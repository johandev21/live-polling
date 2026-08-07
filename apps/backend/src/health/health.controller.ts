import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Res,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { Response } from 'express';
import {
  healthResponseSchema,
  readinessResponseSchema,
} from '../contracts/health.contract';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}

  @Get('live')
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  live() {
    return healthResponseSchema.parse({ status: 'ok', service: 'backend' });
  }

  @Get('ready')
  @AllowAnonymous()
  async ready(@Res() response: Response) {
    const result = readinessResponseSchema.parse(
      await this.health.dependencies(),
    );
    return response
      .status(
        result.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE,
      )
      .json(result);
  }
}
