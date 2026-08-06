# Live Polling Platform

## MVP Design Brief

This document is the product and UX source of truth for designing the first release of the Live Polling Platform. It is written for the product designer responsible for the complete web experience across desktop and mobile.

The product is a fast, minimal live polling tool for presentations, classrooms, meetings, and live events. A host creates a session, shares a room code or invitation link, and controls a sequence of polls. Participants join instantly without creating an account, submit responses to the active poll, and may see aggregate results when the host reveals them.

The experience should feel reliable under pressure: a host may be presenting in front of a room, while hundreds of participants may be joining from phones at the same time.

## Product Principles

- **Fast to first response**: A participant should join and understand what to do within seconds.
- **Host-controlled**: The host decides which poll is active, when responses stop, and when results become visible.
- **Clear live state**: Every screen should make it obvious whether a session or poll is waiting, open, closed, or ended.
- **Trust the server**: Never make a participant believe a response was accepted before the product confirms it.
- **Low friction**: Participants do not create accounts. Hosts use passwordless magic-link authentication.
- **Focused presentation mode**: Host controls should be usable while presenting and should avoid unnecessary configuration.
- **Private by default**: Sessions are accessible through a room code or invitation link, not public discovery.
- **Accessible and responsive**: Core flows must work with keyboard, screen readers, touch, and small mobile screens.

## Canonical Vocabulary

Use these terms consistently in UI copy, navigation, empty states, documentation, and error messages.

### People

**Host**

An authenticated person who owns and controls polling sessions.

Do not use: presenter, organizer, admin.

**Participant**

A person who joins a session without creating an account and submits responses using a session-local identity.

Do not use: attendee, user, voter.

### Sessions

**Session**

A host-owned live event containing an ordered collection of polls and participant activity.

Do not use: event, room, presentation.

**Room Code**

A short, human-shareable identifier used to join a session.

Do not use: session ID, access code.

**Invitation Link**

A URL that takes a participant directly to a session's join flow.

Do not use: share link, invite URL.

### Polling

**Poll**

A question within a session that can be opened to collect participant responses.

Do not use: question, survey.

**Response**

A participant's submitted answer to a poll.

Do not use: vote, submission.

**Single-Choice Poll**

A poll where a participant may select exactly one option.

**Multiple-Choice Poll**

A poll where a participant may select more than one option.

**Open-Ended Poll**

A poll where a participant submits free-form text.

Do not use: text poll.

**Active Poll**

The one poll in a session currently accepting responses.

Do not use: open question, live question.

**Results**

Aggregate counts and percentages derived from responses to a poll.

Do not use: analytics, leaderboard.

### Lifecycle

**Draft Session**

A session being prepared by its host and not yet available for participation.

**Live Session**

A session available for participants to join and interact with its active poll.

**Ended Session**

A read-only session whose polling activity is permanently complete.

**Open Poll**

A poll accepting responses.

**Closed Poll**

A poll that no longer accepts responses.

**Revealed Results**

Results that participants are allowed to view.

**Waiting State**

The participant view shown when a live session has no active poll accepting responses.

### Identity And Reliability

**Session-Local Identity**

A browser-backed participant identity scoped to one session, without verified person identity.

**Server Authority**

Persisted server state, not browser optimism or connection status, determines valid sessions, polls, and responses.

**Presence**

A participant's current connection status within a session. Presence does not determine whether their response is retained.

Do not use: attendance.

**Participant Count**

An approximate count of participants currently connected to a session.

## Users And Permissions

### Host

- Must create an account through a magic link.
- Must verify their email before creating a session.
- Owns their sessions and can see only their own sessions.
- Is the only host of a session in the MVP.
- Can create, edit, reorder, open, close, reveal, hide, and delete polls according to the rules below.
- Can end a session.
- Can see participant count, participant display names, presence, aggregate results, and open-ended response text.
- Can see full poll-by-poll history after a session ends.
- Cannot transfer ownership, invite co-hosts, remove participants, clear responses, or export data in the MVP.

### Participant

