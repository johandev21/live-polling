import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import Redis from 'ioredis';
import type { AddressInfo } from 'node:net';
import { connect } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { Mock } from 'vitest';
import { AppModule } from '../src/app.module';
import { REALTIME_EVENTS } from '../src/contracts/events.contract';
import { DATABASE } from '../src/infrastructure/database/database.constants';
import * as schema from '../src/infrastructure/database/schema';
import { MAILER } from '../src/infrastructure/mailer/mailer.constants';
import type { Mailer } from '../src/infrastructure/mailer/mailer.constants';
import { REDIS_CLIENT } from '../src/infrastructure/redis/redis.constants';
import { SessionGateway } from '../src/realtime/session.gateway';

process.env.PRESENCE_TTL_SECONDS = '2';
process.env.PRESENCE_SWEEP_INTERVAL_MS = '500';

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

type RecordedEvent = { event: string; payload: unknown };

class EventStream {
  readonly events: RecordedEvent[] = [];
  private cursor = 0;

  push(entry: RecordedEvent): void {
    this.events.push(entry);
  }

  async waitFor(
    eventName: string,
    predicate?: (payload: unknown) => boolean,
    timeoutMs = 8_000,
  ): Promise<unknown> {
    const start = Date.now();
    for (;;) {
      while (this.cursor < this.events.length) {
        const entry = this.events[this.cursor]!;
        this.cursor += 1;
        if (
          entry.event === eventName &&
          (!predicate || predicate(entry.payload))
        ) {
          return entry.payload;
        }
      }
      if (Date.now() - start >= timeoutMs) {
        throw new Error(`timed out waiting for ${eventName}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

type ConnectedSocket = { socket: Socket; events: EventStream };

describe('Realtime session updates and presence (e2e)', () => {
  let app: INestApplication<App>;
  let port: number;
  let db: TestDb;
  let mailerSend: Mock<Mailer['send']>;
  let sequence = 0;
  const sockets: Socket[] = [];

  const uniqueEmail = () => {
    sequence += 1;
    return `realtime-host-${sequence}-${Date.now()}@example.com`;
  };

  const uniqueIp = () => {
    sequence += 1;
    return `10.160.${(Date.now() % 200) + sequence}.${(sequence % 250) + 1}`;
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
    port = await listen(app);

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
    vi.restoreAllMocks();
    for (const socket of sockets.splice(0)) {
      socket.removeAllListeners();
      socket.disconnect();
    }
  });

  async function expectServicesReady() {
    try {
      await db.execute(sql`select 1`);
      const redis = app.get<Redis>(REDIS_CLIENT);
      if (redis.status === 'wait') await redis.connect();
      await redis.ping();
    } catch {
      throw new Error(
        'Realtime e2e tests require Postgres and Redis: run `docker compose up -d postgres redis` in the repo root and `pnpm run db:migrate` in apps/backend.',
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

  async function listen(target: INestApplication): Promise<number> {
    const server = target.getHttpServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    return (server.address() as AddressInfo).port;
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
      .send({ name: 'Realtime session' })
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

  function openPollREST(cookie: string, sessionId: string, pollId: string) {
    return request(app.getHttpServer())
      .post(`/sessions/${sessionId}/polls/${pollId}/open`)
      .set('Cookie', cookie)
      .expect(200);
  }

  async function join(
    roomCode: string,
    displayName = 'Ada',
  ): Promise<{ token: string; participantId: string }> {
    const response = await request(app.getHttpServer())
      .post('/join')
      .set(hostHeader(uniqueIp()))
      .send({ roomCode, displayName })
      .expect(201);
    return {
      token: response.body.token as string,
      participantId: (response.body.participant as { id: string }).id,
    };
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

  function connectSocket(
    targetPort: number,
    auth: Record<string, unknown>,
    cookie?: string,
  ): Promise<ConnectedSocket> {
    const socket = connect(`http://127.0.0.1:${targetPort}`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      timeout: 5_000,
      auth,
      extraHeaders: {
        'x-forwarded-for': uniqueIp(),
        ...(cookie ? { Cookie: cookie } : {}),
      },
    });
    sockets.push(socket);
    const stream = new EventStream();
    socket.onAny((event, payload) => stream.push({ event, payload }));
    return new Promise((resolve, reject) => {
      socket.on('connect', () => resolve({ socket, events: stream }));
      socket.on('connect_error', (error) => reject(error));
    });
  }

  function connectParticipant(targetPort: number, token: string) {
    return connectSocket(targetPort, { role: 'participant', token });
  }

  function connectHost(targetPort: number, sessionId: string, cookie: string) {
    return connectSocket(targetPort, { role: 'host', sessionId }, cookie);
  }

  async function waitForRejection(
    targetPort: number,
    auth: Record<string, unknown>,
    cookie?: string,
  ): Promise<unknown> {
    const { socket, events } = await connectSocket(targetPort, auth, cookie);
    const error = await events.waitFor(REALTIME_EVENTS.AUTH_ERROR);
    socket.disconnect();
    return error;
  }

  it('rejects sockets without credentials and reports a machine-readable code', async () => {
    const error = await waitForRejection(port, {});
    expect(error).toEqual({ code: 'UNAUTHORIZED' });
  });

  it('rejects host sockets authenticated with a participant token', async () => {
    const { session } = await createLiveSession();
    const joined = await join(session.roomCode);
    const error = await waitForRejection(port, {
      role: 'host',
      token: joined.token,
    });
    expect(error).toEqual({ code: 'UNAUTHORIZED' });
  });

  it('rejects host sockets for sessions they do not own', async () => {
    const first = await createLiveSession();
    const second = await createLiveSession();
    const error = await waitForRejection(
      port,
      { role: 'host', sessionId: second.session.id },
      first.cookie,
    );
    expect(error).toEqual({ code: 'UNAUTHORIZED' });
  });

  it('rejects participant sockets with an invalid token', async () => {
    const error = await waitForRejection(port, {
      role: 'participant',
      token: 'not-a-token',
    });
    expect(error).toEqual({ code: 'UNAUTHORIZED' });
  });

  it('authenticates a host socket with the host session cookie and joins the session room', async () => {
    const { cookie, session } = await createLiveSession();
    const { socket: hostSocket, events } = await connectHost(
      port,
      session.id,
      cookie,
    );

    const resync = (await events.waitFor(REALTIME_EVENTS.RESYNC_REQUESTED)) as {
      sessionId: string;
      revision: number;
    };
    expect(resync.sessionId).toBe(session.id);
    expect(resync.revision).toBeGreaterThan(0);

    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['Red', 'Blue'],
    });
    const created = (await events.waitFor(
      REALTIME_EVENTS.POLL_CREATED,
      (payload) => (payload as { poll?: { id?: string } }).poll?.id === poll.id,
    )) as { poll: { id: string; hasResponses: boolean } };
    expect(created.poll.id).toBe(poll.id);
    expect(created.poll.hasResponses).toBe(false);
    hostSocket.disconnect();
  });

  it('authenticates a participant socket with a scoped token and reports presence to the host', async () => {
    const { cookie, session } = await createLiveSession();
    const { events: hostEvents } = await connectHost(port, session.id, cookie);
    const joined = await join(session.roomCode, 'Grace');
    const { socket: participantSocket, events: participantEvents } =
      await connectParticipant(port, joined.token);

    const resync = (await participantEvents.waitFor(
      REALTIME_EVENTS.RESYNC_REQUESTED,
    )) as { sessionId: string };
    expect(resync.sessionId).toBe(session.id);

    const presence = (await hostEvents.waitFor(
      REALTIME_EVENTS.PRESENCE_UPDATED,
      (payload) => (payload as { count?: number }).count === 1,
    )) as {
      count: number;
      participants: { participantId: string; displayName: string }[];
    };
    expect(presence.count).toBe(1);
    expect(presence.participants).toEqual([
      { participantId: joined.participantId, displayName: 'Grace' },
    ]);
    participantSocket.disconnect();
  });

  it('keeps rooms isolated so session B sockets never receive session A events', async () => {
    const a = await createLiveSession();
    const b = await createLiveSession();
    const pollA = await createChoicePoll(a.cookie, a.session.id, {
      type: 'single_choice',
      text: 'A question',
      options: ['A1', 'A2'],
    });
    const pollB = await createChoicePoll(b.cookie, b.session.id, {
      type: 'single_choice',
      text: 'B question',
      options: ['B1', 'B2'],
    });

    await connectHost(port, a.session.id, a.cookie);
    const { events: eventsA } = await connectParticipant(
      port,
      (await join(a.session.roomCode)).token,
    );
    const { events: eventsB } = await connectParticipant(
      port,
      (await join(b.session.roomCode)).token,
    );

    await openPollREST(a.cookie, a.session.id, pollA.id);
    await eventsA.waitFor(
      REALTIME_EVENTS.POLL_OPENED,
      (payload) =>
        (payload as { poll?: { id?: string } }).poll?.id === pollA.id,
    );

    await openPollREST(b.cookie, b.session.id, pollB.id);
    await eventsB.waitFor(
      REALTIME_EVENTS.POLL_OPENED,
      (payload) =>
        (payload as { poll?: { id?: string } }).poll?.id === pollB.id,
    );

    await new Promise((resolve) => setTimeout(resolve, 500));
    const openedInA = eventsA.events.filter(
      (entry) =>
        entry.event === REALTIME_EVENTS.POLL_OPENED &&
        (entry.payload as { poll?: { id?: string } }).poll?.id === pollA.id,
    );
    const openedInB = eventsB.events.filter(
      (entry) =>
        entry.event === REALTIME_EVENTS.POLL_OPENED &&
        (entry.payload as { poll?: { id?: string } }).poll?.id === pollA.id,
    );
    expect(openedInA.length).toBeGreaterThan(0);
    expect(openedInB).toHaveLength(0);
  });

  it('emits typed revisioned lifecycle events with role-scoped payloads', async () => {
    const { cookie, session } = await createLiveSession();
    const choice = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best color?',
      options: ['Red', 'Blue'],
    });
    const open = await createOpenPoll(cookie, session.id);

    const { events: hostEvents } = await connectHost(port, session.id, cookie);
    const first = await join(session.roomCode, 'Ada');
    const second = await join(session.roomCode, 'Bob');
    const { events: participantEvents } = await connectParticipant(
      port,
      first.token,
    );
    await hostEvents.waitFor(
      REALTIME_EVENTS.PRESENCE_UPDATED,
      (payload) => (payload as { count?: number }).count === 1,
    );

    await openPollREST(cookie, session.id, choice.id);
    const hostOpened = (await hostEvents.waitFor(
      REALTIME_EVENTS.POLL_OPENED,
      (payload) =>
        (payload as { poll?: { id?: string } }).poll?.id === choice.id,
    )) as { poll: { id: string; sessionId: string; hasResponses: boolean } };
    expect(hostOpened.poll.sessionId).toBe(session.id);
    const participantOpened = (await participantEvents.waitFor(
      REALTIME_EVENTS.POLL_OPENED,
      (payload) =>
        (payload as { poll?: { id?: string } }).poll?.id === choice.id,
    )) as { poll: Record<string, unknown> };
    expect(participantOpened.poll.sessionId).toBeUndefined();
    expect(participantOpened.poll.hasResponses).toBeUndefined();

    await submitResponse(first.token, choice.id, {
      idempotencyKey: 'k-realtime-1',
      optionIds: [choice.options[0]!.id],
    }).expect(200);
    const hostAccepted = (await hostEvents.waitFor(
      REALTIME_EVENTS.RESPONSE_ACCEPTED,
      (payload) =>
        (payload as { pollId?: string }).pollId === choice.id &&
        (payload as { results?: { total?: number } }).results?.total === 1,
    )) as { results: { total: number; counts: { text: string }[] } };
    expect(hostAccepted.results.counts[0]?.text).toBe('Red');
    const participantAccepted = (await participantEvents.waitFor(
      REALTIME_EVENTS.RESPONSE_ACCEPTED,
      (payload) => (payload as { pollId?: string }).pollId === choice.id,
    )) as { results: unknown };
    expect(participantAccepted.results).toBeNull();

    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${choice.id}/reveal`)
      .set('Cookie', cookie)
      .expect(200);
    await participantEvents.waitFor(REALTIME_EVENTS.RESULTS_REVEALED);

    await submitResponse(second.token, choice.id, {
      idempotencyKey: 'k-realtime-2',
      optionIds: [choice.options[1]!.id],
    }).expect(200);
    const revealedParticipantAccepted = (await participantEvents.waitFor(
      REALTIME_EVENTS.RESPONSE_ACCEPTED,
      (payload) =>
        (payload as { pollId?: string }).pollId === choice.id &&
        (payload as { results?: { total?: number } }).results?.total === 2,
    )) as { results: { total: number } };
    expect(revealedParticipantAccepted.results.total).toBe(2);

    await openPollREST(cookie, session.id, open.id);
    await participantEvents.waitFor(
      REALTIME_EVENTS.POLL_CLOSED,
      (payload) =>
        (payload as { poll?: { id?: string } }).poll?.id === choice.id,
    );
    await participantEvents.waitFor(
      REALTIME_EVENTS.POLL_OPENED,
      (payload) => (payload as { poll?: { id?: string } }).poll?.id === open.id,
    );

    await submitResponse(second.token, open.id, {
      idempotencyKey: 'k-realtime-open',
      text: 'tremendous party!',
    }).expect(200);
    const openHostAccepted = (await hostEvents.waitFor(
      REALTIME_EVENTS.RESPONSE_ACCEPTED,
      (payload) => (payload as { pollId?: string }).pollId === open.id,
    )) as { results: { responses: { text: string }[] } };
    expect(openHostAccepted.results.responses[0]?.text).toBe(
      'tremendous party!',
    );
    const openParticipantAccepted = (await participantEvents.waitFor(
      REALTIME_EVENTS.RESPONSE_ACCEPTED,
      (payload) => (payload as { pollId?: string }).pollId === open.id,
    )) as { results: unknown };
    expect(openParticipantAccepted.results).toBeNull();
    const serializedParticipantEvents = JSON.stringify(participantEvents);
    expect(serializedParticipantEvents).not.toContain('tremendous party!');

    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${open.id}/close`)
      .set('Cookie', cookie)
      .expect(200);
    await participantEvents.waitFor(
      REALTIME_EVENTS.POLL_CLOSED,
      (payload) => (payload as { poll?: { id?: string } }).poll?.id === open.id,
    );

    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/end`)
      .set('Cookie', cookie)
      .expect(200);
    const ended = (await participantEvents.waitFor(
      REALTIME_EVENTS.SESSION_UPDATED,
      (payload) =>
        (payload as { session?: { status?: string } }).session?.status ===
        'ended',
    )) as { session: { roomCode?: string } };
    expect(ended.session.roomCode).toBeUndefined();

    const hostSessionEvents = hostEvents.events.filter(
      (entry) =>
        entry.event === REALTIME_EVENTS.SESSION_UPDATED ||
        entry.event === REALTIME_EVENTS.POLL_OPENED ||
        entry.event === REALTIME_EVENTS.POLL_CLOSED ||
        entry.event === REALTIME_EVENTS.RESPONSE_ACCEPTED ||
        entry.event === REALTIME_EVENTS.RESULTS_REVEALED,
    );
    const participantSessionEvents = participantEvents.events.filter(
      (entry) =>
        entry.event === REALTIME_EVENTS.SESSION_UPDATED ||
        entry.event === REALTIME_EVENTS.POLL_OPENED ||
        entry.event === REALTIME_EVENTS.POLL_CLOSED ||
        entry.event === REALTIME_EVENTS.RESPONSE_ACCEPTED ||
        entry.event === REALTIME_EVENTS.RESULTS_REVEALED,
    );
    for (const events of [hostSessionEvents, participantSessionEvents]) {
      const revisions = events.map(
        (entry) => (entry.payload as { revision?: number }).revision ?? 0,
      );
      expect(revisions.length).toBeGreaterThan(3);
      expect(new Set(revisions).size).toBeGreaterThan(3);
      for (let i = 1; i < revisions.length; i += 1) {
        expect(revisions[i]!).toBeGreaterThanOrEqual(revisions[i - 1]!);
      }
    }

    for (const entry of participantEvents.events) {
      if (entry.event === REALTIME_EVENTS.PRESENCE_UPDATED) {
        expect(entry.payload).not.toHaveProperty('participants');
      }
    }
    for (const entry of hostEvents.events) {
      if (entry.event === REALTIME_EVENTS.PRESENCE_UPDATED) {
        expect(entry.payload).toHaveProperty('participants');
      }
    }
  }, 20_000);

  it('tracks presence in Redis with heartbeats and disconnect/expiry handling', async () => {
    const { cookie, session } = await createLiveSession();
    const { events: hostEvents } = await connectHost(port, session.id, cookie);
    const first = await join(session.roomCode, 'Ada');
    const second = await join(session.roomCode, 'Bob');
    const { socket: firstSocket, events: firstEvents } =
      await connectParticipant(port, first.token);
    const { socket: secondSocket } = await connectParticipant(
      port,
      second.token,
    );

    const atTwo = (await hostEvents.waitFor(
      REALTIME_EVENTS.PRESENCE_UPDATED,
      (payload) => (payload as { count?: number }).count === 2,
    )) as { count: number; participants: { displayName: string }[] };
    expect(atTwo.count).toBe(2);
    expect(atTwo.participants.map((p) => p.displayName).sort()).toEqual([
      'Ada',
      'Bob',
    ]);
    for (const entry of firstEvents.events) {
      if (entry.event === REALTIME_EVENTS.PRESENCE_UPDATED) {
        expect(entry.payload).not.toHaveProperty('participants');
        expect(entry.payload).toHaveProperty('count');
      }
    }

    await request(app.getHttpServer())
      .patch('/participant/me')
      .set('Authorization', `Bearer ${first.token}`)
      .send({ displayName: 'Ada-renamed' })
      .expect(200);
    const renamed = (await hostEvents.waitFor(
      REALTIME_EVENTS.PRESENCE_UPDATED,
      (payload) =>
        (
          payload as { participants?: { displayName: string }[] }
        ).participants?.some((p) => p.displayName === 'Ada-renamed') === true,
    )) as { count: number };
    expect(renamed.count).toBe(2);

    firstSocket.disconnect();
    await hostEvents.waitFor(
      REALTIME_EVENTS.PRESENCE_UPDATED,
      (payload) => (payload as { count?: number }).count === 1,
    );

    const expired = await hostEvents.waitFor(
      REALTIME_EVENTS.PRESENCE_UPDATED,
      (payload) => (payload as { count?: number }).count === 0,
      10_000,
    );
    expect((expired as { participants: unknown[] }).participants).toEqual([]);

    secondSocket.emit('presence.heartbeat');
    await hostEvents.waitFor(
      REALTIME_EVENTS.PRESENCE_UPDATED,
      (payload) => (payload as { count?: number }).count === 1,
    );

    secondSocket.disconnect();
    await hostEvents.waitFor(
      REALTIME_EVENTS.PRESENCE_UPDATED,
      (payload) => (payload as { count?: number }).count === 0,
    );
    expect(
      hostEvents.events.filter(
        (entry) => entry.event === REALTIME_EVENTS.PRESENCE_UPDATED,
      ).length,
    ).toBeGreaterThanOrEqual(4);
  });

  it('reconnecting participants receive a resync request and converge on the snapshot', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['Red', 'Blue'],
    });
    const { events: hostEvents } = await connectHost(port, session.id, cookie);
    const joined = await join(session.roomCode, 'Ada');
    await openPollREST(cookie, session.id, poll.id);

    const { socket: firstSocket } = await connectParticipant(
      port,
      joined.token,
    );
    await submitResponse(joined.token, poll.id, {
      idempotencyKey: 'k-reconnect',
      optionIds: [poll.options[0]!.id],
    }).expect(200);
    const accepted = (await hostEvents.waitFor(
      REALTIME_EVENTS.RESPONSE_ACCEPTED,
      (payload) =>
        (payload as { results?: { total?: number } }).results?.total === 1,
    )) as { revision: number };
    firstSocket.disconnect();

    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.id}/close`)
      .set('Cookie', cookie)
      .expect(200);

    const { events: secondEvents } = await connectParticipant(
      port,
      joined.token,
    );
    const resync = (await secondEvents.waitFor(
      REALTIME_EVENTS.RESYNC_REQUESTED,
    )) as { revision: number };
    expect(resync.revision).toBeGreaterThanOrEqual(accepted.revision);

    const snapshot = await request(app.getHttpServer())
      .get('/participant/session')
      .set('Authorization', `Bearer ${joined.token}`)
      .expect(200);
    const pollInSnapshot = (
      snapshot.body.polls as { id: string; isOpen: boolean }[]
    ).find((entry) => entry.id === poll.id);
    expect(pollInSnapshot?.isOpen).toBe(false);

    const results = await request(app.getHttpServer())
      .get(`/sessions/${session.id}/polls/${poll.id}/results`)
      .set('Cookie', cookie)
      .expect(200);
    expect(results.body.total).toBe(1);
  });

  it('keeps a committed response when the realtime broadcast fails', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id, {
      type: 'single_choice',
      text: 'Best?',
      options: ['Red', 'Blue'],
    });
    await openPollREST(cookie, session.id, poll.id);
    const joined = await join(session.roomCode);
    const gateway = app.get(SessionGateway);
    const adapter = gateway.server.of('/').adapter as {
      broadcast: (...args: unknown[]) => void;
    };
    const broadcastSpy = vi
      .spyOn(adapter, 'broadcast')
      .mockImplementation(() => {
        throw new Error('simulated broadcast failure');
      });

    const submit = await submitResponse(joined.token, poll.id, {
      idempotencyKey: 'k-publish-fail',
      optionIds: [poll.options[0]!.id],
    });
    expect(submit.status).toBe(200);

    const persisted = await db
      .select()
      .from(schema.responses)
      .where(eq(schema.responses.pollId, poll.id));
    expect(persisted).toHaveLength(1);

    const results = await request(app.getHttpServer())
      .get(`/sessions/${session.id}/polls/${poll.id}/results`)
      .set('Cookie', cookie)
      .expect(200);
    expect(results.body.total).toBe(1);
    expect(results.body.counts[0]?.count).toBe(1);

    broadcastSpy.mockRestore();
    const retry = await submitResponse(joined.token, poll.id, {
      idempotencyKey: 'k-publish-fail',
      optionIds: [poll.options[0]!.id],
    });
    expect(retry.status).toBe(200);
    expect(retry.body.id).toBe(persisted[0]?.id);
  });

  it('coordinates broadcasts across backend instances through the Redis adapter', async () => {
    const secondFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MAILER)
      .useValue({ send: vi.fn() })
      .compile();
    const secondApp = secondFixture.createNestApplication();
    await secondApp.init();
    const secondPort = await listen(secondApp);
    try {
      const firstGateway = app.get(SessionGateway);
      const secondGateway = secondApp.get(SessionGateway);
      expect(firstGateway.usesRedisAdapter).toBe(true);
      expect(secondGateway.usesRedisAdapter).toBe(true);

      const { cookie, session } = await createLiveSession();
      const poll = await createChoicePoll(cookie, session.id, {
        type: 'single_choice',
        text: 'Cross instance?',
        options: ['Yes', 'No'],
      });

      const { events: hostEvents } = await connectHost(
        port,
        session.id,
        cookie,
      );
      const joined = await join(session.roomCode, 'Ada');
      const { events: participantEvents } = await connectParticipant(
        secondPort,
        joined.token,
      );
      await hostEvents.waitFor(
        REALTIME_EVENTS.PRESENCE_UPDATED,
        (payload) => (payload as { count?: number }).count === 1,
      );

      await openPollREST(cookie, session.id, poll.id);
      const opened = (await participantEvents.waitFor(
        REALTIME_EVENTS.POLL_OPENED,
        (payload) =>
          (payload as { poll?: { id?: string } }).poll?.id === poll.id,
      )) as { poll: { text: string } };
      expect(opened.poll.text).toBe('Cross instance?');

      await submitResponse(joined.token, poll.id, {
        idempotencyKey: 'k-cross-instance',
        optionIds: [poll.options[0]!.id],
      }).expect(200);
      const accepted = (await hostEvents.waitFor(
        REALTIME_EVENTS.RESPONSE_ACCEPTED,
        (payload) =>
          (payload as { results?: { total?: number } }).results?.total === 1,
      )) as { results: { total: number } };
      expect(accepted.results.total).toBe(1);
    } finally {
      await secondApp.close();
    }
  });
});
