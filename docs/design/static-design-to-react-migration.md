# Static Design to React Migration Guide

This document is the implementation guide for migrating the HTML/Tailwind files in
`static-design/` into the React frontend in `apps/frontend/`.

The goal is not to reproduce every HTML file as an isolated React component. The
goal is to preserve the visual language and product behavior while building a
small, readable component system that can represent multiple screens and states
without copy-paste.

## Decision Summary

- Treat the files in `static-design/` as visual references and state fixtures, not
  as React component boundaries.
- Keep `apps/frontend/src/index.css` as the design-token source of truth.
- Replace static hex values with semantic CSS variables. Do not copy colors into
  JSX or Tailwind class strings.
- Build one responsive React page for a flow. Do not create separate React pages
  for desktop, tablet, and mobile screenshots.
- Build one state-driven page for a flow. Do not create a route for every loading,
  empty, error, or connection screenshot.
- Follow Feature-Sliced Design v2.1: start in `pages/`, extract only confirmed
  reuse, keep shared UI free of business rules, and avoid adopting `widgets/`
  by default.
- Keep server-confirmed response state separate from connection state.
- Prefer semantic HTML and readable props over a literal translation of nested
  `<div>` elements.
- Migrate one vertical slice at a time and keep the application buildable after
  every slice.

## Current Repository Baseline

| Location | Current role | Migration implication |
| --- | --- | --- |
| `apps/frontend/src/App.tsx` | Temporary `Hello, Pulse Frontend!` shell | Replace with the app/router composition; do not put all pages in this file. |
| `apps/frontend/src/main.tsx` | React entrypoint; imports `index.css` | Move or reduce to the FSD `app` entrypoint when the folder structure is introduced. |
| `apps/frontend/src/index.css` | Tailwind import and Pulse design variables | Keep the variables, add only missing semantic tokens, and import global styles from `app`. |
| `apps/frontend/vite.config.ts` | Vite, React, and Tailwind CSS Vite plugin | Add FSD path aliases here when aliases are added to TypeScript. |
| `apps/frontend/package.json` | React 19, Tailwind CSS 4, TanStack Router/Form/Query, Base UI, Zod | Use the existing stack; do not introduce a second routing, form, or data-fetching pattern without a decision. |
| `screens-to-build.md` | Product-level screen and state inventory | Use it to verify coverage; use the HTML files for visual details. |
| `docs/design/mvp-design-brief.md` | Product behavior, vocabulary, accessibility, and responsive requirements | Behavior and product semantics take precedence over decorative details in a static fixture. |
| `docs/adr/0001-server-authoritative-live-state.md` | Server-authoritative live state | Never render an accepted response from connection state or an optimistic mutation alone. |
| `docs/adr/0002-session-local-participant-identity.md` | Session-local participant identity | Keep participant names and identity scoped to the participant flow and session. |

### Static HTML Differences To Account For

The static files are standalone HTML documents. They all:

- Load Tailwind from the CDN rather than the Vite Tailwind plugin.
- Disable Tailwind preflight with `corePlugins.preflight: false`.
- Add their own `box-sizing` rule and body margin reset.
- Load DM Sans and JetBrains Mono from Google Fonts.
- Use hard-coded hex colors that correspond to the current design tokens.
- Use fixed canvas dimensions such as `1440px`, `1024px`, `900px`, and `390px`.
- Use inline SVG path data for Lucide icons.
- Use `data-pencil-name` as a design annotation, not as application behavior.

The React application currently imports Tailwind through `@import 'tailwindcss';`
and does not load the Google Fonts link in `apps/frontend/index.html`. Resolve the
preflight and font differences before judging visual parity. Otherwise, a font
fallback or different default margin can look like a layout regression.

## Design Analysis

The screens share a small set of visual systems. The following grouping is the
recommended starting point for React page slices.

| Screen family | Static design files | React ownership | Reuse boundary |
| --- | --- | --- | --- |
| Marketing landing | `landing-page-desktop.html`, `landing-page-tablet.html`, `landing-page-mobile.html` | `pages/landing` | One responsive `LandingPage`; the three files are viewport references, not three routes. |
| Host authentication | `host-email-entry.html`, `magic-link-confirmation.html`, `invalid-magic-link.html` | `pages/host-email-entry`, `pages/magic-link-confirmation`, `pages/invalid-magic-link` | Share the visual auth shell and field primitives; keep flow-specific copy and behavior in each page until reuse is proven. |
| Host dashboard and session setup | `host-dashboard.html`, `create-session.html`, `session-editor.html`, `empty-session-editor.html`, `edit-locked-poll.html` | `pages/host-dashboard`, `pages/create-session`, `pages/session-editor`, `pages/edit-locked-poll` | Empty editor is a state of the session editor. Locked poll is a state of poll editing, not a different data model. |
| Poll builder | `poll-builder-single-choice.html`, `poll-builder-multiple-choice.html`, `poll-builder-open-ended.html` | `pages/poll-builder` | One builder page with a `pollType` model. Reuse the poll text field, action row, and shared field primitives; keep type-specific sections local initially. |
| Live host control | `live-control-room.html`, `share-session-panel.html`, `participant-presence-panel.html` | `pages/live-control-room` | The share and presence files are panel states opened from the control room. Do not create independent routes unless navigation requirements demand it. |
| Host results | `host-results-view-choice-poll.html`, `host-results-view-open-ended-poll.html`, `empty-results-zero-responses.html` | `pages/host-results` | One results page selects a choice result view, open-ended response view, or zero-response state from server data. |
| End-of-session host flow | `end-session-confirmation.html`, `ended-session-history.html` | `pages/live-control-room`, `pages/ended-session-history` | Confirmation is a dialog state from the live room. History is a read-only page. |
| Participant entry | `join-by-room-code.html`, `participant-name-entry.html` | `pages/join-by-room-code`, `pages/participant-name-entry` | Share form primitives and participant shell; keep join flow decisions in the page or a feature after a second consumer appears. |
| Participant waiting and poll | `participant-waiting-state.html`, `participant-single-choice-poll.html`, `participant-multiple-choice-poll.html`, `participant-open-ended-poll.html` | `pages/participant-session` | One participant session page selects waiting or poll content from the authoritative session snapshot and `poll.type`. |
| Participant response and connection states | `participant-response-accepted.html`, `participant-reconnecting-response-accepted.html`, `participant-reconnecting-split-status-variation.html`, `participant-poll-closed.html`, `participant-results-hidden.html`, `participant-results-revealed.html`, `participant-session-ended.html` | `pages/participant-session` | These are state variants of one participant flow. Keep response status and connection status as separate values. |

