# Server-Authoritative Live State

PostgreSQL is the durable source of truth for session lifecycle, polls, and responses; Redis is limited to presence, pub/sub, and rate limits. Commands commit in a PostgreSQL transaction before realtime notifications are broadcast, so a failed broadcast cannot lose an accepted response and reconnecting clients can converge by fetching an authoritative snapshot.

## Considered Options

- Redis-first active-session state was rejected because it makes durability and recovery harder.
- Client-optimistic state was rejected because connection status and browser state must not determine valid polling outcomes.

## Consequences

Realtime events carry typed deltas and a monotonically increasing session revision. Clients use revisions to detect gaps, refetch snapshots after reconnects, and ignore stale events.
