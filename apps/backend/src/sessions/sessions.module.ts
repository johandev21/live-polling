import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoomCodeService } from './room-code.service';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [AuthModule],
  controllers: [SessionsController],
  providers: [SessionsService, RoomCodeService],
  exports: [SessionsService],
})
export class SessionsModule {}
