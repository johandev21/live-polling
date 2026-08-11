import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';

import { ModeToggle } from '@/components/mode-toggle';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { GlassHeader } from '@/shared/ui/glass-header';


import {
  hostPollTypeLabel,
  type HostResultPoll,
} from '../model/host-results';
import { ChoiceResults } from './ChoiceResults';
import { EmptyResults } from './EmptyResults';
import { OpenEndedResults } from './OpenEndedResults';
import { PollStateCard } from './PollStateCard';

export type HostResultsPageProps = {
  errorMessage?: string | null;
  initialPollId?: string;
  isLoading?: boolean;
  onToggleLifecycle?: (pollId: string) => Promise<void> | void;
  onToggleVisibility?: (pollId: string) => Promise<void> | void;
  polls: readonly HostResultPoll[];
  sessionId: string;
  sessionName: string;
};

export function HostResultsPage({
  errorMessage,
  initialPollId,
  isLoading = false,
  onToggleLifecycle,
  onToggleVisibility,
  polls,
  sessionId,
  sessionName,
}: HostResultsPageProps) {
  const [selectedPollId, setSelectedPollId] = useState(initialPollId ?? '');

  if (isLoading) {
    return <LoadingState />;
  }

  const selectedPoll =
    polls.find((poll) => poll.id === selectedPollId) ?? polls[0];

  if (!selectedPoll) {
    return <EmptyState />;
  }

  const previousPoll = polls.find(
    (poll) => poll.number === selectedPoll.number - 1,
  );
  const nextPoll = polls.find(
    (poll) => poll.number === selectedPoll.number + 1,
  );

  async function handleToggleLifecycle() {
    if (!onToggleLifecycle) return;
    try {
      await onToggleLifecycle(selectedPoll.id);
    } catch (err) {
      void err;
    }
  }

  async function handleToggleVisibility() {
    if (!onToggleVisibility) return;
    try {
      await onToggleVisibility(selectedPoll.id);
    } catch (err) {
      void err;
    }
  }

  return (
    <div className="min-h-screen bg-mist-50 dark:bg-background text-foreground">
      <AppHeader sessionId={sessionId} />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <ResultsHeader
          poll={selectedPoll}
          pollCount={polls.length}
          sessionName={sessionName}
        />

        {errorMessage ? <ErrorMessage message={errorMessage} /> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="space-y-4">
            <PollQuestionHeader
              nextPoll={nextPoll}
              onSelectPoll={setSelectedPollId}
              pollCount={polls.length}
              previousPoll={previousPoll}
              selectedPoll={selectedPoll}
            />
            <ResultsPanel poll={selectedPoll} />
          </div>

          <aside className="space-y-4">
            <PollStateCard
              onToggleLifecycle={handleToggleLifecycle}
              onToggleVisibility={handleToggleVisibility}
              poll={selectedPoll}
            />
            <PollNavigation
              onSelect={setSelectedPollId}
              poll={selectedPoll}
              polls={polls}
            />
          </aside>
        </div>

        <AdjacentPollNavigation
          nextPoll={nextPoll}
          onSelectPoll={setSelectedPollId}
          previousPoll={previousPoll}
          selectedPoll={selectedPoll}
        />
      </main>
    </div>
  );
}

function AppHeader({ sessionId }: { sessionId: string }) {
  return (
    <GlassHeader>
      <div className="flex w-full items-center justify-between gap-4">
        <Brand />
        <div className="flex items-center gap-3 sm:gap-5">
          <a
            className="hidden text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-primary hover:underline sm:inline"
            href={`/host/sessions/${encodeURIComponent(sessionId)}/live`}
          >
            Back to control room
          </a>
          <LiveUpdatesBadge />
          <ModeToggle />
        </div>
      </div>
    </GlassHeader>
  );
}

function LiveUpdatesBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 font-mono text-[10px] font-bold text-foreground">
      <RefreshCw aria-hidden="true" size={13} strokeWidth={1.8} />
      <span className="hidden sm:inline">Live updates</span>
      <span className="sm:hidden">Live</span>
    </span>
  );
}

