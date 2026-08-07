import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SessionsModule } from '../sessions/sessions.module';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';

@Module({
  imports: [AuthModule, SessionsModule, RealtimeModule],
  controllers: [PollsController],
  providers: [PollsService],
  exports: [PollsService],
})
export class PollsModule {}