### Common Composition Patterns

The following structures recur across the files and should guide component
boundaries:

| Repeated structure | Examples in the designs | Initial placement |
| --- | --- | --- |
| Brand mark and wordmark | Landing, auth, host navigation, participant cards | `shared/ui/brand` |
| Centered canvas | Participant cards, auth content, panels, confirmations | `shared/ui/centered-layout` or a page-local wrapper if only one page needs it |
| Surface/card | Builder form, results cards, live poll, empty states, history items | `shared/ui/surface` |
| Primary, secondary, and text actions | Create session, join, submit, copy, reveal, close | `shared/ui/button` |
| Status pill with dot and label | Draft, live, open, closed, ended, revealed, synchronized, reconnecting | `shared/ui/status-badge` |
| Label, control, helper text, validation | Email, room code, session name, poll text, response input | `shared/ui/field` and `shared/ui/input` |
| Informational callout | Draft notice, response reliability note, recovery note, privacy guidance | `shared/ui/callout` |
| Horizontal result bar | Landing preview, live room, host results, participant results, ended history | `shared/ui/result-bar` |
| Connection indicator | Connected, synchronized, reconnecting, stale/resyncing | `shared/ui/connection-status` |
| Initial avatar or participant row | Host dashboard and presence panel | Keep presence behavior page-owned; extract only the presentational avatar if reused. |
| Poll context header | Participant poll cards and result pages | Keep the first implementation page-local; extract after the same API is used in multiple pages. |
| Choice option row | Builder options and participant radio/checkbox options | Do not force these into one component prematurely. Their semantics and interactions differ. |

### What Should Not Be Shared Yet

These blocks look similar but have different responsibilities or are currently
used by one route:

- `LandingHero` and its preview composition.
- `HostDashboardHeader` and dashboard filtering logic.
- `SessionEditor` and its poll reorder behavior.
- `PollBuilder` type-specific form sections.
- `LiveControlRoom` two-column composition.
- `ParticipantPollCard` and its server response lifecycle.
- `ResultsDetailRail` and host-only result controls.
- `EndedPollHistoryItem` if it is only used by the history page.

Keep these inside their page slices. Extract a block only when the same code is
actively used in at least two places, the usages do not always change together,
and the component has a focused API.

## FSD Target Structure

Start with the smallest useful FSD structure. `features/` and `entities/` are
optional and should not be created empty.

```text
apps/frontend/src/
  app/
    entrypoint.tsx
    router.tsx
    providers/
      query-provider.tsx
    styles/
      index.css
  pages/
    landing/
      ui/
        LandingPage.tsx
      index.ts
    host-email-entry/
      ui/
        HostEmailEntryPage.tsx
      model/
        host-email-entry.ts
      index.ts
    magic-link-confirmation/
      ui/
        MagicLinkConfirmationPage.tsx
      index.ts
    invalid-magic-link/
      ui/
        InvalidMagicLinkPage.tsx
      index.ts
    host-dashboard/
      ui/
        HostDashboardPage.tsx
      model/
        host-dashboard.ts
      index.ts
    create-session/
      ui/
        CreateSessionPage.tsx
      model/
        create-session.ts
      index.ts
    session-editor/
      ui/
        SessionEditorPage.tsx
        EmptySessionEditor.tsx
      model/
        session-editor.ts
      index.ts
    poll-builder/
      ui/
        PollBuilderPage.tsx
        PollTypeTabs.tsx
        ChoicePollFields.tsx
        OpenEndedPollFields.tsx
      model/
        poll-builder.ts
      index.ts
    edit-locked-poll/
      ui/
        EditLockedPollPage.tsx
      index.ts
    live-control-room/
      ui/
        LiveControlRoomPage.tsx
        ShareSessionPanel.tsx
        ParticipantPresencePanel.tsx
        EndSessionDialog.tsx
      model/
        live-control-room.ts
      index.ts
    host-results/
      ui/
        HostResultsPage.tsx
        ChoiceResults.tsx
        OpenEndedResults.tsx
        EmptyResults.tsx
      index.ts
    ended-session-history/
      ui/
        EndedSessionHistoryPage.tsx
      index.ts
    join-by-room-code/
      ui/
        JoinByRoomCodePage.tsx
      model/
        join-by-room-code.ts
      index.ts
    participant-name-entry/
      ui/
        ParticipantNameEntryPage.tsx
      index.ts
    participant-session/
      ui/
        ParticipantSessionPage.tsx
        ParticipantWaitingState.tsx
        ParticipantPoll.tsx
        ParticipantResponseState.tsx
      model/
        participant-session.ts
      index.ts
  shared/
    ui/
      brand/
      button/
      callout/
      centered-layout/
      connection-status/
      field/
      input/
      result-bar/
      status-badge/
      surface/
    lib/
      class-names.ts
      format-count.ts
    api/
      client.ts
    auth/
      token.ts
    config/
      routes.ts
```

This tree is a starting point, not a requirement to create every file on day
one. Create a folder when it has an implementation. Do not create empty
`features/`, `entities/`, or `widgets/` directories.