function ResultsHeader({
  poll,
  pollCount,
  sessionName,
}: {
  poll: HostResultPoll;
  pollCount: number;
  sessionName: string;
}) {
  return (
    <header className="border-b border-border pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {sessionName}
            </h1>
            <Badge variant="default">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-current"
              />
              Live session
            </Badge>
          </div>
        </div>
        <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-primary">
          HOST RESULTS
        </p>
      </div>

      <PollSummaryBar poll={poll} pollCount={pollCount} />
    </header>
  );
}

function PollSummaryBar({
  poll,
}: {
  poll: HostResultPoll;
  pollCount: number;
}) {
  let topOutcome = 'N/A';
  if (poll.totalResponses > 0) {
    if (poll.type === 'open-ended') {
      topOutcome = `${poll.openEndedResponses.length} entries`;
    } else if (poll.options.length > 0) {
      const sorted = [...poll.options].sort((a, b) => b.count - a.count);
      const top = sorted[0];
      if (top && top.count > 0) {
        const pct = Math.round((top.count / poll.totalResponses) * 100);
        topOutcome = `${top.label} (${pct}%)`;
      } else {
        topOutcome = 'No votes yet';
      }
    }
  }

  return (
    <div className="mt-5 grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-3.5 sm:grid-cols-4 sm:p-4">
      <div className="border-r border-border/40 pr-3 last:border-r-0 sm:pr-4">
        <span className="block font-mono text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          Total Responses
        </span>
        <span className="mt-1 block font-mono text-xl font-bold text-foreground sm:text-2xl">
          {poll.totalResponses}
        </span>
      </div>

      <div className="border-r border-border/40 pr-3 last:border-r-0 sm:pr-4">
        <span className="block font-mono text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          Poll Type
        </span>
        <span className="mt-1 block text-xs font-semibold text-foreground">
          {hostPollTypeLabel(poll.type)}
        </span>
      </div>

      <div className="border-r border-border/40 pr-3 last:border-r-0 sm:pr-4">
        <span className="block font-mono text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          Status & Visibility
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <Badge className="h-4 px-1.5 text-[9px]" variant={poll.lifecycle === 'open' ? 'default' : 'secondary'}>
            {poll.lifecycle}
          </Badge>
          <Badge className="h-4 px-1.5 text-[9px]" variant={poll.visibility === 'revealed' ? 'default' : 'secondary'}>
            {poll.visibility}
          </Badge>
        </div>
      </div>

      <div>
        <span className="block font-mono text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          Top Outcome
        </span>
        <span className="mt-1 block truncate text-xs font-semibold text-foreground">
          {topOutcome}
        </span>
      </div>
    </div>
  );
}

function PollQuestionHeader({
  nextPoll,
  onSelectPoll,
  pollCount,
  previousPoll,
  selectedPoll,
}: {
  nextPoll?: HostResultPoll;
  onSelectPoll: (pollId: string) => void;
  pollCount: number;
  previousPoll?: HostResultPoll;
  selectedPoll: HostResultPoll;
}) {
  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-primary">
            Poll {formatPollNumber(selectedPoll.number)} of {formatPollNumber(pollCount)}
          </span>
          <Badge variant="outline">{hostPollTypeLabel(selectedPoll.type)}</Badge>
        </div>
        <h2 className="mt-1 text-base font-bold text-foreground sm:text-lg">
          {selectedPoll.question}
        </h2>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          aria-label="Previous poll"
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!previousPoll}
          onClick={() => previousPoll && onSelectPoll(previousPoll.id)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={15} strokeWidth={1.8} />
          <span className="hidden sm:inline">Prev</span>
        </button>
        <span className="font-mono text-xs text-muted-foreground">
          {selectedPoll.number}/{pollCount}
        </span>
        <button
          aria-label="Next poll"
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!nextPoll}
          onClick={() => nextPoll && onSelectPoll(nextPoll.id)}
          type="button"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight aria-hidden="true" size={15} strokeWidth={1.8} />
        </button>
      </div>
    </Card>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p
      aria-live="polite"
      className="mt-4 text-xs font-semibold text-destructive"
    >
      {message}
    </p>
  );
}

