import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
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
const SIGN_IN_PATH = '/api/auth/sign-in/magic-link';

describe('Participant joining and session-local identity (e2e)', () => {
  let app: INestApplication<App>;
  let db: TestDb;
  let mailerSend: Mock<Mailer['send']>;
  let sequence = 0;

  const uniqueEmail = () => {
    sequence += 1;
    return `join-host-${sequence}-${Date.now()}@example.com`;
  };

  const uniqueIp = () => {
    sequence += 1;
    return `10.200.${(Date.now() % 200) + sequence}.${(sequence % 250) + 1}`;
  };

  const hostHeader = (ip: string) => ({ 'X-Forwarded-For': ip });

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
    await wipeTables();
  });

  afterAll(async () => {
    await wipeTables();
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
        'Participant e2e tests require Postgres and Redis: run `docker compose up -d postgres redis` in the repo root and `pnpm run db:migrate` in apps/backend.',
      );
    }
  }

  async function wipeTables() {
    await db.delete(schema.participants);
    await db.delete(schema.pollOptions);
    await db.delete(schema.polls);
    await db.delete(schema.roomCodes);
    await db.delete(schema.sessions);
    await db.delete(schema.hosts);
    await db.delete(schema.verification);
    await db.delete(schema.session);
    await db.delete(schema.account);
    await db.delete(schema.user);
  }

  async function signInHost(): Promise<string> {
    const email = uniqueEmail();
    const ip = uniqueIp();
    await request(app.getHttpServer())
      .post(SIGN_IN_PATH)
      .set(hostHeader(ip))
      .send({ email })
      .expect(200);
    const calls = mailerSend.mock.calls;
    const message = calls[calls.length - 1]?.[0];
    const link = message?.text.match(/https?:\/\/\S+/)?.[0];
    expect(link).toBeDefined();
    const url = new URL(link as string);
    const response = await request(app.getHttpServer())
      .get(`${url.pathname}${url.search}`)
      .redirects(0)
      .set(hostHeader(ip))
      .expect(302);
    const setCookies = response.headers['set-cookie'] as unknown as
      | string[]
      | undefined;
    const sessionCookie = setCookies?.find((cookie) =>
      cookie.startsWith(`${SESSION_COOKIE_NAME}=`),
    );
    expect(sessionCookie).toBeDefined();
    return (sessionCookie as string).split(';')[0] as string;
  }

  async function createLiveSession(
    name = 'Participant session',
    withPoll = true,
  ): Promise<{ cookie: string; session: Record<string, unknown> }> {
    const cookie = await signInHost();
    const created = await request(app.getHttpServer())
      .post('/sessions')
      .set('Cookie', cookie)
      .send({ name })
      .expect(201);
    if (withPoll) {
      await request(app.getHttpServer())
        .post(`/sessions/${created.body.id}/polls`)
        .set('Cookie', cookie)
        .send({
          type: 'single_choice',
          text: 'Best color?',
          options: ['Red', 'Blue'],
        })
        .expect(201);
    }
    await request(app.getHttpServer())
      .post(`/sessions/${created.body.id}/start`)
      .set('Cookie', cookie)
      .expect(200);
    return { cookie, session: created.body };
  }

  async function endSession(cookie: string, sessionId: string) {
    await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/end`)
      .set('Cookie', cookie)
      .expect(200);
  }

  function join(
    body: {
      roomCode?: string;
      invitationUrl?: string;
      displayName: string;
      token?: string | null;
    },
    ip: string,
  ) {
    return request(app.getHttpServer())
      .post('/join')
      .set(hostHeader(ip))
      .send(body);
  }

  it('joins a live session by room code case-insensitively and returns token, identity, and snapshot', async () => {
    const { session } = await createLiveSession();
    const roomCode = session.roomCode as string;

    const response = await join(
      { roomCode: roomCode.toLowerCase(), displayName: '  Ada  ' },
      uniqueIp(),
    );

    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
    expect(response.body.token.split('.')).toHaveLength(2);
    expect(response.body.participant).toMatchObject({
      sessionId: session.id,
      displayName: 'Ada',
    });
    expect(response.body.snapshot.session).toMatchObject({
      id: session.id,
      name: 'Participant session',
      status: 'live',
    });
    expect(response.body.snapshot.polls).toHaveLength(1);
    expect(response.body.snapshot.polls[0]).toMatchObject({
      text: 'Best color?',
      type: 'single_choice',
      isOpen: false,
      resultsRevealed: false,
    });
    expect(response.body.snapshot.polls[0].options).toHaveLength(2);
    expect(response.body.snapshot.polls[0].hasResponses).toBeUndefined();

    const persisted = await db
      .select()
      .from(schema.participants)
      .where(eq(schema.participants.sessionId, session.id as string));
    expect(persisted).toHaveLength(1);
    expect(persisted[0]?.displayName).toBe('Ada');
  });

  it('joins a live session through an invitation link in the same flow', async () => {
    const { cookie, session } = await createLiveSession();
    const invitation = await request(app.getHttpServer())
      .get(`/sessions/${session.id as string}/invitation`)
      .set('Cookie', cookie)
      .expect(200);

    const response = await join(
      {
        invitationUrl: invitation.body.url as string,
        displayName: 'Via Link',
      },
      uniqueIp(),
    );

    expect(response.status).toBe(201);
    expect(response.body.participant.sessionId).toBe(session.id);
    expect(response.body.participant.displayName).toBe('Via Link');
  });

  it('rejects joining unknown room codes, draft sessions, and ended sessions', async () => {
    const { cookie, session } = await createLiveSession();
    const ip = uniqueIp();

    const unknown = await join(
      { roomCode: 'ZZZZZZ', displayName: 'Ada' },
      uniqueIp(),
    );
    expect(unknown.status).toBe(404);
    expect(unknown.body.code).toBe('SESSION_NOT_FOUND');

    const draft = await request(app.getHttpServer())
      .post('/sessions')
      .set('Cookie', cookie)
      .send({ name: 'Draft' })
      .expect(201);
    const draftJoin = await join(
      { roomCode: draft.body.roomCode, displayName: 'Ada' },
      uniqueIp(),
    );
    expect(draftJoin.status).toBe(409);
    expect(draftJoin.body.code).toBe('SESSION_DRAFT');

    await endSession(cookie, session.id as string);
    const endedJoin = await join(
      { roomCode: session.roomCode as string, displayName: 'Ada' },
      ip,
    );
    expect(endedJoin.status).toBe(409);
    expect(endedJoin.body.code).toBe('SESSION_ENDED');
  });

  it('rejects empty display names with INVALID_INPUT', async () => {
    const { session } = await createLiveSession();

    const response = await join(
      { roomCode: session.roomCode as string, displayName: '   ' },
      uniqueIp(),
    );
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('INVALID_INPUT');
  });

  it('allows duplicate display names', async () => {
    const { session } = await createLiveSession();

    const first = await join(
      { roomCode: session.roomCode as string, displayName: 'Bob' },
      uniqueIp(),
    );
    const second = await join(
      { roomCode: session.roomCode as string, displayName: 'Bob' },
      uniqueIp(),
    );

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.participant.id).not.toBe(second.body.participant.id);

    const persisted = await db
      .select()
      .from(schema.participants)
      .where(eq(schema.participants.sessionId, session.id as string));
    expect(persisted).toHaveLength(2);
  });

  it('reuses the same browser identity when re-joining with the token', async () => {
    const { session } = await createLiveSession();

    const first = await join(
      { roomCode: session.roomCode as string, displayName: 'Ada' },
      uniqueIp(),
    );
    expect(first.status).toBe(201);
    const firstId = first.body.participant.id as string;

    const second = await join(
      {
        roomCode: session.roomCode as string,
        displayName: 'Ada Renamed',
        token: first.body.token as string,
      },
      uniqueIp(),
    );
    expect(second.status).toBe(201);
    expect(second.body.participant.id).toBe(firstId);
    expect(second.body.participant.displayName).toBe('Ada Renamed');

    const persisted = await db
      .select()
      .from(schema.participants)
      .where(eq(schema.participants.id, firstId));
    expect(persisted).toHaveLength(1);
  });

  it('creates a separate identity for a token from another session', async () => {
    const firstSession = await createLiveSession('First');
    const secondSession = await createLiveSession('Second');

    const first = await join(
      { roomCode: firstSession.session.roomCode as string, displayName: 'Ada' },
      uniqueIp(),
    );
    const second = await join(
      {
        roomCode: secondSession.session.roomCode as string,
        displayName: 'Ada',
        token: first.body.token as string,
      },
      uniqueIp(),
    );

    expect(second.body.participant.id).not.toBe(first.body.participant.id);
  });

  it('fetches a participant-safe session snapshot with the token', async () => {
    const { session } = await createLiveSession();
    const joined = await join(
      { roomCode: session.roomCode as string, displayName: 'Ada' },
      uniqueIp(),
    );

    const response = await request(app.getHttpServer())
      .get('/participant/session')
      .set('Authorization', `Bearer ${joined.body.token}`)
      .expect(200);

    expect(response.body.session.id).toBe(session.id);
    expect(response.body.session.revision).toBeGreaterThanOrEqual(2);
    expect(response.body.polls[0]?.options).toHaveLength(2);
  });

  it('rejects missing, malformed, and forged tokens with UNAUTHORIZED', async () => {
    await request(app.getHttpServer()).get('/participant/session').expect(401);

    await request(app.getHttpServer())
      .get('/participant/session')
      .set('Authorization', 'Bearer not-a-token')
      .expect(401);

    const forged = await request(app.getHttpServer())
      .get('/participant/session')
      .set('Authorization', 'Bearer x.y')
      .expect(401);
    expect(forged.body.code).toBe('UNAUTHORIZED');
  });

  it('revokes participant access when the session is deleted', async () => {
    const { cookie, session } = await createLiveSession();
    const joined = await join(
      { roomCode: session.roomCode as string, displayName: 'Ada' },
      uniqueIp(),
    );

    await request(app.getHttpServer())
      .get('/participant/session')
      .set('Authorization', `Bearer ${joined.body.token}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/sessions/${session.id as string}`)
      .set('Cookie', cookie)
      .send({ confirm: true })
      .expect(204);

    await request(app.getHttpServer())
      .get('/participant/session')
      .set('Authorization', `Bearer ${joined.body.token}`)
      .expect(401);

    const remaining = await db
      .select()
      .from(schema.participants)
      .where(eq(schema.participants.sessionId, session.id as string));
    expect(remaining).toHaveLength(0);
  });

  it('updates the display name while the session is live', async () => {
    const { session } = await createLiveSession();
    const joined = await join(
      { roomCode: session.roomCode as string, displayName: 'Old' },
      uniqueIp(),
    );

    const response = await request(app.getHttpServer())
      .patch('/participant/me')
      .set('Authorization', `Bearer ${joined.body.token}`)
      .send({ displayName: '  New Name  ' })
      .expect(200);

    expect(response.body).toMatchObject({
      id: joined.body.participant.id,
      sessionId: session.id,
      displayName: 'New Name',
    });
  });

  it('rejects display-name updates on ended sessions', async () => {
    const { cookie, session } = await createLiveSession();
    const joined = await join(
      { roomCode: session.roomCode as string, displayName: 'Ada' },
      uniqueIp(),
    );
    await endSession(cookie, session.id as string);

    const response = await request(app.getHttpServer())
      .patch('/participant/me')
      .set('Authorization', `Bearer ${joined.body.token}`)
      .send({ displayName: 'New' })
      .expect(409);

    expect(response.body.code).toBe('SESSION_ENDED');
  });

  it('rate limits join requests per client', async () => {
    const { session } = await createLiveSession();
    const ip = uniqueIp();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await join(
        { roomCode: session.roomCode as string, displayName: `P${attempt}` },
        ip,
      );
      expect(response.status).toBe(201);
    }

    const blocked = await join(
      { roomCode: session.roomCode as string, displayName: 'Over' },
      ip,
    );
    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('RATE_LIMITED');
    expect(blocked.headers['x-retry-after']).toBeDefined();
  });

  it('rate limits display-name updates per participant token', async () => {
    const { session } = await createLiveSession();
    const joined = await join(
      { roomCode: session.roomCode as string, displayName: 'Ada' },
      uniqueIp(),
    );

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await request(app.getHttpServer())
        .patch('/participant/me')
        .set('Authorization', `Bearer ${joined.body.token}`)
        .send({ displayName: `Name ${attempt}` });
      expect(response.status).toBe(200);
    }

    const blocked = await request(app.getHttpServer())
      .patch('/participant/me')
      .set('Authorization', `Bearer ${joined.body.token}`)
      .send({ displayName: 'Blocked' })
      .expect(429);
    expect(blocked.body.code).toBe('RATE_LIMITED');
  });
});
