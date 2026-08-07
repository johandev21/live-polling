# Backend MVP: Live Polling Platform

## Problem Statement

The static frontend screens exist, but the application has no backend domain, persistence, authentication, API, or realtime behavior behind them. Hosts need a reliable server-authoritative backend that lets them create and run private live sessions, while participants need to join without an account and submit responses from a browser or mobile device.

The current backend is a NestJS starter with only the default healthless greeting endpoint and starter Jest/Supertest tests. The backend must be built as the durable foundation that the existing frontend will consume later.

## Solution

Build the backend MVP as a single NestJS service in the existing monorepo. Organize the backend by feature/domain modules and expose:

- REST endpoints for host authentication, session and poll commands, participant joining, response submission, and authoritative snapshots.
- Socket.io for committed session state-change notifications and approximate presence.
- PostgreSQL with Drizzle ORM as the durable source of truth.
- Redis for presence, Socket.io cross-instance pub/sub, and rate limiting only.
- Better Auth for host magic-link authentication and authenticated host sessions.
- Zod schemas shared by backend contracts and the future frontend integration.
- Docker Compose support for local PostgreSQL, Redis, and mail capture.
- Vitest as the backend test runner, with Supertest and Socket.io clients at the application boundary.

The core reliability rule is: persist accepted lifecycle changes and responses in PostgreSQL transactions first, then broadcast realtime updates. A failed broadcast must not make an accepted response disappear. Clients recover by fetching the authoritative session snapshot after reconnects or revision gaps.

## User Stories

### Host Authentication

1. As a host, I want to request a magic link with my email address, so that I can authenticate without managing a password.
2. As a host, I want a magic link to be single-use and short-lived, so that leaked links have limited value.
3. As a host, I want to receive a clear error when a magic link is invalid or expired, so that I know how to request another one.
4. As a host, I want my email to be verified before I create a session, so that host ownership is tied to a confirmed email address.
5. As a host, I want an authenticated session after consuming a valid magic link, so that subsequent host requests are authorized.
6. As a host, I want account recovery to use email ownership, so that no separate password-recovery system is needed.
7. As a host, I want rate limits on magic-link requests, so that my account and the mailer cannot be abused.
8. As the system, I want authentication tokens and magic-link values excluded from logs and API responses, so that credentials are not exposed.

### Host Session Management

9. As a host, I want to create a named draft session, so that I can prepare a live event before participants arrive.
10. As a host, I want to list only my own sessions, so that private sessions are not publicly discoverable.
11. As a host, I want to retrieve a complete session snapshot, so that the dashboard can render the current session state from the server.
12. As a host, I want to update a draft session name, so that the session is recognizable in my dashboard.
13. As a host, I want a session to receive a short human-friendly room code, so that I can share it verbally or on a slide.
14. As a host, I want an invitation link derived from the room code, so that participants can join directly.
15. As a host, I want a session to require at least one poll before starting, so that participants do not enter an unusable session.
16. As a host, I want to start a draft session, so that participants can join it.
17. As a host, I want to end a live session permanently, so that no further responses can be submitted.
18. As a host, I want to delete a session after explicit confirmation, so that I can remove unwanted session data.
19. As a host, I want deletion to invalidate the room code and participant access immediately, so that deleted sessions cannot continue accepting activity.
20. As a host, I want ended sessions to remain readable, so that I can review their complete history.
21. As the system, I want to reject invalid lifecycle transitions, so that a session cannot move backward or reopen after ending.

### Host Poll Management

22. As a host, I want to add a single-choice poll, so that participants can select exactly one option.
23. As a host, I want to add a multiple-choice poll, so that participants can select several options.
24. As a host, I want to add an open-ended poll, so that participants can submit free-form text.
25. As a host, I want poll text limited to 500 characters, so that the live experience remains readable.
26. As a host, I want choice polls to require between 2 and 10 unique non-empty options, so that invalid polls cannot be published.
27. As a host, I want to configure an optional maximum selection count for multiple-choice polls, so that I can constrain responses when needed.
28. As a host, I want to edit polls before they receive responses, so that I can correct preparation mistakes.
29. As a host, I want answered polls to become immutable, so that existing results are not silently changed.
30. As a host, I want to delete polls before they receive responses, so that I can remove preparation mistakes.
31. As a host, I want answered polls protected from deletion, so that result history remains trustworthy.
32. As a host, I want to reorder polls while preparing a draft, so that the presentation follows the intended sequence.
33. As a host, I want to open any poll during a live session, including an earlier poll, so that I can revisit content during a presentation.
34. As a host, I want opening one poll to close the previous active poll, so that exactly one poll accepts responses.
35. As a host, I want to close the active poll, so that I can stop responses without ending the session.
36. As a host, I want to reveal or hide results independently of opening and closing a poll, so that I control when participants see aggregates.
37. As a host, I want to reveal an empty poll, so that participants can see that results currently contain zero responses.
38. As a host, I want to view open-ended responses as a chronological list, so that I can read participant text without automatic interpretation.

