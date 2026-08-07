import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { DATABASE } from '../infrastructure/database/database.constants';
import type {
  Database,
  DbHandle,
} from '../infrastructure/database/database.types';
import * as schema from '../infrastructure/database/schema';
import { ERROR_CODES } from '../contracts/errors.contract';
import type {
  HostResults,
  ParticipantResults,
  ResponseSnapshot,
} from '../contracts/response.contract';
import {
  hostResultsSchema,
  participantResultsSchema,
  responseSnapshotSchema,
} from '../contracts/response.contract';
import { PollsService } from '../polls/polls.service';
import { ParticipantsService } from '../participants/participants.service';
import { SessionAccessService } from '../sessions/session-access.service';
import {
  InvalidResponseError,
  canSubmit,
  normalizeIdempotencyKey,
  normalizeOpenText,
  validateChoiceSelection,
} from './response.domain';

@Injectable()
export class ResponsesService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(PollsService) private readonly polls: PollsService,
    @Inject(ParticipantsService)
    private readonly participants: ParticipantsService,
    @Inject(SessionAccessService)
    private readonly access: SessionAccessService,
  ) {}

  async submit(
    participantId: string,
    pollId: string,
    input: { idempotencyKey: string; optionIds?: string[]; text?: string },
  ): Promise<ResponseSnapshot> {
    const sessionId =
      await this.participants.sessionIdForParticipant(participantId);
    const key = this.normalizeKey(input.idempotencyKey);
    return this.access.withSessionLock(sessionId, async (session, tx) => {
      const [poll] = await tx
        .select()
        .from(schema.polls)
        .where(eq(schema.polls.id, pollId))
        .for('update');
      if (!poll) throw this.pollNotFound();
      if (poll.sessionId !== sessionId) throw this.pollNotFound();
      const gate = canSubmit(session.status, poll.isOpen);
      if (!gate.allowed) {
        throw gate.reason === 'session'
          ? this.sessionGated()
          : this.closedPoll();
      }
      const options = await tx
        .select({ id: schema.pollOptions.id })
        .from(schema.pollOptions)
        .where(eq(schema.pollOptions.pollId, pollId))
        .orderBy(asc(schema.pollOptions.position));
      const selection = this.validateSelection(
        poll.type,
        poll.maxSelections,
        options.map((option) => option.id),
        input,
      );
      const [existing] = await tx
        .select()
        .from(schema.responses)
        .where(
          and(
            eq(schema.responses.participantId, participantId),
            eq(schema.responses.pollId, pollId),
          ),
        )
        .limit(1);
      if (existing) {
        if (existing.idempotencyKey === key) {
          return this.responseSnapshot(tx, existing.id);
        }
        const [updated] = await tx
          .update(schema.responses)
          .set({
            idempotencyKey: key,
            text: selection.text,
            updatedAt: new Date(),
          })
          .where(eq(schema.responses.id, existing.id))
          .returning();
        await this.replaceSelections(tx, existing.id, selection.optionIds);
        await this.access.bumpRevision(tx, sessionId);
        return this.responseSnapshot(tx, updated.id);
      }
      const [created] = await tx
        .insert(schema.responses)
        .values({
          sessionId,
          pollId,
          participantId,
          text: selection.text,
          idempotencyKey: key,
        })
        .returning();
      await this.insertSelections(tx, created.id, selection.optionIds);
      if (!poll.hasResponses) {
        await tx
          .update(schema.polls)
          .set({ hasResponses: true, updatedAt: new Date() })
          .where(eq(schema.polls.id, pollId));
      }
      await this.access.bumpRevision(tx, sessionId);
      return this.responseSnapshot(tx, created.id);
    });
  }

  async participantResults(
    participantId: string,
    pollId: string,
  ): Promise<ParticipantResults> {
    const sessionId =
      await this.participants.sessionIdForParticipant(participantId);
    const group = await this.polls.pollGroup(pollId);
    if (!group || group.poll.sessionId !== sessionId) {
      throw this.pollNotFound();
    }
    if (!group.poll.resultsRevealed) {
      throw new ForbiddenException({
        code: ERROR_CODES.RESULTS_NOT_REVEALED,
      });
    }
    return this.choiceResults(pollId);
  }

  async hostResults(
    userId: string,
    sessionId: string,
    pollId: string,
  ): Promise<HostResults> {
    await this.access.getOwnedSession(userId, sessionId);
    const group = await this.polls.pollGroup(pollId);
    if (!group || group.poll.sessionId !== sessionId) {
      throw this.pollNotFound();
    }
    const total = await this.responseCount(pollId);
    if (group.poll.type === 'open_ended') {
      const rows = await this.db
        .select({
          id: schema.responses.id,
          text: schema.responses.text,
          createdAt: schema.responses.createdAt,
        })
        .from(schema.responses)
        .where(
          and(
            eq(schema.responses.pollId, pollId),
            isNotNull(schema.responses.text),
          ),
        )
        .orderBy(asc(schema.responses.createdAt));
      return hostResultsSchema.parse({
        pollId,
        total,
        counts: [],
        responses: rows.map((row) => ({
          id: row.id,
          text: row.text as string,
          createdAt: row.createdAt,
        })),
      });
    }
    const rows = await this.db
      .select({
        optionId: schema.responseOptions.optionId,
        text: schema.pollOptions.text,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.responseOptions)
      .innerJoin(
        schema.responses,
        eq(schema.responses.id, schema.responseOptions.responseId),
      )
      .innerJoin(
        schema.pollOptions,
        eq(schema.pollOptions.id, schema.responseOptions.optionId),
      )
      .where(eq(schema.responses.pollId, pollId))
      .groupBy(
        schema.responseOptions.optionId,
        schema.pollOptions.text,
        schema.pollOptions.position,
      )
      .orderBy(asc(schema.pollOptions.position));
    return hostResultsSchema.parse({
      pollId,
      total,
      counts: rows.map((row) => ({
        optionId: row.optionId,
        text: row.text,
        count: row.count,
        percentage: percentage(row.count, total),
      })),
      responses: [],
    });
  }

  private async choiceResults(pollId: string): Promise<ParticipantResults> {
    const total = await this.responseCount(pollId);
    const rows = await this.db
      .select({
        optionId: schema.responseOptions.optionId,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.responseOptions)
      .innerJoin(
        schema.responses,
        eq(schema.responses.id, schema.responseOptions.responseId),
      )
      .where(eq(schema.responses.pollId, pollId))
      .groupBy(schema.responseOptions.optionId);
    return participantResultsSchema.parse({
      pollId,
      total,
      counts: rows.map((row) => ({
        optionId: row.optionId,
        count: row.count,
        percentage: percentage(row.count, total),
      })),
    });
  }

  private async responseCount(pollId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.responses)
      .where(eq(schema.responses.pollId, pollId));
    return row?.count ?? 0;
  }

  private validateSelection(
    type: 'single_choice' | 'multiple_choice' | 'open_ended',
    maxSelections: number | null,
    validOptionIds: string[],
    input: { optionIds?: string[]; text?: string },
  ): { optionIds: string[]; text: string | null } {
    try {
      if (type === 'open_ended') {
        if (input.optionIds) {
          throw new InvalidResponseError(
            'open-ended responses cannot select options',
          );
        }
        return { optionIds: [], text: normalizeOpenText(input.text) };
      }
      return {
        optionIds: validateChoiceSelection(
          input.optionIds,
          { type, maxSelections },
          validOptionIds,
        ),
        text: null,
      };
    } catch (error) {
      if (error instanceof InvalidResponseError) {
        throw new ConflictException({
          code: ERROR_CODES.INVALID_INPUT,
          message: error.message,
        });
      }
      throw error;
    }
  }

  private async insertSelections(
    tx: DbHandle,
    responseId: string,
    optionIds: readonly string[],
  ) {
    if (optionIds.length === 0) return;
    await tx
      .insert(schema.responseOptions)
      .values(optionIds.map((optionId) => ({ responseId, optionId })));
  }

  private async replaceSelections(
    tx: DbHandle,
    responseId: string,
    optionIds: readonly string[],
  ) {
    await tx
      .delete(schema.responseOptions)
      .where(eq(schema.responseOptions.responseId, responseId));
    await this.insertSelections(tx, responseId, optionIds);
  }

  private async responseSnapshot(
    tx: DbHandle,
    responseId: string,
  ): Promise<ResponseSnapshot> {
    const [response] = await tx
      .select()
      .from(schema.responses)
      .where(eq(schema.responses.id, responseId))
      .limit(1);
    if (!response) {
      throw new NotFoundException({ code: ERROR_CODES.INTERNAL });
    }
    const selections = await tx
      .select({ optionId: schema.responseOptions.optionId })
      .from(schema.responseOptions)
      .where(eq(schema.responseOptions.responseId, responseId));
    return responseSnapshotSchema.parse({
      id: response.id,
      pollId: response.pollId,
      participantId: response.participantId,
      optionIds: selections.map((selection) => selection.optionId),
      text: response.text,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    });
  }

  private normalizeKey(key: string): string {
    try {
      return normalizeIdempotencyKey(key);
    } catch (error) {
      if (error instanceof InvalidResponseError) {
        throw new ConflictException({
          code: ERROR_CODES.INVALID_INPUT,
          message: error.message,
        });
      }
      throw error;
    }
  }

  private sessionGated() {
    return new ConflictException({ code: ERROR_CODES.SESSION_ENDED });
  }

  private closedPoll() {
    return new ConflictException({ code: ERROR_CODES.CLOSED_POLL });
  }

  private pollNotFound() {
    return new NotFoundException({ code: ERROR_CODES.POLL_NOT_FOUND });
  }
}

function percentage(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 1_000) / 10;
}
