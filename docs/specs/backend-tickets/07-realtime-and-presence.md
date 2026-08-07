## Parent

[#1 Build backend MVP for live polling platform](https://github.com/johandev21/live-polling/issues/1)

## What to build

Provide Socket.io session updates and Redis-backed presence so hosts and participants see committed live changes without refreshing, while reconnecting clients converge on PostgreSQL state.

## Acceptance criteria

- [ ] Host sockets authenticate with the host session.
- [ ] Participant sockets authenticate with a scoped participant token.
- [ ] Authorized sockets join only the appropriate session room.
- [ ] Session, poll, result, response, and participant-count changes emit typed notifications.
- [ ] Notifications include a monotonically increasing session revision.
- [ ] Events contain only data allowed for the recipient role.
- [ ] Presence heartbeats and disconnect expiry are stored in Redis.
- [ ] Hosts can receive approximate participant counts and participant presence changes.
- [ ] Redis Socket.io coordination works across multiple backend instances.
- [ ] Stale events do not roll state backward.
- [ ] Revision gaps lead clients to fetch an authoritative session snapshot.
- [ ] Reconnect behavior preserves accepted responses and converges to current state.
- [ ] A failed broadcast after a successful database commit does not roll back the response.
- [ ] Socket.io integration tests cover auth, room isolation, events, revisions, presence, reconnect, and publication failure.

## Blocked by

- #4 — Host session lifecycle
- #6 — Participant joining and session-local identity
- #7 — Durable responses and results
