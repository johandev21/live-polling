# Frontend API and Realtime Integration Specification

**Parent Issue:** [#11 Frontend API and Realtime Integration with TanStack Router, TanStack Query, and Zod](https://github.com/johandev21/live-polling/issues/11)

## Problem Statement

The frontend currently consists of static design screens and placeholder routing. While the UI visually represents host and participant experiences, it is not connected to the live NestJS backend API or Socket.io realtime service. Hosts cannot authenticate, create or manage sessions, author polls, control live sessions, or view live results. Participants cannot join sessions with room codes or invitation links, persist their session-local identity, submit responses, receive realtime poll state updates, or view revealed results.

## Solution

Connect the static frontend application to the authoritative backend REST API and Socket.io realtime events using TanStack Router for route state and parameters, TanStack Query for server state management and caching, and Zod schemas for request/response runtime validation. Enable full host and participant lifecycles with local token persistence for session-local identity, strict adherence to server authority, automated revision-tracked realtime synchronization, and resilient error recovery using machine-readable error codes.

## User Stories

1. As a host, I want to enter my email address on the sign-in page, so that I can receive a magic link to authenticate without needing a password.
2. As a host, I want to see a confirmation screen after requesting a magic link, so that I know to check my email inbox.
3. As a host, I want to be informed if my magic link is invalid or expired, so that I can easily request a new link and return to the email entry screen.
4. As an authenticated host, I want to view my dashboard with sessions organized into Draft, Live, and Ended categories, so that I can quickly see the status of all my sessions.
5. As an authenticated host, I want to create a new session with a name, so that I can prepare a live polling event.
6. As a host, I want to edit my draft session details and manage its poll list, so that I can prepare questions before going live.
7. As a host, I want to add Single-Choice, Multiple-Choice, and Open-Ended polls to my draft session, so that I can gather different kinds of feedback from participants.
8. As a host, I want to reorder polls within a draft session, so that questions are presented in the desired order.
9. As a host, I want to start a session when at least one poll is configured, so that the session transitions from Draft to Live and participants can join.
10. As a host, I want to be prevented from starting a session with zero polls, so that participants never enter a session with no content.
11. As a host, I want to view an edit-locked poll screen for polls that already have responses, so that I am prevented from modifying immutable poll structures after participants have answered.
12. As a host in the live control room, I want to see the active room code, invitation link, participant count, and session status, so that I can manage the active event effectively.
13. As a host, I want to open a poll in a live session, so that it becomes the active poll accepting responses from participants while automatically closing any previously open poll.
14. As a host, I want to close an active poll, so that no further responses are accepted.
15. As a host, I want to reveal or hide poll results, so that I can control when participants can see aggregate response counts and percentages.
16. As a host, I want to view real-time result updates for choice and open-ended polls in the control room, so that I can monitor participant submissions as they occur.
17. As a host, I want to end a live session with an explicit confirmation step, so that the session is permanently marked as Ended and no further responses are accepted.
18. As a host, I want to view the history and results of ended sessions, so that I can review past polling data in a read-only view.
19. As a participant, I want to join a live session using a 6-character room code, so that I can participate in polls without creating an account.
20. As a participant, I want to join a live session via a direct invitation link URL, so that I can bypass manual room code entry.
21. As a participant, I want to be notified if I try to join a Draft or Ended session, so that I understand why access is blocked.
22. As a participant, I want to enter a display name when joining a session, so that the host can identify my presence while maintaining session-local identity.
23. As a participant, I want my session token stored in browser storage, so that my identity and responses survive page reloads and temporary disconnects within the session.
24. As a participant, I want to see a waiting state when a live session has no active open poll, so that I know to wait for the host to activate a question.
25. As a participant, I want to submit a single choice response to an active single-choice poll, so that my selection is recorded by the server.
26. As a participant, I want to select up to the maximum permitted options for a multiple-choice poll, so that I can submit valid multi-option selections.
27. As a participant, I want to submit free-form text up to 500 characters for an open-ended poll, so that I can share detailed written feedback.
28. As a participant, I want my response submissions to include a client-generated idempotency key, so that retries due to network failure do not create duplicate responses.
29. As a participant, I want to update my submitted response while the poll remains open, so that I can correct or change my answer before the poll closes.
30. As a participant, I want to view aggregate poll results when the host has revealed them, so that I can see how others answered without seeing individual names or open-ended responses of others.
31. As a participant, I want to be informed when results are hidden by the host, so that I know results are concealed.
32. As a participant, I want to receive immediate socket notifications when polls open, close, reveal, or when the session ends, so that my UI automatically updates without manual page refreshes.
33. As a participant, I want periodic presence heartbeats sent via socket, so that the host's active participant count reflects my connection status.
34. As a participant, I want my client to resynchronize authoritative state from the server snapshot whenever a socket reconnects or a revision gap is detected, so that state convergence is guaranteed.
35. As a user (host or participant), I want clear error feedback for API failures based on machine-readable error codes, so that I can recover gracefully from transient or invalid actions.

## Implementation Decisions

### Module and Interface Structure

- **API Client Layer:** Establish an HTTP client wrapping `fetch` configured with base URL, credential handling (cookies for host session), and bearer token authorization (for participant requests). Standardize error response parsing against `ERROR_CODES`.
- **Query & Mutation Hooks:** Build custom TanStack Query hooks for Host domain operations (`useHostSessions`, `useHostSession`, `useCreateSession`, `useUpdateSession`, `useStartSession`, `useEndSession`, `useDeleteSession`, `useCreatePoll`, `useUpdatePoll`, `useDeletePoll`, `useReorderPolls`, `useOpenPoll`, `useClosePoll`, `useRevealResults`, `useHideResults`, `useHostPollResults`) and Participant domain operations (`useJoinSession`, `useParticipantSession`, `useUpdateParticipantName`, `useSubmitResponse`, `useParticipantPollResults`).
- **Realtime Socket Synchronization Manager:** Implement a unified Socket.io connection manager for host and participant roles. The manager maintains current session revision state, listens to `REALTIME_EVENTS`, updates query cache data, triggers presence heartbeats for participants, and triggers full query invalidation / snapshot refetching upon receiving `resync.requested` or detecting non-sequential revisions.
- **Session-Local Identity Storage:** Implement browser storage helpers to persist and restore participant bearer tokens keyed by session ID (`live_polling_token_<sessionId>`).
- **Router Search & Path Validation:** Use Zod schemas in TanStack Router route definitions (`validateSearch` and path parameters) to validate route inputs (such as room codes, email, and poll IDs).
- **Server Authority & Non-Optimistic Response States:** Maintain strict adherence to server authority: pending response mutations reflect local submitting states, but acceptance and updated response views depend entirely on server-confirmed REST HTTP 200/201 responses or authoritative session snapshots.

## Testing Decisions

### Primary Test Seam

The primary seam for testing frontend integration is the full React application boundary combined with MSW (Mock Service Worker) for API and Socket.io network interception, as well as Component Integration tests against the NestJS e2e testing server.

- **Component & Hook Seams:** Test TanStack Query data hooks and Socket synchronization logic using React Testing Library (`@testing-library/react`) wrapped in QueryClient and Router providers.
- **Interception & Mocks:** Intercept REST HTTP endpoints and Socket.io events with MSW to simulate success flows, server errors (`POLL_LOCKED`, `CLOSED_POLL`, `SESSION_ENDED`, `RATE_LIMITED`), network disconnects, and revision resynchronizations.
- **External Behavior Focus:** Tests must verify UI transitions, state recovery, token persistence, error alerts, and realtime DOM updates without depending on internal component component-state variables or private functions.

## Out Of Scope

- Modifying the existing static CSS/Tailwind design system or visual styling unless necessary to display dynamic states.
- Server-side rendering (SSR) or React Server Components.
- Custom authentication mechanisms outside Better Auth magic links.
- Analytics or third-party tracking integration.
- Offline-first mutation queuing across application restarts (retries are bounded to active sessions with idempotency keys).

## Further Notes

- API contract details, lifecycle transitions, privacy boundaries, and Socket.io event schemas follow `docs/contracts/backend-api.md`.
- All domain terminology strictly aligns with `CONTEXT.md` (Host, Participant, Session, Room Code, Invitation Link, Poll, Response, Active Poll, Results, Waiting State, Presence, Participant Count).
