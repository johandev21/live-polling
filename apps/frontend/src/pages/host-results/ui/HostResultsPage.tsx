import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

import { Brand, StatusBadge, Surface } from '@/shared/ui';

import {
  hostPollTypeLabel,
  hostResultsFixture,
  type HostResultPoll,
} from '../model/host-results';
import { ChoiceResults } from './ChoiceResults';
import { EmptyResults } from './EmptyResults';
import { OpenEndedResults } from './OpenEndedResults';
import { PollStateCard } from './PollStateCard';

export type HostResultsPageProps = {
  initialPollId?: string;
};

function PollNavigation({
  onSelect,
  poll,
  polls,
}: {
  onSelect: (pollId: string) => void;
  poll: HostResultPoll;
  polls: readonly HostResultPoll[];
}) {
  return (
    <Surface as="section" aria-labelledby="poll-navigation-title" padding="md">
      <h2
        className="font-[var(--font-mono)] text-[10px] font-bold tracking-[0.14em] text-[var(--color-text-tertiary)]"
        id="poll-navigation-title"
      >
        POLL NAVIGATION
      </h2>
      <ul className="mt-3 space-y-2">
        {polls.map((item) => {
          const isCurrent = item.id === poll.id;

          return (
            <li key={item.id}>
              <button
                aria-current={isCurrent ? 'page' : undefined}
                className={
                  isCurrent
                    ? 'w-full rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] px-3 py-3 text-left text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                    : 'w-full rounded-[var(--radius-sm)] px-3 py-3 text-left text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)]'
                }
                onClick={() => onSelect(item.id)}
                type="button"
              >
                <span className="font-[var(--font-mono)] text-[10px] font-bold">
                  {String(item.number).padStart(2, '0')} ·{' '}
                  {hostPollTypeLabel(item.type)}
                </span>
                <span className="mt-1 block text-xs font-semibold leading-4">
                  {item.question}
                </span>
                <span className="mt-1 block text-[10px] text-[var(--color-text-tertiary)]">
                  {item.totalResponses} responses
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Surface>
  );
}

export function HostResultsPage({ initialPollId }: HostResultsPageProps = {}) {
  const [polls, setPolls] =
    useState<readonly HostResultPoll[]>(hostResultsFixture);
  const [selectedPollId, setSelectedPollId] = useState(
    initialPollId ?? hostResultsFixture[0]?.id ?? '',
  );

  const selectedPoll =
    polls.find((poll) => poll.id === selectedPollId) ?? polls[0];

  if (!selectedPoll) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-bg-canvas)] px-4">
        <Surface elevation="card" padding="lg">
          <p className="text-sm text-[var(--color-text-secondary)]">
            No results available.
          </p>
        </Surface>
      </main>
    );
  }

  function updateSelectedPoll(
    patch: Partial<Pick<HostResultPoll, 'lifecycle' | 'visibility'>>,
  ) {
    setPolls((currentPolls) =>
      currentPolls.map((poll) =>
        poll.id === selectedPoll.id ? { ...poll, ...patch } : poll,
      ),
    );
  }

  const previousPoll = polls.find(
    (poll) => poll.number === selectedPoll.number - 1,
  );
  const nextPoll = polls.find(
    (poll) => poll.number === selectedPoll.number + 1,
  );
  const isEmpty = selectedPoll.totalResponses === 0;

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-12">
          <Brand aria-label="Pulse home" size="md" />
          <div className="flex items-center gap-3 sm:gap-5">
            <a
              className="hidden text-xs font-semibold text-[var(--color-text-secondary)] underline-offset-4 hover:text-[var(--color-primary)] hover:underline sm:inline"
              href="/host/sessions/team-offsite/live"
            >
              Back to control room
            </a>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-soft)] px-3 py-2 font-[var(--font-mono)] text-[10px] font-bold text-[var(--color-success)]">
              <RefreshCw aria-hidden="true" size={14} strokeWidth={1.8} />
              <span className="hidden sm:inline">Live updates</span>
              <span className="sm:hidden">Live</span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 lg:px-12 lg:py-9">
        <header className="border-b border-[var(--color-border)] pb-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                  Team offsite · June 2025
                </h1>
                <StatusBadge label="Live session" tone="success" />
              </div>
              <p className="mt-3 text-sm font-semibold text-[var(--color-text-secondary)]">
                Poll {String(selectedPoll.number).padStart(2, '0')} of{' '}
                {String(polls.length).padStart(2, '0')} ·{' '}
                {selectedPoll.question}
              </p>
            </div>
            <p className="font-[var(--font-mono)] text-[11px] font-bold tracking-[0.14em] text-[var(--color-primary)]">
              HOST RESULTS
            </p>
          </div>
        </header>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="min-w-0">
            {isEmpty ? (
              <EmptyResults poll={selectedPoll} />
            ) : selectedPoll.type === 'open-ended' ? (
              <OpenEndedResults poll={selectedPoll} />
            ) : (
              <ChoiceResults poll={selectedPoll} />
            )}
          </div>

          <aside className="space-y-4">
            <PollStateCard
              onToggleLifecycle={() =>
                updateSelectedPoll({
                  lifecycle:
                    selectedPoll.lifecycle === 'open' ? 'closed' : 'open',
                })
              }
              onToggleVisibility={() =>
                updateSelectedPoll({
                  visibility:
                    selectedPoll.visibility === 'hidden'
                      ? 'revealed'
                      : 'hidden',
                })
              }
              poll={selectedPoll}
            />

            <Surface
              as="section"
              className="flex items-start gap-3"
              padding="md"
              tone="muted"
            >
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-[var(--color-primary)]"
                size={18}
                strokeWidth={1.8}
              />
              <p className="text-xs leading-5 text-[var(--color-text-secondary)]">
                Hosts can see results at any time, including results that remain
                hidden from participants.
              </p>
            </Surface>

            <PollNavigation
              onSelect={setSelectedPollId}
              poll={selectedPoll}
              polls={polls}
            />
          </aside>
        </div>

        <nav
          aria-label="Adjacent poll navigation"
          className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4 lg:max-w-[calc(100%-22rem-1.5rem)]"
        >
          <button
            className="inline-flex min-h-10 items-center gap-1 rounded-[var(--radius-sm)] px-2 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!previousPoll}
            onClick={() => previousPoll && setSelectedPollId(previousPoll.id)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={17} strokeWidth={1.8} />
            Previous poll
          </button>
          <span className="hidden max-w-md truncate text-center text-xs font-semibold text-[var(--color-text-secondary)] sm:block">
            {String(selectedPoll.number).padStart(2, '0')} ·{' '}
            {selectedPoll.question}
          </span>
          <button
            className="inline-flex min-h-10 items-center gap-1 rounded-[var(--radius-sm)] px-2 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!nextPoll}
            onClick={() => nextPoll && setSelectedPollId(nextPoll.id)}
            type="button"
          >
            Next poll
            <ChevronRight aria-hidden="true" size={17} strokeWidth={1.8} />
          </button>
        </nav>
      </main>
    </div>
  );
}