### Participant Joining

39. As a participant, I want to join with a room code, so that I can participate without an account.
40. As a participant, I want an invitation link to take me directly to the join flow, so that I do not need to type a code.
41. As a participant, I want room-code matching to be case-insensitive, so that capitalization does not prevent joining.
42. As a participant, I want to provide a display name, so that the host can distinguish connected participants.
43. As a participant, I want to join without creating an account, so that I can participate immediately.
44. As a participant, I want duplicate display names to be allowed, so that names are not mistaken for verified identity.
45. As a returning participant, I want my browser identity restored for the same session, so that I do not repeat the join flow unnecessarily.
46. As a participant, I want a separate identity on another device or browser, so that the system does not claim cross-device identity it cannot verify.
47. As a participant, I want draft sessions to reject joining, so that I cannot enter a session before the host starts it.
48. As a participant, I want ended sessions to reject joining, so that no new activity begins after the host ends the session.
49. As a participant, I want a scoped and revocable participant token, so that my access is limited to the session I joined.
50. As the system, I want to rate-limit joining and identity updates, so that room codes cannot be abused for uncontrolled connection attempts.

### Participant Responses

51. As a participant, I want to receive the current active poll after joining, so that I can respond without manually refreshing.
52. As a participant, I want a waiting state when no poll is active, so that I understand the session is functioning but awaiting the host.
53. As a participant, I want to submit exactly one effective response per poll, so that duplicate requests do not inflate results.
54. As a participant, I want to replace my response while a poll is open, so that I can correct my answer.
55. As a participant, I want the replacement to update aggregates atomically, so that results never count both the old and new response.
56. As a participant, I want single-choice responses validated as exactly one option, so that malformed requests cannot be accepted.
57. As a participant, I want multiple-choice responses validated against the poll options and selection limit, so that invalid selections are rejected.
58. As a participant, I want open-ended responses trimmed and limited to 500 characters, so that the server accepts only valid text.
59. As a participant, I want submissions after poll close rejected, so that the host's close action is authoritative.
60. As a participant, I want a response to remain accepted if I disconnect after the server commits it, so that network presence does not determine data retention.
61. As a participant, I want retries to be idempotent, so that a temporary network failure does not create duplicate responses.
62. As the system, I want accepted responses stored in PostgreSQL before realtime broadcast, so that no accepted response is lost when a notification fails.
63. As the system, I want response submission protected by session and network rate limits, so that automated abuse cannot overwhelm a live poll.

### Results And Visibility

64. As a host, I want aggregate counts and percentages for choice polls, so that I can understand responses live.
65. As a host, I want open-ended response text and total count, so that I can review qualitative feedback.
66. As a host, I want full results after a session ends, including results never revealed to participants, so that the session history is complete.
67. As a participant, I want to see aggregate results only when the host reveals them, so that the host controls the presentation.
68. As a participant, I want results to remain visible only while they are revealed, so that hiding results takes effect immediately.
69. As a participant, I want counts and percentages without participant names, so that results protect participant privacy.
70. As a participant, I want multiple-choice result percentages explained as potentially exceeding 100%, so that the aggregate is not misleading.
71. As the system, I want result calculation derived from durable effective responses, so that aggregates remain correct after replacements and reconnects.

### Realtime And Presence

72. As a host, I want live session changes broadcast to connected clients, so that I can run a presentation without manual refreshes.
73. As a participant, I want an opened poll to appear automatically, so that I can respond as soon as the host starts it.
74. As a participant, I want a closed poll to stop accepting responses immediately, so that stale browser state cannot bypass the host's control.
75. As a host, I want an approximate participant count, so that I can understand current reach.
76. As a host, I want participant display names and online/offline presence, so that I can monitor connection activity.
77. As the system, I want presence stored in Redis rather than PostgreSQL, so that ephemeral connection state does not become durable domain data.
78. As the system, I want Socket.io events coordinated through Redis across backend instances, so that all participants receive updates regardless of instance.
79. As a client, I want events tagged with a monotonically increasing session revision, so that stale events do not overwrite newer state.
80. As a client, I want to fetch an authoritative snapshot after reconnecting, so that missed events do not leave the UI permanently stale.
81. As a client, I want to resynchronize after a revision gap, so that out-of-order or missed notifications converge to server state.
82. As a host or participant, I want graceful reconnect behavior, so that an ordinary network interruption is recoverable without losing committed data.

