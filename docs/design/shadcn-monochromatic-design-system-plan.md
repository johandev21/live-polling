# Shadcn-Only Monochromatic Design System Plan

## Outcome

Remove the remaining Pulse/custom design system from the frontend and make shadcn/ui's global semantic variables the only application styling system.

The finished application should be monochromatic:

- No teal, green, blue, orange, red, or other chromatic brand colors.
- No page-level hard-coded color values.
- No legacy `--color-*`, `--space-*`, custom radius, or custom shadow variables.
- No `var(--color-...)` classes in React components.
- No visual dependence on the old Pulse design library.
- All surfaces, text, borders, controls, focus rings, states, and charts use shadcn semantic tokens.

The application layout, route structure, responsive behavior, copy, domain behavior, and interaction behavior must remain unchanged. This is a design-system replacement, not a layout redesign.

## Current State

The frontend is `apps/frontend`.

The shadcn foundation already exists:

- Components: `apps/frontend/src/components/ui`
- `cn` utility: `apps/frontend/src/lib/utils.ts`
- Global stylesheet: `apps/frontend/src/index.css`
- shadcn configuration: `apps/frontend/components.json`
- Global `TooltipProvider`: `apps/frontend/src/app/entrypoint.tsx`
- Tailwind CSS v4 with `@theme inline` and OKLCH variables

The old system still exists primarily in `src/index.css` and page-level class names. It currently defines:

- Pulse canvas/surface/text/border/primary/status colors
- Light and dark `data-theme` color blocks
- Custom typography variables for Plus Jakarta Sans and JetBrains Mono
- Custom spacing variables
- Custom radii
- Custom card shadow
- A custom `data-theme` dark-mode mechanism alongside shadcn's `.dark` mechanism

The current stylesheet also contains shadcn variables, so the first priority is to eliminate the duplicate token source rather than layering another compatibility system on top.

## Non-Negotiable Rules

1. Use only shadcn semantic tokens for visual styling.
2. Use the existing shadcn component implementations in `src/components/ui`; do not regenerate or fork them for branding.
3. Use `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `bg-muted`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`, `border-border`, `border-input`, `ring-ring`, and related semantic utilities.
4. Use `cn` for conditional class composition.
5. Do not introduce aliases such as `--color-surface`, `--color-primary-soft`, `--color-text-secondary`, or `--surface-muted` as compatibility variables.
6. Do not use arbitrary color utilities such as `bg-[#...]`, `text-[#...]`, `border-[#...]`, or arbitrary `rgb()`, `hsl()`, and `oklch()` values in page components.
7. Do not use the old `var(--color-*)`, `var(--space-*)`, `var(--radius-sm)`, `var(--radius-md)`, `var(--radius-lg)`, or `var(--shadow-card)` variables.
8. Do not use `data-theme` as a second theme system. Use the shadcn `.dark` class mechanism only.
9. Do not add page-specific design primitives to `src/components/ui`.
10. Preserve semantic states and accessibility even though their colors become neutral.
11. Do not change API calls, routing, query hooks, mutation hooks, models, contracts, or server code.
12. Keep existing layout geometry: grids, max widths, spacing relationships, responsive breakpoints, and component placement.

## Canonical Token Contract

Use shadcn's Tailwind CSS v4 semantic variable contract. The global stylesheet should define the canonical variables below for `:root` and `.dark`:

```css
--background
--foreground
--card
--card-foreground
--popover
--popover-foreground
--primary
--primary-foreground
--secondary
--secondary-foreground
--muted
--muted-foreground
--accent
--accent-foreground
--destructive
--destructive-foreground
--border
--input
--ring
--chart-1 through --chart-5
--sidebar and sidebar companion variables
--radius
```

The existing `@theme inline` block should expose these variables as Tailwind utilities. Keep the shadcn structure and naming; do not add a second semantic naming layer.

### Neutral palette requirements

All non-transparent colors must have zero chroma. In OKLCH, this means the middle chroma value is `0`:

```css
--background: oklch(1 0 0);
--foreground: oklch(0.145 0 0);
--primary: oklch(0.205 0 0);
--primary-foreground: oklch(0.985 0 0);
--secondary: oklch(0.97 0 0);
--muted: oklch(0.97 0 0);
--muted-foreground: oklch(0.556 0 0);
--border: oklch(0.922 0 0);
--ring: oklch(0.708 0 0);
```

Apply the same neutral principle to dark mode, charts, sidebar tokens, and destructive tokens. `--destructive` must remain visually distinct through contrast and weight, not hue. `--chart-1` through `--chart-5` should be a grayscale progression so result charts remain distinguishable without color.

Transparency is allowed for borders and overlays when it is part of the shadcn component implementation, for example `oklch(1 0 0 / 10%)` in dark mode.

### Typography requirements

Use the font already selected by the shadcn setup, currently Geist Variable. Remove the old Plus Jakarta Sans and JetBrains Mono variables and any associated imports if they are no longer used. Do not preserve the old font variables under new names.

