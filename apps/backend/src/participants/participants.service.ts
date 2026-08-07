import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DATABASE } from '../infrastructure/database/database.constants';
import type { Database } from '../infrastructure/database/database.types';
import * as schema from '../infrastructure/database/schema';
import { ERROR_CODES } from '../contracts/errors.contract';
import type {
  JoinResponse,
  ParticipantSessionSnapshot,
  ParticipantSnapshot,
} from '../contracts/participant.contract';
import {
  joinResponseSchema,
  participantSessionSnapshotSchema,
  participantSnapshotSchema,
} from '../contracts/participant.contract';
import { PollsService } from '../polls/polls.service';
import {
  InvalidDisplayNameError,
  normalizeDisplayName,
} from './participant.domain';
import { ParticipantTokenService } from './participant-token.service';

@Injectable()
export class ParticipantsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(PollsService) private readonly polls: PollsService,
    @Inject(ParticipantTokenService)
    private readonly tokens: ParticipantTokenService,
  ) {}

  async join(input: {
    roomCode?: string;
    invitationUrl?: string;
    displayName: string;
    token?: string | null;
  }): Promise<JoinResponse> {
    const name = this.normalizeName(input.displayName);
    const roomCode =
      input.roomCode ?? this.roomCodeFromInvitation(input.invitationUrl);
    const [session] = await this.db
      .select()
      .from(schema.sessions)
      .where(sql`lower(${schema.sessions.roomCode}) = lower(${roomCode})`)
      .limit(1);
    if (!session) {
      throw new NotFoundException({ code: ERROR_CODES.SESSION_NOT_FOUND });
    }
    if (session.status === 'draft') {
      throw new ConflictException({ code: ERROR_CODES.SESSION_DRAFT });
    }
    if (session.status === 'ended') {
      throw new ConflictException({ code: ERROR_CODES.SESSION_ENDED });
    }

    if (input.token) {
      const payload = this.tokens.verify(input.token);
      if (payload?.sid === session.id) {
        const [existing] = await this.db
          .select()
          .from(schema.participants)
          .where(eq(schema.participants.id, payload.sub))
          .limit(1);
        if (existing) {
          const [updated] = await this.db
            .update(schema.participants)
            .set({ displayName: name, updatedAt: new Date() })
            .where(eq(schema.participants.id, existing.id))
            .returning();
          return this.buildResponse(session.id, updated, input.token);
        }
      }
    }

    const [participant] = await this.db
      .insert(schema.participants)
      .values({ sessionId: session.id, displayName: name })
      .returning();
    const token = this.tokens.issue(participant.id, session.id);
    return this.buildResponse(session.id, participant, token);
  }

  async sessionIdForParticipant(participantId: string): Promise<string> {
    const participant = await this.requireParticipant(participantId);
    return participant.sessionId;
  }

  async snapshot(participantId: string): Promise<ParticipantSessionSnapshot> {
    const participant = await this.requireParticipant(participantId);
    return this.buildSnapshot(participant.sessionId);
  }

  async updateDisplayName(
    participantId: string,
    displayName: string,
  ): Promise<ParticipantSnapshot> {
    const name = this.normalizeName(displayName);
    const participant = await this.requireParticipant(participantId);
    const [session] = await this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, participant.sessionId))
      .limit(1);
    if (session?.status === 'ended') {
      throw new ConflictException({ code: ERROR_CODES.SESSION_ENDED });
    }
    const [updated] = await this.db
      .update(schema.participants)
      .set({ displayName: name, updatedAt: new Date() })
      .where(eq(schema.participants.id, participantId))
      .returning();
    return this.toParticipantSnapshot(updated);
  }

  private async buildResponse(
    sessionId: string,
    participant: ParticipantRow,
    token: string,
  ): Promise<JoinResponse> {
    return joinResponseSchema.parse({
      token,
      participant: this.toParticipantSnapshot(participant),
      snapshot: await this.buildSnapshot(sessionId),
    });
  }

  private async buildSnapshot(
    sessionId: string,
  ): Promise<ParticipantSessionSnapshot> {
    const [session] = await this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, sessionId))
      .limit(1);
    if (!session) {
      throw new NotFoundException({ code: ERROR_CODES.SESSION_NOT_FOUND });
    }
    const groups = await this.polls.pollGroups(sessionId);
    return participantSessionSnapshotSchema.parse({
      session: {
        id: session.id,
        name: session.name,
        status: session.status,
        revision: session.revision,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
      },
      polls: groups.map(({ poll, options }) => ({
        id: poll.id,
        text: poll.text,
        type: poll.type,
        position: poll.position,
        maxSelections: poll.maxSelections,
        options: options.map((option) => ({
          id: option.id,
          text: option.text,
          position: option.position,
        })),
        isOpen: poll.isOpen,
        resultsRevealed: poll.resultsRevealed,
      })),
    });
  }

  private normalizeName(name: string): string {
    try {
      return normalizeDisplayName(name);
    } catch (error) {
      if (error instanceof InvalidDisplayNameError) {
        throw new BadRequestException({ code: ERROR_CODES.INVALID_INPUT });
      }
      throw error;
    }
  }

  private roomCodeFromInvitation(invitationUrl: string | undefined): string {
    if (!invitationUrl) return '';
    const path = new URL(invitationUrl).pathname;
    return path.split('/').filter(Boolean).at(-1) ?? '';
  }

  private toParticipantSnapshot(
    participant: ParticipantRow,
  ): ParticipantSnapshot {
    return participantSnapshotSchema.parse({
      id: participant.id,
      sessionId: participant.sessionId,
      displayName: participant.displayName,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
    });
  }

  private async requireParticipant(
    participantId: string,
  ): Promise<ParticipantRow> {
    const [participant] = await this.db
      .select()
      .from(schema.participants)
      .where(eq(schema.participants.id, participantId))
      .limit(1);
    if (!participant) {
      throw new UnauthorizedException({ code: ERROR_CODES.UNAUTHORIZED });
    }
    return participant;
  }
}

type ParticipantRow = typeof schema.participants.$inferSelect;
