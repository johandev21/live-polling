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

describe('Poll authoring and lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  let db: TestDb;
  let mailerSend: Mock<Mailer['send']>;
  let sequence = 0;

  const uniqueEmail = () => {
    sequence += 1;
    return `poll-host-${sequence}-${Date.now()}@example.com`;
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
        'Poll e2e tests require Postgres and Redis: run `docker compose up -d postgres redis` in the repo root and `pnpm run db:migrate` in apps/backend.',
      );
    }
  }

  async function wipeTables() {
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
    const response = await request(app.getHttpServer())
      .get(
        `${new URL(link as string).pathname}${new URL(link as string).search}`,
      )
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

  async function createSession(cookie: string, name = 'Poll session') {
    const response = await request(app.getHttpServer())
      .post('/sessions')
      .set('Cookie', cookie)
      .send({ name })
      .expect(201);
    return response.body;
  }

  async function createPoll(
    cookie: string,
    sessionId: string,
    body: {
      type: string;
      text: string;
      options?: string[];
      maxSelections?: number | null;
    },
    expected = 201,
  ) {
    const response = await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/polls`)
      .set('Cookie', cookie)
      .send(body)
      .expect(expected);
    return response;
  }

  async function startSession(cookie: string, sessionId: string) {
    await createPoll(cookie, sessionId, {
      type: 'single_choice',
      text: 'Starter',
      options: ['A', 'B'],
    });
    await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/start`)
      .set('Cookie', cookie)
      .expect(200);
  }

  async function seedHasResponses(pollId: string) {
    await db
      .update(schema.polls)
      .set({ hasResponses: true })
      .where(eq(schema.polls.id, pollId));
  }

  function expectChoicePoll(body: Record<string, unknown>) {
    expect(body).toMatchObject({
      id: expect.any(String),
      sessionId: expect.any(String),
      type: expect.any(String),
      text: expect.any(String),
      position: 0,
      isOpen: false,
      resultsRevealed: false,
      hasResponses: false,
      maxSelections: null,
      options: expect.any(Array),
    });
  }

  it('creates all three poll types with snapshots and ordered options', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);

    const single = await createPoll(cookie, session.id, {
      type: 'single_choice',
      text: '  Best color?  ',
      options: [' Red ', 'Blue', ' Green '],
    });
    expect(single.status).toBe(201);
    expectChoicePoll(single.body);
    expect(single.body.text).toBe('Best color?');
    expect(single.body.type).toBe('single_choice');
    expect(single.body.options).toEqual([
      { id: expect.any(String), text: 'Red', position: 0 },
      { id: expect.any(String), text: 'Blue', position: 1 },
      { id: expect.any(String), text: 'Green', position: 2 },
    ]);

    const multiple = await createPoll(cookie, session.id, {
      type: 'multiple_choice',
      text: 'Pick toppings',
      options: ['Cheese', 'Bacon', 'Mushroom'],
      maxSelections: 2,
    });
    expect(multiple.body.maxSelections).toBe(2);
    expect(multiple.body.type).toBe('multiple_choice');

    const openEnded = await createPoll(cookie, session.id, {
      type: 'open_ended',
      text: 'Why?',
    });
    expect(openEnded.body.type).toBe('open_ended');
    expect(openEnded.body.options).toEqual([]);
    expect(openEnded.body.maxSelections).toBeNull();
  });

  it('rejects invalid poll payloads with INVALID_INPUT', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    const post = (body: Record<string, unknown>) =>
      request(app.getHttpServer())
        .post(`/sessions/${session.id}/polls`)
        .set('Cookie', cookie)
        .send(body);

    const invalid: Record<string, unknown>[] = [
      { type: 'single_choice', text: '   ', options: ['a', 'b'] },
      { type: 'single_choice', text: 'x'.repeat(501), options: ['a', 'b'] },
      { type: 'single_choice', text: 'Q', options: ['a'] },
      {
        type: 'single_choice',
        text: 'Q',
        options: Array.from({ length: 11 }, (_, i) => `o${i}`),
      },
      { type: 'single_choice', text: 'Q', options: ['a', 'a'] },
      { type: 'single_choice', text: 'Q', options: ['', 'b'] },
      {
        type: 'single_choice',
        text: 'Q',
        options: ['a', 'b'],
        maxSelections: 3,
      },
      {
        type: 'single_choice',
        text: 'Q',
        options: ['a', 'b'],
        maxSelections: 2,
      },
      {
        type: 'single_choice',
        text: 'Q',
        options: ['a', 'b'],
        maxSelections: 1,
      },
      { type: 'open_ended', text: 'Q', options: ['a', 'b'] },
      { type: 'open_ended', text: 'Q', maxSelections: 2 },
      { type: 'single_choice', text: 'Q' },
      { type: 'unknown_type', text: 'Q' },
    ];

    for (const body of invalid) {
      const response = await post(body);
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_INPUT');
    }
  });

  it('lists polls in creation order', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    await createPoll(cookie, session.id, {
      type: 'open_ended',
      text: 'First',
    });
    await createPoll(cookie, session.id, {
      type: 'open_ended',
      text: 'Second',
    });

    const response = await request(app.getHttpServer())
      .get(`/sessions/${session.id}/polls`)
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body.polls.map((p: { text: string }) => p.text)).toEqual([
      'First',
      'Second',
    ]);
    expect(response.body.polls[0]?.position).toBe(0);
    expect(response.body.polls[1]?.position).toBe(1);
  });

  it('updates a poll before responses and bumps the session revision', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    const poll = await createPoll(cookie, session.id, {
      type: 'multiple_choice',
      text: 'Old',
      options: ['A', 'B', 'C'],
      maxSelections: 2,
    });

    const response = await request(app.getHttpServer())
      .patch(`/sessions/${session.id}/polls/${poll.body.id}`)
      .set('Cookie', cookie)
      .send({
        text: 'New',
        options: ['X', 'Y', 'Z'],
        maxSelections: null,
      })
      .expect(200);

    expect(response.body.text).toBe('New');
    expect(response.body.options.map((o: { text: string }) => o.text)).toEqual([
      'X',
      'Y',
      'Z',
    ]);
    expect(response.body.maxSelections).toBeNull();

    const sessionBefore = await request(app.getHttpServer())
      .get(`/sessions/${session.id}`)
      .set('Cookie', cookie)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/sessions/${session.id}/polls/${poll.body.id}`)
      .set('Cookie', cookie)
      .send({ text: 'New again', options: ['X', 'Y', 'Z'] })
      .expect(200);

    const sessionAfter = await request(app.getHttpServer())
      .get(`/sessions/${session.id}`)
      .set('Cookie', cookie)
      .expect(200);
    expect(sessionAfter.body.revision).toBe(sessionBefore.body.revision + 1);
  });

  it('locks poll edits after the first effective response', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    const poll = await createPoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Locked',
      options: ['A', 'B'],
    });
    await seedHasResponses(poll.body.id);

    const response = await request(app.getHttpServer())
      .patch(`/sessions/${session.id}/polls/${poll.body.id}`)
      .set('Cookie', cookie)
      .send({ text: 'Nope', options: ['A', 'B'] })
      .expect(409);

    expect(response.body.code).toBe('POLL_LOCKED');
  });

  it('deletes a poll before responses and cascades its options', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    const poll = await createPoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Doomed',
      options: ['A', 'B'],
    });
    const optionIds = (
      await db
        .select({ id: schema.pollOptions.id })
        .from(schema.pollOptions)
        .where(eq(schema.pollOptions.pollId, poll.body.id))
    ).map((row) => row.id);
    expect(optionIds).toHaveLength(2);

    await request(app.getHttpServer())
      .delete(`/sessions/${session.id}/polls/${poll.body.id}`)
      .set('Cookie', cookie)
      .expect(204);

    const list = await request(app.getHttpServer())
      .get(`/sessions/${session.id}/polls`)
      .set('Cookie', cookie)
      .expect(200);
    expect(list.body.polls).toHaveLength(0);

    const leftovers = await db
      .select()
      .from(schema.pollOptions)
      .where(eq(schema.pollOptions.pollId, poll.body.id));
    expect(leftovers).toHaveLength(0);
  });

  it('rejects deleting a poll with responses', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    const poll = await createPoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Answered',
      options: ['A', 'B'],
    });
    await seedHasResponses(poll.body.id);

    const response = await request(app.getHttpServer())
      .delete(`/sessions/${session.id}/polls/${poll.body.id}`)
      .set('Cookie', cookie)
      .expect(409);
    expect(response.body.code).toBe('POLL_LOCKED');
  });

  it('compacts positions when a poll is deleted so order stays dense', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    await createPoll(cookie, session.id, {
      type: 'open_ended',
      text: 'One',
    });
    const second = await createPoll(cookie, session.id, {
      type: 'open_ended',
      text: 'Two',
    });
    await createPoll(cookie, session.id, {
      type: 'open_ended',
      text: 'Three',
    });

    await request(app.getHttpServer())
      .delete(`/sessions/${session.id}/polls/${second.body.id}`)
      .set('Cookie', cookie)
      .expect(204);

    await createPoll(cookie, session.id, {
      type: 'open_ended',
      text: 'Four',
    });

    const list = await request(app.getHttpServer())
      .get(`/sessions/${session.id}/polls`)
      .set('Cookie', cookie)
      .expect(200);

    expect(list.body.polls.map((p: { text: string }) => p.text)).toEqual([
      'One',
      'Three',
      'Four',
    ]);
    expect(
      list.body.polls.map((p: { position: number }) => p.position),
    ).toEqual([0, 1, 2]);
  });

  it('reorders polls in a draft session', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    const first = await createPoll(cookie, session.id, {
      type: 'open_ended',
      text: 'One',
    });
    const second = await createPoll(cookie, session.id, {
      type: 'open_ended',
      text: 'Two',
    });
    const third = await createPoll(cookie, session.id, {
      type: 'open_ended',
      text: 'Three',
    });

    const response = await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/reorder`)
      .set('Cookie', cookie)
      .send({ pollIds: [third.body.id, first.body.id, second.body.id] })
      .expect(200);

    expect(response.body.polls.map((p: { text: string }) => p.text)).toEqual([
      'Three',
      'One',
      'Two',
    ]);
    expect(
      response.body.polls.map((p: { position: number }) => p.position),
    ).toEqual([0, 1, 2]);
  });

  it('rejects malformed reorder sets and reorder outside draft', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    const first = await createPoll(cookie, session.id, {
      type: 'open_ended',
      text: 'One',
    });
    await createPoll(cookie, session.id, {
      type: 'open_ended',
      text: 'Two',
    });

    const cases: unknown[][] = [
      [first.body.id],
      [first.body.id, '00000000-0000-4000-8000-000000000000'],
      [first.body.id, first.body.id],
    ];
    for (const pollIds of cases) {
      const response = await request(app.getHttpServer())
        .post(`/sessions/${session.id}/polls/reorder`)
        .set('Cookie', cookie)
        .send({ pollIds })
        .expect(400);
      expect(response.body.code).toBe('INVALID_INPUT');
    }

    await startSession(cookie, session.id);
    const liveReorder = await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/reorder`)
      .set('Cookie', cookie)
      .send({ pollIds: [first.body.id] })
      .expect(409);
    expect(liveReorder.body.code).toBe('INVALID_TRANSITION');
  });

  it('rejects opening or closing polls outside a live session', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    const poll = await createPoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Q',
      options: ['A', 'B'],
    });

    const draftOpen = await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.body.id}/open`)
      .set('Cookie', cookie)
      .expect(409);
    expect(draftOpen.body.code).toBe('INVALID_TRANSITION');

    await startSession(cookie, session.id);
    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/end`)
      .set('Cookie', cookie)
      .expect(200);

    const endedOpen = await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.body.id}/open`)
      .set('Cookie', cookie)
      .expect(409);
    expect(endedOpen.body.code).toBe('INVALID_TRANSITION');
  });

  it('opens a poll in a live session and atomically closes any other open poll', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    const first = await createPoll(cookie, session.id, {
      type: 'single_choice',
      text: 'First',
      options: ['A', 'B'],
    });
    const second = await createPoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Second',
      options: ['C', 'D'],
    });
    await startSession(cookie, session.id);

    const opened = await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${first.body.id}/open`)
      .set('Cookie', cookie)
      .expect(200);
    expect(opened.body.isOpen).toBe(true);

    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${second.body.id}/open`)
      .set('Cookie', cookie)
      .expect(200);

    const list = await request(app.getHttpServer())
      .get(`/sessions/${session.id}/polls`)
      .set('Cookie', cookie)
      .expect(200);
    const open = list.body.polls.filter((p: { isOpen: boolean }) => p.isOpen);
    expect(open).toHaveLength(1);
    expect(open[0]?.id).toBe(second.body.id);

    const reopened = await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${first.body.id}/open`)
      .set('Cookie', cookie)
      .expect(200);
    expect(reopened.body.isOpen).toBe(true);
  });

  it('rejects opening an already-open poll and closing a closed poll', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    const poll = await createPoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Q',
      options: ['A', 'B'],
    });
    await startSession(cookie, session.id);

    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.body.id}/open`)
      .set('Cookie', cookie)
      .expect(200);

    const reopen = await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.body.id}/open`)
      .set('Cookie', cookie)
      .expect(409);
    expect(reopen.body.code).toBe('INVALID_TRANSITION');

    const close = await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.body.id}/close`)
      .set('Cookie', cookie)
      .expect(200);
    expect(close.body.isOpen).toBe(false);

    const reclose = await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.body.id}/close`)
      .set('Cookie', cookie)
      .expect(409);
    expect(reclose.body.code).toBe('INVALID_TRANSITION');
  });

  it('reveals and hides results independently of open state, including zero responses', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    const poll = await createPoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Q',
      options: ['A', 'B'],
    });
    await startSession(cookie, session.id);

    const revealed = await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.body.id}/reveal`)
      .set('Cookie', cookie)
      .expect(200);
    expect(revealed.body.resultsRevealed).toBe(true);
    expect(revealed.body.isOpen).toBe(false);

    const reReveal = await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.body.id}/reveal`)
      .set('Cookie', cookie)
      .expect(409);
    expect(reReveal.body.code).toBe('INVALID_TRANSITION');

    const hidden = await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.body.id}/hide`)
      .set('Cookie', cookie)
      .expect(200);
    expect(hidden.body.resultsRevealed).toBe(false);

    const reHide = await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.body.id}/hide`)
      .set('Cookie', cookie)
      .expect(409);
    expect(reHide.body.code).toBe('INVALID_TRANSITION');
  });

  it('blocks reveal/hide on ended sessions', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    const poll = await createPoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Q',
      options: ['A', 'B'],
    });
    await startSession(cookie, session.id);
    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/end`)
      .set('Cookie', cookie)
      .expect(200);

    for (const action of ['reveal', 'hide']) {
      const response = await request(app.getHttpServer())
        .post(`/sessions/${session.id}/polls/${poll.body.id}/${action}`)
        .set('Cookie', cookie)
        .expect(409);
      expect(response.body.code).toBe('INVALID_TRANSITION');
    }
  });

  it('blocks poll edits and creates on ended sessions', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    const poll = await createPoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Q',
      options: ['A', 'B'],
    });
    await startSession(cookie, session.id);
    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/end`)
      .set('Cookie', cookie)
      .expect(200);

    const edit = await request(app.getHttpServer())
      .patch(`/sessions/${session.id}/polls/${poll.body.id}`)
      .set('Cookie', cookie)
      .send({ text: 'Changed', options: ['A', 'B'] })
      .expect(409);
    expect(edit.body.code).toBe('INVALID_TRANSITION');

    const create = await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls`)
      .set('Cookie', cookie)
      .send({ type: 'open_ended', text: 'Late' })
      .expect(409);
    expect(create.body.code).toBe('INVALID_TRANSITION');
  });

  it('enforces host ownership across all poll routes', async () => {
    const cookie = await signInHost();
    const otherCookie = await signInHost();
    const other = await createSession(otherCookie);
    const otherPoll = await createPoll(otherCookie, other.id, {
      type: 'single_choice',
      text: 'Private',
      options: ['A', 'B'],
    });

    const create = await request(app.getHttpServer())
      .post(`/sessions/${other.id}/polls`)
      .set('Cookie', cookie)
      .send({ type: 'open_ended', text: 'Sneaky' })
      .expect(404);
    expect(create.body.code).toBe('SESSION_NOT_FOUND');

    const list = await request(app.getHttpServer())
      .get(`/sessions/${other.id}/polls`)
      .set('Cookie', cookie)
      .expect(404);
    expect(list.body.code).toBe('SESSION_NOT_FOUND');

    const get = await request(app.getHttpServer())
      .get(`/sessions/${other.id}/polls/${otherPoll.body.id}`)
      .set('Cookie', cookie)
      .expect(404);
    expect(get.body.code).toBe('SESSION_NOT_FOUND');

    const open = await request(app.getHttpServer())
      .post(`/sessions/${other.id}/polls/${otherPoll.body.id}/open`)
      .set('Cookie', cookie)
      .expect(404);
    expect(open.body.code).toBe('SESSION_NOT_FOUND');
  });

  it('returns POLL_NOT_FOUND for polls outside the requested session', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    const other = await createSession(cookie);
    const poll = await createPoll(cookie, session.id, {
      type: 'open_ended',
      text: 'Elsewhere',
    });

    const response = await request(app.getHttpServer())
      .get(`/sessions/${other.id}/polls/${poll.body.id}`)
      .set('Cookie', cookie)
      .expect(404);
    expect(response.body.code).toBe('POLL_NOT_FOUND');
  });

  it('advances the session revision when a poll opens', async () => {
    const cookie = await signInHost();
    const session = await createSession(cookie);
    const poll = await createPoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Q',
      options: ['A', 'B'],
    });
    await startSession(cookie, session.id);

    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.body.id}/open`)
      .set('Cookie', cookie)
      .expect(200);

    const sessionAfter = await request(app.getHttpServer())
      .get(`/sessions/${session.id}`)
      .set('Cookie', cookie)
      .expect(200);
    expect(sessionAfter.body.revision).toBeGreaterThanOrEqual(2);
  });
});
