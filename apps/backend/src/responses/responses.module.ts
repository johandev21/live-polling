import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RateLimitModule } from '../infrastructure/rate-limit/rate-limit.module';
import { SessionsModule } from '../sessions/sessions.module';
import { PollsModule } from '../polls/polls.module';
import { ParticipantsModule } from '../participants/participants.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ResponsesController } from './responses.controller';
import { ResponsesService } from './responses.service';

@Module({
  imports: [
    AuthModule,
    RateLimitModule,
    SessionsModule,
    PollsModule,
    ParticipantsModule,
    RealtimeModule,
  ],
  controllers: [ResponsesController],
  providers: [ResponsesService],
  exports: [ResponsesService],
})
export class ResponsesModule {}