### Reliability And Operations

83. As an operator, I want PostgreSQL health included in readiness checks, so that unhealthy instances are removed from traffic.
84. As an operator, I want Redis health included in readiness checks, so that realtime and rate-limit dependencies are visible.
85. As an operator, I want liveness checks separate from dependency readiness, so that process failure is distinguished from dependency failure.
86. As an operator, I want structured logs, so that request and realtime failures can be diagnosed.
87. As an operator, I want metrics for active sessions, accepted responses, errors, and dependency health, so that live reliability is measurable.
88. As an operator, I want response text, magic links, participant tokens, and raw IP addresses excluded from logs, so that telemetry does not leak private data.
89. As an operator, I want graceful shutdown, so that in-flight database work completes and clients receive retryable disconnects.
90. As an operator, I want explicit Drizzle migrations, so that production schema changes are reviewable and repeatable.
91. As an operator, I want Docker Compose dependencies for local development, so that backend behavior can be reproduced with PostgreSQL, Redis, and mail capture.
92. As an operator, I want Vitest coverage reporting, so that important backend behavior can be measured in CI.

## Implementation Decisions

### Current Repository Baseline

- Preserve the existing pnpm/Turborepo monorepo.
- Expand the existing NestJS backend rather than creating a second backend application.
- Replace the starter-only application behavior with feature modules and a minimal health/readiness surface.
- Replace the backend's Jest test configuration and scripts with Vitest-compatible configuration and scripts.
- Keep the future frontend integration contract independent of the current static screen implementation.

### Backend Module Boundaries

Organize by feature and domain responsibility, avoiding a single broad service:

- **Auth**: Better Auth integration, host authentication state, magic-link request/consumption, email verification, and host guards.
- **Hosts**: Authenticated host identity and ownership authorization.
- **Sessions**: Session creation, listing, snapshots, room codes, lifecycle transitions, deletion, and invitation-link data.
- **Polls**: Poll validation, creation, editing, deletion, ordering, open/close, and result visibility transitions.
- **Participants**: Join flow, session-local identity, participant token issuing/revocation, display-name changes, and authorization.
- **Responses**: Single effective response per participant/poll, replacement, idempotency, validation, and aggregate reads.
- **Realtime**: Socket.io gateway, scoped connection authentication, session rooms, revisioned events, resynchronization, and Redis adapter integration.
- **Presence**: Redis-backed heartbeats, online/offline expiry, and participant count.
- **Infrastructure**: PostgreSQL/Drizzle connection, Redis connection, configuration, mailer abstraction, logging, health checks, rate limiting, and migrations.
- **Contracts**: Zod schemas for REST inputs/outputs and Socket.io event payloads, shared with future frontend consumers.

Modules should depend on explicit repository/service interfaces rather than reaching into another module's persistence details. Keep domain transition and response rules testable without HTTP or Socket.io.

### Authentication And Authorization

- Use Better Auth for host magic-link authentication and authenticated host sessions.
- Host endpoints require an authenticated, verified host session.
- A host can access only sessions they own.
- Participant access uses a signed token scoped to one session-local identity and one session.
- Participant tokens are revocable when a session is deleted.
- Do not use room codes as socket credentials by themselves.
- Socket connections authenticate with the host session or participant token.
- Do not create participant accounts.
- Do not claim cross-device identity or strong anti-cheat guarantees.

### Session State

Persist the following concepts in PostgreSQL:

- Host/account ownership reference.
- Session name.
- Case-insensitive room code with uniqueness among active sessions.
- Session status: draft, live, ended.
- Session creation/update/end/delete timestamps.
- Session revision used for realtime convergence.
- Ordered polls and their lifecycle state.
- Participant session-local identity references needed to associate effective responses.
- Responses and idempotency keys.

Use server time for lifecycle and expiry decisions. Ended sessions cannot be reopened. Deleted sessions are removed immediately according to the agreed data-deletion behavior.

Room-code generation must be human-friendly, case-insensitive, collision-safe, and safe against accidental ambiguous characters. Retired codes may be reused only after a safety delay.

### Poll And Response Invariants

Enforce these rules in domain logic and persistence transactions, not only in request validation:

