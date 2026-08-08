## Parent

[#11 Frontend API and Realtime Integration with TanStack Router, TanStack Query, and Zod](https://github.com/johandev21/live-polling/issues/11)

## What to build

Connect the Participant Session view (`/session/$sessionSlug`) to `GET /participant/session` snapshot and `PUT /participant/polls/:id/response` with client-generated idempotency keys. Handle Waiting State, Single-Choice responses, Multiple-Choice responses, and Open-Ended response submissions.

## Acceptance criteria

- [ ] Participant Session page fetches authoritative snapshot via `GET /participant/session` using Bearer token.
- [ ] Displays Waiting State when no poll in the live session has `isOpen: true`.
- [ ] Participant can submit a single choice selection for Single-Choice polls.
- [ ] Participant can submit up to `maxSelections` choices for Multiple-Choice polls.
- [ ] Participant can submit free-form text up to 500 characters for Open-Ended polls.
- [ ] Response submissions generate a unique `idempotencyKey` per attempt to ensure retries do not duplicate responses.
- [ ] Resubmitting an answer while the poll remains open updates the existing response.
- [ ] Server-confirmed response acceptance transitions UI to accepted response state.
- [ ] Automated tests verify snapshot fetching, response validation rules, idempotency key generation, and response updates.

## Blocked by

- [#15 Participant Joining, Token Persistence, and Identity](https://github.com/johandev21/live-polling/issues/15)
