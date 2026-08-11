import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../infrastructure/redis/redis.constants';

export const PRESENCE_HEARTBEAT_EVENT = 'presence.heartbeat';

export type PresenceMember = {
  participantId: string;
  displayName: string;
};

@Injectable()
export class PresenceService {
  private readonly ttlSeconds: number;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    const ttl = Number(process.env.PRESENCE_TTL_SECONDS ?? 30);
    if (!Number.isFinite(ttl) || ttl < 1) {
      throw new Error('PRESENCE_TTL_SECONDS must be a positive number');
    }
    this.ttlSeconds = ttl;
  }

  async attach(
    sessionId: string,
    participantId: string,
    displayName: string,
  ): Promise<number> {
    await this.ensureConnected();
    await this.redis
      .multi()
      .sadd(this.membersKey(sessionId), participantId)
      .hset(this.namesKey(sessionId), participantId, displayName)
      .expire(this.membersKey(sessionId), this.ttlSeconds)
      .expire(this.namesKey(sessionId), this.ttlSeconds)
      .exec();
    return this.count(sessionId);
  }

  async heartbeat(sessionId: string, participantId: string): Promise<number> {
    await this.ensureConnected();
    await this.redis
      .multi()
      .sadd(this.membersKey(sessionId), participantId)
      .expire(this.membersKey(sessionId), this.ttlSeconds)
      .expire(this.namesKey(sessionId), this.ttlSeconds)
      .exec();
    return this.count(sessionId);
  }

  async detach(sessionId: string, participantId: string): Promise<number> {
    await this.ensureConnected();
    await this.redis
      .multi()
      .srem(this.membersKey(sessionId), participantId)
      .hdel(this.namesKey(sessionId), participantId)
      .exec();
    return this.count(sessionId);
  }

  async rename(
    sessionId: string,
    participantId: string,
    displayName: string,
  ): Promise<void> {
    await this.ensureConnected();
    const connected = await this.redis.sismember(
      this.membersKey(sessionId),
      participantId,
    );
    if (!connected) return;
    await this.redis
      .multi()
      .hset(this.namesKey(sessionId), participantId, displayName)
      .expire(this.membersKey(sessionId), this.ttlSeconds)
      .expire(this.namesKey(sessionId), this.ttlSeconds)
      .exec();
  }

  async count(sessionId: string): Promise<number> {
    await this.ensureConnected();
    return this.redis.scard(this.membersKey(sessionId));
  }

  async members(sessionId: string): Promise<PresenceMember[]> {
    await this.ensureConnected();
    const names = await this.redis.hgetall(this.namesKey(sessionId));
    return Object.entries(names).map(([participantId, displayName]) => ({
      participantId,
      displayName,
    }));
  }

  private async ensureConnected() {
    if (
      this.redis.status === 'wait' ||
      this.redis.status === 'close' ||
      this.redis.status === 'end'
    ) {
      await this.redis.connect().catch(() => undefined);
    }
  }

  private membersKey(sessionId: string): string {
    return `presence:session:${sessionId}`;
  }

  private namesKey(sessionId: string): string {
    return `presence:session:${sessionId}:names`;
  }
}
