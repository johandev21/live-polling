import { Module } from '@nestjs/common';
import { RateLimitModule } from '../infrastructure/rate-limit/rate-limit.module';
import { PollsModule } from '../polls/polls.module';
import { ParticipantGuard } from './participant.guard';
import { ParticipantTokenService } from './participant-token.service';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';

@Module({
  imports: [RateLimitModule, PollsModule],
  controllers: [ParticipantsController],
  providers: [ParticipantsService, ParticipantTokenService, ParticipantGuard],
  exports: [ParticipantsService, ParticipantGuard, ParticipantTokenService],
})
export class ParticipantsModule {}
