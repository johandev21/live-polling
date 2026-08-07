import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { and, count, eq, sql } from 'drizzle-orm';
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

type ChoicePoll = {
  id: string;
  options: { id: string; text: string }[];
};

describe('End-to-end verification (e2e)', () => {
  let app: INestApplication<App>;
  let db: TestDb;
  let mailerSend: Mock<Mailer['send']>;
  let sequence = 0;

  const uniqueEmail = () => {
    sequence += 1;
    return `e2e-host-${sequence}-${Date.now()}@example.com`;
  };

  const uniqueIp = () => {
    sequence += 1;
    return `10.190.${(Date.now() % 200) + sequence}.${(sequence % 250) + 1}`;
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
        'Journey e2e tests require Postgres and Redis: run `docker compose up -d postgres redis` in the repo root and `pnpm run db:migrate` in apps/backend.',
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

  async function createSession(cookie: string, name: string) {
    const response = await request(app.getHttpServer())
      .post('/sessions')
      .set('Cookie', cookie)
      .send({ name })
      .expect(201);
    return response.body as {
      id: string;
      name: string;
      roomCode: string;
      status: string;
      revision: number;
    };
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

  async function startSession(cookie: string, sessionId: string) {
    const response = await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/start`)
      .set('Cookie', cookie)
      .expect(200);
    return response.body as { status: string; revision: number };
  }

  async function openPoll(cookie: string, sessionId: string, pollId: string) {
    await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/polls/${pollId}/open`)
      .set('Cookie', cookie)
      .expect(200);
  }

  async function closePoll(cookie: string, sessionId: string, pollId: string) {
    await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/polls/${pollId}/close`)
      .set('Cookie', cookie)
      .expect(200);
  }

  function join(roomCode: string, displayName = 'Ada') {
    return request(app.getHttpServer())
      .post('/join')
      .set(hostHeader(uniqueIp()))
      .send({ roomCode, displayName })
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

  function hostResults(cookie: string, sessionId: string, pollId: string) {
    return request(app.getHttpServer())
      .get(`/sessions/${sessionId}/polls/${pollId}/results`)
      .set('Cookie', cookie);
  }

  function participantResults(token: string, pollId: string) {
    return request(app.getHttpServer())
      .get(`/participant/polls/${pollId}/results`)
      .set('Authorization', `Bearer ${token}`);
  }

  async function openPollCount(sessionId: string): Promise<number> {
    const [row] = await db
      .select({ open: count() })
      .from(schema.polls)
      .where(
        and(
          eq(schema.polls.sessionId, sessionId),
          eq(schema.polls.isOpen, true),
        ),
      );
    return row?.open ?? 0;
  }

  async function responseCount(sessionId: string): Promise<number> {
    const [row] = await db
      .select({ total: count() })
      .from(schema.responses)
      .where(eq(schema.responses.sessionId, sessionId));
    return row?.total ?? 0;
  }

  async function sessionRow(sessionId: string) {
    const [row] = await db
      .select({
        status: schema.sessions.status,
        revision: schema.sessions.revision,
      })
      .from(schema.sessions)
      .where(eq(schema.sessions.id, sessionId))
      .limit(1);
    expect(row).toBeDefined();
    return row as { status: string; revision: number };
  }

  it('drives one session through the complete host and participant journey', async () => {
    const cookie = await signInHost();

    const session = await createSession(cookie, 'Journey session');
    expect(session.status).toBe('draft');
    expect(session.revision).toBe(1);

    const single = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best color?',
      options: ['Red', 'Blue'],
    });
    const multi = await createChoicePoll(cookie, session.id, {
      type: 'multiple_choice',
      text: 'Pick up to two',
      options: ['A', 'B', 'C'],
      maxSelections: 2,
    });
    const open = await createOpenPoll(cookie, session.id);

    const reordered = await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/reorder`)
      .set('Cookie', cookie)
      .send({ pollIds: [single.id, multi.id, open.id] })
      .expect(200);
    expect(
      (reordered.body.polls as { id: string; position: number }[]).map(
        (poll) => poll.position,
      ),
    ).toEqual([0, 1, 2]);

    const renamed = await request(app.getHttpServer())
      .patch(`/sessions/${session.id}`)
      .set('Cookie', cookie)
      .send({ name: 'Journey session renamed' })
      .expect(200);
    expect(renamed.body.name).toBe('Journey session renamed');

    const invitation = await request(app.getHttpServer())
      .get(`/sessions/${session.id}/invitation`)
      .set('Cookie', cookie)
      .expect(200);
    expect(invitation.body.roomCode).toBe(session.roomCode);
    expect(invitation.body.url).toContain(`/join/${session.roomCode}`);

    const started = await startSession(cookie, session.id);
    expect(started.status).toBe('live');

    const joined = await join(session.roomCode, 'Ada');
    const participant = joined.body.participant as {
      id: string;
      sessionId: string;
      displayName: string;
    };
    expect(participant.sessionId).toBe(session.id);
    expect(participant.displayName).toBe('Ada');
    expect((joined.body.snapshot.session as { status: string }).status).toBe(
      'live',
    );
    expect(
      (joined.body.snapshot.polls as { id: string }[]).map((poll) => poll.id),
    ).toEqual([single.id, multi.id, open.id]);

    const byInvitation = await request(app.getHttpServer())
      .post('/join')
      .set(hostHeader(uniqueIp()))
      .send({ invitationUrl: invitation.body.url, displayName: 'Bob' })
      .expect(201);
    const bobToken = byInvitation.body.token as string;

    await openPoll(cookie, session.id, single.id);
    const snapshot = await request(app.getHttpServer())
      .get('/participant/session')
      .set('Authorization', `Bearer ${joined.body.token as string}`)
      .expect(200);
    const openInSnapshot = (
      snapshot.body.polls as { id: string; isOpen: boolean }[]
    ).find((poll) => poll.id === single.id);
    expect(openInSnapshot?.isOpen).toBe(true);

    const singleResponse = await submitResponse(
      joined.body.token as string,
      single.id,
      { idempotencyKey: 'journey-single', optionIds: [single.options[0]!.id] },
    ).expect(200);
    expect(singleResponse.body.optionIds).toEqual([single.options[0]!.id]);

    const replaced = await submitResponse(
      joined.body.token as string,
      single.id,
      {
        idempotencyKey: 'journey-single-2',
        optionIds: [single.options[1]!.id],
      },
    ).expect(200);
    expect(replaced.body.id).toBe(singleResponse.body.id);
    expect(replaced.body.optionIds).toEqual([single.options[1]!.id]);

    const liveResults = await hostResults(cookie, session.id, single.id).expect(
      200,
    );
    expect(liveResults.body.total).toBe(1);
    expect(liveResults.body.counts[0]).toMatchObject({
      text: 'Blue',
      count: 1,
      percentage: 100,
    });

    await closePoll(cookie, session.id, single.id);
    await openPoll(cookie, session.id, multi.id);

    await submitResponse(bobToken, multi.id, {
      idempotencyKey: 'journey-multi-1',
      optionIds: [multi.options[0]!.id, multi.options[1]!.id],
    }).expect(200);
    await submitResponse(joined.body.token as string, multi.id, {
      idempotencyKey: 'journey-multi-2',
      optionIds: [multi.options[0]!.id],
    }).expect(200);

    const hidden = await participantResults(bobToken, multi.id);
    expect(hidden.status).toBe(403);
    expect(hidden.body.code).toBe('RESULTS_NOT_REVEALED');

    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${multi.id}/reveal`)
      .set('Cookie', cookie)
      .expect(200);
    const revealed = await participantResults(bobToken, multi.id).expect(200);
    expect(revealed.body.total).toBe(2);
    const revealedCounts = (
      revealed.body.counts as {
        optionId: string;
        count: number;
        percentage: number;
      }[]
    ).sort((left, right) => left.optionId.localeCompare(right.optionId));
    expect(revealedCounts).toEqual(
      [
        { optionId: multi.options[0]!.id, count: 2, percentage: 100 },
        { optionId: multi.options[1]!.id, count: 1, percentage: 50 },
      ].sort((left, right) => left.optionId.localeCompare(right.optionId)),
    );
    expect(JSON.stringify(revealed.body)).not.toContain('Red');

    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${multi.id}/hide`)
      .set('Cookie', cookie)
      .expect(200);
    const reHidden = await participantResults(bobToken, multi.id);
    expect(reHidden.status).toBe(403);

    await closePoll(cookie, session.id, multi.id);
    await openPoll(cookie, session.id, open.id);
    await submitResponse(joined.body.token as string, open.id, {
      idempotencyKey: 'journey-open',
      text: 'tremendous party!',
    }).expect(200);
    const openResults = await hostResults(cookie, session.id, open.id).expect(
      200,
    );
    expect(openResults.body.total).toBe(1);
    expect(openResults.body.responses[0]?.text).toBe('tremendous party!');

    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/end`)
      .set('Cookie', cookie)
      .expect(200);

    const endedSnapshot = await request(app.getHttpServer())
      .get('/participant/session')
      .set('Authorization', `Bearer ${joined.body.token as string}`)
      .expect(200);
    expect((endedSnapshot.body.session as { status: string }).status).toBe(
      'ended',
    );

    const afterEnd = await hostResults(cookie, session.id, single.id).expect(
      200,
    );
    expect(afterEnd.body.total).toBe(1);
    const multiAfterEnd = await hostResults(
      cookie,
      session.id,
      multi.id,
    ).expect(200);
    expect(multiAfterEnd.body.total).toBe(2);

    const list = await request(app.getHttpServer())
      .get('/sessions')
      .set('Cookie', cookie)
      .expect(200);
    const listed = (
      list.body.sessions as { id: string; status: string }[]
    ).find((entry) => entry.id === session.id);
    expect(listed?.status).toBe('ended');

    const rejectedAfterEnd = await submitResponse(bobToken, open.id, {
      idempotencyKey: 'journey-late',
      text: 'too late',
    });
    expect(rejectedAfterEnd.status).toBe(409);
    expect(rejectedAfterEnd.body.code).toBe('SESSION_ENDED');
  }, 30_000);

  it('resolves a concurrent poll-open and response-submit to one authoritative outcome', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie, 'Open/submit race session');
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
    await startSession(cookie, session.id);
    await openPoll(cookie, session.id, first.id);
    const joined = await join(session.roomCode);
    const token = joined.body.token as string;

    const before = await sessionRow(session.id);

    const [openResult, submitResult] = await Promise.all([
      request(app.getHttpServer())
        .post(`/sessions/${session.id}/polls/${second.id}/open`)
        .set('Cookie', cookie),
      submitResponse(token, first.id, {
        idempotencyKey: 'k-race-open-submit',
        optionIds: [first.options[0]!.id],
      }),
    ]);

    expect(openResult.status).toBe(200);
    expect([200, 409]).toContain(submitResult.status);

    expect(await openPollCount(session.id)).toBe(1);
    const openPollIds = (
      await db
        .select({ id: schema.polls.id })
        .from(schema.polls)
        .where(
          and(
            eq(schema.polls.sessionId, session.id),
            eq(schema.polls.isOpen, true),
          ),
        )
    ).map((poll) => poll.id);
    expect(openPollIds).toEqual([second.id]);

    if (submitResult.status === 200) {
      expect(await responseCount(session.id)).toBe(1);
      const results = await hostResults(cookie, session.id, first.id).expect(
        200,
      );
      expect(results.body.total).toBe(1);
    } else {
      expect(submitResult.status).toBe(409);
      expect(submitResult.body.code).toBe('CLOSED_POLL');
      expect(await responseCount(session.id)).toBe(0);
    }

    const after = await sessionRow(session.id);
    expect(after.revision).toBeGreaterThan(before.revision);
    const snapshot = await request(app.getHttpServer())
      .get(`/sessions/${session.id}`)
      .set('Cookie', cookie)
      .expect(200);
    expect(snapshot.body.revision).toBe(after.revision);
  }, 20_000);

  it('leaves exactly one active poll when two host requests open different polls concurrently', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie, 'Competing open session');
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
    await startSession(cookie, session.id);

    const before = await sessionRow(session.id);

    const [openFirst, openSecond] = await Promise.all([
      request(app.getHttpServer())
        .post(`/sessions/${session.id}/polls/${first.id}/open`)
        .set('Cookie', cookie),
      request(app.getHttpServer())
        .post(`/sessions/${session.id}/polls/${second.id}/open`)
        .set('Cookie', cookie),
    ]);

    expect(openFirst.status).toBe(200);
    expect(openSecond.status).toBe(200);

    expect(await openPollCount(session.id)).toBe(1);
    const winner = (
      await db
        .select({ id: schema.polls.id })
        .from(schema.polls)
        .where(
          and(
            eq(schema.polls.sessionId, session.id),
            eq(schema.polls.isOpen, true),
          ),
        )
    )[0]?.id;
    expect([first.id, second.id]).toContain(winner);

    const after = await sessionRow(session.id);
    expect(after.revision).toBe(before.revision + 2);

    const list = await request(app.getHttpServer())
      .get(`/sessions/${session.id}/polls`)
      .set('Cookie', cookie)
      .expect(200);
    const open = (list.body.polls as { id: string; isOpen: boolean }[]).filter(
      (poll) => poll.isOpen,
    );
    expect(open).toHaveLength(1);
    expect(open[0]?.id).toBe(winner);
  }, 20_000);

  it('treats parallel idempotent retries as one effective response', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie, 'Idempotent race session');
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['Red', 'Blue'],
    });
    await startSession(cookie, session.id);
    await openPoll(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);
    const token = joined.body.token as string;

    const before = await sessionRow(session.id);

    const [first, second] = await Promise.all([
      submitResponse(token, poll.id, {
        idempotencyKey: 'k-parallel-retry',
        optionIds: [poll.options[0]!.id],
      }),
      submitResponse(token, poll.id, {
        idempotencyKey: 'k-parallel-retry',
        optionIds: [poll.options[0]!.id],
      }),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);

    expect(await responseCount(session.id)).toBe(1);
    const persisted = await db
      .select()
      .from(schema.responses)
      .where(eq(schema.responses.pollId, poll.id));
    expect(persisted).toHaveLength(1);
    expect(persisted[0]?.id).toBe(first.body.id);

    const after = await sessionRow(session.id);
    expect(after.revision).toBe(before.revision + 1);

    const results = await hostResults(cookie, session.id, poll.id).expect(200);
    expect(results.body.total).toBe(1);
    expect(results.body.counts[0]?.count).toBe(1);
  }, 20_000);

  it('resolves a response racing a session end without partial writes', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie, 'End race session');
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['Red', 'Blue'],
    });
    await startSession(cookie, session.id);
    await openPoll(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);
    const token = joined.body.token as string;

    const [endResult, submitResult] = await Promise.all([
      request(app.getHttpServer())
        .post(`/sessions/${session.id}/end`)
        .set('Cookie', cookie),
      submitResponse(token, poll.id, {
        idempotencyKey: 'k-race-end',
        optionIds: [poll.options[0]!.id],
      }),
    ]);

    expect(endResult.status).toBe(200);
    expect([200, 409]).toContain(submitResult.status);

    const ended = await sessionRow(session.id);
    expect(ended.status).toBe('ended');
    expect(ended.revision).toBe(endResult.body.revision);

    if (submitResult.status === 200) {
      expect(await responseCount(session.id)).toBe(1);
      const results = await hostResults(cookie, session.id, poll.id).expect(
        200,
      );
      expect(results.body.total).toBe(1);
    } else {
      expect(submitResult.status).toBe(409);
      expect(submitResult.body.code).toBe('SESSION_ENDED');
      expect(await responseCount(session.id)).toBe(0);
    }

    const late = await submitResponse(token, poll.id, {
      idempotencyKey: 'k-race-end-late',
      optionIds: [poll.options[0]!.id],
    });
    expect(late.status).toBe(409);
    expect(late.body.code).toBe('SESSION_ENDED');
    expect(await responseCount(session.id)).toBe(
      submitResult.status === 200 ? 1 : 0,
    );
  }, 20_000);

  it('resolves a response racing a poll close without partial writes', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie, 'Close race session');
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['Red', 'Blue'],
    });
    await startSession(cookie, session.id);
    await openPoll(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);
    const token = joined.body.token as string;

    const [closeResult, submitResult] = await Promise.all([
      request(app.getHttpServer())
        .post(`/sessions/${session.id}/polls/${poll.id}/close`)
        .set('Cookie', cookie),
      submitResponse(token, poll.id, {
        idempotencyKey: 'k-race-close',
        optionIds: [poll.options[0]!.id],
      }),
    ]);

    expect(closeResult.status).toBe(200);
    expect([200, 409]).toContain(submitResult.status);

    const polls = await db
      .select({ isOpen: schema.polls.isOpen })
      .from(schema.polls)
      .where(eq(schema.polls.id, poll.id));
    expect(polls[0]?.isOpen).toBe(false);

    if (submitResult.status === 200) {
      expect(await responseCount(session.id)).toBe(1);
      const results = await hostResults(cookie, session.id, poll.id).expect(
        200,
      );
      expect(results.body.total).toBe(1);
    } else {
      expect(submitResult.body.code).toBe('CLOSED_POLL');
      expect(await responseCount(session.id)).toBe(0);
    }

    const late = await submitResponse(token, poll.id, {
      idempotencyKey: 'k-race-close-late',
      optionIds: [poll.options[0]!.id],
    });
    expect(late.status).toBe(409);
    expect(late.body.code).toBe('CLOSED_POLL');
    expect(await responseCount(session.id)).toBe(
      submitResult.status === 200 ? 1 : 0,
    );
  }, 20_000);
});