### Layer Responsibilities

| Layer | Put here | Do not put here |
| --- | --- | --- |
| `app` | Router, providers, global styles, theme initialization, global error boundaries, entrypoint | Poll-specific forms, session-specific API behavior, page markup |
| `pages` | Route-level composition, page-specific UI, page-specific forms, local state, local API calls | Confirmed multi-page features or generic UI infrastructure |
| `features` | A reusable user interaction used in two or more pages, such as a confirmed response submission flow | A presentational card used once, or a speculative future interaction |
| `entities` | A reusable business domain model used in two or more pages/features, such as a stable poll model | A type copied from one API response, generic CRUD, or auth tokens |
| `shared` | Generic UI primitives, API client setup, auth token storage, utilities, global design assets | Session rules, poll lifecycle rules, response acceptance rules, business calculations |
| `widgets` | Existing legacy blocks only, if there is a concrete reason to keep them | New screen compositions by default |

### Import Rules

Imports may only move downward through the layers:

```text
app -> pages -> features -> entities -> shared
```

The following are required:

- A slice may import only from lower layers.
- Slices on the same layer may not import each other directly.
- Every page, feature, or entity slice exposes its public API through `index.ts`.
- Consumers import from `@/pages/poll-builder`, not from
  `@/pages/poll-builder/ui/PollBuilderPage`.
- Shared segments expose their own entrypoints, such as `@/shared/ui` or
  `@/shared/api`; do not create one miscellaneous top-level shared barrel.
- Use domain-based filenames such as `poll-builder.ts` or `fetch-session.ts`,
  not catch-all files named `types.ts`, `utils.ts`, or `helpers.ts`.

Example:

```tsx
// Allowed: a page composes lower-layer UI.
import { ResultBar } from '@/shared/ui/result-bar';

// Allowed: a page imports a feature through its public API.
import { SubmitResponse } from '@/features/submit-response';

// Not allowed: bypassing a slice public API.
import { PollBuilderPage } from '@/pages/poll-builder/ui/PollBuilderPage';
```

### Path Alias Setup

The current project has no FSD aliases. Add the same aliases to
`apps/frontend/tsconfig.app.json` and `apps/frontend/vite.config.ts`.

