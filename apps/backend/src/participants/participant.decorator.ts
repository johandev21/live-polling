import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { ParticipantTokenPayload } from './participant.domain';

export const Participant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ParticipantTokenPayload => {
    return context
      .switchToHttp()
      .getRequest<{ participant: ParticipantTokenPayload }>().participant;
  },
);