function ResultsPanel({ poll }: { poll: HostResultPoll }) {
  if (poll.totalResponses === 0) return <EmptyResults poll={poll} />;
  if (poll.type === 'open-ended') return <OpenEndedResults poll={poll} />;
  return <ChoiceResults poll={poll} />;
}

function AdjacentPollNavigation({
  nextPoll,
  onSelectPoll,
  previousPoll,
  selectedPoll,
}: {
  nextPoll?: HostResultPoll;
  onSelectPoll: (pollId: string) => void;
  previousPoll?: HostResultPoll;
  selectedPoll: HostResultPoll;
}) {
  return (
    <nav
      aria-label="Adjacent poll navigation"
      className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-4 lg:max-w-[calc(100%-20rem-1.5rem)] xl:max-w-[calc(100%-22rem-1.5rem)]"
    >
      <button
        className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!previousPoll}
        onClick={() => previousPoll && onSelectPoll(previousPoll.id)}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={16} strokeWidth={1.8} />
        Previous poll
      </button>
      <span className="hidden max-w-md truncate text-center text-xs font-semibold text-muted-foreground sm:block">
        {formatPollNumber(selectedPoll.number)}: {selectedPoll.question}
      </span>
      <button
        className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border px-3 text-xs font-semibold text-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!nextPoll}
        onClick={() => nextPoll && onSelectPoll(nextPoll.id)}
        type="button"
      >
        Next poll
        <ChevronRight aria-hidden="true" size={16} strokeWidth={1.8} />
      </button>
    </nav>
  );
}

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
    <Card aria-labelledby="poll-navigation-title" className="p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2
          className="font-mono text-[10px] font-bold tracking-[0.14em] text-muted-foreground"
          id="poll-navigation-title"
        >
          SESSION POLLS ({polls.length})
        </h2>
      </div>
      <ul className="mt-3 space-y-1.5">
        {polls.map((item) => {
          const isCurrent = item.id === poll.id;

          return (
            <li key={item.id}>
              <button
                aria-current={isCurrent ? 'page' : undefined}
                className={
                  isCurrent
                    ? 'flex w-full items-start justify-between gap-3 rounded-md bg-secondary p-3 text-left text-primary ring-1 ring-primary/40'
                    : 'flex w-full items-start justify-between gap-3 rounded-md p-3 text-left text-muted-foreground transition-colors hover:bg-muted/60'
                }
                onClick={() => onSelect(item.id)}
                type="button"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold">
                      {formatPollNumber(item.number)}
                    </span>
                    <Badge className="h-4 px-1 text-[9px]" variant="outline">
                      {hostPollTypeLabel(item.type)}
                    </Badge>
                  </div>
                  <span className="mt-1 block truncate text-xs font-semibold leading-4">
                    Poll {formatPollNumber(item.number)}: {item.question}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-[10px] font-bold text-muted-foreground">
                  {item.totalResponses} resp
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function LoadingState() {
  return (
    <main className="grid min-h-screen place-items-center bg-mist-50 dark:bg-background px-4">
      <Card className="p-8 sm:p-10">
        <p className="text-sm font-semibold text-muted-foreground">
          Loading results...
        </p>
      </Card>
    </main>
  );
}

function EmptyState() {
  return (
    <main className="grid min-h-screen place-items-center bg-mist-50 dark:bg-background px-4">
      <Card className="p-8 sm:p-10">
        <p className="text-sm text-muted-foreground">
          No results available.
        </p>
      </Card>
    </main>
  );
}

function Brand() {
  return (
    <a
      aria-label="Pulse home"
      className="inline-flex items-center gap-2.5"
      href="/"
    >
      <span aria-hidden="true" className="size-7 rounded-full bg-primary" />
      <span className="text-xl leading-none font-bold tracking-tight">pulse</span>
    </a>
  );
}

function formatPollNumber(number: number): string {
  return String(number);
}

