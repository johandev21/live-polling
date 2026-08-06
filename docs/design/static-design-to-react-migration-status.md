# Static Design to React Migration Status

**Status date:** 2026-08-06

## Executive Summary

The frontend now contains a working React migration of the major screen families
described by `docs/design/static-design-to-react-migration.md`. The temporary
Hello World shell has been replaced with a route-driven app, a shared Pulse UI
kit, responsive page slices, local state models, and Lucide React icons.

The migration is approximately 90-95% complete if the target is a local,
state-driven visual frontend. The remaining frontend work is mostly behavior,
accessibility, and architecture hardening. It is not all cosmetic: several
participant and host edge cases still need correction.

The frontend is not production-integrated. It currently uses fixture data and
local React state because the existing repository did not provide the frontend
API, authentication, realtime, or response persistence wiring. Server authority
rules are represented in the state models and copy, but are not yet enforced by
real server calls.

## Completed

### Dependency and App Foundation

- Installed `lucide-react` in `apps/frontend` and updated `pnpm-lock.yaml`.
- Replaced the temporary `App.tsx` markup with an app entrypoint and router view.
- Added a lightweight route registry with normal path and hash fallback support.
- Added `@/app`, `@/pages`, and `@/shared` aliases to TypeScript and Vite.
- Added responsive global tokens and baseline styles.
- Added light and dark values for inverse, status-surface, and card-shadow tokens.
- Added DM Sans and JetBrains Mono loading through the app HTML entrypoint.
- Added reduced-motion and focus-visible baseline styles.

### Shared UI

The shared UI layer now includes public APIs for:

- `Brand`
- `Button` and `IconButton`
- `Surface`
- `StatusBadge`
- `Field`
- `TextInput` and `Textarea`
- `Callout`
- `ResultBar`
- `ConnectionStatus`
- `CenteredCardLayout`
- A typed Lucide icon API

These components use semantic HTML, design-token variables, stable variant
maps, accessible labels, and responsive utility classes. Domain rules remain in
page slices rather than shared UI.

### Implemented Page Families

- Landing page with responsive desktop, tablet, and mobile composition.
- Host email entry, magic-link confirmation, and invalid-link recovery.
- Host dashboard with Draft, Live, and Ended session views.
- Create-session flow with draft preview and empty state.
- Session editor with ordered poll rows and local reorder actions.
- Poll builder for single-choice, multiple-choice, and open-ended polls.
- Read-only locked-poll projection with result preview.
- Live control room with active poll controls, results, share panel, presence
  panel, connection state, and end-session confirmation.
- Host choice results, open-ended results, and zero-response result state.
- Ended-session history with read-only choice and open-ended result history.
- Room Code join flow with normalization and invalid, draft, ended, and
  unavailable states.
- Participant display-name entry with session-local identity copy.
- Participant session state-driven page with waiting, poll, response, closed,
  result, reconnecting, and ended-state models.

### Registered Routes

Canonical routes currently include:

- `/`
- `/host/email`
- `/host/magic-link`
- `/host/magic-link/invalid`
- `/host/dashboard`
- `/host/sessions/new`
- `/host/sessions/:sessionSlug`
- `/host/sessions/:sessionSlug/polls/new`
- `/host/sessions/:sessionSlug/polls/locked`
- `/host/sessions/:sessionSlug/live`
- `/host/sessions/:sessionSlug/results`
- `/host/sessions/:sessionSlug/history`
- `/join`
- `/join/name`
- `/session/:sessionSlug`

There are also compatibility aliases for the earlier page-local paths such as
`/host-dashboard`, `/session-editor`, `/participant/name`, and
`/participant/session`.

## Verification Completed

The following commands pass from the repository root:

```bash
pnpm lint
pnpm format:check
pnpm build
```

The frontend-specific checks also pass:

```bash
pnpm --filter frontend lint
pnpm --filter frontend format:check
pnpm --filter frontend build
```

Browser smoke checks covered:

- Landing page at mobile and desktop widths.
- Host dashboard at desktop width.
- Participant poll at 390px with no horizontal overflow.
- Live control room at 390px with the sharing dialog opened.
- Ended-session history at 390px.
- Hash fallback navigation using `/#/join`.
- Dark-theme token application.
- Lucide SVG rendering on the migrated pages.

This was a smoke pass, not a complete visual comparison against every static
HTML fixture at every required reference width.

## Remaining Frontend Hardening

These items are the next recommended fixes for the local migration. They do not
require a backend to implement.

### Participant Routing and Identity