- A session must contain at least one poll before starting.
- A live session has at most one active poll.
- Opening a poll atomically closes any other active poll.
- A poll with effective responses cannot change text or options.
- A poll with effective responses cannot be deleted.
- Only an open poll accepts responses.
- A response belongs to one participant identity and one poll.
- A participant/poll pair has one effective response.
- Replacing a response updates the effective answer atomically.
- Multiple-choice selection count cannot exceed the configured maximum.
- Open-ended response text is trimmed, non-empty, and at most 500 characters.
- Result aggregates are derived from effective durable responses.

Use database constraints where appropriate for uniqueness and ownership relationships. Use PostgreSQL transactions for lifecycle transitions and response replacement.

### REST Contract

The exact route names may be chosen during implementation, but the API must provide these capabilities:

- Request and consume host magic links.
- Retrieve the authenticated host.
- Create, list, retrieve, update, start, end, and delete owned sessions.
- Create, retrieve, update, delete, reorder, open, close, reveal, and hide polls within owned sessions.
- Join a live session by room code or invitation-link data.
- Retrieve the participant's authoritative session snapshot.
- Update a participant display name.
- Submit or replace a response using an idempotency key.
- Retrieve host results and open-ended response text.
- Retrieve participant-permitted results.
- Retrieve health and readiness status.

All request bodies, query parameters, response bodies, and error payloads must be validated or serialized through Zod-backed contracts. Use consistent machine-readable error codes so the future frontend can distinguish invalid input, unauthorized access, closed polls, ended sessions, stale state, rate limiting, and transient dependency failure.

Use REST for commands and authoritative reads. Do not require the frontend to submit responses through Socket.io.

### Socket.io Contract

Socket.io is for notifications and presence, not the durable command path.

The gateway must support:

- Host or participant authentication during connection.
- Joining a session-scoped socket room after authorization.
- Presence heartbeat and disconnect handling.
- Notifications for session lifecycle changes.
- Notifications for poll creation, update, reorder, open, close, result reveal, and result hide.
- Notifications for accepted response changes and updated result aggregates.
- Notifications for participant-count/presence changes where appropriate.
- A typed session revision on each state-change notification.
- A resynchronization path that leads the client to fetch the authoritative snapshot.

Events should contain minimal typed deltas plus the revision needed for convergence. Do not send private participant data to other participants. Do not send host-only open-ended response details to participant sockets.

Persist first, then publish. If publish fails after commit, retain the accepted state and rely on retry/refetch mechanisms rather than rolling back the database transaction.

### Redis Responsibilities

Use Redis only for ephemeral or coordination concerns:

- Socket.io adapter/pub-sub across backend instances.
- Participant presence and heartbeat expiry.
- Approximate participant counts.
- Host and participant rate limits.
- Optional short-lived coordination needed for reconnect behavior.

PostgreSQL wins whenever Redis and PostgreSQL disagree about durable session, poll, or response state. Redis must be rebuildable without losing accepted domain data.

### Validation And Security

- Validate every external input with Zod-backed schemas.
- Apply authentication and ownership guards before domain operations.
- Sanitize response serialization so host-only and participant-only fields cannot cross boundaries.
- Enforce explicit CORS origins; do not use wildcard CORS with credentials.
- Enforce HTTP and Socket.io payload limits.
- Rate-limit magic-link requests, joins, identity updates, response submissions, and socket connection attempts.
- Do not log magic-link values, participant tokens, response text, or raw IP addresses.
- Use generic responses where revealing account or identity existence would enable abuse.
- Use server time for all expirations and lifecycle acceptance.

### Realtime Reliability Model

- PostgreSQL is authoritative for accepted state.
- Each session has a monotonically increasing revision.
- A committed state mutation advances the revision within the same transaction as the mutation.
- Realtime notification happens after commit.
- Clients ignore stale revisions and resync after a gap.
- Reconnecting clients fetch an authoritative snapshot before resuming normal live updates.
- A participant's accepted response survives disconnects and presence expiry.

### Operations And Deployment

- Provide Docker Compose services for PostgreSQL, Redis, and local email capture.
- The API and Socket.io gateway run in one deployable NestJS service.
- The frontend development server may run outside Docker for iteration speed.
- Use explicit Drizzle migrations during deployment; do not mutate production schema on application startup.
- Provide liveness and readiness checks.
- Readiness must include PostgreSQL, Redis, and required configuration.
- Add structured logs and metrics for request failures, active sessions, response acceptance, realtime errors, and dependency health.
- Support graceful shutdown: stop new work, finish in-flight transactions, signal socket reconnect, and allow clients to resync.
- Avoid prescribing a cloud provider; define container and environment contracts instead.

### Vitest Test Configuration