- Does not create an account.
- Joins using a room code or invitation link.
- Enters a display name.
- Uses a browser-backed session-local identity.
- Can have a separate identity in another browser or device.
- May use a display name already used by another participant.
- Can respond to the active poll and replace their response while it remains open.
- Sees aggregate results only when the host has revealed them.
- Never sees other participants' names or individual responses.

## Session Lifecycle

The only valid session transitions are:

`Draft Session -> Live Session -> Ended Session`

- A draft session is private to the host.
- A session requires at least one poll before it can start.
- Starting a session makes it available to participants.
- A live session may have no active poll; participants see the waiting state.
- Ending a session is permanent and requires explicit confirmation.
- An ended session is read-only for the host.
- Ended sessions reject new participants.
- Deleted sessions disappear immediately, disconnect participants, and invalidate room-code access.

## Poll Lifecycle

Polls may be:

- Draft/configured while the session is being prepared.
- Open and accepting responses.
- Closed and no longer accepting responses.
- Revealed or hidden with respect to participant result visibility.

Rules:

- Only one poll can be active at a time.
- Opening any poll automatically closes the currently active poll.
- The host may open any poll, including an earlier poll, while the session is live.
- Closing a poll stops responses but does not change its result visibility.
- Opening and closing are immediate actions; only ending a session requires confirmation.
- The host may reveal results for a poll with zero responses.
- Hiding results removes participant access immediately.
- A poll with responses cannot have its text or options edited.
- A poll with responses cannot be deleted.
- A poll without responses can be edited or deleted.
- Polls can be reordered in draft. Once live, the configured order remains stable, but the host may manually open any poll.

## Poll Types And Validation

### Single-Choice Poll

- Participant selects exactly one option.
- Require 2 to 10 non-empty options.
- Option text must be unique within the poll.

### Multiple-Choice Poll

- Participant selects one or more options.
- Require 2 to 10 non-empty options.
- Option text must be unique within the poll.
- The host may configure an optional maximum selection count.

### Open-Ended Poll

- Participant submits free-form text.
- Response must contain non-empty trimmed text.
- Maximum response length is 500 characters.
- Results are a chronological list of submitted text responses and a total count.
- No automatic clustering, summarization, or profanity filtering in the MVP.

### Shared Poll Constraints

- Poll text is required and limited to 500 characters.
- Rich text is not supported.
- The session name is required and limited to 120 characters.
- Preserve poll and option order as configured by the host.

## Response Rules

- A participant has one effective response per poll.
- A participant may replace their response while the poll is open.
- Replacing a response updates results atomically; the old response does not remain counted.
- Responses submitted after a poll closes are rejected.
- A response is not considered accepted until the server confirms it.
- Temporary connection loss must not lose an already accepted response.
- Duplicate retries must be safe and must not create duplicate effective responses.
- Participant presence does not affect response retention.

## Result Rules

### Host Results

Hosts can always see aggregate results for their sessions, including hidden results and results after the session ends.

For choice polls, show:

- Option label.
- Response count.
- Percentage of effective responses.
- Total response count.
- Clear empty state when there are zero responses.

For multiple-choice polls, clarify that percentages may add up to more than 100% because participants may select multiple options.

For open-ended polls, show:

- Total response count.
- Chronological response list.
- Anonymous/session-local presentation of responses.

### Participant Results

- Participants see results only when the host has revealed them.
- Participants may see results after submitting a response if results are revealed.
- If results are hidden, show an explicit state such as “Results will appear when the host reveals them.”
- If the host hides results again, remove participant access immediately.
- Participants never see individual response authors.

## Screen Inventory

Design all screens below, including loading, empty, error, offline, and permission states.

### Public And Authentication

#### Landing Page

Purpose: Explain the product quickly and route people into the correct flow.

Required content:

- Clear value proposition for live polling.
- Primary action for hosts to sign in or create a session.
- Primary or secondary action for participants to join with a room code.
- Short explanation that participants do not need an account.
- Example use cases: presentations, classrooms, meetings, live events.

#### Host Email Entry

Purpose: Collect the host's email address to send a magic link.

States:

- Empty form.
- Invalid email.
- Sending.
- Email sent confirmation.
- Rate-limited request.

Copy should explain that the link is short-lived and single-use.

