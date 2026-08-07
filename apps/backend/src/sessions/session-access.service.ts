import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DATABASE } from '../infrastructure/database/database.constants';
import type {
  Database,
  DbHandle,
} from '../infrastructure/database/database.types';
import * as schema from '../infrastructure/database/schema';
import { ERROR_CODES } from '../contracts/errors.contract';

export type SessionRow = typeof schema.sessions.$inferSelect;

@Injectable()
export class SessionAccessService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async requireHostId(userId: string): Promise<string> {
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

  async getOwnedSession(
    userId: string,
    sessionId: string,
  ): Promise<SessionRow> {
    const hostId = await this.requireHostId(userId);
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
    if (!row) {
      throw new NotFoundException({ code: ERROR_CODES.SESSION_NOT_FOUND });
    }
    return row;
  }

  async withOwnedSessionLock<T>(
    userId: string,
    sessionId: string,
    mutate: (row: SessionRow, tx: DbHandle) => Promise<T>,
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
      if (!row) {
        throw new NotFoundException({ code: ERROR_CODES.SESSION_NOT_FOUND });
      }
      return mutate(row, tx);
    });
  }

  async withSessionLock<T>(
    sessionId: string,
    mutate: (row: SessionRow, tx: DbHandle) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, sessionId))
        .for('update');
      if (!row) {
        throw new NotFoundException({ code: ERROR_CODES.SESSION_NOT_FOUND });
      }
      return mutate(row, tx);
    });
  }

  async bumpRevision(tx: DbHandle, sessionId: string) {
    await tx
      .update(schema.sessions)
      .set({
        updatedAt: new Date(),
        revision: sql`${schema.sessions.revision} + 1`,
      })
      .where(eq(schema.sessions.id, sessionId));
  }
}
