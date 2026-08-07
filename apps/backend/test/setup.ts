import 'reflect-metadata';

process.env.DATABASE_URL ??=
  'postgresql://polling:polling@localhost:5433/polling';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.BETTER_AUTH_URL ??= 'http://localhost:3000';
process.env.BETTER_AUTH_SECRET ??= 'test-secret-with-at-least-32-characters';
