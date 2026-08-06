# Live Polling Platform

This context defines the product language for hosted live polling sessions and anonymous participation.

## Session

**Host**:
An authenticated person who owns and controls polling sessions.
_Avoid_: Presenter, organizer, admin

**Participant**:
A person who joins a session without creating an account and submits responses using a session-local identity.
_Avoid_: Attendee, user, voter

**Session**:
A host-owned live event containing an ordered collection of polls and its participant activity.
_Avoid_: Event, room, presentation

**Room Code**:
A short human-shareable identifier used to join a session.
_Avoid_: Session ID, access code

**Invitation Link**:
A URL that takes a participant directly to a session's join flow.
_Avoid_: Share link, invite URL

## Polling

**Poll**:
A question within a session that can be opened to collect participant responses.
_Avoid_: Question, survey

**Response**:
A participant's submitted answer to a poll.
_Avoid_: Vote, submission

**Single-Choice Poll**:
A poll where a participant may select exactly one option.

**Multiple-Choice Poll**:
A poll where a participant may select more than one option.

**Open-Ended Poll**:
A poll where a participant submits free-form text.
_Avoid_: Text poll

**Active Poll**:
The one poll in a session currently accepting responses.
_Avoid_: Open question, live question

**Results**:
Aggregate counts and percentages derived from responses to a poll.
_Avoid_: Analytics, leaderboard

## Lifecycle

**Draft Session**:
A session being prepared by its host and not yet available for participation.

**Live Session**:
A session available for participants to join and interact with its active poll.

**Ended Session**:
A read-only session whose polling activity is permanently complete.

**Open Poll**:
A poll accepting responses.

**Closed Poll**:
A poll that no longer accepts responses.

**Revealed Results**:
Results that participants are allowed to view.

**Waiting State**:
The participant view shown when a live session has no active poll accepting responses.

## Identity And Reliability

**Session-Local Identity**:
A browser-backed participant identity scoped to one session, without verified person identity.

**Server Authority**:
The rule that persisted server state, not a browser's optimistic state or connection status, determines valid sessions, polls, and responses.

**Presence**:
A participant's current connection status within a session; it does not determine whether their response is retained.
_Avoid_: Attendance

**Participant Count**:
An approximate count of participants currently connected to a session.
