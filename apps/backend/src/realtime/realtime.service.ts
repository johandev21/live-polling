import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE } from '../infrastructure/database/database.constants';
import type { Database } from '../infrastructure/database/database.types';
import * as schema from '../infrastructure/database/schema';
import { PresenceService } from './presence.service';
import { SessionGateway, hostRoom, participantRoom } from './session.gateway';

@Injectable()
export class RealtimeService {
  constructor(
    @Inject(SessionGateway) private readonly gateway: SessionGateway,
    @Inject(PresenceService) private readonly presence: PresenceService,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  toHosts(sessionId: string, eventName: string, payload: unknown): void {
    this.gateway.publish(hostRoom(sessionId), eventName, payload);
  }

  toParticipants(sessionId: string, eventName: string, payload: unknown): void {
    this.gateway.publish(participantRoom(sessionId), eventName, payload);
  }

  toAll(
    sessionId: string,
    eventName: string,
    hostPayload: unknown,
    participantPayload: unknown,
  ): void {
    this.toHosts(sessionId, eventName, hostPayload);
    this.toParticipants(sessionId, eventName, participantPayload);
  }

  async currentRevision(sessionId: string): Promise<number> {
    const [row] = await this.db
      .select({ revision: schema.sessions.revision })
      .from(schema.sessions)
      .where(eq(schema.sessions.id, sessionId))
      .limit(1);
    return row?.revision ?? 1;
  }

  async renamePresence(
    sessionId: string,
    participantId: string,
    displayName: string,
  ): Promise<void> {
    await this.presence.rename(sessionId, participantId, displayName);
    await this.gateway.syncPresence(sessionId, true);
  }
}
