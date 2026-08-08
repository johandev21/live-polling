import {
  Inject,
  Injectable,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import Redis from 'ioredis';
import { RateLimitModule } from '../infrastructure/rate-limit/rate-limit.module';
import { MetricsService } from '../infrastructure/metrics/metrics.service';
import { ParticipantTokenService } from '../participants/participant-token.service';
import { PresenceService } from './presence.service';
import { guardPublishRejections } from './redis-publish-guard';
import { RealtimeService } from './realtime.service';
import { SOCKET_ADAPTER } from './session.gateway';
import type { SocketAdapter } from './session.gateway';
import { SessionGateway } from './session.gateway';

export const SOCKET_ADAPTER_CLIENTS = Symbol('SOCKET_ADAPTER_CLIENTS');

type SocketAdapterClients = {
  pubClient: Redis;
  subClient: Redis;
};

@Injectable()
class SocketAdapterShutdown implements OnApplicationShutdown {
  constructor(
    @Inject(SOCKET_ADAPTER_CLIENTS)
    private readonly clients: SocketAdapterClients,
  ) {}

  async onApplicationShutdown() {
    const settle = () =>
      new Promise<void>((resolve) => setTimeout(resolve, 100));
    await settle();
    this.clients.subClient.disconnect(false);
    this.clients.pubClient.disconnect(false);
  }
}

@Module({
  imports: [BetterAuthModule, RateLimitModule],
  providers: [
    SessionGateway,
    PresenceService,
    RealtimeService,
    ParticipantTokenService,
    {
      provide: SOCKET_ADAPTER_CLIENTS,
      inject: [MetricsService],
      useFactory: (metrics: MetricsService): SocketAdapterClients => {
        const url =
          process.env.REDIS_URL ??
          (() => {
            throw new Error('REDIS_URL is required');
          })();
        const pubClient = new Redis(url, {
          retryStrategy: () => null,
        }).on('error', () => undefined);
        guardPublishRejections(pubClient, () => {
          metrics.countRealtimeFailure('publish');
          new Logger('Realtime').warn(
            'redis publish rejected during realtime broadcast',
          );
        });
        const subClient = pubClient.duplicate().on('error', () => undefined);
        return { pubClient, subClient };
      },
    },
    {
      provide: SOCKET_ADAPTER,
      inject: [SOCKET_ADAPTER_CLIENTS],
      useFactory: (clients: SocketAdapterClients): SocketAdapter =>
        createAdapter(clients.pubClient, clients.subClient),
    },
    SocketAdapterShutdown,
  ],
  exports: [RealtimeService, PresenceService],
})
export class RealtimeModule {}