#### Magic Link Confirmation

Purpose: Confirm that the email was sent and help the host recover from common mistakes.

Required actions:

- Return to email entry.
- Request a new link after the appropriate delay.
- Explain that the host should check spam or junk folders.

#### Invalid Or Expired Magic Link

Purpose: Explain that authentication cannot continue and provide a clear route to request a new link.

#### Host Dashboard

Purpose: Let a host find and manage their own sessions.

Required content:

- Session list grouped or filtered by draft, live, and ended.
- Create session action.
- Session name.
- Session status.
- Poll count.
- Last updated information.
- Quick access to live sessions.
- Empty state for a new host.

### Host Session Creation And Editing

#### Create Session

Required fields:

- Session name.

Required behavior:

- Session cannot start until at least one poll exists.
- Make the draft nature obvious.
- Provide a clear next action to add the first poll.

#### Session Editor

Purpose: Prepare the ordered poll sequence before going live.

Required content:

- Session name.
- Ordered poll list.
- Poll type labels.
- Poll status.
- Add poll action.
- Edit poll action.
- Delete poll action for unanswered polls.
- Reorder affordance.
- Start session action.
- Clear indication that participants cannot join yet.

Empty state:

- Explain that at least one poll is required to start.
- Make “Add poll” the dominant action.

#### Poll Builder

Support:

- Single-choice poll.
- Multiple-choice poll.
- Open-ended poll.

Required controls:

- Poll type selection.
- Poll text input.
- Option inputs for choice polls.
- Add option and remove option controls.
- Optional maximum selection count for multiple-choice polls.
- Save/cancel behavior.
- Inline validation.

Validation copy must be specific, close to the field, and preserve entered values.

#### Edit-Locked Poll

When a poll has responses, show the poll as immutable:

- Explain why text and options cannot be edited.
- Allow the host to view results.
- Allow reordering if the session rules permit it.
- Allow closing or opening according to lifecycle state.

### Host Live Experience

#### Live Control Room

This is the primary host screen during a presentation or event.

Required content:

- Session name and live status.
- Room code displayed prominently.
- Copy invitation link action.
- Participant count.
- Participant presence indicator or list.
- Current active poll.
- Poll sequence/navigation.
- Open/close controls.
- Reveal/hide results controls.
- End session action.
- Connection/synchronization status.

The active poll and its controls must dominate the visual hierarchy. The host should not need to navigate away to perform the common actions.

#### Share Session Panel

Purpose: Help the host get participants into the session.

Required content:

- Large room code.
- Invitation link.
- Copy button with clear success feedback.
- Optional QR code area if included by design; do not make QR scanning a dependency of the MVP.
- Short instruction: join using the room code or invitation link.

#### Participant Presence Panel

Required content:

- Approximate participant count.
- Participant display names visible to the host only.
- Online/offline status.
- Clear explanation that presence is approximate.

Do not show participant response details in this panel.

#### Host Results View

Required content:

- Poll text and type.
- Open/closed/revealed/hidden status.
- Live aggregate counts and percentages.
- Total response count.
- Empty result state.
- Open-ended chronological response list.
- Clear distinction between host visibility and participant visibility.

Results should update without disrupting the host's current control context.

#### End Session Confirmation

Explain clearly:

- Ending is permanent.
- Participants can no longer submit responses.
- The host can still view the read-only session history.

Require explicit confirmation. Do not use ambiguous button labels such as “Continue.”

#### Ended Session History

Required content:

- Ended status.
- Complete ordered poll history.
- Host-visible results, including results never revealed to participants.
- Open-ended responses.
- Final response totals.
- Read-only treatment for all poll controls.

### Participant Experience

#### Join By Room Code

Required content:

- Room code input.
- Join action.
- Invitation-link route that pre-fills or skips the room code step.
- Clear invalid-code state.
- Clear draft-session and ended-session states.

Room codes are case-insensitive. The UI may normalize input to uppercase for readability.

#### Participant Name Entry

Required content:

- Display name input.
- Join session action.
- Short explanation that no account is required.
- Notice that the name is visible to the host but not to other participants.

Rules:

