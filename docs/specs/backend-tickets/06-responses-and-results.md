## Parent

[#1 Build backend MVP for live polling platform](https://github.com/johandev21/live-polling/issues/1)

## What to build

Allow participants to submit and replace responses to active polls, and provide correctly scoped host and participant results derived from durable effective responses.

## Acceptance criteria

- [ ] A participant can submit a valid single-choice response.
- [ ] A participant can submit a valid multiple-choice response.
- [ ] A participant can submit valid open-ended text after trimming.
- [ ] Open-ended responses reject empty text and text longer than 500 characters.
- [ ] Multiple-choice responses enforce configured maximum selection counts.
- [ ] Responses reference only valid options belonging to the poll.
- [ ] Submissions to closed or inactive polls are rejected by server authority.
- [ ] Each participant/poll pair has one effective response.
- [ ] A participant can replace their response while the poll is open.
- [ ] Replacement updates the effective result atomically without double-counting.
- [ ] Idempotency keys make safe retries produce one effective operation.
- [ ] Host results include aggregate counts, percentages, totals, and open-ended response text.
- [ ] Participant results include only aggregate results when the host has revealed them.
- [ ] Participant results never include names or individual response text.
- [ ] Ended sessions retain complete host-visible results.
- [ ] PostgreSQL is committed before any realtime publication is attempted.
- [ ] Vitest tests cover invalid input, idempotency, replacement, close races, result visibility, and privacy.

## Blocked by

- #5 — Poll authoring and lifecycle
- #6 — Participant joining and session-local identity
