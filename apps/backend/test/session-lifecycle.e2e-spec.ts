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
import { ROOM_CODE_ALPHABET } from '../src/sessions/room-code.service';

type TestDb = NodePgDatabase<typeof schema>;

const SESSION_COOKIE_NAME = 'better-auth.session_token';
const SIGN_IN_PATH = '/api/auth/sign-in/magic-link';

describe('Host session lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  let db: TestDb;
  let mailerSend: Mock<Mailer['send']>;
  let sequence = 0;

  const uniqueEmail = () => {
    sequence += 1;
    return `sess-host-${sequence}-${Date.now()}@example.com`;
  };

  const uniqueIp = () => {
    sequence += 1;
    return `10.100.${(Date.now() % 200) + sequence}.${(sequence % 250) + 1}`;
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
        'Session e2e tests require Postgres and Redis: run `docker compose up -d postgres redis` in the repo root and `pnpm run db:migrate` in apps/backend.',
      );
    }
  }

  async function wipeTables() {
    await db.delete(schema.roomCodes);
    await db.delete(schema.sessions);
    await db.delete(schema.hosts);
    await db.delete(schema.verification);
    await db.delete(schema.session);
    await db.delete(schema.account);
    await db.delete(schema.user);
  }

  async function requestMagicLink(email: string, ip: string): Promise<URL> {
    await request(app.getHttpServer())
      .post(SIGN_IN_PATH)
      .set(hostHeader(ip))
      .send({ email })
      .expect(200);
    const calls = mailerSend.mock.calls;
    const message = calls[calls.length - 1]?.[0];
    const link = message?.text.match(/https?:\/\/\S+/)?.[0];
    expect(link).toBeDefined();
    return new URL(link as string);
  }

  async function signInAndGetCookie(
    email: string,
    ip: string,
  ): Promise<string> {
    const link = await requestMagicLink(email, ip);
    const response = await request(app.getHttpServer())
      .get(`${link.pathname}${link.search}`)
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

  async function signInHost(): Promise<{ cookie: string; email: string }> {
    const email = uniqueEmail();
    const cookie = await signInAndGetCookie(email, uniqueIp());
    return { cookie, email };
  }

  async function createSession(cookie: string, name: string, expected = 201) {
    const response = await request(app.getHttpServer())
      .post('/sessions')
      .set('Cookie', cookie)
      .send({ name })
      .expect(expected);
    return response;
  }

  async function seedPoll(sessionId: string) {
    await db
      .insert(schema.polls)
      .values({ sessionId })
      .returning({ id: schema.polls.id });
  }

  it('creates a named draft session with a room code and snapshot revision', async () => {
    const { cookie } = await signInHost();

    const response = await createSession(cookie, 'Team standup');

    expect(response.body).toMatchObject({
      name: 'Team standup',
      status: 'draft',
      revision: 1,
      roomCode: expect.any(String),
    });
    expect(response.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(response.body.roomCode).toHaveLength(6);
    for (const char of response.body.roomCode as string) {
      expect(ROOM_CODE_ALPHABET).toContain(char);
    }
    expect(response.body.startedAt).toBeNull();
    expect(response.body.endedAt).toBeNull();
    expect(new Date(response.body.createdAt).getTime()).not.toBeNaN();
    expect(new Date(response.body.updatedAt).getTime()).not.toBeNaN();
  });

  it('rejects invalid session names with INVALID_INPUT', async () => {
    const { cookie } = await signInHost();

    const empty = await request(app.getHttpServer())
      .post('/sessions')
      .set('Cookie', cookie)
      .send({ name: '   ' });
    expect(empty.status).toBe(400);
    expect(empty.body.code).toBe('INVALID_INPUT');

    const tooLong = await request(app.getHttpServer())
      .post('/sessions')
      .set('Cookie', cookie)
      .send({ name: 'x'.repeat(121) });
    expect(tooLong.status).toBe(400);
    expect(tooLong.body.code).toBe('INVALID_INPUT');
  });

  it('lists only sessions owned by the host, newest first', async () => {
    const { cookie } = await signInHost();
    const { cookie: otherCookie } = await signInHost();

    await createSession(cookie, 'First');
    await createSession(cookie, 'Second');
    await createSession(otherCookie, 'Foreign');

    const mine = await request(app.getHttpServer())
      .get('/sessions')
      .set('Cookie', cookie)
      .expect(200);

    expect(mine.body.sessions).toHaveLength(2);
    expect(mine.body.sessions.map((s: { name: string }) => s.name)).toEqual([
      'Second',
      'First',
    ]);
  });

  it('retrieves an owned session snapshot', async () => {
    const { cookie } = await signInHost();
    const created = await createSession(cookie, 'Snapshot me');

    const response = await request(app.getHttpServer())
      .get(`/sessions/${created.body.id}`)
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body).toMatchObject({
      id: created.body.id,
      name: 'Snapshot me',
      status: 'draft',
      revision: 1,
    });
  });

  it('returns SESSION_NOT_FOUND for another host session and unknown ids', async () => {
    const { cookie } = await signInHost();
    const { cookie: otherCookie } = await signInHost();
    const created = await createSession(otherCookie, 'Private');

    const foreign = await request(app.getHttpServer())
      .get(`/sessions/${created.body.id}`)
      .set('Cookie', cookie);
    expect(foreign.status).toBe(404);
    expect(foreign.body.code).toBe('SESSION_NOT_FOUND');

    const unknown = await request(app.getHttpServer())
      .get('/sessions/00000000-0000-4000-8000-000000000000')
      .set('Cookie', cookie);
    expect(unknown.status).toBe(404);
    expect(unknown.body.code).toBe('SESSION_NOT_FOUND');
  });

  it('rejects malformed session ids with INVALID_INPUT', async () => {
    const { cookie } = await signInHost();

    const response = await request(app.getHttpServer())
      .get('/sessions/not-a-uuid')
      .set('Cookie', cookie);
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('INVALID_INPUT');
  });

  it('enforces case-insensitive room-code uniqueness at the database level', async () => {
    const { cookie } = await signInHost();
    const created = await createSession(cookie, 'Case');

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', cookie)
      .expect(200);
    const [host] = await db
      .select({ id: schema.hosts.id })
      .from(schema.hosts)
      .where(eq(schema.hosts.userId, me.body.id))
      .limit(1);

    await expect(
      db.insert(schema.sessions).values({
        hostId: (host as { id: string }).id,
        name: 'Collision',
        roomCode: created.body.roomCode.toLowerCase(),
      }),
    ).rejects.toMatchObject({ cause: { code: '23505' } });
  });

  it('derives invitation-link data from the room code', async () => {
    const { cookie } = await signInHost();
    const created = await createSession(cookie, 'Invite me');

    const response = await request(app.getHttpServer())
      .get(`/sessions/${created.body.id}/invitation`)
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body).toEqual({
      roomCode: created.body.roomCode,
      url: `http://localhost:5173/join/${created.body.roomCode}`,
    });
  });

  it('rejects starting a session without any poll with NO_POLLS', async () => {
    const { cookie } = await signInHost();
    const created = await createSession(cookie, 'Empty');

    const response = await request(app.getHttpServer())
      .post(`/sessions/${created.body.id}/start`)
      .set('Cookie', cookie);
    expect(response.status).toBe(409);
    expect(response.body.code).toBe('NO_POLLS');

    const still = await request(app.getHttpServer())
      .get(`/sessions/${created.body.id}`)
      .set('Cookie', cookie)
      .expect(200);
    expect(still.body.status).toBe('draft');
  });

  it('starts a draft session once it has a poll and advances the revision', async () => {
    const { cookie } = await signInHost();
    const created = await createSession(cookie, 'Startable');
    await seedPoll(created.body.id);

    const response = await request(app.getHttpServer())
      .post(`/sessions/${created.body.id}/start`)
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body).toMatchObject({
      id: created.body.id,
      status: 'live',
      revision: 2,
    });
    expect(new Date(response.body.startedAt).getTime()).not.toBeNaN();

    const persisted = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, created.body.id));
    expect(persisted[0]?.status).toBe('live');
    expect(persisted[0]?.revision).toBe(2);
  });

  it('ends a live session permanently and advances the revision', async () => {
    const { cookie } = await signInHost();
    const created = await createSession(cookie, 'Endable');
    await seedPoll(created.body.id);
    await request(app.getHttpServer())
      .post(`/sessions/${created.body.id}/start`)
      .set('Cookie', cookie)
      .expect(200);

    const response = await request(app.getHttpServer())
      .post(`/sessions/${created.body.id}/end`)
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body).toMatchObject({
      id: created.body.id,
      status: 'ended',
      revision: 3,
    });
    expect(new Date(response.body.endedAt).getTime()).not.toBeNaN();
  });

  it('rejects invalid transitions with INVALID_TRANSITION', async () => {
    const { cookie } = await signInHost();
    const created = await createSession(cookie, 'Transitions');
    await seedPoll(created.body.id);

    await request(app.getHttpServer())
      .post(`/sessions/${created.body.id}/start`)
      .set('Cookie', cookie)
      .expect(200);

    const reopen = await request(app.getHttpServer())
      .post(`/sessions/${created.body.id}/start`)
      .set('Cookie', cookie)
      .expect(409);
    expect(reopen.body.code).toBe('INVALID_TRANSITION');

    const endDraft = await createSession(cookie, 'Draft ender');
    const endDraftResponse = await request(app.getHttpServer())
      .post(`/sessions/${endDraft.body.id}/end`)
      .set('Cookie', cookie)
      .expect(409);
    expect(endDraftResponse.body.code).toBe('INVALID_TRANSITION');

    const endLive = await request(app.getHttpServer())
      .post(`/sessions/${created.body.id}/end`)
      .set('Cookie', cookie)
      .expect(200);
    expect(endLive.body.status).toBe('ended');

    const reopenEnded = await request(app.getHttpServer())
      .post(`/sessions/${created.body.id}/start`)
      .set('Cookie', cookie)
      .expect(409);
    expect(reopenEnded.body.code).toBe('INVALID_TRANSITION');
  });

  it('updates a draft session name and advances the revision', async () => {
    const { cookie } = await signInHost();
    const created = await createSession(cookie, 'Old name');

    const response = await request(app.getHttpServer())
      .patch(`/sessions/${created.body.id}`)
      .set('Cookie', cookie)
      .send({ name: 'New name' })
      .expect(200);

    expect(response.body).toMatchObject({
      id: created.body.id,
      name: 'New name',
      revision: 2,
    });
  });

  it('rejects name updates for live and ended sessions with INVALID_TRANSITION', async () => {
    const { cookie } = await signInHost();
    const created = await createSession(cookie, 'Locked');
    await seedPoll(created.body.id);
    await request(app.getHttpServer())
      .post(`/sessions/${created.body.id}/start`)
      .set('Cookie', cookie)
      .expect(200);

    const liveUpdate = await request(app.getHttpServer())
      .patch(`/sessions/${created.body.id}`)
      .set('Cookie', cookie)
      .send({ name: 'Renamed live' });
    expect(liveUpdate.status).toBe(409);
    expect(liveUpdate.body.code).toBe('INVALID_TRANSITION');

    await request(app.getHttpServer())
      .post(`/sessions/${created.body.id}/end`)
      .set('Cookie', cookie)
      .expect(200);

    const endedUpdate = await request(app.getHttpServer())
      .patch(`/sessions/${created.body.id}`)
      .set('Cookie', cookie)
      .send({ name: 'Renamed ended' });
    expect(endedUpdate.status).toBe(409);
    expect(endedUpdate.body.code).toBe('INVALID_TRANSITION');
  });

  it('requires explicit confirmation before deleting a session', async () => {
    const { cookie } = await signInHost();
    const created = await createSession(cookie, 'Keep me');

    const unconfirmed = await request(app.getHttpServer())
      .delete(`/sessions/${created.body.id}`)
      .set('Cookie', cookie)
      .send({ confirm: false });
    expect(unconfirmed.status).toBe(400);
    expect(unconfirmed.body.code).toBe('CONFIRMATION_REQUIRED');

    const missing = await request(app.getHttpServer())
      .delete(`/sessions/${created.body.id}`)
      .set('Cookie', cookie)
      .send({});
    expect(missing.status).toBe(400);
    expect(missing.body.code).toBe('INVALID_INPUT');

    const stillThere = await request(app.getHttpServer())
      .get(`/sessions/${created.body.id}`)
      .set('Cookie', cookie)
      .expect(200);
    expect(stillThere.body.name).toBe('Keep me');
  });

  it('deletes a session after confirmation, tombstones its room code, and removes it from reads', async () => {
    const { cookie } = await signInHost();
    const created = await createSession(cookie, 'Delete me');

    const deleted = await request(app.getHttpServer())
      .delete(`/sessions/${created.body.id}`)
      .set('Cookie', cookie)
      .send({ confirm: true });
    expect(deleted.status).toBe(204);

    const missing = await request(app.getHttpServer())
      .get(`/sessions/${created.body.id}`)
      .set('Cookie', cookie);
    expect(missing.status).toBe(404);

    const list = await request(app.getHttpServer())
      .get('/sessions')
      .set('Cookie', cookie)
      .expect(200);
    expect(list.body.sessions).toHaveLength(0);

    const tombstones = await db
      .select()
      .from(schema.roomCodes)
      .where(eq(schema.roomCodes.code, created.body.roomCode));
    expect(tombstones).toHaveLength(1);
  });

  it('rejects cross-host deletion with SESSION_NOT_FOUND', async () => {
    const { cookie } = await signInHost();
    const { cookie: otherCookie } = await signInHost();
    const created = await createSession(otherCookie, 'Not mine');

    const response = await request(app.getHttpServer())
      .delete(`/sessions/${created.body.id}`)
      .set('Cookie', cookie)
      .send({ confirm: true });
    expect(response.status).toBe(404);
    expect(response.body.code).toBe('SESSION_NOT_FOUND');
  });

  it('rejects unauthenticated session requests with UNAUTHORIZED', async () => {
    const anonymous = await request(app.getHttpServer()).get('/sessions');
    expect(anonymous.status).toBe(401);
    expect(anonymous.body.code).toBe('UNAUTHORIZED');

    const anonymousCreate = await request(app.getHttpServer())
      .post('/sessions')
      .send({ name: 'Nope' });
    expect(anonymousCreate.status).toBe(401);
    expect(anonymousCreate.body.code).toBe('UNAUTHORIZED');
  });

  it('resolves concurrent start requests to exactly one live session', async () => {
    const { cookie } = await signInHost();
    const created = await createSession(cookie, 'Race');
    await seedPoll(created.body.id);

    const [first, second] = await Promise.all([
      request(app.getHttpServer())
        .post(`/sessions/${created.body.id}/start`)
        .set('Cookie', cookie),
      request(app.getHttpServer())
        .post(`/sessions/${created.body.id}/start`)
        .set('Cookie', cookie),
    ]);

    const statuses = [first.status, second.status].sort((a, b) => a - b);
    expect(statuses).toEqual([200, 409]);
    const loser = first.status === 409 ? first : second;
    expect(loser.body.code).toBe('INVALID_TRANSITION');

    const persisted = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, created.body.id));
    expect(persisted[0]?.status).toBe('live');
    expect(persisted[0]?.revision).toBe(2);
  });

  it('tombstones released room codes so they are not reused immediately', async () => {
    const { cookie } = await signInHost();
    const created = await createSession(cookie, 'Recycler');
    await request(app.getHttpServer())
      .delete(`/sessions/${created.body.id}`)
      .set('Cookie', cookie)
      .send({ confirm: true })
      .expect(204);

    const reused = await request(app.getHttpServer())
      .post('/sessions')
      .set('Cookie', cookie)
      .send({ name: 'Fresh' })
      .expect(201);

    expect(reused.body.roomCode).not.toBe(created.body.roomCode);
  });
});