TypeScript configuration:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/app/*": ["src/app/*"],
      "@/pages/*": ["src/pages/*"],
      "@/features/*": ["src/features/*"],
      "@/entities/*": ["src/entities/*"],
      "@/shared/*": ["src/shared/*"]
    }
  }
}
```

Vite configuration should resolve the same locations. Because this project is
ESM, prefer `fileURLToPath` rather than assuming `__dirname` exists:

```ts
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@/app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@/pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@/features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@/entities': fileURLToPath(new URL('./src/entities', import.meta.url)),
      '@/shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    },
  },
});
```

Only add aliases for layers that contain code. It is acceptable to start with
`@/app`, `@/pages`, and `@/shared`.

## Design Token Contract

`apps/frontend/src/index.css` already defines the core Pulse tokens. These
variables are the contract between the designs and React components.

### Existing Token Mapping

| Static design value | Existing token | Use in React |
| --- | --- | --- |
| `#F3F6F5` | `--color-bg-canvas` | Page background and input background |
| `#FCFDFC` | `--color-surface` | Cards, panels, and elevated surfaces |
| `#E8F0EE` | `--color-surface-muted` | Muted surfaces, neutral status backgrounds, tracks |
| `#173034` | `--color-text-primary` | Headings, primary labels, content |
| `#566C6D` | `--color-text-secondary` | Supporting text and secondary labels |
| `#819291` | `--color-text-tertiary` | Hints, metadata, and low-emphasis text |
| `#D3DFDC` | `--color-border` | Borders and dividers |
| `#1B4C50` | `--color-primary` | Primary actions, accent text, result fills |
| `#E0EFEC` | `--color-primary-soft` | Selected surfaces and positive informational surfaces |
| `#2F7A63` | `--color-success` | Accepted, open, live, and synchronized states |
| `#A66C32` | `--color-warning` | Draft and reconnecting states |
| `#A94C4C` | `--color-error` | Invalid, rejected, or destructive states |
| `#3F7180` | `--color-info` | Informational states when the design calls for a distinct tone |
| DM Sans | `--font-sans` | Default UI and body type |
| JetBrains Mono | `--font-mono` | Room codes, counts, metadata, eyebrows, and status metadata |
| `4px` through `40px` | `--space-1` through `--space-8` | Repeated spacing decisions |
| `8px`, `12px`, `16px` | `--radius-sm`, `--radius-md`, `--radius-lg` | Repeated corner radii |

### Missing Semantic Tokens

The static designs also use values that are not currently represented in
`index.css`, including white-on-primary text, inverse text on the dark teal
panels, success/warning/error surface colors, translucent inverse surfaces, and
card shadows.

Before migrating those states, add semantic variables rather than repeating
the raw values in components. Names should describe purpose, not the current
hex value. A possible starting set is:

```css
:root {
  --color-text-on-primary: #ffffff;
  --color-text-on-primary-muted: #d6eae6;
  --color-text-on-primary-soft: #c7e4de;
  --color-surface-success: #e7f6f0;
  --color-surface-warning: #fff3e1;
  --color-surface-error: #f8e9e7;
  --color-surface-inverse-muted: rgb(255 255 255 / 0.1);
  --shadow-card: 0 12px 28px rgb(23 48 52 / 0.13);
}
```

The exact values must be checked against the designs and given dark-theme
values before release. Do not add both `--color-error-surface` and
`--color-surface-error`; choose one naming convention and use it consistently.

### Using Variables With Tailwind CSS 4

Prefer the Tailwind CSS 4 CSS-variable shorthand when it is accepted by the
project's editor and formatter:

```tsx
<section className="border border-(--color-border) bg-(--color-surface) text-(--color-text-primary)">
  Content
</section>
```

The explicit arbitrary-value form is also valid and can be easier to recognize
when scanning code:

```tsx
<section className="border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]">
  Content
</section>
```

Pick one style for the frontend and use it consistently. Do not mix raw hex
values and variables in the same component. If a token is used often enough
that the class still feels noisy, hide the composition behind a named shared
component rather than creating a screen-specific CSS class for every variation.

### Global Base Styles

The current `index.css` contains variables but no explicit font registration or
application baseline. The app layer should own the global stylesheet. Keep the
baseline small and global:

```css
@import 'tailwindcss';

@layer base {
  :root {
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    background: var(--color-bg-canvas);
  }

  html {
    min-width: 320px;
    background: var(--color-bg-canvas);
  }

  body {
    min-width: 320px;
    min-height: 100vh;
    margin: 0;
    background: var(--color-bg-canvas);
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }
}
```

Do not copy the standalone HTML `box-sizing` and body reset into every page.
Tailwind preflight already supplies a baseline; any application-specific
override belongs in the app stylesheet once.

### Fonts

The static files load DM Sans and JetBrains Mono, but the current React
`index.html` does not. Choose one app-wide loading strategy:

- Prefer self-hosted `woff2` files under `app/fonts/` when the product owns the
  font assets.
- If external loading is intentionally allowed, add the font loading at the app
  entrypoint or `index.html`, not to each page.
- Verify the computed font in browser developer tools before comparing widths,
  line breaks, and card heights.

Global fonts and global CSS belong to `app/` under FSD. A font used by exactly
one feature may remain local, but that is not the case for the Pulse typography.

## Readable Tailwind and React Patterns

### Convert Repeated Utility Groups Into Named Components

Do not start by adding a large `@apply` layer or a generic `components.css`
file. Use named React components for repeated semantic units.

```tsx
import type { HTMLAttributes } from 'react';

const surfaceClassName = [
  'rounded-[var(--radius-lg)]',
  'border border-[var(--color-border)]',
  'bg-[var(--color-surface)]',
].join(' ');

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  padding?: 'none' | 'sm' | 'md';
};

const paddingClassName = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
} as const;

export function Surface({ padding = 'md', className, ...props }: SurfaceProps) {
  return (
    <div
      className={[surfaceClassName, paddingClassName[padding], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
```

The component names the visual responsibility. It does not know about sessions,
polls, responses, or server state, so it can remain in `shared/ui`.

### Use Complete Class Maps For Variants

Tailwind scans source strings. Do not construct class names from arbitrary data:

```tsx
// Avoid. The generated class may not be present in the Tailwind output.
const className = `bg-${tone}-500`;
```

Use a complete, statically visible map:

```tsx
type StatusTone = 'neutral' | 'success' | 'warning' | 'error';

const statusClasses = {
  neutral: 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]',
  success: 'bg-[var(--color-surface-success)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-surface-warning)] text-[var(--color-warning)]',
  error: 'bg-[var(--color-surface-error)] text-[var(--color-error)]',
} satisfies Record<StatusTone, string>;
```

Keep domain-to-tone mapping outside the generic component. For example, a page
may map `Draft Session` to `warning`, while `StatusBadge` only understands
visual tones.

### Use Semantic Elements

The static designs use many `<div>` elements for visual grouping. React code
should use the element that matches the behavior:

| Static pattern | React replacement |
| --- | --- |
| Clickable `<div>` | `<button type="button">` for an action, or `<a>` for navigation |
| Text field drawn as a `<div>` | A labeled `<input>` or `<textarea>` |
| Type selector drawn as boxes | A tablist, radio group, or native select matching the interaction |
| Status text only | A status element with text and a non-color cue |
| Result rows | A list or section with headings and accessible values |
| Modal/panel close SVG | A real button with an accessible label and focus behavior |

Use `data-pencil-name` only during visual debugging if it is useful. It is not a
substitute for an accessible name, test id, or component API.

### Use Props For Data, Not Duplicated Markup

The repeated result rows in the designs should be rendered from data:

```tsx
type ResultBarData = {
  id: string;
  label: string;
  count: number;
  percentage: number;
};

type ResultBarListProps = {
  results: ResultBarData[];
};

export function ResultBarList({ results }: ResultBarListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {results.map((result) => (
        <li key={result.id}>
          {/* ResultBar owns the visual track; the page owns the result data. */}
          <ResultBar {...result} />
        </li>
      ))}
    </ul>
  );
}
```

Use stable domain ids for keys. Do not use the array index for poll options,
responses, or poll history items when order can change.

### Keep Generic Components Dumb

`shared/ui/StatusBadge` may accept `label` and `tone`. It must not decide that a
poll is open by importing a poll model. `shared/ui/ResultBar` may receive a
percentage. It must not calculate effective responses or decide who may view
the result.

Business rules belong in the page, feature, or entity that owns them. This keeps
shared components readable and prevents hidden coupling between host and
participant flows.

### Keep State Separate By Concern

Do not model every visual variation as one overloaded `status` string. Use
separate values:

```ts
type SessionLifecycle = 'draft' | 'live' | 'ended';
type PollLifecycle = 'configured' | 'open' | 'closed';
type ResultVisibility = 'hidden' | 'revealed';
type ResponseState = 'none' | 'pending' | 'accepted' | 'rejected';
type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'synchronized'
  | 'stale';
