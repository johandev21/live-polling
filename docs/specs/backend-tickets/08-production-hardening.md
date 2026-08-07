## Parent

[#1 Build backend MVP for live polling platform](https://github.com/johandev21/live-polling/issues/1)

## What to build

Make the backend safe to operate as a production service by adding explicit security boundaries, abuse controls, observability, dependency health, and graceful shutdown behavior.

## Acceptance criteria

- [ ] CORS allows only explicitly configured frontend origins.
- [ ] HTTP and Socket.io payload sizes are bounded.
- [ ] Magic-link, join, identity-update, response, and socket-connection actions are rate-limited.
- [ ] All external inputs are validated through Zod-backed contracts.
- [ ] Authentication and ownership guards run before domain operations.
- [ ] Host-only and participant-only response fields are sanitized at serialization boundaries.
- [ ] Sensitive tokens, response text, and raw IP addresses are excluded from logs.
- [ ] Structured logs include enough correlation data for diagnosis without exposing private data.
- [ ] Metrics cover active sessions, accepted responses, request failures, realtime failures, and dependency health.
- [ ] Liveness and readiness behavior distinguishes process health from dependency health.
- [ ] Graceful shutdown stops new work, finishes in-flight transactions, and signals socket reconnect.
- [ ] Configuration is environment-driven and fails clearly when required values are missing.
- [ ] Operational behavior is covered by Vitest integration tests where externally observable.

## Blocked by

- #2 — Backend foundation, persistence, and Vitest harness
- #3 — Host magic-link authentication
- #4 — Host session lifecycle
- #5 — Poll authoring and lifecycle
- #6 — Participant joining and session-local identity
- #7 — Durable responses and results
- #8 — Realtime session updates and presence
