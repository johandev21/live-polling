## Parent

[#1 Build backend MVP for live polling platform](https://github.com/johandev21/live-polling/issues/1)

## What to build

Allow hosts to author, order, and control single-choice, multiple-choice, and open-ended polls inside their sessions.

## Acceptance criteria

- [ ] A host can create all three supported poll types.
- [ ] Poll text is required and limited to 500 characters.
- [ ] Choice polls require 2–10 unique, non-empty options.
- [ ] Multiple-choice polls support an optional maximum selection count.
- [ ] A host can update or delete polls before they receive responses.
- [ ] Poll text and options become immutable after the first effective response.
- [ ] Polls with responses cannot be deleted.
- [ ] A host can reorder polls while preparing a draft session.
- [ ] A live session has at most one active poll.
- [ ] Opening a poll atomically closes any other active poll.
- [ ] A host can open and close any poll during a live session.
- [ ] A host can reveal and hide results independently of poll open/closed state.
- [ ] Results can be revealed for a poll with zero responses.
- [ ] Invalid poll transitions and validation failures use machine-readable errors.
- [ ] Domain and HTTP integration tests cover poll validation and lifecycle invariants.

## Blocked by

- #4 — Host session lifecycle
