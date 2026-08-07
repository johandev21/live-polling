import { Module } from '@nestjs/common';
import { RequestCorrelationMiddleware } from './request-correlation.middleware';

@Module({
  providers: [RequestCorrelationMiddleware],
})
export class LoggingModule {}
