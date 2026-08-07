import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { MetricsService } from '../metrics/metrics.service';
import { RequestContext } from './request-context';

@Injectable()
export class RequestCorrelationMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Http');

  constructor(
    @Inject(MetricsService) private readonly metrics: MetricsService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers['x-request-id'];
    const requestId =
      (Array.isArray(header) ? header[0] : header) ?? randomUUID();
    res.setHeader('X-Request-Id', requestId);
    const startedAt = process.hrtime.bigint();

    RequestContext.run({ requestId }, () => {
      res.on('finish', () => {
        const durationMs =
          Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const summary = {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Math.round(durationMs * 100) / 100,
        };
        if (res.statusCode >= 500) {
          this.metrics.countRequestFailure('5xx');
          this.logger.error(summary);
        } else if (res.statusCode >= 400) {
          this.metrics.countRequestFailure('4xx');
          this.logger.warn(summary);
        } else {
          this.logger.log(summary);
        }
      });
      next();
    });
  }
}
