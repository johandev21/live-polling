## Parent

[#11 Frontend API and Realtime Integration with TanStack Router, TanStack Query, and Zod](https://github.com/johandev21/live-polling/issues/11)

## What to build

Connect the Session Editor (`/host/sessions/$sessionSlug`), Poll Builder (`/host/sessions/$sessionSlug/polls/new`), and Edit-Locked Poll page (`/host/sessions/$sessionSlug/polls/locked`) to backend poll CRUD, poll reordering, and session start APIs (`POST /sessions/:id/start`). Enforce session start validation and poll immutability when answered.

## Acceptance criteria

- [ ] Session Editor displays ordered poll list fetched via `GET /sessions/:id`.
- [ ] Poll Builder creates Single-Choice, Multiple-Choice (with optional `maxSelections`), and Open-Ended polls (`POST /sessions/:id/polls`).
- [ ] Poll reordering sends new poll order permutation to `POST /sessions/:id/polls/reorder`.
- [ ] Attempting to start a session with zero polls displays `NO_POLLS` error notice.
- [ ] Starting a session with polls (`POST /sessions/:id/start`) transitions status from Draft to Live and redirects to Live Control Room (`/host/sessions/$sessionSlug/live`).
- [ ] Edit-Locked Poll view appears for answered polls (`POLL_LOCKED`) preventing modification of immutable poll fields.
- [ ] Automated tests verify poll creation, reordering, locked poll handling, and session start flows.

## Blocked by

- [#13 Host Dashboard & Session Management](https://github.com/johandev21/live-polling/issues/13)
