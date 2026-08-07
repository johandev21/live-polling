## Parent

[#1 Build backend MVP for live polling platform](https://github.com/johandev21/live-polling/issues/1)

## What to build

Establish the runnable backend foundation for the Live Polling Platform. The NestJS service must connect to PostgreSQL and Redis, run explicit Drizzle migrations, expose health and readiness behavior, validate shared contracts with Zod, and run unit/integration tests with Vitest.

## Acceptance criteria

- [ ] The backend starts through the monorepo development and production commands.
- [ ] Docker Compose provides PostgreSQL, Redis, and a local mail-capture dependency.
- [ ] PostgreSQL schema management uses explicit Drizzle migrations.
- [ ] PostgreSQL and Redis connectivity are configured through environment variables.
- [ ] Liveness and readiness endpoints are available; readiness checks required dependencies.
- [ ] Zod contract infrastructure is available for backend request, response, and event schemas.
- [ ] Vitest replaces the starter Jest test runner for backend unit and integration tests.
- [ ] Supertest and a Socket.io client can be used by the integration test harness.
- [ ] A meaningful health/readiness test replaces the starter greeting e2e assertion.

## Blocked by

None — can start immediately.
