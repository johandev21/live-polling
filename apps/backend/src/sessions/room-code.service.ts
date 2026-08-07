import { Inject, Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import { DATABASE } from '../infrastructure/database/database.constants';
import * as schema from '../infrastructure/database/schema';

export type SessionDb = PgDatabase<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_REUSE_DELAY_MS = 24 * 60 * 60 * 1_000;
export const MAX_ROOM_CODE_ATTEMPTS = 30;

@Injectable()
export class RoomCodeService {
  constructor(@Inject(DATABASE) private readonly db: SessionDb) {}

  generate(): string {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
      code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
    }
    return code;
  }

  async recentlyReleased(code: string): Promise<boolean> {
    const cutoff = new Date(Date.now() - ROOM_CODE_REUSE_DELAY_MS);
    const tombstone = await this.db.query.roomCodes.findFirst({
      where: and(
        eq(schema.roomCodes.code, code),
        gt(schema.roomCodes.releasedAt, cutoff),
      ),
    });
    return tombstone !== undefined;
  }

  async markReleased(code: string, db: SessionDb) {
    await db
      .insert(schema.roomCodes)
      .values({ code })
      .onConflictDoUpdate({
        target: schema.roomCodes.code,
        set: { releasedAt: new Date() },
      });
  }
}
