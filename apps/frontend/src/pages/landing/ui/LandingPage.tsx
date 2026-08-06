import { ArrowUpRight, LogIn } from 'lucide-react';

import { Brand, ResultBar, StatusBadge, Surface } from '@/shared/ui';

type PreviewResult = {
  count: number;
  id: string;
  label: string;
  percentage: number;
};

type WorkflowStep = {
  body: string;
  id: string;
  number: string;
  title: string;
};

const previewResults: readonly PreviewResult[] = [
  { count: 42, id: 'deep-work', label: 'Deep work', percentage: 58 },
  {
    count: 20,
    id: 'team-connection',
    label: 'Team connection',
    percentage: 27,
  },
  { count: 11, id: 'learning-time', label: 'Learning time', percentage: 15 },
];

const workflowSteps: readonly WorkflowStep[] = [
  {
    body: 'Add a name and your first poll.',
    id: 'create',
    number: '01',
    title: 'Create a session',
  },
  {
    body: 'Participants join from any phone, no account needed.',
    id: 'share',
    number: '02',
    title: 'Share the Room Code',
  },
  {
    body: "Keep control of the active poll and the room's attention.",
    id: 'move-on',
    number: '03',
    title: 'Open, reveal, move on',
  },
];

const primaryLinkClassName = [
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)]',
  'bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-text-on-primary)]',
  'transition-[filter,transform] hover:brightness-95 active:translate-y-px',
].join(' ');