- Duplicate display names are allowed.
- Empty names are not allowed.
- The name can be changed later during the live session.

#### Participant Waiting State

Show when:

- The session is live but no poll is active.
- A poll has just closed and the host has not opened another.

Required content:

- Session name.
- Clear waiting message.
- Connection status.
- Optional participant count only if the product chooses to expose it; it is not required.

Do not show a confusing disabled poll form.

#### Participant Single-Choice Poll

Required content:

- Poll text.
- Options with large touch targets.
- Selected state.
- Submit/update response action.
- Loading/pending state.
- Accepted response state.
- Error and retry state.

#### Participant Multiple-Choice Poll

Required content:

- Poll text.
- Checkbox-like options.
- Selection count or maximum-selection guidance when configured.
- Submit/update response action.
- Pending, accepted, and retry states.

#### Participant Open-Ended Poll

Required content:

- Poll text.
- Multiline input.
- Character count near the limit.
- Submit/update response action.
- Pending, accepted, and retry states.

#### Participant Response Accepted

Show:

- Confirmation that the response was accepted by the server.
- The participant's current response.
- Edit/change response action while the poll remains open.
- Results if revealed.
- Waiting or closed state if the poll is no longer open.

Avoid implying that the response is immutable when edits are allowed.

#### Participant Results Revealed

Show:

- Poll text.
- Aggregate result visualization.
- Counts and percentages.
- Total response count.
- Appropriate multiple-choice explanation.

Do not show names or individual open-ended responses.

#### Participant Results Hidden

Show:

- Their response status if they have responded.
- A clear explanation that the host has not revealed results.
- Waiting or closed context as appropriate.

#### Participant Poll Closed

Show:

- The poll is closed.
- Whether their response was accepted before closing.
- Results if currently revealed.
- Waiting state or next active poll when one becomes available.

#### Participant Session Ended

Show:

- The session has ended.
- No more responses can be submitted.
- A final result view only if the participant is permitted to see revealed results.

### Error, Loading, And Recovery Screens

Design explicit states for:

- Invalid room code.
- Draft session cannot be joined.
- Ended session cannot be joined.
- Session deleted while a participant is connected.
- Poll closed before response submission.
- Response rejected by server.
- Duplicate or expired participant token.
- Network disconnected.
- Reconnecting.
- Reconnected and synchronized.
- Server unavailable.
- Unauthorized host action.
- Rate limit exceeded.
- Invalid or oversized input.
- Empty session list.
- Empty poll list.
- Empty results.

The error experience must distinguish between:

- “Your response was not accepted.”
- “Your response was accepted, but live updates are reconnecting.”

Never tell a participant that a response was lost unless the server explicitly rejected it.

## Realtime And Synchronization UX

The frontend uses REST for commands, queries, and authoritative session snapshots. Socket.io provides live notifications for committed state changes and presence.

Design for these states:

- Connecting.
- Connected.
- Reconnecting.
- Synchronized.
- Stale or resyncing.

Important behavior:

- Server state wins over optimistic browser state.
- A response submission may show a pending state until confirmed.
- A successful database commit must remain accepted even if a realtime broadcast fails.
- After reconnecting, the client fetches the current authoritative snapshot.
- Events use a monotonically increasing session revision.
- Stale events must not visibly roll the UI backward.
- If a revision gap is detected, show a subtle resync state and refresh data; do not expose protocol terminology to participants.

Use a small, persistent connection indicator rather than disruptive full-screen alerts for ordinary reconnects.

## Responsive Design Requirements

### Participant Mobile First

Participants will commonly join on phones in portrait orientation. Prioritize:

- One-handed interaction.
- Large tap targets.
- Short vertical flows.
- Readable poll text without excessive scrolling.
- Sticky or clearly visible submit action where appropriate.
- No horizontal scrolling.
- Good behavior with mobile browser chrome and virtual keyboards.

### Host Desktop First, Mobile Supported

Hosts may use a laptop or desktop while presenting, but the host dashboard must remain usable on tablets and phones.

Desktop host layouts may use a control-room structure with:

- Main active poll/results area.
- Secondary session navigation.
- Share and participant panels.

