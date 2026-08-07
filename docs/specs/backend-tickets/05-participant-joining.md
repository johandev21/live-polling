## Parent

[#1 Build backend MVP for live polling platform](https://github.com/johandev21/live-polling/issues/1)

## What to build

Allow participants to join live sessions by room code or invitation-link data without creating accounts, establish a scoped session-local identity, and retrieve a participant-safe session snapshot.

## Acceptance criteria

- [ ] A participant can join a live session using a room code.
- [ ] Room-code matching is case-insensitive.
- [ ] Invitation-link data can enter the same join flow.
- [ ] Draft and ended sessions reject new participants.
- [ ] A participant must provide a non-empty display name.
- [ ] Duplicate display names are allowed.
- [ ] A successful join returns a scoped participant token and session-local identity.
- [ ] Returning with the same browser identity can reuse the identity for that session.
- [ ] The same person may have separate identities in different browsers or devices.
- [ ] A participant can update their display name while the session is live.
- [ ] Participant tokens are scoped to one session and can be revoked when the session is deleted.
- [ ] Participant snapshots exclude host-only data and other participants' private data.
- [ ] Join and identity-update requests are rate-limited.
- [ ] Vitest HTTP integration tests cover joining, token scope, privacy, and invalid session states.

## Blocked by

- #4 — Host session lifecycle
