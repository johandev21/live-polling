import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ZodValidationPipe } from '../contracts/zod-validation.pipe';
import {
  joinRequestSchema,
  updateDisplayNameRequestSchema,
} from '../contracts/participant.contract';
import {
  RateLimit,
  RateLimitGuard,
} from '../infrastructure/rate-limit/rate-limit.guard';
import { Participant } from './participant.decorator';
import type { ParticipantTokenPayload } from './participant.domain';
import { ParticipantGuard } from './participant.guard';
import { ParticipantsService } from './participants.service';

@Controller()
@AllowAnonymous()
export class ParticipantsController {
  constructor(
    @Inject(ParticipantsService)
    private readonly participants: ParticipantsService,
  ) {}

  @Post('join')
  @UseGuards(RateLimitGuard)
  @RateLimit(60, 10)
  join(
    @Body(new ZodValidationPipe(joinRequestSchema))
    body: {
      roomCode?: string;
      invitationUrl?: string;
      displayName: string;
      token?: string | null;
    },
  ) {
    return this.participants.join(body);
  }

  @Get('participant/session')
  @UseGuards(ParticipantGuard)
  session(@Participant() participant: ParticipantTokenPayload) {
    return this.participants.snapshot(participant.sub);
  }

  @Patch('participant/me')
  @UseGuards(ParticipantGuard, RateLimitGuard)
  @RateLimit(60, 20)
  updateDisplayName(
    @Participant() participant: ParticipantTokenPayload,
    @Body(new ZodValidationPipe(updateDisplayNameRequestSchema))
    body: { displayName: string },
  ) {
    return this.participants.updateDisplayName(
      participant.sub,
      body.displayName,
    );
  }
}