- The Room Code page links to `/join/invitation`, but that route is not yet
  registered.
- A direct `/join/:roomCode` route should preserve the Room Code in the join
  form.
- The participant name entry currently navigates without carrying the entered
  name into the participant session. The session falls back to `Avery`.
- The canonical participant route should carry both the session identifier and
  the session-local display name.

### Participant Recovery and State Boundaries

- Add explicit snapshot `loading`, `ready`, and `unavailable` states with a
  retry action. Connection state must remain separate from snapshot state.
- Remove product-facing fixture controls such as `Preview join outcomes` and
  `Explore participant states`. The typed fixtures and initial props should
  remain available for development and tests without shipping debug UI.
- Make the pending-response fixture behavior explicitly represent a server
  confirmation rather than making a local timer appear authoritative.
- Keep the existing response branches intact: pending, accepted, rejected,
  reconnecting after acceptance, closed, hidden results, revealed results, and
  ended session.

### Host Lifecycle and Responsive Behavior

- The session editor currently exposes add, delete, reorder, and edit controls
  for non-draft sessions. Those actions must be guarded or hidden when the
  session is live or ended; permitted history/results actions should remain.
- The live control room currently stacks the secondary rail on mobile. Move
  sharing, presence, and session tools behind a compact mobile sheet, drawer,
  or tab while keeping the active poll and its controls visible.
- Add explicit participant-result visibility and host-result visibility fields
  to ended-session history data. Hosts should still see results that were never
  revealed to Participants, while the UI should make that distinction clear.
- Fix the zero-response result eyebrow so an open-ended zero-response poll is
  not labeled as a single-choice poll.

### Accessibility and Shared Composition

- `Brand` currently suppresses the global focus outline with
  `focus-visible:outline-none`; restore a visible focus treatment.
- Poll type controls and dashboard filters currently use tab roles without full
  tabpanel and keyboard semantics. Use a labeled radio/button group or
  implement complete tabs.
- Share-panel copy feedback currently shows success even when clipboard access
  is unavailable or rejected. Only show `Copied` after a successful write and
  show a recoverable error otherwise.
- The three authentication pages duplicate a presentational split shell. A
  shared, domain-neutral auth shell would reduce duplication without moving auth
  behavior out of the owning pages.
- Decide whether all page icons should use the typed shared icon API or whether
  direct named Lucide imports are the project-wide strategy. The current code
  uses both approaches.

### Architecture Decisions to Resolve

- The app has a custom lightweight router while `@tanstack/react-router`
  remains an installed but unused dependency. Decide whether to keep the small
  router and remove the unused dependency, or migrate the route registry to the
  existing TanStack Router stack.
- The migration guide recommends app-owned global styles under `app/`, while
  the current token source and baseline remain in `src/index.css`. Decide
  whether to move the stylesheet or document `index.css` as the deliberate
  token-and-baseline entrypoint.

## Production Integration Still Needed

The following work is outside the completed static-design migration and should
be treated as a separate implementation phase:

- Host authentication and magic-link request/verification API calls.
- Session creation, loading, lifecycle transitions, and server validation.
- Poll creation, editing, ordering, locking, and persistence.
- Participant Room Code resolution and session-local identity persistence.
- Server-confirmed response submission and retry behavior.
- Realtime session snapshots, result updates, presence, reconnect, and resync.
- Server-authoritative visibility rules for participant and host results.
- Error handling for deleted sessions, stale commands, unavailable services, and
  authorization failures.
- Automated frontend tests for route composition, form validation, state
  branches, privacy rules, and response/connection independence.

## Recommended Continuation Order

1. Fix participant routing and preserve the session-local display name.
2. Add participant loading/unavailable recovery and remove shipped fixture
   controls.
3. Guard the session editor for live and ended lifecycles.
4. Add the mobile live-room tools surface and correct ended-history visibility
   metadata.
5. Fix focus, group semantics, clipboard feedback, and zero-response labeling.
6. Resolve the router, global stylesheet, and icon-strategy decisions.
7. Add API/realtime integration only after the server contracts are confirmed.
8. Add automated tests and perform full visual checks at 390px, 768px, 1024px,
   and 1440px in light and dark themes.

## Useful Commands

```bash
pnpm --filter frontend dev
pnpm lint
pnpm format:check
pnpm build
```

The next session should start by reading this file, then
`docs/design/static-design-to-react-migration.md`, and finally inspecting
`apps/frontend/src/app/routes.ts` plus the relevant page slice before making
changes.