Use semantic Tailwind typography utilities and existing layout classes. Do not invent a replacement typography token system in CSS.

### State requirements

Neutral does not mean ambiguous. Preserve state communication using combinations of:

- `variant` and `size`
- text labels
- icons with accessible names
- borders and contrast
- `aria-*` attributes
- loading indicators
- disabled and focus-visible states
- pattern, weight, or layout differences for chart/result distinctions

Do not reintroduce hue solely to communicate success, warning, error, information, live, or ended states.

## Token Migration Map

Use this as a direction, not as a compatibility layer:

| Legacy usage | Replace with |
| --- | --- |
| `var(--color-bg-canvas)` | `bg-background` or `bg-muted` depending on the existing surface role |
| `var(--color-surface)` | `bg-card` or `bg-background` |
| `var(--color-surface-muted)` | `bg-muted` |
| `var(--color-text-primary)` | `text-foreground` |
| `var(--color-text-secondary)` | `text-muted-foreground` |
| `var(--color-text-tertiary)` | `text-muted-foreground` with an appropriate size/weight |
| `var(--color-text-on-primary)` | `text-primary-foreground` |
| `var(--color-border)` | `border-border` |
| `var(--color-primary)` | `bg-primary`, `text-primary`, or `border-primary` according to role |
| `var(--color-primary-soft)` | `bg-secondary` or `bg-accent` |
| `var(--color-success)` | semantic component variant plus neutral contrast |
| `var(--color-warning)` | `Alert`/`Badge` variant plus neutral contrast |
| `var(--color-error)` | `destructive` variant or `text-destructive` |
| `var(--color-info)` | `text-muted-foreground`, `border-border`, or an appropriate neutral variant |
| `var(--color-surface-success/warning/error/info)` | `bg-muted`, `bg-card`, or component variant |
| `var(--color-surface-inverse)` | `bg-foreground text-background` only where an inverse surface is required |
| `var(--space-*)` | Tailwind spacing utilities such as `p-4`, `gap-6`, `space-y-4` |
| `var(--radius-sm/md/lg)` | shadcn radius utilities such as `rounded-sm`, `rounded-md`, `rounded-lg` |
| `var(--shadow-card)` | shadcn component defaults; use `shadow-sm` only when the existing hierarchy requires elevation |
| `var(--font-sans)` | shadcn/global `font-sans` |
| `var(--font-mono)` | `font-mono` only where code-like content genuinely needs it |

Do not mechanically replace every old surface with `bg-background`. Preserve the existing visual hierarchy by choosing between `background`, `card`, `muted`, `secondary`, and `popover` based on semantic role.

## Execution Phases

### Phase 0: Baseline and inventory

Create a baseline before editing:

```powershell
pnpm --filter frontend build
pnpm --filter frontend test
pnpm --filter frontend lint
```

Capture a route/screenshot inventory for desktop and mobile. Record any existing failures separately from migration failures.

Search all legacy styling:

```powershell
rg -- "--color-|--space-|--radius-|--shadow-|var\(--color-|var\(--space-|var\(--radius-|var\(--shadow-|data-theme|Plus Jakarta|JetBrains|#[0-9a-fA-F]{3,8}|rgb\(|hsl\(|oklch\(" apps/frontend/src
```

Classify each match as global token definition, page styling, shared composition, chart styling, or legitimate third-party/component code.

### Phase 1: Replace the global stylesheet

One owner edits `apps/frontend/src/index.css`:

- Retain required imports: Tailwind, `tw-animate-css`, shadcn Tailwind CSS, and the selected font if still used.
- Remove the Pulse token block entirely.
- Remove duplicate `data-theme` and `prefers-color-scheme` custom token blocks.
- Keep only the shadcn semantic variable contract, in neutral OKLCH values.
- Keep `.dark` as the only dark theme selector.
- Keep minimal base normalization, `body` background/foreground, focus-visible behavior, reduced-motion behavior, and shadcn's global border/ring rules.
- Replace `var(--color-bg-canvas)` and `var(--color-text-primary)` on `html`, `body`, and `:root` with shadcn utilities or canonical variables.
- Ensure charts and sidebar variables are neutral too.

Do not update page class names in this phase except where required to keep the stylesheet compiling. Page token migration belongs to the page agents.

### Phase 2: Migrate page classes in parallel

After the global contract is established, use disjoint agents:

- **Agent A: Public/auth pages**
  - `src/pages/landing/**`
  - `src/pages/host-email-entry/**`
  - `src/pages/magic-link-confirmation/**`
  - `src/pages/invalid-magic-link/**`
  - `src/pages/join-by-room-code/**`
  - `src/pages/participant-name-entry/**`

- **Agent B: Host preparation pages**
  - `src/pages/create-session/**`
  - `src/pages/host-dashboard/**`
  - `src/pages/session-editor/**`
  - `src/pages/poll-builder/**`
  - `src/pages/edit-locked-poll/**`

- **Agent C: Live and result pages**
  - `src/pages/live-control-room/**`
  - `src/pages/host-results/**`
  - `src/pages/ended-session-history/**`

