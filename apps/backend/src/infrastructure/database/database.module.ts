import {
  Global,
  Inject,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DATABASE, DATABASE_POOL } from './database.constants';
import * as schema from './schema';

@Injectable()
class DatabaseShutdown implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: () =>
        new Pool({
          connectionString:
            process.env.DATABASE_URL ??
            (() => {
              throw new Error('DATABASE_URL is required');
            })(),
          max: Number(process.env.DATABASE_POOL_MAX ?? 10),
          connectionTimeoutMillis: 1_000,
        }),
    },
    {
      provide: DATABASE,
      inject: [DATABASE_POOL],
      useFactory: (pool: Pool) => drizzle(pool, { schema }),
    },
    DatabaseShutdown,
  ],
  exports: [DATABASE_POOL, DATABASE],
})
export class DatabaseModule {}
