import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { Counter, Gauge, Registry } from 'prom-client';
import { HealthService } from '../../health/health.service';
import { SESSION_STATUSES } from '../../sessions/session.domain';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import * as schema from '../database/schema';

export type RealtimeFailureKind = 'publish' | 'presence' | 'connect';
export type RequestFailureStatusClass = '4xx' | '5xx';

@Injectable()
export class MetricsService {
  readonly registry = new Registry();
  readonly activeSessions: Gauge;
  readonly acceptedResponses: Counter;
  readonly requestFailures: Counter;
  readonly realtimeFailures: Counter;
  readonly dependencyHealth: Gauge;

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(HealthService) private readonly health: HealthService,
  ) {
    this.activeSessions = new Gauge({
      name: 'polling_active_sessions',
      help: 'Sessions currently in live status',
      registers: [this.registry],
    });
    this.acceptedResponses = new Counter({
      name: 'polling_accepted_responses_total',
      help: 'Responses accepted and persisted',
      registers: [this.registry],
    });
    this.requestFailures = new Counter({
      name: 'polling_request_failures_total',
      help: 'HTTP requests that finished with an error status',
      labelNames: ['status_class'] as const,
      registers: [this.registry],
    });
    this.realtimeFailures = new Counter({
      name: 'polling_realtime_failures_total',
      help: 'Realtime publish or presence operations that failed',
      labelNames: ['kind'] as const,
      registers: [this.registry],
    });
    this.dependencyHealth = new Gauge({
      name: 'polling_dependency_health',
      help: 'Dependency health where 1 is ok and 0 is error',
      labelNames: ['dependency'] as const,
      registers: [this.registry],
    });
  }

  async scrape(): Promise<{ contentType: string; body: string }> {
    await this.refreshLiveGauges();
    return {
      contentType: this.registry.contentType,
      body: await this.registry.metrics(),
    };
  }

  countAcceptedResponse(): void {
    this.acceptedResponses.inc();
  }

  countRequestFailure(statusClass: RequestFailureStatusClass): void {
    this.requestFailures.inc({ status_class: statusClass });
  }

  countRealtimeFailure(kind: RealtimeFailureKind): void {
    this.realtimeFailures.inc({ kind });
  }

  private async refreshLiveGauges(): Promise<void> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.sessions)
      .where(eq(schema.sessions.status, SESSION_STATUSES[1]));
    this.activeSessions.set(row?.count ?? 0);

    const dependencies = await this.health.dependencies();
    this.dependencyHealth.set(
      { dependency: 'postgres' },
      dependencies.checks.database === 'ok' ? 1 : 0,
    );
    this.dependencyHealth.set(
      { dependency: 'redis' },
      dependencies.checks.redis === 'ok' ? 1 : 0,
    );
  }
}