```

This is required for the participant reconnect designs. A participant can have
`responseState: 'accepted'` and `connectionState: 'reconnecting'` at the same
time. Reconnecting must not change an accepted response to pending or rejected.

### Prefer Explicit State Branches

Use an early return or a small state switch for materially different screens.
Avoid a single component with deeply nested ternaries:

```tsx
function ParticipantSessionPage() {
  const snapshot = useParticipantSessionSnapshot();

  if (snapshot.kind === 'loading') {
    return <ParticipantLoadingState />;
  }

  if (snapshot.kind === 'error') {
    return <ParticipantErrorState error={snapshot.error} />;
  }

  if (snapshot.session.lifecycle === 'ended') {
    return <ParticipantSessionEnded session={snapshot.session} />;
  }

  if (!snapshot.session.activePoll) {
    return <ParticipantWaitingState session={snapshot.session} />;
  }

  return (
    <ParticipantPoll
      poll={snapshot.session.activePoll}
      response={snapshot.response}
      connection={snapshot.connection}
    />
  );
}
```

The example is intentionally page-level. It keeps the state transition visible
and lets the poll component focus on poll-type presentation.

## Migration Workflow

Follow these phases in order. Do not combine a folder migration, a visual
redesign, and a data-flow rewrite in one unreviewable change.

### Phase 0: Establish The Foundation

1. Confirm the font loading strategy and verify DM Sans and JetBrains Mono.
2. Keep the existing variables in `index.css`; add missing semantic surface,
   inverse, and shadow variables.
3. Add light and dark values for every new variable.
4. Add the small app-wide base styles once.
5. Decide the icon source. Do not duplicate the long inline SVG path data from
   every static file.
6. Add `@/app`, `@/pages`, and `@/shared` aliases to TypeScript and Vite.
7. Create an app entrypoint, router, and route-level page exports.
8. Replace `App.tsx` with a route composition instead of adding more screen
   conditionals to the temporary component.
9. Render one blank route through the new structure and run the build.

### Phase 1: Build The Small Shared UI Kit

Implement and visually check the following primitives before building complex
pages:

| Component | Required responsibility | Must not own |
| --- | --- | --- |
| `Brand` | Render the Pulse mark and wordmark with a size or context variant | Authentication, routing, or session data |
| `Button` | Render primary, secondary, quiet, and destructive visual variants; expose native button behavior | API calls or navigation decisions |
| `IconButton` | Render an icon-only action with an accessible label and focus state | Modal or panel state |
| `Surface` | Render border, background, radius, and optional padding | Domain-specific content |
| `StatusBadge` | Render a label, tone, and optional dot/icon | Mapping lifecycle values to product rules |
| `Field` | Render label, control slot, hint, and validation message | Form submission or validation schema |
| `TextInput` and `Textarea` | Render accessible native controls with the design tokens | Session or poll state |
| `Callout` | Render neutral, info, warning, or error supporting content | Deciding whether an error occurred |
| `ResultBar` | Render label, count, percentage, and proportional fill | Calculating result percentages |
| `ConnectionStatus` | Render a connection state without implying response acceptance | Owning the socket or query client |
| `CenteredCardLayout` | Provide a responsive centered canvas/card frame where it is truly generic | Participant or host business copy |

Each primitive should have a small prop surface and a stable visual contract.
Avoid adding props for every one-off spacing or color difference.

### Phase 2: Migrate The Public And Authentication Flows

#### Landing Page

Source files: `landing-page-desktop.html`, `landing-page-tablet.html`, and
`landing-page-mobile.html`.

1. Create one `LandingPage` component.
2. Preserve the shared nav, hero copy, two CTAs, trust note, and poll preview.
3. Convert the fixed 1440/1024/390 canvases into a responsive container.
4. Keep the tablet and mobile screenshots as viewport acceptance references.
5. Use the same button and brand primitives as the authenticated flows.
6. Do not branch on `window.innerWidth` to render three different trees.

#### Host Authentication

Source files: `host-email-entry.html`, `magic-link-confirmation.html`, and
`invalid-magic-link.html`.

1. Build a presentational auth split layout with a dark welcome panel and a
   light content area.
2. Pass welcome eyebrow, heading, body, assurance copy, and content as props or
   slots so the layout stays generic.
3. Use real labeled inputs and buttons in the email entry page.
4. Keep `sending`, `sent`, `rate-limited`, `expired`, and `invalid` as explicit
   page state values.
5. Preserve the email value when moving from email entry to confirmation.
6. Treat request-new-link cooldown as behavior, not as hard-coded text in the
   layout.

The auth layout can live in `shared/ui` if it has no auth logic. The magic-link
request, token handling, and navigation remain in the owning page or feature.

#### Join And Participant Name Entry

Source files: `join-by-room-code.html` and `participant-name-entry.html`.

1. Use a real form with a labeled Room Code input.
2. Normalize the Room Code for display and submission according to the product
   rule; show validation beside the field.
3. Keep invalid, draft-session, ended-session, and unavailable-server states
   explicit.
4. Use a separate name form with a clear explanation of session-local identity.
5. Do not require unique participant names.
6. Keep route handling in `app` and form state in the page until the join action
   is reused elsewhere.

### Phase 3: Migrate The Participant Session As One State-Driven Page

Source files: `participant-waiting-state.html`, the three participant poll type
files, and all participant response/connection/result files.

Use one page slice, `pages/participant-session`, with explicit view branches.

The page should select a view in this order:

1. Initial loading or snapshot error.
2. Session deleted, invalid, or ended.
3. Live session with no active poll: waiting state.
4. Active poll: choose the poll renderer by `poll.type`.
5. Within the active poll, render response state and result visibility without
   discarding the poll context.
6. Overlay or place `ConnectionStatus` separately from response state.

Poll type rules:

| Poll type | Control | Shared parts | Page-local behavior |
| --- | --- | --- | --- |
| Single-choice | Radio group | Poll header, option row surface, submit action, response hint | Exactly one selection and selected state |
| Multiple-choice | Checkbox group | Poll header, option row surface, submit action, response hint | Selection count and optional maximum |
| Open-ended | Textarea | Poll header, submit action, response hint, identity footer | Trimmed non-empty value and 500-character counter |

The participant designs specifically require these distinctions:

- Pending means the request has not been confirmed.
- Accepted means the server confirmed the response.
- Rejected means the server did not accept the response and the user needs a
  clear retry path.
- Reconnecting after acceptance means the response remains accepted while live
  updates catch up.
- Hidden results must not render aggregate values.
- Revealed participant results must never render participant names or individual
  open-ended responses.
- Closed polls must explain whether an earlier response was accepted.

### Phase 4: Migrate Host Setup And Poll Builder

Source files: `host-dashboard.html`, `create-session.html`,
`session-editor.html`, `empty-session-editor.html`, the three poll builder files,
and `edit-locked-poll.html`.

#### Host Dashboard

1. Render sessions from a typed list rather than copying session cards.
2. Represent Draft, Live, and Ended as filter state or grouped data.
3. Keep the empty session list as an explicit empty branch.
4. Use a semantic navigation/header and a real create-session button.

#### Create Session And Session Editor

1. Keep the session name form in the create-session page.
2. Render the preview from the current draft model, not duplicated placeholder
   markup.
3. Treat `empty-session-editor.html` as the zero-poll branch of the editor.
4. Render poll sequence rows with `.map()` and stable poll ids.
5. Keep reorder, edit, delete, and start actions in the page model or a feature
   once they are reused.
6. Disable start for a draft with no polls and explain why in visible copy.
7. Keep the participants-cannot-join notice tied to the session lifecycle.

#### Poll Builder

Use one `PollBuilderPage` with a typed model:

```ts

