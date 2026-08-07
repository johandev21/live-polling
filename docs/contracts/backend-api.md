# Backend API Contract for the Frontend

**Status:** verified end-to-end by `apps/backend/test/journey.e2e-spec.ts` and the per-feature e2e suites.

This document describes how the frontend integrates with the backend **without inventing domain behavior**. It documents flows, lifecycle, error codes, and the realtime model. The machine-readable source of truth is the Zod schemas in `apps/backend/src/contracts/` — every request body, response body, and socket event payload in this document is validated through those schemas:

| Contract file | Contents |
| --- | --- |
| `session.contract.ts` | Host session snapshots, list/create/update/delete request schemas, invitation link |
| `poll.contract.ts` | Poll create/update/reorder requests, host poll snapshots |
| `participant.contract.ts` | Join request/response, participant session snapshot, display-name update |
| `response.contract.ts` | Submit-response request, response snapshot, host and participant results |
| `events.contract.ts` | `REALTIME_EVENTS` names and every socket event payload |
| `errors.contract.ts` | `ERROR_CODES` — the machine-readable error vocabulary |
| `health.contract.ts` | Liveness/readiness payloads |

Domain vocabulary follows `CONTEXT.md`: Host, Participant, Session, Room Code, Invitation Link, Poll, Response, Active Poll, Results, Waiting State, Presence, Participant Count.

## Architecture rules the frontend must assume

- **Server authority.** Persisted server state, not browser state or connection status, determines valid Sessions, Polls, Responses, and Results. The frontend renders the last server-confirmed state; commands are never applied optimistically as if accepted.
- **REST for commands and authoritative reads, Socket.io only for notifications and presence.** Never submit a Response through the socket.
- **An accepted Response survives disconnects.** Presence and connection status say nothing about whether a Response was retained; after reconnecting, fetch the authoritative snapshot and reconcile.
- **One effective Response per Participant per Poll.** Retries are idempotent via `idempotencyKey`; a replace-and-resubmit updates the same Response row.
- **At most one Active Poll per live Session.** Opening a Poll closes the previous Active Poll atomically.
- **Results are host-controlled.** Participants see Results only while the host has revealed them, and only as counts/percentages — never names or open-ended text.

## Host authentication (Better Auth magic link)

Better Auth serves `/api/auth/*` on the same origin as the API.

1. `POST /api/auth/sign-in/magic-link` with `{ email }` → the mailer (or Mailpit in dev) receives a single-use link. The frontend shows a confirmation state (`/host/magic-link`).
2. The link is consumed by `GET` on the URL (302 to the app). The frontend receives a session cookie (`better-auth.session_token`) which must be sent on all subsequent host requests.
3. `GET /api/auth/session` (Better Auth standard) → the authenticated host; a `null` session means not signed in.
4. The backend redirects after consuming the link; the frontend maps the result to its confirmation state (`/host/magic-link`) or an invalid-link recovery state (`/host/magic-link/invalid`). The backend does not signal which one — the frontend derives it from the callback flow.

Host requests use the session cookie. Requests without a valid host session are rejected with `UNAUTHORIZED`; an unverified email is rejected with `HOST_EMAIL_NOT_VERIFIED`.

## Host REST contract

Base: API origin. All bodies are JSON. Error responses have shape `{ code, message? }` with `code` from `ERROR_CODES` (`errors.contract.ts`).

### Sessions

| Operation | Endpoint | Notes |
| --- | --- | --- |
| Create Session | `POST /sessions` `{ name }` | 201; Session starts as a Draft Session with `revision: 1` and a Room Code |
| List my Sessions | `GET /sessions` | `{ sessions: SessionSnapshot[] }` |
| Retrieve Session | `GET /sessions/:id` | Complete host snapshot |
| Rename Session | `PATCH /sessions/:id` `{ name }` | Draft or Live only |
| Start Session | `POST /sessions/:id/start` | Draft → Live; 409 `NO_POLLS` if no Polls |
| End Session | `POST /sessions/:id/end` | Live → Ended, permanently |
| Delete Session | `DELETE /sessions/:id` `{ confirm: true }` | 204; 400 `CONFIRMATION_REQUIRED` without `confirm` |
| Invitation Link | `GET /sessions/:id/invitation` | `{ roomCode, url }`; the `url` is `FRONTEND_ORIGIN/join/:roomCode` |

