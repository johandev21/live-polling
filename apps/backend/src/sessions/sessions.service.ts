import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE } from '../infrastructure/database/database.constants';
import * as schema from '../infrastructure/database/schema';
import { sessionSnapshotSchema } from '../contracts/session.contract';
import type { SessionSnapshot } from '../contracts/session.contract';
import { ERROR_CODES } from '../contracts/errors.contract';
import type { SessionStatus } from './session.domain';
import {
  InvalidSessionTransitionError,
  canUpdateSessionName,
  transitionSessionStatus,
} from './session.domain';
import { MAX_ROOM_CODE_ATTEMPTS, RoomCodeService } from './room-code.service';
import type { SessionDb } from './room-code.service';

@Injectable()
export class SessionsService {
  constructor(
    @Inject(DATABASE) private readonly db: NodePgDatabase<typeof schema>,
    @Inject(RoomCodeService) private readonly roomCodes: RoomCodeService,
  ) {}

  async create(userId: string, name: string): Promise<SessionSnapshot> {
    const hostId = await this.requireHostId(userId);
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
    const hostId = await this.requireHostId(userId);
    const rows = await this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.hostId, hostId))
      .orderBy(desc(schema.sessions.createdAt));
    return rows.map((row) => this.toSnapshot(row));
  }

  async get(userId: string, sessionId: string): Promise<SessionSnapshot> {
    const hostId = await this.requireHostId(userId);
    const row = await this.findOwned(sessionId, hostId);
    if (!row) throw this.notFound();
    return this.toSnapshot(row);
  }

  async updateName(
    userId: string,
    sessionId: string,
    name: string,
  ): Promise<SessionSnapshot> {
    return this.mutateOwned(userId, sessionId, async (row, tx) => {
      if (!canUpdateSessionName(row.status)) throw this.invalidTransition();
      return this.commitMutation(tx, row, { name });
    });
  }

  async start(userId: string, sessionId: string): Promise<SessionSnapshot> {
    return this.mutateOwned(userId, sessionId, async (row, tx) => {
      const status = this.transition(row.status, 'live');
      const [poll] = await tx
        .select({ id: schema.polls.id })
        .from(schema.polls)
        .where(eq(schema.polls.sessionId, sessionId))
        .limit(1);
      if (!poll) {
        throw new ConflictException({ code: ERROR_CODES.NO_POLLS });
      }
      return this.commitMutation(tx, row, { status, startedAt: new Date() });
    });
  }

  async end(userId: string, sessionId: string): Promise<SessionSnapshot> {
    return this.mutateOwned(userId, sessionId, async (row, tx) => {
      const status = this.transition(row.status, 'ended');
      return this.commitMutation(tx, row, { status, endedAt: new Date() });
    });
  }

  async delete(userId: string, sessionId: string, confirm: boolean) {
    if (!confirm) {
      throw new BadRequestException({
        code: ERROR_CODES.CONFIRMATION_REQUIRED,
      });
    }
    await this.mutateOwned(userId, sessionId, async (row, tx) => {
      await tx
        .delete(schema.sessions)
        .where(
          and(
            eq(schema.sessions.id, sessionId),
            eq(schema.sessions.hostId, row.hostId),
          ),
        );
      await this.roomCodes.markReleased(row.roomCode, tx);
    });
  }

  async invitation(userId: string, sessionId: string) {
    const hostId = await this.requireHostId(userId);
    const row = await this.findOwned(sessionId, hostId);
    if (!row) throw this.notFound();
    const origin = (process.env.FRONTEND_ORIGINS ?? 'http://localhost:5173')
      .split(',')[0]
      ?.trim();
    return {
      roomCode: row.roomCode,
      url: `${origin}/join/${row.roomCode}`,
    };
  }

  private async mutateOwned<T>(
    userId: string,
    sessionId: string,
    mutate: (row: SessionRow, tx: SessionDb) => Promise<T>,
  ): Promise<T> {
    const hostId = await this.requireHostId(userId);
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(schema.sessions)
        .where(
          and(
            eq(schema.sessions.id, sessionId),
            eq(schema.sessions.hostId, hostId),
          ),
        )
        .for('update');
      if (!row) throw this.notFound();
      return mutate(row, tx);
    });
  }

  private async findOwned(
    sessionId: string,
    hostId: string,
  ): Promise<SessionRow | undefined> {
    const [row] = await this.db
      .select()
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.id, sessionId),
          eq(schema.sessions.hostId, hostId),
        ),
      )
      .limit(1);
    return row;
  }

  private async requireHostId(userId: string): Promise<string> {
    const [host] = await this.db
      .select({ id: schema.hosts.id })
      .from(schema.hosts)
      .where(eq(schema.hosts.userId, userId))
      .limit(1);
    if (!host) {
      throw new InternalServerErrorException({ code: ERROR_CODES.INTERNAL });
    }
    return host.id;
  }

  private async commitMutation(
    tx: SessionDb,
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
      .set({ ...changes, updatedAt: new Date(), revision: row.revision + 1 })
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

type SessionRow = typeof schema.sessions.$inferSelect;

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code =
    (error as { code?: string }).code ??
    (error as { cause?: { code?: string } }).cause?.code;
  return code === '23505';
}
