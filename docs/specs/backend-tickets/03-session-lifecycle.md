## Parent

[#1 Build backend MVP for live polling platform](https://github.com/johandev21/live-polling/issues/1)

## What to build

Allow an authenticated host to create and manage private sessions through the complete draft, live, ended, and deleted lifecycle.

## Acceptance criteria

- [ ] A verified host can create a named draft session.
- [ ] A host can list and retrieve only sessions they own.
- [ ] Each session has a case-insensitive, human-friendly room code.
- [ ] Invitation-link data can be derived from a session's room code.
- [ ] A session cannot start without at least one poll.
- [ ] A draft session can transition to live.
- [ ] A live session can transition to ended.
- [ ] Ended sessions cannot be reopened or changed through live controls.
- [ ] A host can update a draft session name.
- [ ] A host can delete a session after explicit confirmation from the caller.
- [ ] Deleted sessions invalidate room-code access and participant access.
- [ ] Invalid transitions and cross-host access return machine-readable errors.
- [ ] Session snapshots include server-authoritative state and a session revision.
- [ ] Lifecycle mutations are persisted transactionally.
- [ ] Vitest HTTP integration tests cover ownership and all lifecycle transitions.

## Blocked by

- #2 — Backend foundation, persistence, and Vitest harness
- #3 — Host magic-link authentication
