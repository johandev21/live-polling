import {
  ChevronLeft,
  ChevronRight,
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
    <div className="min-h-screen bg-mist-50 text-foreground dark:bg-background">
      <AppHeader sessionId={sessionId} />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <ResultsHeader
          poll={selectedPoll}
          pollCount={polls.length}
          sessionName={sessionName}
        />

        {errorMessage ? <ErrorMessage message={errorMessage} /> : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <PollQuestionHeader
              nextPoll={nextPoll}
              onSelectPoll={setSelectedPollId}
              pollCount={polls.length}
              previousPoll={previousPoll}
              selectedPoll={selectedPoll}
            />
            <ResultsPanel poll={selectedPoll} />
          </div>

          <aside className="space-y-6">
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
      </main>
    </div>
  );
}

function AppHeader({ sessionId }: { sessionId: string }) {
  return (
    <GlassHeader>
      <div className="flex w-full items-center justify-between gap-4">
        <Brand />
        <div className="flex items-center gap-4 sm:gap-6">
          <a
            className="hidden text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline sm:inline"
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
    <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
      Live updates
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
    <header className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            HOST RESULTS
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {sessionName}
            </h1>
            <Badge variant="secondary" className="px-2.5 py-1 text-xs font-medium">
              Live session
            </Badge>
          </div>
        </div>
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
    <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/80 bg-card p-5 sm:grid-cols-3 sm:p-6">
      <div>
        <span className="block text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Total Responses
        </span>
        <span className="mt-1.5 block font-mono text-2xl font-bold text-foreground sm:text-3xl">
          {poll.totalResponses}
        </span>
      </div>

      <div>
        <span className="block text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Poll Type
        </span>
        <span className="mt-1.5 block text-sm font-medium text-foreground sm:text-base">
          {hostPollTypeLabel(poll.type)}
        </span>
      </div>

      <div>
        <span className="block text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Top Outcome
        </span>
        <span className="mt-1.5 block truncate text-sm font-medium text-foreground sm:text-base">
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
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-muted-foreground">
            Poll {formatPollNumber(selectedPoll.number)} of {formatPollNumber(pollCount)}
          </span>
          <Badge variant="outline" className="text-xs font-medium">
            {hostPollTypeLabel(selectedPoll.type)}
          </Badge>
        </div>
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">
          {selectedPoll.question}
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          aria-label="Previous poll"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!previousPoll}
          onClick={() => previousPoll && onSelectPoll(previousPoll.id)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={16} strokeWidth={1.8} />
          <span>Previous</span>
        </button>
        <button
          aria-label="Next poll"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!nextPoll}
          onClick={() => nextPoll && onSelectPoll(nextPoll.id)}
          type="button"
        >
          <span>Next</span>
          <ChevronRight aria-hidden="true" size={16} strokeWidth={1.8} />
        </button>
      </div>
    </Card>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p
      aria-live="polite"
      className="mt-4 text-sm font-medium text-destructive"
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
          className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          id="poll-navigation-title"
        >
          SESSION POLLS ({polls.length})
        </h2>
      </div>
      <ul className="mt-4 space-y-2">
        {polls.map((item) => {
          const isCurrent = item.id === poll.id;

          return (
            <li key={item.id}>
              <button
                aria-current={isCurrent ? 'page' : undefined}
                className={
                  isCurrent
                    ? 'flex w-full items-start justify-between gap-3 rounded-lg bg-secondary p-3.5 text-left text-primary ring-1 ring-primary/40'
                    : 'flex w-full items-start justify-between gap-3 rounded-lg p-3.5 text-left text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground'
                }
                onClick={() => onSelect(item.id)}
                type="button"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Poll {formatPollNumber(item.number)}
                    </span>
                    <Badge className="px-1.5 py-0.5 text-xs font-medium" variant="outline">
                      {hostPollTypeLabel(item.type)}
                    </Badge>
                  </div>
                  <span className="mt-1 block truncate text-sm font-medium leading-snug">
                    Poll {formatPollNumber(item.number)}: {item.question}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {item.totalResponses} {item.totalResponses === 1 ? 'resp' : 'resp'}
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
    <main className="grid min-h-screen place-items-center bg-mist-50 px-4 dark:bg-background">
      <Card className="p-8 sm:p-10">
        <p className="text-base font-medium text-muted-foreground">
          Loading results...
        </p>
      </Card>
    </main>
  );
}

function EmptyState() {
  return (
    <main className="grid min-h-screen place-items-center bg-mist-50 px-4 dark:bg-background">
      <Card className="p-8 sm:p-10">
        <p className="text-base font-medium text-muted-foreground">
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


