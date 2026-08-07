import { Module } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import Redis from 'ioredis';
import { DATABASE } from '../infrastructure/database/database.constants';
import { hosts } from '../infrastructure/database/schema';
import { MAILER, Mailer } from '../infrastructure/mailer/mailer.constants';
import { REDIS_CLIENT } from '../infrastructure/redis/redis.constants';
import { AuthController } from './auth.controller';
import { VerifiedHostGuard } from './auth.guards';

@Module({
  imports: [
    BetterAuthModule.forRootAsync({
      inject: [DATABASE, MAILER, REDIS_CLIENT],
      useFactory: (
        database: Parameters<typeof drizzleAdapter>[0],
        mailer: Mailer,
        redis: Redis,
      ) => ({
        auth: betterAuth({
          database: drizzleAdapter(database, { provider: 'pg' }),
          basePath: '/api/auth',
          baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
          secret: requiredAuthSecret(),
          trustedOrigins: configuredOrigins(),
          session: {
            expiresIn: 60 * 60 * 24 * 7,
            storeSessionInDatabase: true,
            preserveSessionInDatabase: true,
          },
          verification: {
            storeInDatabase: true,
          },
          secondaryStorage: {
            get: async (key: string) => {
              await connectRedis(redis);
              return redis.get(key);
            },
            set: async (key: string, value: string, ttl?: number) => {
              await connectRedis(redis);
              if (ttl) await redis.set(key, value, 'EX', ttl);
              else await redis.set(key, value);
            },
            delete: async (key: string) => {
              await connectRedis(redis);
              await redis.del(key);
            },
            increment: async (key: string, ttl: number) => {
              await connectRedis(redis);
              const value = await redis.incrby(key, 1);
              if (value === 1) await redis.expire(key, ttl);
              return value;
            },
          },
          rateLimit: { enabled: true, window: 60, max: 5 },
          databaseHooks: {
            user: {
              create: {
                after: async (user) => {
                  await database.insert(hosts).values({
                    userId: user.id,
                    email: user.email,
                  });
                },
              },
            },
          },
          emailVerification: {
            sendVerificationEmail: async ({ user, url }) => {
              await mailer.send({
                to: user.email,
                subject: 'Verify your Live Polling email',
                text: `Verify your email by opening: ${url}`,
              });
            },
            sendOnSignIn: true,
          },
          plugins: [
            magicLink({
              expiresIn: 60 * 15,
              sendMagicLink: async ({ email, url }) => {
                const link = new URL(url);
                if (link.searchParams.get('callbackURL') === '/') {
                  link.searchParams.set(
                    'callbackURL',
                    `${process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'}/auth/callback`,
                  );
                }
                await mailer.send({
                  to: email,
                  subject: 'Your Live Polling sign-in link',
                  text: `Sign in to Live Polling by opening: ${link.toString()}`,
                });
              },
            }),
          ],
        }),
        bodyParser: { json: { limit: '64kb' }, urlencoded: { limit: '64kb' } },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [VerifiedHostGuard],
})
export class AuthModule {}

function requiredAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be at least 32 characters');
  }
  return secret;
}

function configuredOrigins(): string[] {
  return (process.env.FRONTEND_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function connectRedis(redis: Redis) {
  if (redis.status === 'wait') await redis.connect();
}
