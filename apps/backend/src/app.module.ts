import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { HealthModule } from './health/health.module';
import { MailerModule } from './infrastructure/mailer/mailer.module';
import { AuthModule } from './auth/auth.module';
import { SessionsModule } from './sessions/sessions.module';
import { PollsModule } from './polls/polls.module';
import { ParticipantsModule } from './participants/participants.module';
import { ResponsesModule } from './responses/responses.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    MailerModule,
    AuthModule,
    SessionsModule,
    PollsModule,
    ParticipantsModule,
    ResponsesModule,
    RealtimeModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
