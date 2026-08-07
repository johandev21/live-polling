import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { createAdapter } from '@socket.io/redis-adapter';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { eq } from 'drizzle-orm';
import type { Server, Socket } from 'socket.io';
import { ERROR_CODES } from '../contracts/errors.contract';
import {
  REALTIME_EVENTS,
  hostPresenceEventSchema,
  participantPresenceEventSchema,
  resyncRequestSchema,
  socketAuthErrorSchema,
} from '../contracts/events.contract';
import { sessionIdSchema } from '../contracts/session.contract';
import * as schema from '../infrastructure/database/schema';
import { DATABASE } from '../infrastructure/database/database.constants';
import type { Database } from '../infrastructure/database/database.types';
import { RateLimitService } from '../infrastructure/rate-limit/rate-limit.service';
import { MetricsService } from '../infrastructure/metrics/metrics.service';
import { ParticipantTokenService } from '../participants/participant-token.service';
import { PRESENCE_HEARTBEAT_EVENT, PresenceService } from './presence.service';

export const SOCKET_ADAPTER = Symbol('SOCKET_ADAPTER');
export type SocketAdapter = ReturnType<typeof createAdapter>;

export function hostRoom(sessionId: string): string {
  return `session:${sessionId}:hosts`;
}

export function participantRoom(sessionId: string): string {
  return `session:${sessionId}:participants`;
}

export type HostPrincipal = { role: 'host'; sessionId: string };
export type ParticipantPrincipal = {
  role: 'participant';
  sessionId: string;
  participantId: string;
  displayName: string;
};
export type SocketPrincipal = HostPrincipal | ParticipantPrincipal;

const SOCKET_CONNECT_WINDOW_SECONDS = 60;
const SOCKET_CONNECT_MAX = 20;
const DEFAULT_PRESENCE_SWEEP_INTERVAL_MS = 1_000;

function roomFor(principal: SocketPrincipal): string {
  return principal.role === 'host'
    ? hostRoom(principal.sessionId)
    : participantRoom(principal.sessionId);
}

@WebSocketGateway({
  cors: {
    origin: configuredOrigins(),
    credentials: true,
  },
  maxHttpBufferSize: 64 * 1024,
})
@Injectable()
export class SessionGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleDestroy
{
  private readonly logger = new Logger(SessionGateway.name);

  @WebSocketServer()
  server!: Server;

  usesRedisAdapter = false;

