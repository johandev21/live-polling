# Complete Screen Inventory

## 1. Public & Authentication

### Landing Page
- Desktop
- Tablet
- Mobile

### Host Email Entry
- Empty
- Invalid email
- Sending
- Email sent
- Rate limited

### Magic Link Confirmation
- Email sent confirmation
- Spam/junk guidance
- Return to email entry
- Request new link cooldown

### Invalid or Expired Magic Link
- Expired link
- Invalid link
- Request a new link
- Return to email entry

### Host Dashboard
- Sessions grouped by **Draft**, **Live**, and **Ended**
- Empty session list
- Create session
- Quick access to live sessions

---

## 2. Host Session Creation & Editing

### Create Session
- Session name form
- Draft status
- No polls yet
- Add first poll CTA

### Session Editor
- Ordered poll list
- Poll type labels
- Poll status
- Add, edit, delete, and reorder actions
- Start session action
- Participants cannot join notice

### Empty Session Editor
- No polls configured
- At least one poll required
- Dominant **Add poll** action

### Poll Builder — Single Choice
- Poll text
- Two to ten options
- Add/remove options
- Inline validation

### Poll Builder — Multiple Choice
- Poll text
- Options
- Optional maximum selection count
- Inline validation

### Poll Builder — Open Ended
- Poll text
- Character limit
- Save/cancel
- Inline validation

### Edit-Locked Poll
- Immutable poll text and options
- Explanation that responses already exist
- View results
- Open, close, and reorder actions where permitted

---

## 3. Host Live Experience

### Live Control Room
- Live session status
- Room Code
- Invitation Link action
- Participant Count
- Presence access
- Active Poll
- Poll navigation
- Open/close controls
- Reveal/hide results
- End session
- Connection/synchronization status

### Share Session Panel
- Large Room Code
- Invitation Link
- Copy action
- Copy success state
- Optional QR code area
- Join instructions

### Participant Presence Panel
- Approximate participant count
- Participant display names
- Online/offline status
- Approximate presence explanation
- No response details

### Host Results View — Choice Poll
- Poll text and type
- Open/closed/revealed/hidden status
- Counts
- Percentages
- Total Response Count
- Zero-response state
- Live result updates

### Host Results View — Open-Ended Poll
- Total Response Count
- Chronological response list
- Anonymous/session-local presentation
- Host-only visibility distinction

### End Session Confirmation
- Permanent-action warning
- Participants can no longer respond
- Read-only history explanation
- Explicit **End session** confirmation

### Ended Session History
- Ended status
- Complete ordered poll history
- Host-visible results
- Hidden participant results still visible to host
- Open-ended responses
- Final totals
- Read-only controls

---

## 4. Participant Experience

### Join by Room Code
- Room Code input
- Join action
- Uppercase normalization
- Invalid Room Code
- Draft Session cannot be joined
- Ended Session cannot be joined
- Invitation Link route

### Participant Name Entry
- Display Name input
- Join Session action
- No-account explanation
- Host-only visibility notice
- Duplicate names allowed

### Participant Waiting State
- Live Session with no Active Poll
- Session name
- Waiting message
- Connection status
- Optional Participant Count

### Participant Single Choice Poll
- Poll text
- Large touch-target options
- Selected state
- Submit/update response
- Pending state
- Accepted state
- Retry state

### Participant Multiple Choice Poll
- Checkbox-like options
- Selection count
- Maximum-selection guidance
- Submit/update response
- Pending, accepted, and retry states

### Participant Open-Ended Poll
- Poll text
- Multiline response field
- Character count
- Submit/update response
- Pending, accepted, and retry states

### Participant Response Accepted
- Server-confirmed acceptance
- Current response
- Change response action
- Open Poll state
- Closed Poll state
- Results if revealed

### Participant Results Revealed
- Aggregate result visualization
- Counts
- Percentages
- Total Response Count
- Multiple-choice percentage explanation
- No participant names or individual responses

### Participant Results Hidden
- Response status
- "Results will appear when the host reveals them"
- Waiting or closed context

### Participant Poll Closed
- Poll closed status
- Whether the response was accepted
- Results if revealed
- Waiting state or next Active Poll

### Participant Session Ended
- Session ended message
- No more responses
- Final results only when permitted

---

## 5. Loading, Error, Offline & Recovery States

These are reusable states that can appear throughout the application.

### Loading
- Initial session loading
- Poll loading
- Results loading
- Dashboard loading

### Error States
- Invalid Room Code
- Draft Session Cannot Be Joined
- Ended Session Cannot Be Joined
- Session Deleted While Connected
- Poll Closed Before Response Submission
- Response Rejected by Server
  - Clearly states the response was not accepted
  - Retry action
- Response Accepted but Live Updates Reconnecting
  - Clearly separates accepted response from connection status
- Duplicate or Expired Participant Session
- Server Unavailable
- Unauthorized Host Action
- Rate Limit Exceeded
- Invalid or Oversized Input

### Connection States
- Network Disconnected
- Reconnecting
- Reconnected and Synchronized
- Stale or Resyncing State
  - Subtle refresh/resync treatment
  - Avoid technical protocol terminology

### Empty States
- Empty Session List
- Empty Poll List
- Empty Results / Zero Responses