`SessionSnapshot` (`session.contract.ts`): `id, name, roomCode, status (draft|live|ended), revision, createdAt, updatedAt, startedAt, endedAt`.

### Polls (within `sessions/:sessionId/polls`)

| Operation | Endpoint | Notes |
| --- | --- | --- |
| Create Poll | `POST` `{ type, text, options?, maxSelections? }` | 201; `type` is `single_choice` \| `multiple_choice` \| `open_ended` |
| List Polls | `GET` | Ordered by `position` |
| Retrieve Poll | `GET /:pollId` | |
| Update Poll | `PATCH /:pollId` `{ text, options?, maxSelections? }` | 409 `POLL_LOCKED` once the Poll `hasResponses` |
| Delete Poll | `DELETE /:pollId` | 204; 409 `POLL_LOCKED` once answered |
| Reorder Polls | `POST /reorder` `{ pollIds }` | Draft only; 400 `INVALID_INPUT` unless the list is a permutation of all Polls |
| Open Poll | `POST /:pollId/open` | Live only; atomically closes the previous Active Poll; 409 `INVALID_TRANSITION` if already open |
| Close Poll | `POST /:pollId/close` | Live only; no further Responses accepted |
| Reveal Results | `POST /:pollId/reveal` | Participants may now fetch Results |
| Hide Results | `POST /:pollId/hide` | Participants re-blocked |

Poll snapshot (`poll.contract.ts`): `id, sessionId, text, type, position, maxSelections, isOpen, resultsRevealed, hasResponses, options[{ id, text, position }], createdAt, updatedAt`.

### Host Results

`GET /sessions/:sessionId/polls/:pollId/results` → `hostResultsSchema` (`response.contract.ts`):

- Choice Polls: `{ pollId, total, counts: [{ optionId, text, count, percentage }], responses: [] }`. For `multiple_choice`, `percentage` can exceed 100.
- Open-Ended Polls: `{ pollId, total, counts: [], responses: [{ id, text, createdAt }] }` in chronological order.

Host Results remain available after the Session ends. They are scoped to the owning Host; another Host gets `SESSION_NOT_FOUND`.

## Participant REST contract

### Join

`POST /join` with either a Room Code or an Invitation Link (at least one required), plus a display name and an optional existing participant token:

```json
{ "roomCode": "7K4P9D", "displayName": "Ada" }
```

- 201 → `joinResponseSchema`: `{ token, participant, snapshot }`. The `token` is the scoped bearer token for all participant calls; the frontend should persist it (e.g. localStorage) per Session — it is the Session-Local Identity.
- `POST /join` with the same `token` restores the same identity (browser identity restoration). A new device without a token gets a new identity even in the same Session.
- Room Code matching is case-insensitive. Draft Sessions → 409 `SESSION_DRAFT`; Ended Sessions → 409 `SESSION_ENDED`; unknown → 404 `SESSION_NOT_FOUND`. Joining is rate-limited (`RATE_LIMITED`, 429).

### Participant snapshot (authoritative)

`GET /participant/session` with `Authorization: Bearer <token>` → `participantSessionSnapshotSchema`: `{ session: { id, name, status, revision, startedAt, endedAt }, polls: [participantPollSnapshotSchema] }`.

- `participantPollSnapshotSchema` excludes `sessionId`, `hasResponses`, and host-only fields.
- When no Poll has `isOpen: true`, the participant view is the Waiting State.
- Fetch this snapshot on every load and after every socket reconnect.

