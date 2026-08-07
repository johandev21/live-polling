import { Injectable } from '@nestjs/common';
import type { ParticipantTokenPayload } from './participant.domain';
import {
  TOKEN_TTL_SECONDS,
  decodeParticipantToken,
  encodeParticipantToken,
} from './participant.domain';

@Injectable()
export class ParticipantTokenService {
  private readonly secret: string;

  constructor() {
    const secret =
      process.env.PARTICIPANT_TOKEN_SECRET ?? process.env.BETTER_AUTH_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error(
        'PARTICIPANT_TOKEN_SECRET (or BETTER_AUTH_SECRET) must be at least 32 characters',
      );
    }
    this.secret = secret;
  }

  issue(participantId: string, sessionId: string): string {
    const now = Math.floor(Date.now() / 1_000);
    return encodeParticipantToken(
      {
        sub: participantId,
        sid: sessionId,
        iat: now,
        exp: now + TOKEN_TTL_SECONDS,
      },
      this.secret,
    );
  }

  verify(token: string): ParticipantTokenPayload | null {
    try {
      return decodeParticipantToken(token, this.secret);
    } catch {
      return null;
    }
  }
}
