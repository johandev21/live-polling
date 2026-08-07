import {
  Global,
  Inject,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
class RedisShutdown implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  onApplicationShutdown() {
    this.redis.disconnect();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () =>
        new Redis(
          process.env.REDIS_URL ??
            (() => {
              throw new Error('REDIS_URL is required');
            })(),
          {
            lazyConnect: true,
            connectTimeout: 1_000,
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            retryStrategy: () => null,
          },
        ).on('error', () => undefined),
    },
    RedisShutdown,
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
