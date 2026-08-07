import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AllowAnonymous, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { HostSessionGuard } from '../auth/auth.guards';
import { ZodValidationPipe } from '../contracts/zod-validation.pipe';
import { uuidSchema } from '../contracts/session.contract';
import { submitResponseRequestSchema } from '../contracts/response.contract';
import {
  RateLimit,
  RateLimitGuard,
} from '../infrastructure/rate-limit/rate-limit.guard';
import { Participant } from '../participants/participant.decorator';
import type { ParticipantTokenPayload } from '../participants/participant.domain';
import { ParticipantGuard } from '../participants/participant.guard';
import { ResponsesService } from './responses.service';

@Controller()
@AllowAnonymous()
export class ResponsesController {
  constructor(
    @Inject(ResponsesService) private readonly responses: ResponsesService,
  ) {}

  @Put('participant/polls/:pollId/response')
  @UseGuards(ParticipantGuard, RateLimitGuard)
  @RateLimit(60, 30)
  submit(
    @Participant() participant: ParticipantTokenPayload,
    @Param('pollId', new ZodValidationPipe(uuidSchema)) pollId: string,
    @Body(new ZodValidationPipe(submitResponseRequestSchema))
    body: { idempotencyKey: string; optionIds?: string[]; text?: string },
  ) {
    return this.responses.submit(participant.sub, pollId, body);
  }

  @Get('participant/polls/:pollId/results')
  @UseGuards(ParticipantGuard)
  results(
    @Participant() participant: ParticipantTokenPayload,
    @Param('pollId', new ZodValidationPipe(uuidSchema)) pollId: string,
  ) {
    return this.responses.participantResults(participant.sub, pollId);
  }

  @Get('sessions/:sessionId/polls/:pollId/results')
  @UseGuards(HostSessionGuard)
  hostResults(
    @Session() session: UserSession,
    @Param('sessionId', new ZodValidationPipe(uuidSchema)) sessionId: string,
    @Param('pollId', new ZodValidationPipe(uuidSchema)) pollId: string,
  ) {
    return this.responses.hostResults(session.user.id, sessionId, pollId);
  }
}