type PollType = 'single-choice' | 'multiple-choice' | 'open-ended';

type PollDraft = {
  type: PollType;
  text: string;
  options: string[];
  maximumSelections?: number;
  responseLimit?: number;
};
```

Implementation rules:

1. Keep the type selector in one page-local component because it is used by the
   one builder page, even though it has three screenshot references.
2. Share the poll text field and action row across all types.
3. Render choice options from an array with add/remove controls.
4. Keep single-choice and multiple-choice differences in their type-specific
   sections.
5. Render the maximum selection control only for multiple-choice polls.
6. Render the response limit and character counter only for open-ended polls.
7. Put validation messages beside the field they describe.
8. Preserve values when changing a validation state or when the server rejects a
   save.
9. Do not allow a poll with responses to enter the editable builder. Route it to
   the locked view.

#### Locked Poll

`edit-locked-poll.html` is a read-only projection of a poll with responses.

1. Render immutable text and options as content, not disabled inputs that look
   editable.
2. Explain that existing responses prevent editing.
3. Keep permitted lifecycle actions visible and separate from immutable fields.
4. Reuse the result bar for the host result preview.
5. Use an explicit read-only label and a real results navigation action.

### Phase 5: Migrate The Live Host Experience

Source files: `live-control-room.html`, `share-session-panel.html`,
`participant-presence-panel.html`, `host-results-view-choice-poll.html`,
`host-results-view-open-ended-poll.html`, `empty-results-zero-responses.html`,
`end-session-confirmation.html`, and `ended-session-history.html`.

#### Live Control Room

1. Make the active poll and its controls the primary visual region.
2. Keep Room Code, Invitation Link, Participant Count, presence access, and
   connection status as secondary controls.
3. Render the control room from the authoritative session snapshot.
4. Make open, close, reveal, hide, and end actions explicit buttons with clear
   labels.
5. Use `ConnectionStatus` for synchronized, reconnecting, and resyncing states.
6. Do not make a connection indicator imply that a response was accepted.
7. On smaller screens, move secondary panels to a drawer, sheet, or tab while
   keeping active poll controls visible.

#### Share And Presence Panels

1. Implement them as page-local panels first.
2. Use an accessible dialog or sheet primitive if they overlay the live room.
3. Give close controls an accessible name and restore focus to the trigger.
4. Treat copy success as a temporary UI state tied to the clipboard action.
5. Keep participant count explicitly approximate.
6. Do not display response details in the presence panel.

#### Host Results

Use one `HostResultsPage` and branch on `poll.type`:

- Choice polls render `ResultBar` rows, counts, percentages, and total response
  count.
- Multiple-choice results explain that percentages may add up to more than 100%.
- Open-ended polls render chronological response text and a total count.
- Zero responses render an empty result state, including a clear total of zero.
- Hosts can see results regardless of participant visibility settings.

The results page should be able to update live without stealing focus or
changing the host's current navigation context.

#### End Session And History

1. Render `end-session-confirmation.html` as a dialog state from the live room.
2. Explain the permanent consequences before the destructive action.
3. Use an explicit `End session` label, never `Continue` or `Confirm` alone.
4. After the server confirms the transition, render the ended history page.
5. Make all history controls read-only.
6. Reuse the result rows for choice poll history and the chronological list for
   open-ended history.
7. Keep host visibility separate from participant visibility in the data model.

## Responsive Implementation Rules

The static files describe four useful reference widths: 1440px desktop,
1024px tablet, 900/1000px centered participant/panel canvases, and 390px
mobile. They are not instructions to set fixed widths on the root element.

### Page Containers

Use fluid page containers with max-width constraints:

```tsx
<main className="min-h-screen bg-[var(--color-bg-canvas)] px-4 sm:px-6 lg:px-16">
  <div className="mx-auto w-full max-w-screen-2xl">...</div>