### Display name

`PATCH /participant/me` `{ displayName }` → updated Participant snapshot. Duplicate names are allowed.

### Responses

`PUT /participant/polls/:pollId/response` with `Authorization: Bearer <token>`:

```json
{ "idempotencyKey": "client-generated-unique-per-attempt", "optionIds": ["..."], "text": "..." }
```

- Single-Choice: exactly one `optionId`. Multiple-Choice: 1..`maxSelections` option ids. Open-Ended: `text` only, trimmed, ≤ 500 chars.
- 200 → `responseSnapshotSchema` (`id, pollId, participantId, optionIds, text, createdAt, updatedAt`). The same Participant/Poll always resolves to the same `id` (replacement) and the same `idempotencyKey` is a no-op retry returning the same `id`.
- Errors: 400/409 `INVALID_INPUT` (malformed selection/text), 409 `CLOSED_POLL` (Poll closed or never opened), 409 `SESSION_ENDED`, 404 `POLL_NOT_FOUND` (foreign poll), 429 `RATE_LIMITED`.
- **Retry strategy:** a failed network request can be retried with the same `idempotencyKey`; it will never double-count.

### Participant Results

`GET /participant/polls/:pollId/results` → `participantResultsSchema`: `{ pollId, total, counts: [{ optionId, count, percentage }] }`.

- 403 `RESULTS_NOT_REVEALED` until the host reveals; re-403 after a hide.
- Counts only — no names, no open-ended text.

## Realtime (Socket.io)

Connect to the API origin with Socket.io. Authenticate during connection:

- **Host:** `auth: { role: 'host', sessionId }` plus the host session cookie. Rejected sockets receive `{ code: 'UNAUTHORIZED' }` on `REALTIME_EVENTS.AUTH_ERROR`.
- **Participant:** `auth: { role: 'participant', token }`.

Connection policy: `reconnection: true`; after each (re)connect, wait for `REALTIME_EVENTS.RESYNC_REQUESTED` `{ sessionId, revision }`, then `GET /participant/session` (or the host session snapshot) and reconcile — the snapshot is authoritative and revision-gated.

### Event model

Every state-change event carries `{ sessionId, revision }` (revision is the Session revision, monotonically increasing per committed mutation). `revision` is for convergence: ignore events older than the last seen revision; on a gap, resync from the snapshot.

Event names (`events.contract.ts` → `REALTIME_EVENTS`):

| Event | Payload notes |
| --- | --- |
| `session.updated` | host: full `session`; participant: `session` without `roomCode` |
| `session.deleted` | `{ sessionId, revision }`; participant identity and room code are invalidated |
| `poll.created` / `poll.updated` | host: full host poll snapshot; participant: `participantPollSnapshot` |
| `poll.deleted` | `{ sessionId, revision, pollId }` |
| `poll.reordered` | `{ sessionId, revision, pollIds }` |
| `poll.opened` / `poll.closed` | poll snapshot (participant payload excludes host-only fields) |
| `results.revealed` / `results.hidden` | `{ sessionId, revision, pollId }` |
| `response.accepted` | `{ sessionId, revision, pollId, results }`; host gets `hostResults`; participant gets `participantResults` **or `null` when not revealed** |
| `presence.updated` | host: `{ count, participants: [{ participantId, displayName }] }`; participant: `{ count }` only |
| `resync.requested` | `{ sessionId, revision }` — fetch the snapshot |
| `auth.error` | `{ code }` |

Privacy boundaries the frontend can rely on: participant sockets never receive open-ended text, other participants' names, `hasResponses`, `sessionId`, or host results. Presence `count` is an **approximate Participant Count** (Redis TTL-driven) — it is not evidence about Responses.

### Presence

Participants send `presence.heartbeat` periodically (host UI does not need it). The host receives `presence.updated` with `count` and the current participant list. Presence is per-participant, not per-tab; count is approximate and self-healing.

