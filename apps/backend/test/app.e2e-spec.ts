import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health/live (GET) reports process health', () => {
    return request(app.getHttpServer())
      .get('/health/live')
      .expect(200)
      .expect({ status: 'ok', service: 'backend' });
  });

  it('/health/ready (GET) reports dependency health', async () => {
    const response = await request(app.getHttpServer()).get('/health/ready');

    expect(response.body).toMatchObject({
      status: expect.stringMatching(/^(ok|error)$/),
      checks: {
        database: expect.stringMatching(/^(ok|error)$/),
        redis: expect.stringMatching(/^(ok|error)$/),
      },
    });
    expect(response.status).toBe(response.body.status === 'ok' ? 200 : 503);
  });

  it('/auth/me (GET) rejects unauthenticated hosts', () => {
    return request(app.getHttpServer())
      .get('/auth/me')
      .expect(401)
      .expect((response) => {
        expect(response.body).toMatchObject({
          statusCode: 401,
          message: expect.any(String),
        });
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