const secondaryLinkClassName = [
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)]',
  'border border-[var(--color-border)] bg-transparent px-5 text-sm font-semibold',
  'text-[var(--color-text-primary)] transition-[background-color,transform]',
  'hover:bg-[var(--color-surface)] active:translate-y-px',
].join(' ');

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[var(--color-bg-canvas)]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
        <Brand aria-label="Pulse home" href="/" size="lg" />

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 text-sm text-[var(--color-text-secondary)] md:flex"
        >
          <a
            className="transition-colors hover:text-[var(--color-primary)]"
            href="#product"
          >
            Product
          </a>
          <a
            className="transition-colors hover:text-[var(--color-primary)]"
            href="#hosts"
          >
            For hosts
          </a>
          <a
            className="transition-colors hover:text-[var(--color-primary)]"
            href="#participants"
          >
            For participants
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            className="hidden text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-primary)] sm:inline-flex"
            href="/host/email"
          >
            Sign in
          </a>
          <a className={primaryLinkClassName} href="/host/email">
            <ArrowUpRight aria-hidden="true" size={16} strokeWidth={2} />
            <span className="hidden sm:inline">Create a session</span>
            <span className="sm:hidden">Create session</span>
          </a>
        </div>
      </header>

      <section
        aria-labelledby="landing-heading"
        className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-16 lg:px-12 lg:pb-24 lg:pt-20"
        id="hosts"
      >
        <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
          <p className="font-[var(--font-mono)] text-xs font-bold tracking-[0.16em] text-[var(--color-primary)]">
            LIVE POLLING, WITHOUT THE FRICTION
          </p>
          <h1
            className="max-w-xl text-[clamp(2.5rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--color-text-primary)]"
            id="landing-heading"
          >
            Make every voice part of the moment.
          </h1>
          <p className="max-w-xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
            Pulse helps hosts run focused, reliable polls while participants
            join in seconds - no account required.
          </p>
          <div className="flex w-full flex-wrap items-center justify-center gap-3 lg:justify-start">
            <a className={primaryLinkClassName} href="/host/email">
              <ArrowUpRight aria-hidden="true" size={16} strokeWidth={2} />
              Create a free session
            </a>
            <a className={secondaryLinkClassName} href="/join">
              <LogIn
                aria-hidden="true"
                className="text-[var(--color-primary)]"
                size={16}
              />
              Join with a Room Code
            </a>
          </div>
          <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
            No participant accounts · Server-confirmed responses · WCAG 2.2 AA
          </p>
        </div>

        <Surface
          as="article"
          aria-label="Live poll preview"
          className="w-full rounded-[1.5rem] p-5 sm:p-6"
          elevation="card"
          padding="none"
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full bg-[var(--color-success)]"
                />
                <p className="min-w-0 break-words text-sm font-semibold text-[var(--color-text-primary)]">
                  Team offsite · Pulse session
                </p>
              </div>
              <StatusBadge label="Open poll" tone="success" />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold leading-tight tracking-[-0.025em] text-[var(--color-text-primary)] sm:text-[1.65rem]">
                What should we make more time for?
              </h2>
              <p className="font-[var(--font-mono)] text-[0.68rem] text-[var(--color-text-tertiary)]">
                Single-choice poll · 03:42 remaining
              </p>
            </div>

            <ul className="flex flex-col gap-3">
              {previewResults.map((result) => (
                <li key={result.id}>
                  <Surface className="p-4" padding="none">
                    <ResultBar
                      ariaLabel={`${result.label}: ${result.percentage}%`}
                      count={result.count}
                      label={result.label}
                      percentage={result.percentage}
                    />
                  </Surface>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
              <p className="font-[var(--font-mono)] text-[0.68rem] text-[var(--color-text-tertiary)]">
                73 total responses
              </p>
              <p className="text-xs font-semibold text-[var(--color-warning)]">
                Results hidden from participants
              </p>
            </div>
          </div>
        </Surface>
      </section>

      <section
        aria-labelledby="proof-heading"
        className="bg-[var(--color-primary)] px-5 py-7 text-[var(--color-text-on-primary)] sm:px-8 lg:px-12"
        id="participants"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <h2
            className="text-center text-lg font-semibold sm:text-left"
            id="proof-heading"
          >
            Designed for the room you are in.
          </h2>
          <dl className="grid grid-cols-3 gap-5 text-center sm:gap-8 sm:text-left">
            <div>
              <dt className="font-[var(--font-mono)] text-lg font-bold">
                2 sec
              </dt>
              <dd className="text-xs text-[var(--color-text-on-primary-soft)]">
                to join
              </dd>
            </div>
            <div>
              <dt className="font-[var(--font-mono)] text-lg font-bold">0</dt>
              <dd className="text-xs text-[var(--color-text-on-primary-soft)]">
                accounts needed
              </dd>
            </div>
            <div>
              <dt className="font-[var(--font-mono)] text-lg font-bold">1</dt>
              <dd className="text-xs text-[var(--color-text-on-primary-soft)]">
                clear next action
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        aria-labelledby="workflow-heading"
        className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-14 sm:px-8 lg:px-12 lg:py-16"
        id="product"
      >
        <div>
          <p className="font-[var(--font-mono)] text-xs font-bold tracking-[0.16em] text-[var(--color-primary)]">
            FROM PROMPT TO PARTICIPATION
          </p>
          <h2
            className="mt-3 text-2xl font-bold tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-3xl"
            id="workflow-heading"
          >
            A calmer way to keep a room moving.
          </h2>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {workflowSteps.map((step) => (
            <Surface
              as="li"
              className="flex min-h-36 flex-col gap-2 p-5"
              key={step.id}
              padding="none"
            >
              <span className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-primary)]">
                {step.number}
              </span>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                {step.title}
              </h3>
              <p className="text-sm leading-5 text-[var(--color-text-secondary)]">
                {step.body}
              </p>
            </Surface>
          ))}
        </ol>
      </section>

      <footer className="bg-[var(--color-surface)] px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <p className="text-lg font-bold text-[var(--color-text-primary)]">
              Pulse for live moments.
            </p>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Present clearly. Listen instantly. Move forward together.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <p className="font-[var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">
              Ready when the room is.
            </p>
            <a className={primaryLinkClassName} href="/host/email">
              <ArrowUpRight aria-hidden="true" size={16} strokeWidth={2} />
              Create a free session
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
