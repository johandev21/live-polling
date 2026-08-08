import { ArrowLeft, Clock3, LockKeyhole } from 'lucide-react';

import { Brand, ResultBar, StatusBadge, Surface } from '@/shared/ui';

import {
  type EndedHistoryPoll,
  type EndedSessionHistoryData,
} from '../model/ended-session-history';

export type EndedSessionHistoryPageProps = Readonly<{
  history?: EndedSessionHistoryData;
  isLoading?: boolean;
}>;

const pollTypeLabels = {
  'multiple-choice': 'Multiple-choice',
  'open-ended': 'Open-ended',
  'single-choice': 'Single-choice',
} as const;

function ChoicePollHistory({ poll }: { poll: EndedHistoryPoll }) {
  return (
    <ul className="flex flex-col gap-2">
      {poll.choiceResults.map((result) => (
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
  );
}

function OpenEndedPollHistory({ poll }: { poll: EndedHistoryPoll }) {
  return (
    <ol
      aria-label="Chronological open-ended responses"
      className="flex flex-col gap-2"
    >
      {poll.openEndedResponses.map((response) => (
        <li key={response.id}>
          <Surface
            className="flex items-start gap-3 bg-[var(--color-bg-canvas)] p-3"
            padding="none"
          >
            <Clock3
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-[var(--color-primary)]"
              size={16}
              strokeWidth={1.8}
            />
            <div className="min-w-0">
              <p className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)]">
                {response.submittedAt}
              </p>
              <blockquote className="mt-1 break-words text-sm leading-5 text-[var(--color-text-secondary)]">
                “{response.text}”
              </blockquote>
            </div>
          </Surface>
        </li>
      ))}
    </ol>
  );
}

function PollHistoryCard({ poll }: { poll: EndedHistoryPoll }) {
  return (
    <Surface as="article" className="flex flex-col gap-3 p-4" padding="none">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="min-w-0 break-words text-base font-bold text-[var(--color-text-primary)]">
          {String(poll.number).padStart(2, '0')} · {poll.prompt}
        </h3>
        <span className="shrink-0 font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)] sm:text-right">
          {pollTypeLabels[poll.type]} · {poll.totalResponses} responses
        </span>
      </header>

      {poll.type === 'open-ended' ? (
        <OpenEndedPollHistory poll={poll} />
      ) : (
        <ChoicePollHistory poll={poll} />
      )}

      {poll.type === 'multiple-choice' ? (
        <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
          Percentages may add up to more than 100% because participants could
          select multiple options.
        </p>
      ) : null}
    </Surface>
  );
}

function SessionTotals({ history }: { history: EndedSessionHistoryData }) {
  return (
    <Surface
      as="section"
      aria-labelledby="session-totals-heading"
      className="flex flex-col gap-5 p-6"
      elevation="card"
      padding="none"
      tone="inverse"
    >
      <h2
        className="font-[var(--font-mono)] text-[11px] font-bold tracking-[0.14em] text-[var(--color-text-on-primary-soft)]"
        id="session-totals-heading"
      >
        SESSION TOTALS
      </h2>
      <dl className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <dt className="font-[var(--font-mono)] text-2xl font-bold text-[var(--color-text-on-primary)]">
            {history.polls.length}
          </dt>
          <dd className="text-sm text-[var(--color-text-on-primary-muted)]">
            polls
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="font-[var(--font-mono)] text-2xl font-bold text-[var(--color-text-on-primary)]">
            {history.totalResponses}
          </dt>
          <dd className="text-sm text-[var(--color-text-on-primary-muted)]">
            total responses
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="font-[var(--font-mono)] text-2xl font-bold text-[var(--color-text-on-primary)]">
            {history.endedAt}
          </dt>
          <dd className="text-sm text-[var(--color-text-on-primary-muted)]">
            ended
          </dd>
        </div>
      </dl>
    </Surface>
  );
}

export function EndedSessionHistoryPage({
  history,
  isLoading = false,
}: EndedSessionHistoryPageProps = {}) {
  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-bg-canvas)] px-4">
        <Surface elevation="card" padding="lg">
          <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
            Loading session history...
          </p>
        </Surface>
      </main>
    );
  }

  if (!history) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-bg-canvas)] px-4">
        <Surface elevation="card" padding="lg">
          <p className="text-sm text-[var(--color-text-secondary)]">
            History is unavailable for this session.
          </p>
        </Surface>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <nav className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-16">
          <Brand aria-label="Pulse home" href="/" size="md" />
          <a
            className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-sm)] px-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-primary)]"
            href="/host/dashboard"
          >
            <ArrowLeft aria-hidden="true" size={15} strokeWidth={1.8} />
            Back to dashboard
          </a>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-7 px-4 py-7 sm:px-6 sm:py-10 lg:px-16">
        <header className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-6 lg:gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
              <h1 className="min-w-0 break-words text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                {history.sessionName}
              </h1>
              <StatusBadge label="Ended session" showDot tone="neutral" />
            </div>
            <p className="font-[var(--font-mono)] text-[11px] font-bold tracking-[0.14em] text-[var(--color-text-tertiary)]">
              READ-ONLY HISTORY
            </p>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Ended {history.endedAt} · {history.polls.length} polls ·{' '}
            {history.totalResponses} total responses
          </p>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section aria-labelledby="poll-history-heading" className="min-w-0">
            <h2
              className="mb-3 font-[var(--font-mono)] text-[11px] font-bold tracking-[0.14em] text-[var(--color-primary)]"
              id="poll-history-heading"
            >
              COMPLETE POLL HISTORY
            </h2>
            <div className="flex flex-col gap-3">
              {history.polls.map((poll) => (
                <PollHistoryCard key={poll.id} poll={poll} />
              ))}
            </div>
          </section>

          <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
            <SessionTotals history={history} />
            <Surface
              as="section"
              aria-labelledby="host-results-heading"
              className="flex items-start gap-3 p-4"
              padding="none"
            >
              <LockKeyhole
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-[var(--color-primary)]"
                size={17}
                strokeWidth={1.8}
              />
              <div>
                <h2
                  className="text-sm font-bold text-[var(--color-text-primary)]"
                  id="host-results-heading"
                >
                  Host-visible results
                </h2>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                  This session is read-only. Host results remain available,
                  including results that were never revealed to participants.
                </p>
              </div>
            </Surface>
            <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
              Poll controls are unavailable after a session ends.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
