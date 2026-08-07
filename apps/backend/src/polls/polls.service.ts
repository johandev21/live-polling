import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, gt, inArray, ne, sql } from 'drizzle-orm';
import { DATABASE } from '../infrastructure/database/database.constants';
import type {
  Database,
  DbHandle,
} from '../infrastructure/database/database.types';
import * as schema from '../infrastructure/database/schema';
import { pollSnapshotSchema } from '../contracts/poll.contract';
import type { PollSnapshot } from '../contracts/poll.contract';
import { ERROR_CODES } from '../contracts/errors.contract';
import { SessionAccessService } from '../sessions/session-access.service';
import { isDraft, isEnded, isLive } from '../sessions/session.domain';
import type { PollType } from './poll.domain';
import { InvalidPollError, normalizePollInput } from './poll.domain';

@Injectable()
export class PollsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(SessionAccessService) private readonly access: SessionAccessService,
  ) {}

  async create(
    userId: string,
    sessionId: string,
    input: CreatePollInput,
  ): Promise<PollSnapshot> {
    return this.access.withOwnedSessionLock(
      userId,
      sessionId,
      async (session, tx) => {
        if (isEnded(session.status)) throw this.invalidTransition();
        const { text, options, maxSelections } = this.normalize(
          input,
          input.type,
        );
        const [existing] = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(schema.polls)
          .where(eq(schema.polls.sessionId, sessionId));
        const [poll] = await tx
          .insert(schema.polls)
          .values({
            sessionId,
            text,
            type: input.type,
            maxSelections,
            position: existing?.count ?? 0,
          })
          .returning();
        await this.insertOptions(tx, poll.id, options);
        await this.access.bumpRevision(tx, sessionId);
        return this.snapshot(tx, poll.id);
      },
    );
  }

  async list(userId: string, sessionId: string): Promise<PollSnapshot[]> {
    await this.access.getOwnedSession(userId, sessionId);
    return this.listSnapshots(this.db, sessionId);
  }

  async get(
    userId: string,
    sessionId: string,
    pollId: string,
  ): Promise<PollSnapshot> {
    await this.access.getOwnedSession(userId, sessionId);
    return this.snapshot(this.db, pollId, sessionId);
  }

  async update(
    userId: string,
    sessionId: string,
    pollId: string,
    input: UpdatePollInput,
  ): Promise<PollSnapshot> {
    return this.access.withOwnedSessionLock(
      userId,
      sessionId,
      async (session, tx) => {
        if (isEnded(session.status)) throw this.invalidTransition();
        const poll = await this.requirePoll(tx, pollId, sessionId);
        if (poll.hasResponses) throw this.pollLocked();
        const { text, options, maxSelections } = this.normalize(
          input,
          poll.type,
        );
        await tx
          .update(schema.polls)
          .set({ text, maxSelections, updatedAt: new Date() })
          .where(eq(schema.polls.id, pollId));
        await tx
          .delete(schema.pollOptions)
          .where(eq(schema.pollOptions.pollId, pollId));
        await this.insertOptions(tx, pollId, options);
        await this.access.bumpRevision(tx, sessionId);
        return this.snapshot(tx, pollId, sessionId);
      },
    );
  }

  async remove(userId: string, sessionId: string, pollId: string) {
    await this.access.withOwnedSessionLock(
      userId,
      sessionId,
      async (session, tx) => {
        if (isEnded(session.status)) throw this.invalidTransition();
        const poll = await this.requirePoll(tx, pollId, sessionId);
        if (poll.hasResponses) throw this.pollLocked();
        await tx.delete(schema.polls).where(eq(schema.polls.id, pollId));
        await tx
          .update(schema.polls)
          .set({
            position: sql`${schema.polls.position} - 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.polls.sessionId, sessionId),
              gt(schema.polls.position, poll.position),
            ),
          );
        await this.access.bumpRevision(tx, sessionId);
      },
    );
  }

  async reorder(
    userId: string,
    sessionId: string,
    pollIds: string[],
  ): Promise<PollSnapshot[]> {
    return this.access.withOwnedSessionLock(
      userId,
      sessionId,
      async (session, tx) => {
        if (!isDraft(session.status)) throw this.invalidTransition();
        const polls = await tx
          .select({ id: schema.polls.id })
          .from(schema.polls)
          .where(eq(schema.polls.sessionId, sessionId));
        const existing = new Set(polls.map((poll) => poll.id));
        const requested = new Set(pollIds);
        if (
          pollIds.length !== polls.length ||
          requested.size !== pollIds.length ||
          pollIds.some((id) => !existing.has(id))
        ) {
          throw new BadRequestException({ code: ERROR_CODES.INVALID_INPUT });
        }
        for (let position = 0; position < pollIds.length; position += 1) {
          await tx
            .update(schema.polls)
            .set({ position, updatedAt: new Date() })
            .where(eq(schema.polls.id, pollIds[position]));
        }
        await this.access.bumpRevision(tx, sessionId);
        return this.listSnapshots(tx, sessionId);
      },
    );
  }

  async open(
    userId: string,
    sessionId: string,
    pollId: string,
  ): Promise<PollSnapshot> {
    return this.access.withOwnedSessionLock(
      userId,
      sessionId,
      async (session, tx) => {
        if (!isLive(session.status)) throw this.invalidTransition();
        const poll = await this.requirePoll(tx, pollId, sessionId);
        if (poll.isOpen) throw this.invalidTransition();
        await tx
          .update(schema.polls)
          .set({ isOpen: false, updatedAt: new Date() })
          .where(
            and(
              eq(schema.polls.sessionId, sessionId),
              ne(schema.polls.id, pollId),
              eq(schema.polls.isOpen, true),
            ),
          );
        await tx
          .update(schema.polls)
          .set({ isOpen: true, updatedAt: new Date() })
          .where(eq(schema.polls.id, pollId));
        await this.access.bumpRevision(tx, sessionId);
        return this.snapshot(tx, pollId, sessionId);
      },
    );
  }

  async close(
    userId: string,
    sessionId: string,
    pollId: string,
  ): Promise<PollSnapshot> {
    return this.access.withOwnedSessionLock(
      userId,
      sessionId,
      async (session, tx) => {
        if (!isLive(session.status)) throw this.invalidTransition();
        const poll = await this.requirePoll(tx, pollId, sessionId);
        if (!poll.isOpen) throw this.invalidTransition();
        await tx
          .update(schema.polls)
          .set({ isOpen: false, updatedAt: new Date() })
          .where(eq(schema.polls.id, pollId));
        await this.access.bumpRevision(tx, sessionId);
        return this.snapshot(tx, pollId, sessionId);
      },
    );
  }

  async reveal(
    userId: string,
    sessionId: string,
    pollId: string,
  ): Promise<PollSnapshot> {
    return this.setResultsRevealed(userId, sessionId, pollId, true);
  }

  async hide(
    userId: string,
    sessionId: string,
    pollId: string,
  ): Promise<PollSnapshot> {
    return this.setResultsRevealed(userId, sessionId, pollId, false);
  }

  private async setResultsRevealed(
    userId: string,
    sessionId: string,
    pollId: string,
    revealed: boolean,
  ): Promise<PollSnapshot> {
    return this.access.withOwnedSessionLock(
      userId,
      sessionId,
      async (session, tx) => {
        if (!isLive(session.status)) throw this.invalidTransition();
        const poll = await this.requirePoll(tx, pollId, sessionId);
        if (poll.resultsRevealed === revealed) throw this.invalidTransition();
        await tx
          .update(schema.polls)
          .set({ resultsRevealed: revealed, updatedAt: new Date() })
          .where(eq(schema.polls.id, pollId));
        await this.access.bumpRevision(tx, sessionId);
        return this.snapshot(tx, pollId, sessionId);
      },
    );
  }

  private normalize(
    input: { text: string; options?: string[]; maxSelections?: number | null },
    type: PollType,
  ) {
    try {
      return normalizePollInput(
        type,
        input.text,
        input.options,
        input.maxSelections,
      );
    } catch (error) {
      if (error instanceof InvalidPollError) {
        throw new BadRequestException({
          code: ERROR_CODES.INVALID_INPUT,
          message: error.message,
        });
      }
      throw error;
    }
  }

  private async requirePoll(tx: DbHandle, pollId: string, sessionId: string) {
    const [poll] = await tx
      .select()
      .from(schema.polls)
      .where(
        and(eq(schema.polls.id, pollId), eq(schema.polls.sessionId, sessionId)),
      )
      .limit(1);
    if (!poll) throw this.pollNotFound();
    return poll;
  }

  private async insertOptions(
    tx: DbHandle,
    pollId: string,
    options: readonly string[],
  ) {
    if (options.length === 0) return;
    await tx
      .insert(schema.pollOptions)
      .values(options.map((text, position) => ({ pollId, text, position })));
  }

  private async listSnapshots(
    tx: DbHandle,
    sessionId: string,
  ): Promise<PollSnapshot[]> {
    const polls = await tx
      .select()
      .from(schema.polls)
      .where(eq(schema.polls.sessionId, sessionId))
      .orderBy(asc(schema.polls.position), asc(schema.polls.createdAt));
    if (polls.length === 0) return [];
    const options = await tx
      .select()
      .from(schema.pollOptions)
      .where(
        inArray(
          schema.pollOptions.pollId,
          polls.map((poll) => poll.id),
        ),
      )
      .orderBy(asc(schema.pollOptions.position));
    const optionsByPoll = new Map<string, typeof options>();
    for (const option of options) {
      const group = optionsByPoll.get(option.pollId) ?? [];
      group.push(option);
      optionsByPoll.set(option.pollId, group);
    }
    return polls.map((poll) =>
      this.toSnapshot(poll, optionsByPoll.get(poll.id) ?? []),
    );
  }

  private async snapshot(
    tx: DbHandle,
    pollId: string,
    sessionId?: string,
  ): Promise<PollSnapshot> {
    const [poll] = await tx
      .select()
      .from(schema.polls)
      .where(
        and(
          eq(schema.polls.id, pollId),
          ...(sessionId ? [eq(schema.polls.sessionId, sessionId)] : []),
        ),
      )
      .limit(1);
    if (!poll) throw this.pollNotFound();
    const options = await tx
      .select()
      .from(schema.pollOptions)
      .where(eq(schema.pollOptions.pollId, pollId))
      .orderBy(asc(schema.pollOptions.position));
    return this.toSnapshot(poll, options);
  }

  private toSnapshot(poll: PollRow, options: PollOptionRow[]): PollSnapshot {
    return pollSnapshotSchema.parse({
      id: poll.id,
      sessionId: poll.sessionId,
      text: poll.text,
      type: poll.type,
      position: poll.position,
      maxSelections: poll.maxSelections,
      isOpen: poll.isOpen,
      resultsRevealed: poll.resultsRevealed,
      hasResponses: poll.hasResponses,
      options: options.map((option) => ({
        id: option.id,
        text: option.text,
        position: option.position,
      })),
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
    });
  }

  private invalidTransition() {
    return new ConflictException({ code: ERROR_CODES.INVALID_TRANSITION });
  }

  private pollLocked() {
    return new ConflictException({ code: ERROR_CODES.POLL_LOCKED });
  }

  private pollNotFound() {
    return new NotFoundException({ code: ERROR_CODES.POLL_NOT_FOUND });
  }
}

type CreatePollInput = {
  type: PollType;
  text: string;
  options?: string[];
  maxSelections?: number | null;
};

type UpdatePollInput = {
  text: string;
  options?: string[];
  maxSelections?: number | null;
};

type PollRow = typeof schema.polls.$inferSelect;
type PollOptionRow = typeof schema.pollOptions.$inferSelect;
