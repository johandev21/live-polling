import type { ReactNode } from 'react';
import { ArrowLeft, Clock3, LockKeyhole } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import {
  type EndedHistoryChoiceResult,
  type EndedHistoryPoll,
  type EndedHistoryResponse,
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

export function EndedSessionHistoryPage({
  history,
  isLoading = false,
}: EndedSessionHistoryPageProps = {}) {
  if (isLoading) {
    return (
      <CenteredNotice>
        <p className="text-sm font-semibold text-muted-foreground">
          Loading session history...
        </p>
      </CenteredNotice>
    );
  }

  if (!history) {
    return (
      <CenteredNotice>
        <p className="text-sm text-muted-foreground">
          History is unavailable for this session.
        </p>
      </CenteredNotice>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HistoryNavBar />
      <main className="mx-auto flex w-full max-w-(--breakpoint-2xl) flex-col gap-7 px-4 py-7 sm:px-6 sm:py-10 lg:px-16">
        <SessionSummaryHeader history={history} />
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <PollHistorySection polls={history.polls} />
          <HistorySidebar history={history} />
        </div>
      </main>
    </div>
  );
}

function CenteredNotice({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <Card className="p-8 sm:p-10">{children}</Card>
    </main>
  );
}

function HistoryNavBar() {
  return (
    <header className="border-b border-border bg-card">
      <nav className="mx-auto flex w-full max-w-(--breakpoint-2xl) items-center justify-between gap-4 p-4 sm:px-6 lg:px-16">
        <a
          aria-label="Pulse home"
          className="inline-flex items-center gap-2.5"
          href="/"
        >
          <span aria-hidden="true" className="size-7 rounded-full bg-primary" />
          <span className="text-xl leading-none font-bold tracking-tight">
            pulse
          </span>
        </a>
        <a
          className="text-muted-foreground"
          href="/host/dashboard"
        >
          <ArrowLeft aria-hidden="true" size={15} strokeWidth={1.8} />
          Back to dashboard
        </a>
      </nav>
    </header>
  );
}

function SessionSummaryHeader({
  history,
}: {
  history: EndedSessionHistoryData;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 lg:gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <h1 className="min-w-0 text-3xl font-bold tracking-[-0.04em] wrap-break-word sm:text-4xl">
            {history.sessionName}
          </h1>
          <Badge variant="secondary">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            Ended session
          </Badge>
        </div>
        <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-muted-foreground">
          READ-ONLY HISTORY
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Ended {history.endedAt} · {history.polls.length} polls ·{' '}
        {history.totalResponses} total responses
      </p>
    </header>
  );
}

function PollHistorySection({
  polls,
}: {
  polls: readonly EndedHistoryPoll[];
}) {
  return (
    <section aria-labelledby="poll-history-heading" className="min-w-0">
      <h2
        className="mb-3 font-mono text-[11px] font-bold tracking-[0.14em] text-primary"
        id="poll-history-heading"
      >
        COMPLETE POLL HISTORY
      </h2>
      <div className="flex flex-col gap-3">
        {polls.map((poll) => (
          <PollHistoryCard key={poll.id} poll={poll} />
        ))}
      </div>
    </section>
  );
}

function PollHistoryCard({ poll }: { poll: EndedHistoryPoll }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="min-w-0 text-base font-bold wrap-break-word text-foreground">
          {String(poll.number).padStart(2, '0')} · {poll.prompt}
        </h3>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground sm:text-right">
          {pollTypeLabels[poll.type]} · {poll.totalResponses} responses
        </span>
      </header>

      {poll.type === 'open-ended' ? (
        <OpenEndedPollHistory poll={poll} />
      ) : (
        <ChoicePollHistory poll={poll} />
      )}

      {poll.type === 'multiple-choice' ? (
        <p className="text-xs leading-5 text-muted-foreground">
          Percentages may add up to more than 100% because participants could
          select multiple options.
        </p>
      ) : null}
    </Card>
  );
}

function ChoicePollHistory({ poll }: { poll: EndedHistoryPoll }) {
  return (
    <ul className="flex flex-col gap-2">
      {poll.choiceResults.map((result) => (
        <ChoiceResultRow key={result.id} result={result} />
      ))}
    </ul>
  );
}

function ChoiceResultRow({
  result,
}: {
  result: EndedHistoryChoiceResult;
}) {
  return (
    <li>
      <Card className="p-4">
        <div
          aria-label={`${result.label}: ${result.percentage}%`}
          className="flex flex-col gap-2"
          role="group"
        >
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="font-semibold">{result.label}</span>
            <span className="font-mono text-xs font-semibold text-primary">
              {result.percentage}%
            </span>
          </div>
          <Progress className="h-2" value={result.percentage} />
          <span className="text-xs text-muted-foreground">
            {result.count} responses
          </span>
        </div>
      </Card>
    </li>
  );
}

function OpenEndedPollHistory({ poll }: { poll: EndedHistoryPoll }) {
  return (
    <ol
      aria-label="Chronological open-ended responses"
      className="flex flex-col gap-2"
    >
      {poll.openEndedResponses.map((response) => (
        <OpenEndedResponseRow key={response.id} response={response} />
      ))}
    </ol>
  );
}

function OpenEndedResponseRow({
  response,
}: {
  response: EndedHistoryResponse;
}) {
  return (
    <li>
      <Card className="flex items-start gap-3 border-0 bg-background p-3">
        <Clock3
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-primary"
          size={16}
          strokeWidth={1.8}
        />
        <div className="min-w-0">
          <p className="font-mono text-[10px] text-muted-foreground">
            {response.submittedAt}
          </p>
          <blockquote className="mt-1 text-sm leading-5 wrap-break-word text-muted-foreground">
            “{response.text}”
          </blockquote>
        </div>
      </Card>
    </li>
  );
}

function HistorySidebar({ history }: { history: EndedSessionHistoryData }) {
  return (
    <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
      <SessionTotals history={history} />
      <HostResultsNotice />
      <p className="text-xs leading-5 text-muted-foreground">
        Poll controls are unavailable after a session ends.
      </p>
    </aside>
  );
}

function SessionTotals({ history }: { history: EndedSessionHistoryData }) {
  return (
    <Card
      aria-labelledby="session-totals-heading"
      className="flex flex-col gap-5 bg-primary p-6 text-primary-foreground"
    >
      <h2
        className="font-mono text-[11px] font-bold tracking-[0.14em] text-primary-foreground/80"
        id="session-totals-heading"
      >
        SESSION TOTALS
      </h2>
      <dl className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <dt className="font-mono text-2xl font-bold text-primary-foreground">
            {history.polls.length}
          </dt>
          <dd className="text-sm text-primary-foreground/80">
            polls
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="font-mono text-2xl font-bold text-primary-foreground">
            {history.totalResponses}
          </dt>
          <dd className="text-sm text-primary-foreground/80">
            total responses
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="font-mono text-2xl font-bold text-primary-foreground">
            {history.endedAt}
          </dt>
          <dd className="text-sm text-primary-foreground/80">
            ended
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function HostResultsNotice() {
  return (
    <Card
      aria-labelledby="host-results-heading"
      className="flex items-start gap-3 p-4"
    >
      <LockKeyhole
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-primary"
        size={17}
        strokeWidth={1.8}
      />
      <div>
        <h2
          className="text-sm font-bold text-foreground"
          id="host-results-heading"
        >
          Host-visible results
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          This session is read-only. Host results remain available,
          including results that were never revealed to participants.
        </p>
      </div>
    </Card>
  );
}