### Reliability expectations

- Committed mutations are persisted in PostgreSQL **before** broadcast. If the socket is disconnected at that moment, the client learns the change from the next snapshot fetch or resync — never by assuming a missed event did not happen.
- If Redis coordination is active, events still arrive on any backend instance via the Redis adapter.

## Screen-to-contract map

| Frontend route/page | Backend surface |
| --- | --- |
| `/host/email`, `/host/magic-link`, `/host/magic-link/invalid` | Better Auth magic-link flow |
| `/host/dashboard` | `GET /sessions`, `GET /api/auth/session` |
| `/host/sessions/new` | `POST /sessions` |
| `/host/sessions/:slug` (editor) | `GET /sessions/:id`, `PATCH /sessions/:id`, poll CRUD + `POST reorder`, `POST start` (via `NO_POLLS` handling) |
| `/host/sessions/:slug/polls/new` | `POST /sessions/:id/polls` |
| `/host/sessions/:slug/polls/locked` | `GET /sessions/:id/polls/:pollId` (read-only, `POLL_LOCKED` semantics) |
| `/host/sessions/:slug/live` (live session page) | `GET /sessions/:id/invitation`, poll open/close/reveal/hide, `GET .../results`, socket (host role), `POST /sessions/:id/end` |
| `/host/sessions/:slug/results` | `GET /sessions/:id/polls/:pollId/results` per poll |
| `/host/sessions/:slug/history` | Read-only `GET /sessions/:id` + results after End |
| `/join`, `/join/invitation`, `/join/:roomCode`, `/join/name` | `POST /join` (Room Code or `invitationUrl`) |
| `/session/:slug` (participant) | `POST /join` → `GET /participant/session`, `PUT /participant/polls/:id/response`, `GET /participant/polls/:id/results`, `PATCH /participant/me`, socket (participant role) |

## Error code reference

From `ERROR_CODES` in `apps/backend/src/contracts/errors.contract.ts`:

| Code | Meaning | Common status |
| --- | --- | --- |
| `INVALID_INPUT` | Zod/domain validation failed | 400 or 409 |
| `UNAUTHORIZED` | Missing/invalid host or participant credentials | 401 |
| `HOST_EMAIL_NOT_VERIFIED` | Host has not verified their email | 401 |
| `SESSION_NOT_FOUND` | Session does not exist or is not owned by the Host / joined by the Participant | 404 |
| `SESSION_DRAFT` | Joining a Draft Session | 409 |
| `SESSION_ENDED` | Response/join after End | 409 |
| `POLL_NOT_FOUND` | Poll not in the Session (or not owned) | 404 |
| `POLL_LOCKED` | Edit/delete of an answered Poll | 409 |
| `CLOSED_POLL` | Response to a Poll that is not open | 409 |
| `RESULTS_NOT_REVEALED` | Participant Results fetch while hidden | 403 |
| `INVALID_TRANSITION` | Illegal lifecycle transition (e.g. open an already-open Poll, start an Ended Session) | 409 |
| `CONFIRMATION_REQUIRED` | `DELETE /sessions/:id` without `confirm` | 400 |
| `NO_POLLS` | Start with zero Polls | 409 |
| `RATE_LIMITED` | Per-client or per-network limit | 429 |

The frontend should branch on `code`, not on HTTP status or message text, and must treat unknown codes as transient failures that a snapshot resync resolves.

## Verification

`pnpm run test` in `apps/backend` runs the full e2e suite against Docker Compose PostgreSQL (port 5433) and Redis. `pnpm run test:cov` adds v8 coverage and enforces the configured thresholds in `vitest.config.ts` (exit code 1 below the floor), so CI can run it as a repeatable coverage gate. `test/journey.e2e-spec.ts` drives the complete host and participant journey plus the concurrency and race scenarios that pin the final authoritative state.
