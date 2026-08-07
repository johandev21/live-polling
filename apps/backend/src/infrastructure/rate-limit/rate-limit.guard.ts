import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ERROR_CODES } from '../../contracts/errors.contract';
import { RateLimitService } from './rate-limit.service';

export const RATE_LIMIT_METADATA = 'rate_limit';

export const RateLimit = (windowSeconds: number, max: number) =>
  SetMetadata(RATE_LIMIT_METADATA, { windowSeconds, max });

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(RateLimitService) private readonly rateLimit: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.get<{
      windowSeconds: number;
      max: number;
    }>(RATE_LIMIT_METADATA, context.getHandler());
    if (!config) return true;
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      originalUrl?: string;
      participant?: { sub: string };
    }>();
    const forwarded = request.headers['x-forwarded-for'];
    const ip =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded) ?? 'unknown';
    const identity = request.participant?.sub ?? ip;
    const key = `rate_limit:${request.originalUrl ?? 'unknown'}:${identity}`;
    const { allowed, retryAfterSeconds } = await this.rateLimit.check(
      key,
      config.windowSeconds,
      config.max,
    );
    if (!allowed) {
      context
        .switchToHttp()
        .getResponse()
        .setHeader('X-Retry-After', String(retryAfterSeconds));
      throw new HttpException(
        { code: ERROR_CODES.RATE_LIMITED },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
