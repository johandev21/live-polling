import { createHmac } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import Redis from 'ioredis';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { Mock } from 'vitest';
import { AppModule } from '../src/app.module';
import { DATABASE } from '../src/infrastructure/database/database.constants';
import * as schema from '../src/infrastructure/database/schema';
import { MAILER } from '../src/infrastructure/mailer/mailer.constants';
import type { Mailer } from '../src/infrastructure/mailer/mailer.constants';
import { REDIS_CLIENT } from '../src/infrastructure/redis/redis.constants';

type TestDb = NodePgDatabase<typeof schema>;

const SESSION_COOKIE_NAME = 'better-auth.session_token';
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
const APP_CALLBACK_URL = `${BETTER_AUTH_URL}/auth/callback`;
const SIGN_IN_PATH = '/api/auth/sign-in/magic-link';

describe('Host authentication (e2e)', () => {
  let app: INestApplication<App>;
  let db: TestDb;
  let mailerSend: Mock<Mailer['send']>;
  let sequence = 0;

  const uniqueEmail = () => {
    sequence += 1;
    return `host-${sequence}-${Date.now()}@example.com`;
  };

  const uniqueIp = () => {
    sequence += 1;
    return `10.100.${(Date.now() % 200) + sequence}.${(sequence % 250) + 1}`;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MAILER)
      .useValue({ send: vi.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = app.get<TestDb>(DATABASE);
    mailerSend = app.get<{ send: Mock<Mailer['send']> }>(MAILER).send;

    await expectServicesReady();
    await wipeAuthTables();
  });

  afterAll(async () => {
    await wipeAuthTables();
    await app.close();
  });

  afterEach(() => {
    mailerSend.mockClear();
  });

  async function expectServicesReady() {
    try {
      await db.execute(sql`select 1`);
      const redis = app.get<Redis>(REDIS_CLIENT);
      if (redis.status === 'wait') await redis.connect();
      await redis.ping();
    } catch {
      throw new Error(
        'Auth e2e tests require Postgres and Redis: run `docker compose up -d postgres redis` in the repo root and `pnpm run db:migrate` in apps/backend.',
      );
    }
  }

  async function wipeAuthTables() {
    await db.delete(schema.sessions);
    await db.delete(schema.hosts);
    await db.delete(schema.verification);
    await db.delete(schema.session);
    await db.delete(schema.account);
    await db.delete(schema.user);
  }

  async function requestMagicLink(email: string, ip: string): Promise<URL> {
    const response = await request(app.getHttpServer())
      .post(SIGN_IN_PATH)
      .set('X-Forwarded-For', ip)
      .send({ email })
      .expect(200);

    expect(response.body).toEqual({ status: true });
    expect(response.text).not.toContain('token');

    const calls = mailerSend.mock.calls;
    const message = calls[calls.length - 1]?.[0];
    expect(message).toBeDefined();
    expect(message?.to).toBe(email);
    expect(message?.subject).toBe('Your Live Polling sign-in link');

    const link = message?.text.match(/https?:\/\/\S+/)?.[0];
    expect(link).toBeDefined();
    return new URL(link as string);
  }

  function consumeLink(link: URL, ip: string) {
    return request(app.getHttpServer())
      .get(`${link.pathname}${link.search}`)
      .redirects(0)
      .set('X-Forwarded-For', ip);
  }

  function extractSessionCookie(response: {
    headers: Record<string, unknown>;
  }): string | undefined {
    const setCookies = response.headers['set-cookie'] as unknown as
      | string[]
      | undefined;
    return setCookies?.find((cookie) =>
      cookie.startsWith(`${SESSION_COOKIE_NAME}=`),
    );
  }

  function signSessionToken(token: string): string {
    const signature = createHmac(
      'sha256',
      process.env.BETTER_AUTH_SECRET as string,
    )
      .update(token)
      .digest('base64');
    return encodeURIComponent(`${token}.${signature}`);
  }

  async function signInAndGetSessionCookie(
    email: string,
    ip: string,
  ): Promise<string> {
    const link = await requestMagicLink(email, ip);
    const response = await consumeLink(link, ip);
    expect(response.status).toBe(302);
    const sessionCookie = extractSessionCookie(response);
    expect(sessionCookie).toBeDefined();
    return (sessionCookie as string).split(';')[0] as string;
  }

  it('issues a magic link through the mailer boundary with a generic response for a never-seen email', async () => {
    const link = await requestMagicLink(uniqueEmail(), uniqueIp());

    expect(link.pathname).toBe('/api/auth/magic-link/verify');
    expect(link.searchParams.get('token')).toHaveLength(32);
    expect(link.searchParams.get('callbackURL')).toBe(APP_CALLBACK_URL);
  });

  it('consumes the link: redirects, sets the session cookie, and exposes no session credentials', async () => {
    const ip = uniqueIp();
    const link = await requestMagicLink(uniqueEmail(), ip);

    const response = await consumeLink(link, ip);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(APP_CALLBACK_URL);
    expect(response.text).toBe('');
    expect(response.headers['set-cookie']).toBeDefined();
    const sessionCookie = extractSessionCookie(response);
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toContain('HttpOnly');
  });

  it('rejects an unknown magic-link token with the same machine-readable error', async () => {
    const ip = uniqueIp();
    const response = await consumeLink(
      new URL(
        `/api/auth/magic-link/verify?token=${'x'.repeat(32)}`,
        BETTER_AUTH_URL,
      ),
      ip,
    );

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('error=INVALID_TOKEN');
  });

  it('rejects reuse of a consumed magic link', async () => {
    const ip = uniqueIp();
    const link = await requestMagicLink(uniqueEmail(), ip);

    const first = await consumeLink(link, ip);
    expect(first.status).toBe(302);
    expect(first.headers.location).toBe(APP_CALLBACK_URL);

    const second = await consumeLink(link, ip);
    expect(second.status).toBe(302);
    expect(second.headers.location).toContain('error=INVALID_TOKEN');
  });

  it('rejects expired magic links with the same machine-readable error', async () => {
    const ip = uniqueIp();
    const link = await requestMagicLink(uniqueEmail(), ip);
    const token = link.searchParams.get('token') as string;

    await db
      .update(schema.verification)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(schema.verification.identifier, token));

    const response = await consumeLink(link, ip);
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('error=INVALID_TOKEN');
  });

  it('returns the current host and their provisioned hosts row for an authenticated session', async () => {
    const email = uniqueEmail();
    const ip = uniqueIp();
    const cookie = await signInAndGetSessionCookie(email, ip);

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      email,
      emailVerified: true,
    });

    const hosts = await db
      .select()
      .from(schema.hosts)
      .where(eq(schema.hosts.email, email));
    expect(hosts).toHaveLength(1);
    expect(hosts[0]?.userId).toBe(response.body.id);
  });

  it('rejects unauthenticated requests on /auth/me', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);

    expect(response.body).toMatchObject({ statusCode: 401 });
  });

  it('rejects authenticated but unverified hosts on /auth/me', async () => {
    const email = uniqueEmail();
    const ip = uniqueIp();
    const now = new Date();
    const userId = `unverified-${sequence}`;
    const token = `session-${sequence}`;
    await db.insert(schema.user).values({
      id: userId,
      name: 'Unverified Host',
      email,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(schema.session).values({
      id: `auth-session-${sequence}`,
      token,
      expiresAt: new Date(now.getTime() + 60 * 60 * 1_000),
      createdAt: now,
      updatedAt: now,
      userId,
    });
    const redis = app.get<Redis>(REDIS_CLIENT);
    if (redis.status === 'wait') await redis.connect();
    await redis.set(
      token,
      JSON.stringify({
        session: {
          id: `auth-session-${sequence}`,
          token,
          expiresAt: new Date(now.getTime() + 60 * 60 * 1_000).toISOString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          ipAddress: ip,
          userAgent: '',
          userId,
        },
        user: {
          id: userId,
          name: 'Unverified Host',
          email,
          emailVerified: false,
          image: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      }),
    );

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', `${SESSION_COOKIE_NAME}=${signSessionToken(token)}`)
      .set('X-Forwarded-For', ip)
      .expect(401);

    expect(response.body).toMatchObject({ code: 'HOST_EMAIL_NOT_VERIFIED' });
  });

  it('rate limits magic-link requests per client', async () => {
    const ip = uniqueIp();
    const email = uniqueEmail();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await request(app.getHttpServer())
        .post(SIGN_IN_PATH)
        .set('X-Forwarded-For', ip)
        .send({ email });
      expect(response.status).toBe(200);
    }

    const blocked = await request(app.getHttpServer())
      .post(SIGN_IN_PATH)
      .set('X-Forwarded-For', ip)
      .send({ email })
      .expect(429);

    expect(JSON.parse(blocked.text)).toEqual({
      message: 'Too many requests. Please try again later.',
    });
    expect(blocked.headers['x-retry-after']).toBeDefined();
  });
});
