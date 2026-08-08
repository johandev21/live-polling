import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

function Brand() {
  return <a aria-label="Pulse home" className="inline-flex items-center gap-2.5" href="/"><span aria-hidden="true" className="size-7 rounded-full bg-primary" /><span className="text-xl leading-none font-bold tracking-tight">pulse</span></a>;
}

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
    <Card aria-labelledby="poll-navigation-title" className="p-6">
      <h2
        className="font-mono text-[10px] font-bold tracking-[0.14em] text-muted-foreground"
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
                    ? 'w-full rounded-sm bg-secondary p-3 text-left text-primary ring-1 ring-primary'
                    : 'w-full rounded-sm p-3 text-left text-muted-foreground transition-colors hover:bg-muted'
                }
                onClick={() => onSelect(item.id)}
                type="button"
              >
                <span className="font-mono text-[10px] font-bold">
                  {String(item.number).padStart(2, '0')} ·{' '}
                  {hostPollTypeLabel(item.type)}
                </span>
                <span className="mt-1 block text-xs leading-4 font-semibold">
                  {item.question}
                </span>
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  {item.totalResponses} responses
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

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
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4">
        <Card className="p-8 sm:p-10">
          <p className="text-sm font-semibold text-muted-foreground">
            Loading results...
          </p>
        </Card>
      </main>
    );
  }

  const selectedPoll =
    polls.find((poll) => poll.id === selectedPollId) ?? polls[0];

  if (!selectedPoll) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4">
        <Card className="p-8 sm:p-10">
          <p className="text-sm text-muted-foreground">
            No results available.
          </p>
        </Card>
      </main>
    );
  }

  async function handleToggleLifecycle() {
    if (!onToggleLifecycle) return;
    try {
      await onToggleLifecycle(selectedPoll.id);
    } catch (err) {
      // Errors surface through the shared error banner below
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

  const previousPoll = polls.find(
    (poll) => poll.number === selectedPoll.number - 1,
  );
  const nextPoll = polls.find(
    (poll) => poll.number === selectedPoll.number + 1,
  );
  const isEmpty = selectedPoll.totalResponses === 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-360 items-center justify-between gap-4 p-4 sm:px-6 lg:px-12">
           <Brand />
          <div className="flex items-center gap-3 sm:gap-5">
            <a
              className="hidden text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-primary hover:underline sm:inline"
              href={`/host/sessions/${encodeURIComponent(sessionId)}/live`}
            >
              Back to control room
            </a>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-2 font-mono text-[10px] font-bold text-foreground">
              <RefreshCw aria-hidden="true" size={14} strokeWidth={1.8} />
              <span className="hidden sm:inline">Live updates</span>
              <span className="sm:hidden">Live</span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-360 px-4 py-7 sm:px-6 lg:px-12 lg:py-9">
        <header className="border-b border-border pb-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                  {sessionName}
                </h1>
                 <Badge variant="default"><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />Live session</Badge>
              </div>
              <p className="mt-3 text-sm font-semibold text-muted-foreground">
                Poll {String(selectedPoll.number).padStart(2, '0')} of{' '}
                {String(polls.length).padStart(2, '0')} ·{' '}
                {selectedPoll.question}
              </p>
            </div>
            <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-primary">
              HOST RESULTS
            </p>
          </div>
        </header>

        {errorMessage ? (
          <p
            aria-live="polite"
            className="mt-4 text-sm font-semibold text-destructive"
          >
            {errorMessage}
          </p>
        ) : null}

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
              onToggleLifecycle={handleToggleLifecycle}
              onToggleVisibility={handleToggleVisibility}
              poll={selectedPoll}
            />

             <Card className="flex items-start gap-3 border-0 bg-muted p-6">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-primary"
                size={18}
                strokeWidth={1.8}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Hosts can see results at any time, including results that remain
                hidden from participants.
              </p>
             </Card>

            <PollNavigation
              onSelect={setSelectedPollId}
              poll={selectedPoll}
              polls={polls}
            />
          </aside>
        </div>

        <nav
          aria-label="Adjacent poll navigation"
          className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4 lg:max-w-[calc(100%-22rem-1.5rem)]"
        >
          <button
            className="inline-flex min-h-10 items-center gap-1 rounded-sm px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!previousPoll}
            onClick={() => previousPoll && setSelectedPollId(previousPoll.id)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={17} strokeWidth={1.8} />
            Previous poll
          </button>
          <span className="hidden max-w-md truncate text-center text-xs font-semibold text-muted-foreground sm:block">
            {String(selectedPoll.number).padStart(2, '0')} ·{' '}
            {selectedPoll.question}
          </span>
          <button
            className="inline-flex min-h-10 items-center gap-1 rounded-sm px-2 text-xs font-semibold text-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
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
