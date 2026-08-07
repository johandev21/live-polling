import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { RequestCorrelationMiddleware } from './infrastructure/logging/request-correlation.middleware';
import { MetricsModule } from './infrastructure/metrics/metrics.module';
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
    LoggingModule,
    MetricsModule,
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestCorrelationMiddleware).forRoutes('*');
  }
}