On smaller screens, collapse secondary panels into drawers, sheets, or tabs without hiding the primary poll controls.

### Presentation Visibility

The host needs to read controls and results at a glance. Use strong hierarchy, generous spacing, high contrast, and clear status labels. Avoid dense admin-table styling for the live control room.

## Accessibility Requirements

Target WCAG 2.2 AA for core host and participant flows.

Required:

- Full keyboard operation.
- Visible keyboard focus.
- Semantic form labels.
- Accessible names for icon-only buttons.
- Sufficient color contrast.
- Do not communicate status by color alone.
- Logical heading hierarchy.
- Screen-reader-compatible validation messages.
- Screen-reader-compatible result updates.
- Touch targets appropriate for mobile.
- Reduced-motion support for live transitions.
- Clear focus behavior when a new poll becomes active.
- Error messages that identify the affected field and recovery action.

Live updates must not steal focus from a participant who is typing or selecting a response.

## Visual And Interaction Direction

The product should feel modern, calm, and dependable rather than playful or gamified. It is used in serious presentations and classrooms as well as social events.

Recommended qualities:

- Minimal chrome.
- Strong typographic hierarchy.
- Distinct but restrained status colors.
- Clear open/closed/revealed states.
- High-confidence primary actions.
- Helpful empty states.
- Lightweight feedback for copy, save, submit, and reconnect actions.

Avoid:

- Leaderboards or competitive language.
- Excessive animation.
- Dashboard clutter.
- Public social-feed patterns.
- Ambiguous icons without labels or tooltips.
- Tiny controls that require precision during a live presentation.

The designer may establish the visual system, typography, color palette, spacing, component language, and chart style, but the product semantics and state behavior in this brief should not change.

## Copy Guidelines

- Use “response,” never “vote.”
- Use “participant,” never “user” or “attendee.”
- Use “session,” never “room” for the product object.
- Use “poll,” never “question” or “survey.”
- Use “host,” never “presenter” or “organizer.”
- Explain server-confirmed actions in plain language.
- Prefer direct action labels: “Start session,” “Open poll,” “Close poll,” “Reveal results,” “End session.”
- Make destructive or permanent consequences explicit.
- Avoid technical terms such as revision, socket, token, snapshot, or server authority in user-facing copy.

## Privacy And Trust Requirements

- Sessions are private and are not publicly discoverable.
- Room codes and invitation links grant access to the join flow.
- Participant names are visible to the host only.
- Participant names do not need to be unique.
- Participants do not see other participants' names.
- Participants do not see individual responses.
- Hosts see open-ended response text but not verified participant identity.
- Never expose magic-link tokens or participant tokens in UI.
- Do not suggest that participant identities are verified.
- Make clear when participant count is approximate.

## MVP Out Of Scope

Do not design primary screens or flows for these features:

- Co-hosts or team workspaces.
- Ownership transfer.
- Participant accounts.
- Participant approval queues.
- Session passwords.
- Participant removal.
- Vote clearing.
- Moderation workflows.
- Word clouds.
- Rating or numeric-scale polls.
- Rich text.
- Automatic response clustering or summarization.
- Profanity filtering.
- CSV export UI.
- PowerPoint or Google Slides integration.
- Public session discovery.
- Billing or subscriptions.
- SSO.
- Internationalization.
- Reopening ended sessions.
- Strong cross-device identity or anti-cheat guarantees.

The data model may preserve future export capability, but export is not part of the MVP interface.

## Definition Of A Successful Design

The design is complete when a designer has specified:

- All screens in the screen inventory.
- All session, poll, response, result, presence, loading, error, and reconnect states.
- Desktop, tablet, and mobile behavior.
- Keyboard and screen-reader behavior for core flows.
- Host and participant permission differences.
- Empty, zero-response, closed, hidden-result, deleted-session, and ended-session states.
- Clear confirmation and recovery behavior for every destructive or uncertain action.
- A reusable component and visual system that supports live updates without visual noise.

The final experience should let a verified host prepare a session, invite participants, run multiple polls, monitor responses, reveal results, and end the session confidently. It should let a participant join from a phone without an account, respond quickly, understand whether the response was accepted, and see permitted results without confusion.
