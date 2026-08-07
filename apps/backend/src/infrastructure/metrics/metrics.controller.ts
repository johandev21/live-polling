import { Controller, Get, Inject, Res } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller()
export class MetricsController {
  constructor(
    @Inject(MetricsService) private readonly service: MetricsService,
  ) {}

  @Get('metrics')
  @AllowAnonymous()
  async metrics(@Res() response: Response): Promise<void> {
    const { contentType, body } = await this.service.scrape();
    response.setHeader('Content-Type', contentType);
    response.send(body);
  }
}
