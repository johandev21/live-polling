## Parent

[#11 Frontend API and Realtime Integration with TanStack Router, TanStack Query, and Zod](https://github.com/johandev21/live-polling/issues/11)

## What to build

Implement the unified Socket.io client layer for host and participant connections. Connect Live Control Room (`/host/sessions/$sessionSlug/live`), Host Results (`/host/sessions/$sessionSlug/results`), Ended Session History (`/host/sessions/$sessionSlug/history`), and Participant live updates to open/close/reveal/hide actions, presence heartbeats, session end, and revision-gated resynchronization.

## Acceptance criteria

- [ ] Socket.io connection manager handles host (`role: 'host'`) and participant (`role: 'participant'`) socket authentication.
- [ ] Participants send periodic `presence.heartbeat` via socket; host UI displays updated approximate participant count and presence list.
- [ ] Host can open a poll (`POST /open`), close a poll (`POST /close`), reveal results (`POST /reveal`), and hide results (`POST /hide`).
- [ ] Opening a poll automatically closes any previously open poll.
- [ ] Participants receive realtime socket events (`poll.opened`, `poll.closed`, `results.revealed`, `results.hidden`, `session.ended`) and update UI immediately without manual refresh.
- [ ] Revealed results display aggregate counts and percentages for participants; hidden results display waiting notice.
- [ ] Session end (`POST /sessions/:id/end`) permanently transitions session to Ended and redirects host to Ended Session History.
- [ ] Socket reconnect or revision gap triggers snapshot resynchronization (`GET /participant/session` or host snapshot).
- [ ] Automated tests verify realtime event handling, presence tracking, result visibility toggling, and reconnect snapshot recovery.

## Blocked by

- [#14 Host Session Editor & Poll Authoring](https://github.com/johandev21/live-polling/issues/14)
- [#16 Participant Poll Responding & Snapshot Synchronization](https://github.com/johandev21/live-polling/issues/16)
