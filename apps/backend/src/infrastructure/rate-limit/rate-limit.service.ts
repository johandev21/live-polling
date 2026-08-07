import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

@Injectable()
export class RateLimitService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async check(
    key: string,
    windowSeconds: number,
    max: number,
  ): Promise<RateLimitResult> {
    if (this.redis.status === 'wait') await this.redis.connect();
    const value = await this.redis.incr(key);
    if (value === 1) await this.redis.expire(key, windowSeconds);
    if (value > max) {
      const ttl = await this.redis.ttl(key);
      return { allowed: false, retryAfterSeconds: Math.max(1, ttl) };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