- Use Vitest as the backend test runner instead of Jest.
- Keep test files organized by behavior, with unit tests isolated from integration tests.
- Use Vitest's Node environment for backend tests.
- Configure a coverage provider and a coverage script for CI.
- Use NestJS testing utilities where they provide meaningful module wiring coverage.
- Use Supertest for HTTP boundary tests.
- Use a Socket.io client for realtime boundary tests.
- Use real PostgreSQL and Redis test services for the integration suite, preferably provisioned through Docker Compose or an equivalent test environment.
- Mock external mail delivery at the mailer boundary; use a local mail-capture service for development flows.
- Do not test private class methods or implementation details when an external behavior test can cover the rule.

## Testing Decisions

### Primary Test Seam

The highest seam is the running NestJS application boundary:

- Drive REST behavior with Supertest.
- Drive Socket.io behavior with a real Socket.io client.
- Run against PostgreSQL and Redis test services.
- Assert persisted outcomes, authorization, response payloads, status codes, emitted events, revisions, and reconnect convergence.

This seam matches the planned frontend integration and protects the server-authority contract without coupling tests to internal module structure.

### Unit Tests

Use focused Vitest unit tests for pure or mostly pure domain rules:

- Session lifecycle transition validity.
- Poll validation for all three poll types.
- Poll immutability/deletion rules after responses.
- One-active-poll transition behavior.
- Multiple-choice selection limits.
- Open-ended text normalization and length limits.
- Response replacement and result aggregation.
- Idempotency-key behavior.
- Room-code normalization and validation.
- Revision comparison and stale-event handling where logic is isolated.

### Integration Tests

Cover through HTTP and Socket.io:

- Host magic-link request and authentication flow with a mocked mailer.
- Host ownership and unauthorized access.
- Session create/list/start/end/delete behavior.
- Poll CRUD, ordering, immutability, opening, closing, revealing, and hiding.
- Participant join, duplicate names, token scope, token revocation, and display-name updates.
- Single-choice, multiple-choice, and open-ended response submission.
- Response replacement, close races, invalid payloads, and idempotent retries.
- Host-only result access and participant result visibility.
- Participant privacy boundaries.
- Presence heartbeat, disconnect expiry, and participant count behavior.
- Realtime event delivery after committed changes.
- Snapshot recovery after reconnect and revision gaps.
- Persistence when realtime publication fails.
- Rate limiting and payload bounds.
- Liveness/readiness dependency behavior.

### Concurrency And Failure Tests

Explicitly test:

- Two participants submitting at the same time.
- One participant retrying the same idempotency key.
- A response arriving while the host closes the poll.
- Two competing host requests opening different polls.
- A response transaction committing while realtime broadcast fails.
- Socket disconnect during and after response submission.
- Stale event arrival after a newer revision.
- Reconnect to a different backend instance when Redis Socket.io coordination is enabled.

Tests should assert the final authoritative state and externally observable events, not transaction implementation details.

### Existing Test Prior Art

The backend currently contains starter NestJS TestingModule and Supertest e2e tests. Replace the starter Jest configuration with Vitest while preserving the intent of the existing HTTP boundary coverage. The default greeting test should be removed or replaced by a meaningful health/readiness test.

## Out Of Scope

- Frontend implementation or frontend data hooks.
- Co-hosts, teams, ownership transfer, and shared sessions.
- Participant accounts or verified participant identity.
- Strong cross-device identity and anti-cheat guarantees.
- Public session discovery.
- Session passwords, approval queues, participant removal, and moderation workflows.
- Vote clearing.
- Word clouds, ratings, numeric scales, rich text, and advanced poll types.
- Automatic text clustering, summarization, or profanity filtering.
- CSV export UI, although the data model should not prevent future export.
- PowerPoint/Google Slides integrations.
- Billing, subscriptions, and SSO.
- Internationalization.
- Reopening ended sessions.
- Dedicated microservices for the API and realtime gateway.
- Redis as durable session or response storage.
- Redis backups as a requirement.
- Cloud-provider-specific deployment manifests.

## Further Notes

- The product glossary and server-authority decisions are recorded in `CONTEXT.md` and the accepted ADRs in `docs/adr/`.
- The backend should preserve the terms Host, Participant, Session, Room Code, Invitation Link, Poll, Response, Active Poll, Results, Waiting State, Presence, and Participant Count.
- The key invariant is that no accepted response is lost. Presence and socket connectivity are not evidence that a response was or was not retained.
- The first implementation should establish infrastructure, schema, contracts, and test harness early so feature modules can be built against durable seams.
- A successful backend milestone is reached when the static frontend could be connected without inventing missing domain behavior or relying on client-side authority.
