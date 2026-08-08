## Parent

[#11 Frontend API and Realtime Integration with TanStack Router, TanStack Query, and Zod](https://github.com/johandev21/live-polling/issues/11)

## What to build

Connect the Host Dashboard (`/host/dashboard`) and Create Session page (`/host/sessions/new`) to backend REST APIs (`GET /sessions`, `POST /sessions`, `DELETE /sessions`). The dashboard must fetch the host's sessions, categorize them into Draft, Live, and Ended groups, and allow creating new sessions and deleting existing sessions.

## Acceptance criteria

- [ ] TanStack Query hook `useHostSessions` fetches sessions from `GET /sessions`.
- [ ] Host Dashboard dynamically groups sessions into Draft, Live, and Ended tabs/sections.
- [ ] Create Session page submits session creation (`POST /sessions` `{ name }`) and redirects to the Session Editor (`/host/sessions/$sessionSlug`).
- [ ] Session deletion requires explicit confirmation (`DELETE /sessions/:id` `{ confirm: true }`) and invalidates session list query cache.
- [ ] Empty session state is displayed when the host has no sessions.
- [ ] Automated tests verify session listing, creation, and deletion query flows.

## Blocked by

- [#12 Frontend Foundation, API Client, Contract Validation, and Host Auth Flow](https://github.com/johandev21/live-polling/issues/12)
