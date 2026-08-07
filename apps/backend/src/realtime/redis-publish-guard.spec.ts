import { describe, expect, it } from 'vitest';
import type Redis from 'ioredis';
import { guardPublishRejections } from './redis-publish-guard';

describe('guardPublishRejections', () => {
  it('observes a rejecting publish so the process cannot crash on it', async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (error: unknown) => {
      unhandled.push(error);
    };
    process.on('unhandledRejection', onUnhandled);
    try {
      const client = {
        publish: () => Promise.reject(new Error('redis down')),
      } as unknown as Redis;
      const rejected: unknown[] = [];
      guardPublishRejections(client, (error) => rejected.push(error));

      const result = client.publish('channel', 'message');
      expect(result).toBeInstanceOf(Promise);
      await new Promise((resolve) => setImmediate(resolve));
      await new Promise((resolve) => setImmediate(resolve));

      expect(rejected).toHaveLength(1);
      expect((rejected[0] as Error).message).toBe('redis down');
      expect(unhandled).toHaveLength(0);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('leaves resolved publishes untouched and does not notify', async () => {
    const client = {
      publish: () => Promise.resolve(1),
    } as unknown as Redis;
    const rejected: unknown[] = [];
    guardPublishRejections(client, (error) => rejected.push(error));

    await expect(client.publish('channel', 'message')).resolves.toBe(1);
    await new Promise((resolve) => setImmediate(resolve));
    expect(rejected).toHaveLength(0);
  });

  it('keeps the fire-and-forget publish contract for callers', async () => {
    const client = {
      publish: () => Promise.resolve(2),
    } as unknown as Redis;
    guardPublishRejections(client);

    const result = client.publish('channel', 'message');
    await expect(result).resolves.toBe(2);
  });
});
