import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RoomCodeService } from './room-code.service';
import { SessionAccessService } from './session-access.service';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionAccessService, RoomCodeService],
  exports: [SessionsService, SessionAccessService],
})
export class SessionsModule {}
