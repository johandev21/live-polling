## Parent

[#11 Frontend API and Realtime Integration with TanStack Router, TanStack Query, and Zod](https://github.com/johandev21/live-polling/issues/11)

## What to build

Connect Join by Room Code / Invitation Link pages (`/join`, `/join/:roomCode`, `/join/invitation`) and Participant Name Entry (`/join/name`) to `POST /join` and `PATCH /participant/me`. Store and restore participant bearer tokens in `localStorage` per session to maintain Session-Local Identity across reloads.

## Acceptance criteria

- [ ] Participant can enter room code (case-insensitive) or join directly via invitation link URL.
- [ ] Joining a Draft Session displays `SESSION_DRAFT` notice; joining an Ended Session displays `SESSION_ENDED` notice.
- [ ] Participant enters display name on `/join/name` and calls `POST /join`.
- [ ] Server-returned participant `token` is persisted in `localStorage` keyed by session ID.
- [ ] Submitting `POST /join` with an existing `token` restores the participant's session-local identity.
- [ ] Participant can update display name via `PATCH /participant/me`.
- [ ] Successful join redirects participant to `/session/$sessionSlug`.
- [ ] Automated tests verify join validations, error codes, token persistence, and identity restoration.

## Blocked by

- [#12 Frontend Foundation, API Client, Contract Validation, and Host Auth Flow](https://github.com/johandev21/live-polling/issues/12)