  private readonly sweepIntervalMs: number;
  private sweepTimer: NodeJS.Timeout | null = null;
  private readonly broadcastCounts = new Map<string, number>();
  private readonly socketCounts = new Map<string, number>();

  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(ParticipantTokenService)
    private readonly tokens: ParticipantTokenService,
    @Inject(PresenceService) private readonly presence: PresenceService,
    @Inject(RateLimitService) private readonly rateLimit: RateLimitService,
    @Inject(DATABASE) private readonly db: Database,
    @Inject(SOCKET_ADAPTER) private readonly adapter: SocketAdapter,
    @Inject(MetricsService) private readonly metrics: MetricsService,
  ) {
    const configured = Number(
      process.env.PRESENCE_SWEEP_INTERVAL_MS ??
        DEFAULT_PRESENCE_SWEEP_INTERVAL_MS,
    );
    this.sweepIntervalMs =
      Number.isFinite(configured) && configured >= 100
        ? configured
        : DEFAULT_PRESENCE_SWEEP_INTERVAL_MS;
  }

  afterInit(server: Server): void {
    server.adapter(this.adapter);
    this.usesRedisAdapter = Boolean(
      (server.of('/').adapter as { pubClient?: unknown }).pubClient,
    );
  }

  onModuleDestroy(): void {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    this.sweepTimer = null;
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      if (await this.isConnectionRateLimited(client)) {
        this.reject(client, new SocketAuthError(ERROR_CODES.RATE_LIMITED));
        return;
      }
      const principal = await this.authenticate(client);
      client.data = principal;
      await client.join(roomFor(principal));
      this.socketCounts.set(
        principal.sessionId,
        (this.socketCounts.get(principal.sessionId) ?? 0) + 1,
      );
      if (principal.role === 'participant') {
        this.startSweeper();
        await this.presence.attach(
          principal.sessionId,
          principal.participantId,
          principal.displayName,
        );
        await this.syncPresence(principal.sessionId);
        client.on(PRESENCE_HEARTBEAT_EVENT, () => {
          void this.presence
            .heartbeat(principal.sessionId, principal.participantId)
            .then(() => this.syncPresence(principal.sessionId))
            .catch(() =>
              this.recordPresenceFailure(principal.sessionId, 'heartbeat'),
            );
        });
      }
      const revision = await this.sessionRevision(principal.sessionId);
      client.emit(
        REALTIME_EVENTS.RESYNC_REQUESTED,
        resyncRequestSchema.parse({ sessionId: principal.sessionId, revision }),
      );
    } catch (error) {
      this.reject(
        client,
        error instanceof SocketAuthError
          ? error
          : new SocketAuthError(ERROR_CODES.UNAUTHORIZED),
      );
    }
  }

  handleDisconnect(client: Socket): void {
    const principal = client.data as SocketPrincipal | undefined;
    if (!principal) return;
    const remaining = (this.socketCounts.get(principal.sessionId) ?? 1) - 1;
    if (remaining <= 0) {
      this.socketCounts.delete(principal.sessionId);
      this.broadcastCounts.delete(principal.sessionId);
    } else {
      this.socketCounts.set(principal.sessionId, remaining);
    }
    if (principal.role !== 'participant') return;
    void this.presence
      .detach(principal.sessionId, principal.participantId)
      .then(() => this.syncPresence(principal.sessionId))
      .catch(() => this.recordPresenceFailure(principal.sessionId, 'detach'));
  }

  async syncPresence(sessionId: string, force = false): Promise<void> {
    const count = await this.presence.count(sessionId);
    if (!force && this.broadcastCounts.get(sessionId) === count) return;
    this.broadcastCounts.set(sessionId, count);
    await this.broadcastPresence(sessionId);
  }

  publish(room: string, eventName: string, payload: unknown): void {
    if (!this.server) return;
    try {
      this.server.to(room).emit(eventName, payload);
    } catch {
      this.metrics.countRealtimeFailure('publish');
      this.logger.warn(`realtime publish failed for ${eventName}`);
    }
  }

  private async authenticate(client: Socket): Promise<SocketPrincipal> {
    const auth = (client.handshake.auth ?? {}) as {
      role?: unknown;
      token?: unknown;
      sessionId?: unknown;
    };
    if (auth.role === 'host')
      return this.authenticateHost(client, auth.sessionId);
    if (auth.role === 'participant') {
      return this.authenticateParticipant(client, auth.token);
    }
    throw new SocketAuthError(ERROR_CODES.UNAUTHORIZED);
  }

  private async authenticateHost(
    client: Socket,
    sessionId: unknown,
  ): Promise<HostPrincipal> {
    if (
      typeof sessionId !== 'string' ||
      !sessionIdSchema.safeParse(sessionId).success
    ) {
      throw new SocketAuthError(ERROR_CODES.UNAUTHORIZED);
    }
    const result = await this.auth.api.getSession({
      headers: { cookie: client.handshake.headers.cookie },
    } as Parameters<typeof this.auth.api.getSession>[0]);
    const user = result?.user;
    if (!user) throw new SocketAuthError(ERROR_CODES.UNAUTHORIZED);
    if (user.emailVerified !== true) {
      throw new SocketAuthError(ERROR_CODES.HOST_EMAIL_NOT_VERIFIED);
    }
    const [session] = await this.db
      .select({ hostId: schema.sessions.hostId })
      .from(schema.sessions)
      .where(eq(schema.sessions.id, sessionId))
      .limit(1);
    if (!session) throw new SocketAuthError(ERROR_CODES.UNAUTHORIZED);
    const [host] = await this.db
      .select({ id: schema.hosts.id })
      .from(schema.hosts)
      .where(eq(schema.hosts.userId, user.id))
      .limit(1);
    if (!host || host.id !== session.hostId) {
      throw new SocketAuthError(ERROR_CODES.UNAUTHORIZED);
    }
    return { role: 'host', sessionId };
  }

  private async authenticateParticipant(
    client: Socket,
    token: unknown,
  ): Promise<ParticipantPrincipal> {
    if (typeof token !== 'string' || token.length === 0) {
      throw new SocketAuthError(ERROR_CODES.UNAUTHORIZED);
    }
    const payload = this.tokens.verify(token);
    if (!payload) throw new SocketAuthError(ERROR_CODES.UNAUTHORIZED);
    const [participant] = await this.db
      .select({
        id: schema.participants.id,
        sessionId: schema.participants.sessionId,
        displayName: schema.participants.displayName,
      })
      .from(schema.participants)
      .where(eq(schema.participants.id, payload.sub))
      .limit(1);
    if (!participant || participant.sessionId !== payload.sid) {
      throw new SocketAuthError(ERROR_CODES.UNAUTHORIZED);
    }
    return {
      role: 'participant',
      sessionId: payload.sid,
      participantId: participant.id,
      displayName: participant.displayName,
    };
  }

  private async isConnectionRateLimited(client: Socket): Promise<boolean> {
    const forwarded = client.handshake.headers['x-forwarded-for'];
    const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const ip = forwardedValue ?? client.handshake.address ?? 'unknown';
    const { allowed } = await this.rateLimit.check(
      `socket:connect:${ip}`,
      SOCKET_CONNECT_WINDOW_SECONDS,
      SOCKET_CONNECT_MAX,
    );
    return !allowed;
  }

  private async sessionRevision(sessionId: string): Promise<number> {
    const [row] = await this.db
      .select({ revision: schema.sessions.revision })
      .from(schema.sessions)
      .where(eq(schema.sessions.id, sessionId))
      .limit(1);
    if (!row) throw new SocketAuthError(ERROR_CODES.SESSION_NOT_FOUND);
    return row.revision;
  }

  private async broadcastPresence(sessionId: string): Promise<void> {
    const revision = await this.sessionRevision(sessionId);
    const members = await this.presence.members(sessionId);
    const count = this.broadcastCounts.get(sessionId) ?? 0;
    const hostPayload = hostPresenceEventSchema.parse({
      sessionId,
      revision,
      count,
      participants: members,
    });
    const participantPayload = participantPresenceEventSchema.parse({
      sessionId,
      revision,
      count,
    });
    this.publish(
      hostRoom(sessionId),
      REALTIME_EVENTS.PRESENCE_UPDATED,
      hostPayload,
    );
    this.publish(
      participantRoom(sessionId),
      REALTIME_EVENTS.PRESENCE_UPDATED,
      participantPayload,
    );
  }

  private startSweeper(): void {
    if (this.sweepTimer) return;
    this.sweepTimer = setInterval(() => {
      void this.sweep();
    }, this.sweepIntervalMs);
  }

  private async sweep(): Promise<void> {
    for (const sessionId of this.broadcastCounts.keys()) {
      try {
        await this.syncPresence(sessionId);
      } catch {
        this.recordPresenceFailure(sessionId, 'sweep');
      }
    }
  }

  private recordPresenceFailure(sessionId: string, action: string): void {
    this.metrics.countRealtimeFailure('presence');
    this.logger.warn(`presence ${action} failed for session ${sessionId}`);
  }

  private reject(client: Socket, error: SocketAuthError): void {
    this.metrics.countRealtimeFailure('connect');
    client.emit(
      REALTIME_EVENTS.AUTH_ERROR,
      socketAuthErrorSchema.parse({ code: error.code }),
    );
    client.disconnect(true);
  }
}

class SocketAuthError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'SocketAuthError';
  }
}

function configuredOrigins(): string[] {
  return (process.env.FRONTEND_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
