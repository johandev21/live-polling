import type Redis from 'ioredis';

export type PublishRejectionHandler = (error: unknown) => void;

/**
 * @socket.io/redis-adapter fires `pubClient.publish` without awaiting it. When
 * a Redis connection drops mid-broadcast the pending command promise rejects,
 * and an unhandled rejection would crash the process. This wrapper keeps the
 * adapter's fire-and-forget contract while ensuring rejections are observed.
 */
export function guardPublishRejections(
  client: Redis,
  onRejected?: PublishRejectionHandler,
): void {
  const publish = client.publish.bind(client);
  client.publish = ((...args: unknown[]) => {
    const result = publish(...args);
    if (result instanceof Promise) {
      result.catch((error: unknown) => onRejected?.(error));
    }
    return result;
  }) as typeof client.publish;
}