- **Agent D: Participant session**
  - `src/pages/participant-session/**`

Each page agent must:

- Replace old variable references with semantic shadcn classes.
- Remove arbitrary color utilities and hard-coded colors from owned files.
- Preserve layout geometry and behavior.
- Keep state distinctions through variants, labels, borders, contrast, icons, and structure rather than hue.
- Update owned tests only when role/name/state assertions need to reflect the shadcn primitives.
- Never edit `src/index.css`, another agent's page scope, `src/components/ui`, config, or package files.

### Phase 3: Migrate shared compositions

One owner handles only:

- `src/shared/ui/brand/**`
- `src/shared/ui/auth-shell/**`
- `src/shared/ui/connection-status/**`
- `src/shared/ui/index.ts`
- `src/app/route-fallback.tsx`

Replace old token references in these compositions. Keep `Brand`, `AuthShell`, and `ConnectionState` only if they remain meaningful application compositions. Do not retain legacy token aliases just to avoid editing these files.

### Phase 4: Remove the old system

After repository-wide search confirms no usage:

- Delete old custom token definitions from `src/index.css`.
- Delete unused legacy shared UI files.
- Remove obsolete font dependencies/imports.
- Remove obsolete CSS variables and comments.
- Remove unused class helpers or exports that existed only for the old system.
- Do not remove `class-variance-authority`, `clsx`, `tailwind-merge`, or shadcn dependencies used by generated components.

### Phase 5: Verify visual and behavioral parity

Run the full checks and compare screenshots at minimum for:

- Landing page
- Host email entry
- Host dashboard
- Session editor
- Poll builder
- Live control room
- Host results
- Participant name entry
- Participant active poll
- Participant response accepted state
- Ended session history

Check desktop and mobile widths. Verify light and `.dark` modes if dark mode is exposed or supported by the app.

## Agent Safety Rules

1. Only the global-style owner edits `src/index.css`.
2. Page agents edit only their assigned page directories.
3. Only the shared-composition owner edits `src/shared/ui` and `route-fallback.tsx`.
4. Only the integration owner edits package/config files.
5. Do not run repository-wide formatter fixes from a page agent.
6. Do not regenerate shadcn components.
7. Do not create compatibility aliases for old colors.
8. Do not resolve merge conflicts by restoring the old design system.
9. If a shared change is required, report it and stop at the boundary.
10. Every agent reports changed files, remaining legacy token references, tests, and blockers.

## Acceptance Criteria

### Global CSS

- [ ] `src/index.css` contains no Pulse token definitions.
- [ ] `src/index.css` uses shadcn semantic variables only.
- [ ] All defined theme colors are neutral grayscale values with zero OKLCH chroma, except transparency.
- [ ] Destructive and chart tokens are neutral as well.
- [ ] `.dark` is the only theme selector.
- [ ] Old typography, spacing, radius, and shadow variables are removed.

### React and Tailwind usage

- [ ] No page contains `var(--color-*)`, `var(--space-*)`, old radius variables, or old shadow variables.
- [ ] No page contains hard-coded color utilities or color functions.
- [ ] No page depends on a legacy design-system wrapper where a shadcn primitive is appropriate.
- [ ] Existing layout classes and responsive behavior remain intact.
- [ ] Existing interactions, callbacks, forms, loading states, and accessibility semantics remain intact.

### Repository cleanup

- [ ] No obsolete Pulse token definitions remain anywhere in `apps/frontend/src`.
- [ ] No `data-theme` styling mechanism remains.
- [ ] No obsolete font dependency remains.
- [ ] No unused old shared UI wrapper remains.
- [ ] `TooltipProvider` remains installed exactly once at the app root.

### Verification

- [ ] `pnpm --filter frontend build` passes.
- [ ] `pnpm --filter frontend test` passes.
- [ ] `pnpm --filter frontend lint` passes, with warnings reviewed.
- [ ] `pnpm --filter frontend format:check` passes or known pre-existing failures are documented.
- [ ] Final grep finds no legacy token references or hard-coded colors in page/shared UI code.
- [ ] Desktop and mobile screenshots show the same layout in a neutral monochromatic palette.

## Final Search Commands

Run from the repository root:

```powershell
rg -- "--color-|--space-|--radius-(sm|md|lg)|--shadow-card|var\(--color-|var\(--space-|var\(--radius-|var\(--shadow-card|data-theme|Plus Jakarta|JetBrains" apps/frontend/src
rg "bg-\[|text-\[|border-\[|outline-\[|#[0-9a-fA-F]{3,8}|rgb\(|hsl\(|oklch\(" apps/frontend/src/pages apps/frontend/src/shared apps/frontend/src/app
rg "@/shared/ui/(button|callout|centered-layout|field|icon|input|result-bar|status-badge|surface)" apps/frontend/src
```

The first two searches should return no matches except deliberate third-party or generated shadcn implementation cases explicitly reviewed by the integration owner. The final search should return no matches.
