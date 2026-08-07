import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { DATABASE_POOL } from '../infrastructure/database/database.constants';
import { REDIS_CLIENT } from '../infrastructure/redis/redis.constants';

@Injectable()
export class HealthService {
  constructor(
    @Inject(DATABASE_POOL) private readonly database: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async dependencies(): Promise<{
    status: 'ok' | 'error';
    checks: Record<string, string>;
  }> {
    const checks = await Promise.all([this.checkDatabase(), this.checkRedis()]);
    const status = checks.every((check) => check === 'ok') ? 'ok' : 'error';
    return { status, checks: { database: checks[0], redis: checks[1] } };
  }

  private async checkDatabase(): Promise<string> {
    try {
      await this.database.query('SELECT 1');
      return 'ok';
    } catch {
      return 'error';
    }
  }

  private async checkRedis(): Promise<string> {
    try {
      if (this.redis.status === 'wait') await this.redis.connect();
      await this.redis.ping();
      return 'ok';
    } catch {
      return 'error';
    }
  }
}
