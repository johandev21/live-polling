import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
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
import { StructuredLogger } from '../src/infrastructure/logging/structured-logger.service';
import { SessionGateway } from '../src/realtime/session.gateway';

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

describe('Operational behavior (e2e)', () => {
  let app: INestApplication<App>;
  let port: number;
  let db: TestDb;
  let mailerSend: Mock<Mailer['send']>;
  let sequence = 0;
  const sockets: Socket[] = [];

  const uniqueEmail = () => {
    sequence += 1;
    return `harden-host-${sequence}-${Date.now()}@example.com`;
  };

  const uniqueIp = () => {
    sequence += 1;
    return `10.161.${(Date.now() % 200) + sequence}.${(sequence % 250) + 1}`;
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
        'Operational e2e tests require Postgres and Redis: run `docker compose up -d postgres redis` in the repo root and `pnpm run db:migrate` in apps/backend.',
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

  async function scrapeMetrics(): Promise<string> {
    const response = await request(app.getHttpServer())
      .get('/metrics')
      .expect(200);
    expect(response.headers['content-type']).toMatch(/^text\/plain/);
    return response.text;
  }

  function metricValue(
    text: string,
    name: string,
    labels?: Record<string, string>,
  ): number | null {
    const prefix = labels
      ? `${name}{${Object.entries(labels)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',')}} `
      : `${name} `;
    const line = text
      .split('\n')
      .find((candidate) => candidate.startsWith(prefix));
    if (!line) return null;
    const value = Number(line.slice(prefix.length).trim());
    return Number.isFinite(value) ? value : null;
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

  async function createLiveSession(): Promise<HostedSession> {
    const cookie = await signInHost();
    const created = await request(app.getHttpServer())
      .post('/sessions')
      .set('Cookie', cookie)
      .send({ name: 'Operational session' })
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

  async function createChoicePoll(
    cookie: string,
    sessionId: string,
  ): Promise<ChoicePoll> {
    const response = await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/polls`)
      .set('Cookie', cookie)
      .send({
        type: 'single_choice',
        text: 'Best?',
        options: ['Red', 'Blue'],
      })
      .expect(201);
    return response.body as ChoicePoll;
  }

  async function join(
    roomCode: string,
    displayName = 'Ada',
  ): Promise<{ token: string }> {
    const response = await request(app.getHttpServer())
      .post('/join')
      .set(hostHeader(uniqueIp()))
      .send({ roomCode, displayName })
      .expect(201);
    return { token: response.body.token as string };
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
  ): Promise<Socket> {
    const socket = connect(`http://127.0.0.1:${targetPort}`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      timeout: 5_000,
      auth,
      extraHeaders: { 'x-forwarded-for': uniqueIp() },
    });
    sockets.push(socket);
    return new Promise((resolve, reject) => {
      socket.on('connect', () => resolve(socket));
      socket.on('connect_error', (error) => reject(error));
    });
  }

  it('exposes Prometheus-formatted metrics for every required family', async () => {
    const text = await scrapeMetrics();
    for (const name of [
      'polling_active_sessions',
      'polling_accepted_responses_total',
      'polling_request_failures_total',
      'polling_realtime_failures_total',
      'polling_dependency_health',
    ]) {
      expect(text).toContain(`# TYPE ${name}`);
    }
  });

  it('counts only live sessions in the active sessions gauge', async () => {
    const before = metricValue(
      await scrapeMetrics(),
      'polling_active_sessions',
    );
    expect(before).not.toBeNull();

    const cookie = await signInHost();
    const created = await request(app.getHttpServer())
      .post('/sessions')
      .set('Cookie', cookie)
      .send({ name: 'Draft only' })
      .expect(201);
    expect(metricValue(await scrapeMetrics(), 'polling_active_sessions')).toBe(
      before,
    );

    await request(app.getHttpServer())
      .post(`/sessions/${created.body.id}/polls`)
      .set('Cookie', cookie)
      .send({ type: 'single_choice', text: 'Q', options: ['1', '2'] })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/sessions/${created.body.id}/start`)
      .set('Cookie', cookie)
      .expect(200);

    expect(metricValue(await scrapeMetrics(), 'polling_active_sessions')).toBe(
      (before as number) + 1,
    );
  });

  it('counts accepted responses once per committed change, not per retry', async () => {
    const before =
      metricValue(await scrapeMetrics(), 'polling_accepted_responses_total') ??
      0;

    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id);
    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.id}/open`)
      .set('Cookie', cookie)
      .expect(200);
    const joined = await join(session.roomCode);

    await submitResponse(joined.token, poll.id, {
      idempotencyKey: 'k-metrics-1',
      optionIds: [poll.options[0]!.id],
    }).expect(200);
    expect(
      metricValue(await scrapeMetrics(), 'polling_accepted_responses_total'),
    ).toBe(before + 1);

    await submitResponse(joined.token, poll.id, {
      idempotencyKey: 'k-metrics-1',
      optionIds: [poll.options[0]!.id],
    }).expect(200);
    expect(
      metricValue(await scrapeMetrics(), 'polling_accepted_responses_total'),
    ).toBe(before + 1);

    await submitResponse(joined.token, poll.id, {
      idempotencyKey: 'k-metrics-2',
      optionIds: [poll.options[1]!.id],
    }).expect(200);
    expect(
      metricValue(await scrapeMetrics(), 'polling_accepted_responses_total'),
    ).toBe(before + 2);
  });

  it('counts request failures for guard rejections by status class', async () => {
    const before =
      metricValue(await scrapeMetrics(), 'polling_request_failures_total', {
        status_class: '4xx',
      }) ?? 0;

    await request(app.getHttpServer()).get('/sessions').expect(401);

    expect(
      metricValue(await scrapeMetrics(), 'polling_request_failures_total', {
        status_class: '4xx',
      }),
    ).toBe(before + 1);
    expect(
      metricValue(await scrapeMetrics(), 'polling_request_failures_total', {
        status_class: '5xx',
      }) ?? 0,
    ).toBe(0);
  });

  it('reports dependency health gauges for Postgres and Redis', async () => {
    const text = await scrapeMetrics();
    expect(
      metricValue(text, 'polling_dependency_health', {
        dependency: 'postgres',
      }),
    ).toBe(1);
    expect(
      metricValue(text, 'polling_dependency_health', { dependency: 'redis' }),
    ).toBe(1);
  });

  it('counts realtime failures when a broadcast fails after commit', async () => {
    const { cookie, session } = await createLiveSession();
    const poll = await createChoicePoll(cookie, session.id);
    await request(app.getHttpServer())
      .post(`/sessions/${session.id}/polls/${poll.id}/open`)
      .set('Cookie', cookie)
      .expect(200);
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

    try {
      const before =
        metricValue(await scrapeMetrics(), 'polling_realtime_failures_total', {
          kind: 'publish',
        }) ?? 0;

      await submitResponse(joined.token, poll.id, {
        idempotencyKey: 'k-realtime-metrics',
        optionIds: [poll.options[0]!.id],
      }).expect(200);

      const after = metricValue(
        await scrapeMetrics(),
        'polling_realtime_failures_total',
        { kind: 'publish' },
      );
      expect(after).toBe(before + 2);
    } finally {
      broadcastSpy.mockRestore();
    }
  });

  it('counts rejected socket connections as realtime failures', async () => {
    const before =
      metricValue(await scrapeMetrics(), 'polling_realtime_failures_total', {
        kind: 'connect',
      }) ?? 0;

    const socket = await connectSocket(port, {
      role: 'participant',
      token: 'not-a-token',
    });
    const authError = new Promise<void>((resolve) => {
      socket.on(REALTIME_EVENTS.AUTH_ERROR, () => resolve());
    });
    await authError;
    socket.disconnect();

    expect(
      metricValue(await scrapeMetrics(), 'polling_realtime_failures_total', {
        kind: 'connect',
      }),
    ).toBe(before + 1);
  });

  it('echoes a caller-provided correlation id on every response', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/live')
      .set('X-Request-Id', 'harden-req-echo')
      .expect(200);
    expect(response.headers['x-request-id']).toBe('harden-req-echo');
  });

  it('allows only explicitly configured CORS origins', async () => {
    const allowed = await request(app.getHttpServer())
      .get('/health/live')
      .set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );

    const foreign = await request(app.getHttpServer())
      .get('/health/live')
      .set('Origin', 'http://attacker.example');
    expect(foreign.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('emits structured JSON request logs carrying the correlation id', async () => {
    const lines: string[] = [];
    const logger = new StructuredLogger((line) => lines.push(line));
    const fixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MAILER)
      .useValue({ send: vi.fn() })
      .compile();
    const loggingApp = fixture.createNestApplication({ logger });
    await loggingApp.init();
    try {
      await request(loggingApp.getHttpServer())
        .get('/health/live')
        .set('X-Request-Id', 'harden-req-structured')
        .expect(200);

      const requestLine = lines.find((line) => {
        const parsed = JSON.parse(line) as { context?: string };
        return parsed.context === 'Http';
      });
      expect(requestLine).toBeDefined();
      const parsed = JSON.parse(requestLine as string) as Record<
        string,
        unknown
      >;
      expect(parsed.requestId).toBe('harden-req-structured');
      expect(parsed.message).toMatchObject({
        method: 'GET',
        path: '/health/live',
        status: 200,
      });
    } finally {
      await loggingApp.close();
    }
  });

  it('never writes query-string values such as magic-link tokens into logs', async () => {
    const lines: string[] = [];
    const logger = new StructuredLogger((line) => lines.push(line));
    const fixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MAILER)
      .useValue({ send: vi.fn() })
      .compile();
    const loggingApp = fixture.createNestApplication({ logger });
    await loggingApp.init();
    try {
      const sensitive = `secret-token-${Date.now()}`;
      await request(loggingApp.getHttpServer())
        .get(`/api/auth/magic-link/verify?token=${sensitive}`)
        .expect(302);

      for (const line of lines) {
        expect(line).not.toContain(sensitive);
      }
    } finally {
      await loggingApp.close();
    }
  });

  it('disconnects connected sockets on shutdown so clients can reconnect', async () => {
    const fixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MAILER)
      .useValue({ send: vi.fn() })
      .compile();
    const dedicated = fixture.createNestApplication();
    await dedicated.init();
    const dedicatedPort = await listen(dedicated);
    const dedicatedMailer = dedicated.get<{ send: Mock<Mailer['send']> }>(
      MAILER,
    ).send;
    try {
      const email = uniqueEmail();
      const ip = uniqueIp();
      await request(dedicated.getHttpServer())
        .post(SIGN_IN_PATH)
        .set(hostHeader(ip))
        .send({ email })
        .expect(200);
      const calls = dedicatedMailer.mock.calls;
      const message = calls[calls.length - 1]?.[0];
      const link = message?.text.match(/https?:\/\/\S+/)?.[0];
      const url = new URL(link as string);
      const signIn = await request(dedicated.getHttpServer())
        .get(`${url.pathname}${url.search}`)
        .redirects(0)
        .set(hostHeader(ip))
        .expect(302);
      const setCookies = signIn.headers['set-cookie'] as unknown as
        | string[]
        | undefined;
      const sessionCookie = setCookies?.find((entry) =>
        entry.startsWith(`${SESSION_COOKIE_NAME}=`),
      );
      expect(sessionCookie).toBeDefined();
      const cookie = (sessionCookie as string).split(';')[0] as string;

      const created = await request(dedicated.getHttpServer())
        .post('/sessions')
        .set('Cookie', cookie)
        .send({ name: 'Shutdown' })
        .expect(201);
      const sessionId = (created.body as { id: string }).id;
      await request(dedicated.getHttpServer())
        .post(`/sessions/${sessionId}/polls`)
        .set('Cookie', cookie)
        .send({ type: 'single_choice', text: 'Q', options: ['1', '2'] })
        .expect(201);
      await request(dedicated.getHttpServer())
        .post(`/sessions/${sessionId}/start`)
        .set('Cookie', cookie)
        .expect(200);
      const joined = await request(dedicated.getHttpServer())
        .post('/join')
        .set(hostHeader(uniqueIp()))
        .send({
          roomCode: (created.body as { roomCode: string }).roomCode,
          displayName: 'Ada',
        })
        .expect(201);

      const socket = await connectSocket(dedicatedPort, {
        role: 'participant',
        token: joined.body.token,
      });
      const disconnected = new Promise<void>((resolve) => {
        socket.on('disconnect', () => resolve());
      });

      await dedicated.close();

      const result = await Promise.race([
        disconnected.then(() => 'disconnected'),
        new Promise<string>((resolve) =>
          setTimeout(() => resolve('timeout'), 5_000),
        ),
      ]);
      expect(result).toBe('disconnected');
    } finally {
      sockets.splice(0).forEach((socket) => {
        socket.removeAllListeners();
        socket.disconnect();
      });
    }
  });
});
