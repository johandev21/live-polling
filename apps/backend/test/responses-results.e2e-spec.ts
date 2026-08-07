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

type HostedSession = {
  cookie: string;
  session: { id: string; roomCode: string };
};

type ChoicePoll = {
  id: string;
  options: { id: string; text: string }[];
};

describe('Durable responses and results (e2e)', () => {
  let app: INestApplication<App>;
  let db: TestDb;
  let mailerSend: Mock<Mailer['send']>;
  let sequence = 0;

  const uniqueEmail = () => {
    sequence += 1;
    return `resp-host-${sequence}-${Date.now()}@example.com`;
  };

  const uniqueIp = () => {
    sequence += 1;
    return `10.150.${(Date.now() % 200) + sequence}.${(sequence % 250) + 1}`;
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
        'Response e2e tests require Postgres and Redis: run `docker compose up -d postgres redis` in the repo root and `pnpm run db:migrate` in apps/backend.',
      );
    }
  }

  async function wipeTables() {
    await db.delete(schema.responseOptions);
    await db.delete(schema.responses);
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

  async function createChoicePoll(
    cookie: string,
    sessionId: string,
    body: {
      type: 'single_choice' | 'multiple_choice';
      text: string;
      options: string[];
      maxSelections?: number;
    },
  ): Promise<ChoicePoll> {
    const response = await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/polls`)
      .set('Cookie', cookie)
      .send(body)
      .expect(201);
    return response.body as ChoicePoll;
  }

  async function createOpenPoll(cookie: string, sessionId: string) {
    const response = await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/polls`)
      .set('Cookie', cookie)
      .send({ type: 'open_ended', text: 'Say it' })
      .expect(201);
    return response.body as { id: string };
  }

  async function createLiveSession(): Promise<HostedSession> {
    const cookie = await signInHost();
    const created = await request(app.getHttpServer())
      .post('/sessions')
      .set('Cookie', cookie)
      .send({ name: 'Response session' })
      .expect(201);
    const session = created.body as HostedSession['session'];
    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls`)
      .set('Cookie', cookie)
      .send({
        type: 'single_choice',
        text: 'Starter',
        options: ['A', 'B'],
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/start`)
      .set('Cookie', cookie)
      .expect(200);
    return { cookie, session };
  }

  async function openPoll(cookie: string, sessionId: string, pollId: string) {
    await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/polls/${pollId}/open`)
      .set('Cookie', cookie)
      .expect(200);
  }

  function join(roomCode: string) {
    return request(app.getHttpServer())
      .post('/join')
      .set(hostHeader(uniqueIp()))
      .send({ roomCode, displayName: 'Ada' })
      .expect(201);
  }

  function submitResponse(
    token: string,
    pollId: string,
    body: { idempotencyKey: string; optionIds?: string[]; text?: string },
  ) {
    return request(app.getHttpServer())
      .put(`/participant/polls/${pollId}/response`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

  function participantResults(token: string, pollId: string) {
    return request(app.getHttpServer())
      .get(`/participant/polls/${pollId}/results`)
      .set('Authorization', `Bearer ${token}`);
  }

  function hostResults(cookie: string, sessionId: string, pollId: string) {
    return request(app.getHttpServer())
      .get(`/sessions/${sessionId}/polls/${pollId}/results`)
      .set('Cookie', cookie);
  }

  it('submits a valid single-choice response', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best color?',
      options: ['Red', 'Blue'],
    });
    await openPoll(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);
    const token = joined.body.token as string;

    const response = await submitResponse(token, poll.id, {
      idempotencyKey: 'k-single',
      optionIds: [poll.options[0]!.id],
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      pollId: poll.id,
      participantId: joined.body.participant.id,
      optionIds: [poll.options[0]!.id],
      text: null,
    });
    expect(response.body.id).toBeDefined();
  });

  it('submits a valid multiple-choice response within the selection limit', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'multiple_choice',
      text: 'Pick up to two',
      options: ['A', 'B', 'C'],
      maxSelections: 2,
    });
    await openPoll(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);

    const response = await submitResponse(
      joined.body.token as string,
      poll.id,
      {
        idempotencyKey: 'k-multi',
        optionIds: [poll.options[0]!.id, poll.options[2]!.id],
      },
    );

    expect(response.status).toBe(200);
    expect(response.body.optionIds).toEqual([
      poll.options[0]!.id,
      poll.options[2]!.id,
    ]);
  });

  it('submits a trimmed open-ended response', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createOpenPoll(cookie, session.id);
    await openPoll(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);

    const response = await submitResponse(
      joined.body.token as string,
      poll.id,
      {
        idempotencyKey: 'k-open',
        text: '  Tremendous idea!  ',
      },
    );

    expect(response.status).toBe(200);
    expect(response.body.text).toBe('Tremendous idea!');
    expect(response.body.optionIds).toEqual([]);
  });

  it('rejects empty, overlong, and missing open-ended text with INVALID_INPUT', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createOpenPoll(cookie, session.id);
    await openPoll(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);
    const token = joined.body.token as string;

    const empty = await submitResponse(token, poll.id, {
      idempotencyKey: 'k-empty',
      text: '   ',
    });
    expect(empty.status).toBe(400);
    expect(empty.body.code).toBe('INVALID_INPUT');

    const overlong = await submitResponse(token, poll.id, {
      idempotencyKey: 'k-overlong',
      text: 'x'.repeat(501),
    });
    expect(overlong.status).toBe(400);
    expect(overlong.body.code).toBe('INVALID_INPUT');

    const missing = await submitResponse(token, poll.id, {
      idempotencyKey: 'k-missing',
    });
    expect(missing.status).toBe(409);
    expect(missing.body.code).toBe('INVALID_INPUT');
  });

  it('rejects selection-count violations with INVALID_INPUT', async () => {
    const { cookie, session } = await createLiveSession();
    const multiple = await createChoicePoll(cookie, session.id, {
      type: 'multiple_choice',
      text: 'Pick up to two',
      options: ['A', 'B', 'C'],
      maxSelections: 2,
    });
    const single = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['A', 'B'],
    });
    await openPoll(cookie, session.id, multiple.id);
    const joined = await join(session.roomCode);
    const token = joined.body.token as string;

    const tooMany = await submitResponse(token, multiple.id, {
      idempotencyKey: 'k-too-many',
      optionIds: multiple.options.map((option) => option.id),
    });
    expect(tooMany.status).toBe(409);
    expect(tooMany.body.code).toBe('INVALID_INPUT');

    const emptyList = await submitResponse(token, multiple.id, {
      idempotencyKey: 'k-empty-list',
      optionIds: [],
    });
    expect(emptyList.status).toBe(400);
    expect(emptyList.body.code).toBe('INVALID_INPUT');

    const duplicated = await submitResponse(token, multiple.id, {
      idempotencyKey: 'k-dup',
      optionIds: [multiple.options[0]!.id, multiple.options[0]!.id],
    });
    expect(duplicated.status).toBe(409);
    expect(duplicated.body.code).toBe('INVALID_INPUT');

    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${multiple.id}/close`)
      .set('Cookie', cookie)
      .expect(200);
    await openPoll(cookie, session.id, single.id);

    const noOptions = await submitResponse(token, single.id, {
      idempotencyKey: 'k-no-options',
    });
    expect(noOptions.status).toBe(409);
    expect(noOptions.body.code).toBe('INVALID_INPUT');
  });

  it('rejects option ids that do not belong to the poll', async () => {
    const { cookie, session } = await createLiveSession();
    const first = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'First?',
      options: ['A', 'B'],
    });
    const second = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Second?',
      options: ['C', 'D'],
    });
    await openPoll(cookie, session.id, first.id);
    const joined = await join(session.roomCode);

    const response = await submitResponse(
      joined.body.token as string,
      first.id,
      {
        idempotencyKey: 'k-foreign',
        optionIds: [second.options[0]!.id],
      },
    );

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('INVALID_INPUT');
  });

  it('rejects optionIds on open-ended polls', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createOpenPoll(cookie, session.id);
    await openPoll(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);

    const response = await submitResponse(
      joined.body.token as string,
      poll.id,
      {
        idempotencyKey: 'k-wrong-kind',
        optionIds: ['3f1b45a2-4f0a-4b5a-9c1e-7a2d5c8f0b1e'],
        text: 'Hello',
      },
    );

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('INVALID_INPUT');
  });

  it('rejects submissions to closed polls and ended sessions by server authority', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['A', 'B'],
    });
    await openPoll(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);
    const token = joined.body.token as string;

    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.id}/close`)
      .set('Cookie', cookie)
      .expect(200);

    const closed = await submitResponse(token, poll.id, {
      idempotencyKey: 'k-closed',
      optionIds: [poll.options[0]!.id],
    });
    expect(closed.status).toBe(409);
    expect(closed.body.code).toBe('CLOSED_POLL');

    const neverOpened = await submitResponse(token, poll.id, {
      idempotencyKey: 'k-never-opened',
      optionIds: [poll.options[0]!.id],
    });
    expect(neverOpened.status).toBe(409);
    expect(neverOpened.body.code).toBe('CLOSED_POLL');

    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/end`)
      .set('Cookie', cookie)
      .expect(200);

    const ended = await submitResponse(token, poll.id, {
      idempotencyKey: 'k-ended',
      optionIds: [poll.options[0]!.id],
    });
    expect(ended.status).toBe(409);
    expect(ended.body.code).toBe('SESSION_ENDED');
  });

  it('keeps one effective response per participant and replaces it atomically', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['Red', 'Blue'],
    });
    await openPoll(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);
    const token = joined.body.token as string;

    const first = await submitResponse(token, poll.id, {
      idempotencyKey: 'k-1',
      optionIds: [poll.options[0]!.id],
    });
    expect(first.status).toBe(200);
    const responseId = first.body.id as string;

    const replaced = await submitResponse(token, poll.id, {
      idempotencyKey: 'k-2',
      optionIds: [poll.options[1]!.id],
    });
    expect(replaced.status).toBe(200);
    expect(replaced.body.id).toBe(responseId);
    expect(replaced.body.optionIds).toEqual([poll.options[1]!.id]);

    const persisted = await db
      .select()
      .from(schema.responses)
      .where(eq(schema.responses.pollId, poll.id));
    expect(persisted).toHaveLength(1);
    expect(persisted[0]?.id).toBe(responseId);

    const results = await hostResults(cookie, session.id, poll.id).expect(200);
    expect(results.body.total).toBe(1);
    expect(results.body.counts).toEqual([
      {
        optionId: poll.options[1]!.id,
        text: 'Blue',
        count: 1,
        percentage: 100,
      },
    ]);
  });

  it('treats an idempotent retry as one effective operation', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['Red', 'Blue'],
    });
    await openPoll(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);
    const token = joined.body.token as string;

    const first = await submitResponse(token, poll.id, {
      idempotencyKey: 'k-retry',
      optionIds: [poll.options[0]!.id],
    });
    expect(first.status).toBe(200);

    const retry = await submitResponse(token, poll.id, {
      idempotencyKey: 'k-retry',
      optionIds: [poll.options[0]!.id],
    });
    expect(retry.status).toBe(200);
    expect(retry.body.id).toBe(first.body.id);

    const persisted = await db
      .select()
      .from(schema.responses)
      .where(eq(schema.responses.pollId, poll.id));
    expect(persisted).toHaveLength(1);

    const results = await hostResults(cookie, session.id, poll.id).expect(200);
    expect(results.body.total).toBe(1);
    expect(results.body.counts[0]?.count).toBe(1);
  });

  it('replaces an open-ended response with new text', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createOpenPoll(cookie, session.id);
    await openPoll(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);
    const token = joined.body.token as string;

    const first = await submitResponse(token, poll.id, {
      idempotencyKey: 'k-open-1',
      text: 'first answer',
    });
    expect(first.status).toBe(200);

    const replaced = await submitResponse(token, poll.id, {
      idempotencyKey: 'k-open-2',
      text: 'second answer',
    });
    expect(replaced.status).toBe(200);
    expect(replaced.body.id).toBe(first.body.id);
    expect(replaced.body.text).toBe('second answer');

    const results = await hostResults(cookie, session.id, poll.id).expect(200);
    expect(results.body.total).toBe(1);
    expect(results.body.responses).toEqual([
      {
        id: first.body.id,
        text: 'second answer',
        createdAt: expect.any(String),
      },
    ]);
  });

  it('rejects submissions to polls outside the participant session', async () => {
    const { session } = await createLiveSession();
    const other = await createLiveSession();
    const poll = await createChoicePoll(other.cookie, other.session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['Red', 'Blue'],
    });
    await openPoll(other.cookie, other.session.id, poll.id);
    const joined = await join(session.roomCode);

    const response = await submitResponse(
      joined.body.token as string,
      poll.id,
      {
        idempotencyKey: 'k-foreign-session',
        optionIds: [poll.options[0]!.id],
      },
    );

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('POLL_NOT_FOUND');

    const results = await hostResults(
      other.cookie,
      other.session.id,
      poll.id,
    ).expect(200);
    expect(results.body.total).toBe(0);
  });

  it('resolves the close/submit race without errors or double counting', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['Red', 'Blue'],
    });
    await openPoll(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);
    const token = joined.body.token as string;

    const [closeResult, submitResult] = await Promise.all([
      request(app.getHttpServer())
        .post(`/sessions/${session.id}/polls/${poll.id}/close`)
        .set('Cookie', cookie),
      submitResponse(token, poll.id, {
        idempotencyKey: 'k-race',
        optionIds: [poll.options[0]!.id],
      }),
    ]);

    expect(closeResult.status).toBe(200);
    expect(submitResult.status).toBeGreaterThanOrEqual(200);
    expect(submitResult.status).toBeLessThan(500);
    if (submitResult.status === 409) {
      expect(submitResult.body.code).toBe('CLOSED_POLL');
    } else {
      expect(submitResult.status).toBe(200);
    }

    const results = await hostResults(cookie, session.id, poll.id).expect(200);
    expect(results.body.total).toBe(submitResult.status === 200 ? 1 : 0);
  });

  it('accepts concurrent submissions from two participants without losing responses', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['Red', 'Blue'],
    });
    await openPoll(cookie, session.id, poll.id);
    const first = await join(session.roomCode);
    const second = await join(session.roomCode);

    const [firstResult, secondResult] = await Promise.all([
      submitResponse(first.body.token as string, poll.id, {
        idempotencyKey: 'k-first',
        optionIds: [poll.options[0]!.id],
      }),
      submitResponse(second.body.token as string, poll.id, {
        idempotencyKey: 'k-second',
        optionIds: [poll.options[1]!.id],
      }),
    ]);

    expect(firstResult.status).toBe(200);
    expect(secondResult.status).toBe(200);
    expect(firstResult.body.id).not.toBe(secondResult.body.id);

    const results = await hostResults(cookie, session.id, poll.id).expect(200);
    expect(results.body.total).toBe(2);
    expect(results.body.counts).toEqual([
      { optionId: poll.options[0]!.id, text: 'Red', count: 1, percentage: 50 },
      { optionId: poll.options[1]!.id, text: 'Blue', count: 1, percentage: 50 },
    ]);
  });

  it('hides participant results until the host reveals them and re-blocks after hide', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['Red', 'Blue'],
    });
    await openPoll(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);
    const token = joined.body.token as string;
    await submitResponse(token, poll.id, {
      idempotencyKey: 'k-hidden',
      optionIds: [poll.options[0]!.id],
    }).expect(200);

    const before = await participantResults(token, poll.id);
    expect(before.status).toBe(403);
    expect(before.body.code).toBe('RESULTS_NOT_REVEALED');

    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.id}/reveal`)
      .set('Cookie', cookie)
      .expect(200);

    const after = await participantResults(token, poll.id).expect(200);
    expect(after.body).toEqual({
      pollId: poll.id,
      total: 1,
      counts: [{ optionId: poll.options[0]!.id, count: 1, percentage: 100 }],
    });
    expect(JSON.stringify(after.body)).not.toContain('Red');

    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.id}/hide`)
      .set('Cookie', cookie)
      .expect(200);

    const reHidden = await participantResults(token, poll.id);
    expect(reHidden.status).toBe(403);
    expect(reHidden.body.code).toBe('RESULTS_NOT_REVEALED');
  });

  it('reveals host results with counts, percentages, and totals', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['Red', 'Blue'],
    });
    await openPoll(cookie, session.id, poll.id);

    const red1 = await join(session.roomCode);
    const red2 = await join(session.roomCode);
    const blue1 = await join(session.roomCode);
    const blue2 = await join(session.roomCode);
    await submitResponse(red1.body.token as string, poll.id, {
      idempotencyKey: 'k-r1',
      optionIds: [poll.options[0]!.id],
    }).expect(200);
    await submitResponse(red2.body.token as string, poll.id, {
      idempotencyKey: 'k-r2',
      optionIds: [poll.options[0]!.id],
    }).expect(200);
    await submitResponse(blue1.body.token as string, poll.id, {
      idempotencyKey: 'k-b1',
      optionIds: [poll.options[1]!.id],
    }).expect(200);
    await submitResponse(blue2.body.token as string, poll.id, {
      idempotencyKey: 'k-b2',
      optionIds: [poll.options[1]!.id],
    }).expect(200);

    const results = await hostResults(cookie, session.id, poll.id).expect(200);
    expect(results.body.total).toBe(4);
    expect(results.body.counts).toEqual([
      { optionId: poll.options[0]!.id, text: 'Red', count: 2, percentage: 50 },
      { optionId: poll.options[1]!.id, text: 'Blue', count: 2, percentage: 50 },
    ]);

    const list = await request(app.getHttpServer())
      .get(`/sessions/${session.id}/polls`)
      .set('Cookie', cookie)
      .expect(200);
    const listed = list.body.polls.find(
      (entry: { id: string }) => entry.id === poll.id,
    );
    expect(listed?.hasResponses).toBe(true);
  });

  it('computes percentages above one hundred for multiple-choice polls', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'multiple_choice',
      text: 'Pick any',
      options: ['Red', 'Blue'],
      maxSelections: 2,
    });
    await openPoll(cookie, session.id, poll.id);

    const both = await join(session.roomCode);
    const onlyRed = await join(session.roomCode);
    await submitResponse(both.body.token as string, poll.id, {
      idempotencyKey: 'k-both',
      optionIds: [poll.options[0]!.id, poll.options[1]!.id],
    }).expect(200);
    await submitResponse(onlyRed.body.token as string, poll.id, {
      idempotencyKey: 'k-red',
      optionIds: [poll.options[0]!.id],
    }).expect(200);

    const results = await hostResults(cookie, session.id, poll.id).expect(200);
    expect(results.body.total).toBe(2);
    expect(results.body.counts).toEqual([
      { optionId: poll.options[0]!.id, text: 'Red', count: 2, percentage: 100 },
      { optionId: poll.options[1]!.id, text: 'Blue', count: 1, percentage: 50 },
    ]);
  });

  it('returns open-ended host results in chronological order', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createOpenPoll(cookie, session.id);
    await openPoll(cookie, session.id, poll.id);

    const first = await join(session.roomCode);
    const second = await join(session.roomCode);
    const third = await join(session.roomCode);
    await submitResponse(first.body.token as string, poll.id, {
      idempotencyKey: 'k-text-1',
      text: 'first',
    }).expect(200);
    await submitResponse(second.body.token as string, poll.id, {
      idempotencyKey: 'k-text-2',
      text: 'second',
    }).expect(200);
    await submitResponse(third.body.token as string, poll.id, {
      idempotencyKey: 'k-text-3',
      text: 'third',
    }).expect(200);

    const results = await hostResults(cookie, session.id, poll.id).expect(200);
    expect(results.body.total).toBe(3);
    expect(results.body.counts).toEqual([]);
    expect(
      results.body.responses.map((entry: { text: string }) => entry.text),
    ).toEqual(['first', 'second', 'third']);
  });

  it('keeps host results available after the session ends', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['Red', 'Blue'],
    });
    await openPoll(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);
    await submitResponse(joined.body.token as string, poll.id, {
      idempotencyKey: 'k-endure',
      optionIds: [poll.options[0]!.id],
    }).expect(200);

    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/end`)
      .set('Cookie', cookie)
      .expect(200);

    const results = await hostResults(cookie, session.id, poll.id).expect(200);
    expect(results.body.total).toBe(1);
    expect(results.body.counts[0]).toMatchObject({ count: 1, percentage: 100 });
  });

  it('scopes host results to the owning host and session', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['Red', 'Blue'],
    });
    const otherHost = await createLiveSession();

    const crossHost = await request(app.getHttpServer())
      .get(`/sessions/${session.id}/polls/${poll.id}/results`)
      .set('Cookie', otherHost.cookie);
    expect(crossHost.status).toBe(404);
    expect(crossHost.body.code).toBe('SESSION_NOT_FOUND');

    const wrongSession = await request(app.getHttpServer())
      .get(`/sessions/${otherHost.session.id}/polls/${poll.id}/results`)
      .set('Cookie', otherHost.cookie);
    expect(wrongSession.status).toBe(404);
    expect(wrongSession.body.code).toBe('POLL_NOT_FOUND');
  });

  it('rate limits response submissions per participant', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['Red', 'Blue'],
    });
    await openPoll(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);
    const token = joined.body.token as string;

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const response = await submitResponse(token, poll.id, {
        idempotencyKey: `k-${attempt}`,
        optionIds: [poll.options[0]!.id],
      });
      expect(response.status).toBe(200);
    }

    const blocked = await submitResponse(token, poll.id, {
      idempotencyKey: 'k-blocked',
      optionIds: [poll.options[0]!.id],
    });
    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('RATE_LIMITED');
    expect(blocked.headers['x-retry-after']).toBeDefined();
  });
});
