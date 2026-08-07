import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { DATABASE } from '../infrastructure/database/database.constants';
import type {
  Database,
  DbHandle,
} from '../infrastructure/database/database.types';
import * as schema from '../infrastructure/database/schema';
import { sessionSnapshotSchema } from '../contracts/session.contract';
import type { SessionSnapshot } from '../contracts/session.contract';
import {
  REALTIME_EVENTS,
  hostSessionEventSchema,
  participantSessionEventSchema,
  sessionDeletedEventSchema,
} from '../contracts/events.contract';
import { ERROR_CODES } from '../contracts/errors.contract';
import { RealtimeService } from '../realtime/realtime.service';
import type { SessionStatus } from './session.domain';
import {
  InvalidSessionTransitionError,
  canUpdateSessionName,
  transitionSessionStatus,
} from './session.domain';
import { MAX_ROOM_CODE_ATTEMPTS, RoomCodeService } from './room-code.service';
import type { SessionRow } from './session-access.service';
import { SessionAccessService } from './session-access.service';

@Injectable()
export class SessionsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(RoomCodeService) private readonly roomCodes: RoomCodeService,
    @Inject(SessionAccessService) private readonly access: SessionAccessService,
    @Inject(RealtimeService) private readonly realtime: RealtimeService,
  ) {}

  async create(userId: string, name: string): Promise<SessionSnapshot> {
    const hostId = await this.access.requireHostId(userId);
    for (let attempt = 0; attempt < MAX_ROOM_CODE_ATTEMPTS; attempt += 1) {
      const roomCode = this.roomCodes.generate();
      if (await this.roomCodes.recentlyReleased(roomCode)) continue;
      try {
        const created = await this.db.transaction(async (tx) => {
          const [row] = await tx
            .insert(schema.sessions)
            .values({ hostId, name, roomCode })
            .returning();
          return this.toSnapshot(row);
        });
        return created;
      } catch (error) {
        if (isUniqueViolation(error)) continue;
        throw error;
      }
    }
    throw new Error('unable to allocate a unique room code');
  }

  async list(userId: string): Promise<SessionSnapshot[]> {
    const hostId = await this.access.requireHostId(userId);
    const rows = await this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.hostId, hostId))
      .orderBy(desc(schema.sessions.createdAt));
    return rows.map((row) => this.toSnapshot(row));
  }

  async get(userId: string, sessionId: string): Promise<SessionSnapshot> {
    return this.toSnapshot(
      await this.access.getOwnedSession(userId, sessionId),
    );
  }

  async updateName(
    userId: string,
    sessionId: string,
    name: string,
  ): Promise<SessionSnapshot> {
    const snapshot = await this.access.withOwnedSessionLock(
      userId,
      sessionId,
      async (row, tx) => {
        if (!canUpdateSessionName(row.status)) throw this.invalidTransition();
        return this.commitMutation(tx, row, { name });
      },
    );
    this.publishSessionUpdate(snapshot);
    return snapshot;
  }

  async start(userId: string, sessionId: string): Promise<SessionSnapshot> {
    const snapshot = await this.access.withOwnedSessionLock(
      userId,
      sessionId,
      async (row, tx) => {
        const status = this.transition(row.status, 'live');
        const [poll] = await tx
          .select({ id: schema.polls.id })
          .from(schema.polls)
          .where(eq(schema.polls.sessionId, sessionId))
          .limit(1);
        if (!poll) {
          throw new ConflictException({ code: ERROR_CODES.NO_POLLS });
        }
        return this.commitMutation(tx, row, {
          status,
          startedAt: new Date(),
        });
      },
    );
    this.publishSessionUpdate(snapshot);
    return snapshot;
  }

  async end(userId: string, sessionId: string): Promise<SessionSnapshot> {
    const snapshot = await this.access.withOwnedSessionLock(
      userId,
      sessionId,
      async (row, tx) => {
        const status = this.transition(row.status, 'ended');
        return this.commitMutation(tx, row, { status, endedAt: new Date() });
      },
    );
    this.publishSessionUpdate(snapshot);
    return snapshot;
  }

  async delete(userId: string, sessionId: string, confirm: boolean) {
    if (!confirm) {
      throw new BadRequestException({
        code: ERROR_CODES.CONFIRMATION_REQUIRED,
      });
    }
    let revision = 1;
    await this.access.withOwnedSessionLock(
      userId,
      sessionId,
      async (row, tx) => {
        revision = row.revision;
        await tx
          .delete(schema.sessions)
          .where(
            and(
              eq(schema.sessions.id, sessionId),
              eq(schema.sessions.hostId, row.hostId),
            ),
          );
        await this.roomCodes.markReleased(row.roomCode, tx);
      },
    );
    this.realtime.toAll(
      sessionId,
      REALTIME_EVENTS.SESSION_DELETED,
      sessionDeletedEventSchema.parse({ sessionId, revision }),
      sessionDeletedEventSchema.parse({ sessionId, revision }),
    );
  }

  async invitation(userId: string, sessionId: string) {
    const row = await this.access.getOwnedSession(userId, sessionId);
    const origin = (process.env.FRONTEND_ORIGINS ?? 'http://localhost:5173')
      .split(',')[0]
      ?.trim();
    return {
      roomCode: row.roomCode,
      url: `${origin}/join/${row.roomCode}`,
    };
  }

  private async commitMutation(
    tx: DbHandle,
    row: SessionRow,
    changes: {
      name?: string;
      status?: SessionStatus;
      startedAt?: Date;
      endedAt?: Date;
    },
  ): Promise<SessionSnapshot> {
    const [updated] = await tx
      .update(schema.sessions)
      .set({
        ...changes,
        updatedAt: new Date(),
        revision: sql`${schema.sessions.revision} + 1`,
      })
      .where(
        and(
          eq(schema.sessions.id, row.id),
          eq(schema.sessions.hostId, row.hostId),
        ),
      )
      .returning();
    if (!updated) throw this.notFound();
    return this.toSnapshot(updated);
  }

  private transition(from: SessionStatus, to: SessionStatus): SessionStatus {
    try {
      return transitionSessionStatus(from, to);
    } catch (error) {
      if (error instanceof InvalidSessionTransitionError) {
        throw this.invalidTransition();
      }
      throw error;
    }
  }

  private invalidTransition() {
    return new ConflictException({ code: ERROR_CODES.INVALID_TRANSITION });
  }

  private publishSessionUpdate(snapshot: SessionSnapshot): void {
    const revision = snapshot.revision;
    this.realtime.toAll(
      snapshot.id,
      REALTIME_EVENTS.SESSION_UPDATED,
      hostSessionEventSchema.parse({
        sessionId: snapshot.id,
        revision,
        session: snapshot,
      }),
      participantSessionEventSchema.parse({
        sessionId: snapshot.id,
        revision,
        session: {
          id: snapshot.id,
          name: snapshot.name,
          status: snapshot.status,
          revision: snapshot.revision,
          startedAt: snapshot.startedAt,
          endedAt: snapshot.endedAt,
        },
      }),
    );
  }

  private notFound() {
    return new NotFoundException({ code: ERROR_CODES.SESSION_NOT_FOUND });
  }

  private toSnapshot(row: SessionRow): SessionSnapshot {
    return sessionSnapshotSchema.parse({
      id: row.id,
      name: row.name,
      roomCode: row.roomCode,
      status: row.status,
      revision: row.revision,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
    });
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code =
    (error as { code?: string }).code ??
    (error as { cause?: { code?: string } }).cause?.code;
  return code === '23505';
}