</main>
```

Convert static geometry as follows:

| Static utility | React/Tailwind direction |
| --- | --- |
| `w-[1440px]` root | `w-full`, `min-h-screen`, and a responsive `max-w-*` inner container |
| `h-[1000px]` root | Content-driven height or `min-h-screen`; allow scrolling when content exceeds the viewport |
| `w-[680px]` card | `w-full max-w-2xl` or a page-specific max width |
| `w-[920px]` auth content | `min-w-0 flex-1` on desktop, full width on mobile |
| `gap-[72px]` desktop split | Responsive gap such as `gap-8 lg:gap-16` after visual comparison |
| `overflow-hidden` root | Avoid unless it is required by an actual modal or crop; preserve vertical scrolling |
| fixed `h-[64px]` option | Use a minimum touch height such as `min-h-16` and allow wrapped labels |

### Marketing

- Desktop and tablet use a two-column hero when the content fits.
- Mobile stacks the hero copy and preview.
- Desktop navigation can show all links; mobile navigation should show only the
  actions that the design supports rather than forcing a compressed row.
- Keep CTA labels and the preview content data-driven, not duplicated in each
  viewport branch.

### Host Screens

- Desktop host screens can use a main column and secondary rail.
- At smaller widths, stack the columns or move secondary content into a sheet.
- Never let the room code, active poll controls, or response state become hidden
  behind an inaccessible hover interaction.
- Tables are not required for the current visual language; use cards and lists
  where the designs use cards and lists.

### Participant Screens

- Treat participant UI as mobile-first even when the static reference is a
  desktop canvas.
- Keep option rows and submit actions large enough for touch.
- Do not introduce horizontal scrolling for long session names, Room Codes, or
  response text.
- Let the card height grow with content; do not crop the form to the reference
  screenshot height.
- Account for virtual keyboards around open-ended response fields and submit
  actions.

### Responsive Verification

Check at least these widths after each page family:

- 390px portrait.
- 768px or the chosen tablet breakpoint.
- 1024px tablet/compact desktop.
- 1440px desktop.

Also check a narrow width with a long session name, a long poll option, and a
long open-ended response. Fixed `whitespace-nowrap` from a static fixture should
not be copied when it can cause clipping in the product.

## Forms, Validation, And Accessibility

The design brief targets WCAG 2.2 AA. Visual parity is incomplete if the screen
only looks correct with a mouse and placeholder content.

### Forms

- Give every input a visible or programmatically associated label.
- Use `htmlFor` and stable `id` values.
- Use native input types where possible: `email`, `text`, `radio`, `checkbox`,
  and `textarea`.
- Keep the form model and validation in the owning page's `model/` segment at
  first.
- Use Zod for shared constraints when the project adopts a schema at the page
  or feature boundary.
- Use TanStack Form consistently if the form requires field-level state,
  touched state, or submission coordination; do not mix several form-state
  approaches in one page.
- Preserve entered values when validation or server errors occur.
- Announce validation errors with `aria-describedby` and a live region when the
  message appears after submission.

### Actions And Focus

- Use real buttons for actions and real links for navigation.
- Give icon-only controls an accessible name.
- Provide a visible `:focus-visible` style that meets contrast requirements.
- Keep focus in the participant input while live result updates arrive.
- Move focus deliberately when a new poll becomes active, but do not steal focus
  from a participant who is typing.
- Respect `prefers-reduced-motion` for live transitions and reconnect feedback.

### Status And Color

- Never communicate a lifecycle or connection state by color alone.
- Pair status color with text and, where useful, a dot or icon.
- Do not use `success` for a response merely because a request started.
- Use explicit copy for accepted, rejected, reconnecting, stale, and waiting
  states.

### Privacy And Vocabulary

Use the product vocabulary from `CONTEXT.md` and the MVP design brief:

| Use | Avoid |
| --- | --- |
| Host | Presenter, organizer, admin |
| Participant | Attendee, user, voter |
| Session | Event, room, presentation |
| Room Code | Session ID, access code |
| Invitation Link | Share link, invite URL |
| Poll | Question, survey |
| Response | Vote, submission |
| Results | Analytics, leaderboard |
| Presence | Attendance |

Participants may see their own current response and aggregate revealed results,
but never other participant names or individual open-ended response text.

## State Modeling And Server Authority

The visual state matrix must reflect the backend authority rules, not just the
current browser connection.

### Participant State Matrix

| Server/session state | Connection state | Response state | Render |
| --- | --- | --- | --- |
| Snapshot loading | Any | Unknown | Loading state |
| Snapshot unavailable | Any | Unknown | Recovery/error state with retry |
| Live, no active poll | Connected or synchronized | None | Waiting state |
| Live, poll open | Connected | None or pending | Poll form; pending action state if submitting |
| Live, poll open | Connected | Accepted | Accepted response state with change action |
| Live, poll open | Reconnecting | Accepted | Accepted response plus reconnecting status; never say the response was lost |
| Live, poll open | Connected | Rejected | Rejection state with retry; do not render accepted copy |
| Poll closed | Any | Accepted before close | Closed state that confirms the response was accepted |
| Poll closed | Any | None or rejected | Closed state that does not imply acceptance |
| Live, results hidden | Any | Any | Hide aggregate results and explain when they will appear |
| Live, results revealed | Any | Any | Aggregate results only |
| Session ended | Any | Any | Ended session state; no more response actions |

### Host State Rules

- Draft sessions cannot be joined by participants.
- A session requires at least one poll before it can start.
- Only one poll is active at a time.
- Opening a poll closes the current active poll according to the server result.
- A poll with responses is immutable.
- Hosts can view results even when participants cannot.
- Ending a session is permanent and requires explicit confirmation.
- A successful response commit remains accepted even if realtime broadcasting
  fails.
- Reconnect and resync should fetch authoritative state and ignore stale events.

Do not hide a server failure behind a local optimistic state. When a command is
pending, render pending. When it is rejected, render rejected. When it is
accepted, render accepted.

## Icon And Asset Migration

The static files repeat inline SVG path data for Lucide icons. This is not a
readable React component boundary.

1. Choose one icon strategy for the frontend.
2. Wrap the strategy in a small `shared/ui/icon` API if icons are reused.
3. Pass a typed icon name and size rather than copying SVG path markup into each
   page.
4. Use `aria-hidden="true"` for decorative icons next to visible labels.
5. Give icon-only controls an accessible label.
6. Keep a page-specific icon asset next to its page if it is not actually reused.
7. Put global fonts and styles under `app/`; do not create a top-level catch-all
   `src/assets` segment.
8. Put Vite-served fixed-url assets such as favicons in `public/`.

Do not put business logic in an icon, asset, or generic UI component.

## Static HTML Conversion Checklist

Use this checklist for every source file before considering its migration
complete:

### Analyze

- Identify the route or page state represented by the file.
- Mark the page shell, navigation, main content, rails, cards, panels, and
  overlays.
- List every repeated row or item.
- Separate display data from interactive state.
- Identify which text is product copy and which text is fixture data.
- Note the reference viewport and responsive assumptions.

### Convert

- Replace the fixed root canvas with a responsive page container.
- Replace hard-coded colors with variables from `index.css`.
- Replace repeated markup with an array and `.map()`.
- Replace clickable `<div>` elements with buttons or links.
- Replace drawn fields with labeled native controls.
- Replace inline icons with the shared icon strategy.
- Replace `data-pencil-name` with meaningful component names or remove it.
- Preserve headings and landmark elements.
- Add explicit loading, error, empty, and disabled branches where the screen
  inventory requires them.

### Verify

- Check the design at the source viewport.
- Check 390px, 768px, 1024px, and 1440px widths as applicable.
- Check light theme and dark theme.
- Check keyboard-only navigation.
- Check focus visibility and modal focus restoration.
- Check screen-reader labels and status announcements.
- Check long text, zero responses, and empty lists.
- Check response acceptance versus reconnecting behavior.
- Run lint, formatting, and build commands.

## Recommended Implementation Order

Use this order to get useful end-to-end behavior early:

1. App baseline, aliases, fonts, tokens, and shared primitives.
2. Responsive landing page.
3. Host email entry, magic-link confirmation, and invalid-link recovery.
4. Room Code join and participant name entry.
5. Participant waiting state.
6. Participant poll page with single-choice, multiple-choice, and open-ended
   renderers.
7. Participant accepted, rejected, closed, hidden, revealed, reconnecting, and
   ended states.
8. Host dashboard and create-session page.
9. Session editor, empty editor, and poll sequence rows.
10. Poll builder with all three poll types and validation.
11. Locked poll view.
12. Live control room.
13. Share and presence panels.
14. Host choice/open-ended results and zero-response state.
15. End-session dialog and ended-session history.
16. Extraction pass for reuse that is now proven by actual consumers.
17. Architecture linting and final visual/accessibility verification.

This order deliberately builds the participant path before the most complex host
live view so response reliability and state semantics are exercised early.

## Extraction Rules During Implementation

Use the following decision tree for every proposed component:

| Question | Decision |
| --- | --- |
| Is it used by one page only? | Keep it in that page slice. |
| Is it a generic visual primitive with no business meaning? | Put it in `shared/ui` when it has a stable API. |
| Is it the same user action used in two or more pages? | Consider a `features` slice. |
| Is it the same business model used in two or more features/pages? | Consider an `entities` slice. |
| Does it contain page-specific composition and data fetching? | Keep it in `pages`. |
| Does it require imports from another same-layer slice? | Merge, compose from a higher layer, or move the shared part downward; do not add a direct cross-import casually. |
| Is reuse only hypothetical? | Do not extract yet. |

Acceptable duplication is better than a shared component with a vague API that
must support unrelated host and participant behavior. The target is not zero
duplication; the target is clear ownership and deliberate reuse.

## Verification Commands

Run checks from the repository root after each vertical slice:

```bash
pnpm --filter frontend lint
pnpm --filter frontend format:check
pnpm --filter frontend build
```

Run the workspace checks before a migration milestone:

```bash
pnpm lint
pnpm format:check
pnpm build
```

If the FSD surface grows beyond the initial minimal structure, add the official
Steiger linter and inspect its warnings:

```bash
pnpm --filter frontend add -D @feature-sliced/steiger
pnpm exec steiger apps/frontend/src
```

Resolve `insignificant-slice`, excessive slicing, upward imports, same-layer
cross-imports, and empty layers before declaring the migration complete.

## Definition Of Done

The migration is complete when all of the following are true:

- Every source file in `static-design/` is mapped to a page, page state, panel,
  dialog, or responsive reference.
- No viewport has its own duplicated page tree without a documented reason.
- No state screenshot has become an unnecessary route.
- Repeated visual primitives are implemented once in `shared/ui` with small
  prop APIs.
- Page-specific composition and behavior remain in `pages`.
- Features and entities exist only where actual reuse justifies them.
- FSD import direction and public APIs are respected.
- Core colors, typography, spacing, radii, and theme behavior come from
  `index.css` variables.
- The missing inverse/status/shadow tokens have light and dark values.
- DM Sans and JetBrains Mono are actually loaded and verified.
- Participant response acceptance is distinct from connection status.
- Host and participant visibility rules are enforced in the rendered states.
- Loading, error, empty, closed, hidden, revealed, reconnecting, and ended
  states are explicit and understandable.
- Core flows work with keyboard, touch, narrow screens, and reduced motion.
- `pnpm lint`, `pnpm format:check`, and `pnpm build` pass.
- Visual comparison has been performed at the reference viewports and at mobile
  and tablet widths.

## Reference Material

- `static-design/` for visual references and state fixtures.
- `screens-to-build.md` for the complete screen and state inventory.
- `docs/design/mvp-design-brief.md` for product behavior and accessibility.
- `apps/frontend/src/index.css` for the current Pulse design tokens.
- Feature-Sliced Design v2.1 guidance: https://fsd.how/
- React documentation for component composition and conditional rendering:
  https://react.dev/learn/thinking-in-react
- Tailwind CSS v4 documentation for theme variables and CSS-variable utilities:
  https://tailwindcss.com/docs/theme
