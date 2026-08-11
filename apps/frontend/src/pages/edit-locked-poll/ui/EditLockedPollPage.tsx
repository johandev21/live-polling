import { useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CircleCheck,
  LockKeyhole,
  Play,
} from 'lucide-react';

import { ModeToggle } from '@/components/mode-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brand } from '@/shared/ui/brand';
import { GlassHeader } from '@/shared/ui/glass-header';


import {
  type LockedPoll,
  type LockedPollType,
} from '../model/edit-locked-poll';

export type EditLockedPollPageProps = Readonly<{
  errorMessage?: string | null;
  isLoading?: boolean;
  onClosePoll?: (poll: LockedPoll) => void;
  onOpenPoll?: (poll: LockedPoll) => void;
  onViewResults?: (poll: LockedPoll) => void;
  poll?: LockedPoll;
}>;

const typeLabels: Record<LockedPollType, string> = {
  'multiple-choice': 'Multiple-choice poll',
  'open-ended': 'Open-ended poll',
  'single-choice': 'Single-choice poll',
};

export function EditLockedPollPage({
  errorMessage,
  isLoading = false,
  onClosePoll,
  onOpenPoll,
  onViewResults,
  poll,
}: EditLockedPollPageProps) {
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  if (isLoading) {
    return <PollLoadingState />;
  }

  if (!poll) {
    return <PollUnavailableState />;
  }

  const lockedPoll = poll;

  function handleLifecycleAction() {
    const nextStatus = lockedPoll.status === 'closed' ? 'open' : 'closed';
    const nextPoll: LockedPoll = { ...lockedPoll, status: nextStatus };
    setActionMessage(
      nextStatus === 'open'
        ? 'Poll opened for responses.'
        : 'Poll closed for responses.',
    );
    if (nextStatus === 'open') {
      onOpenPoll?.(nextPoll);
    } else {
      onClosePoll?.(nextPoll);
    }
  }

  function handleViewResults() {
    setActionMessage('Opening host-visible results.');
    onViewResults?.(lockedPoll);
  }

  return (
    <div className="min-h-screen bg-mist-50 dark:bg-background">
      <Header />
      <main className="mx-auto flex w-full max-w-(--breakpoint-2xl) flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-16">
        <PollHeader
          actionMessage={actionMessage}
          errorMessage={errorMessage}
          onLifecycleAction={handleLifecycleAction}
          onViewResults={handleViewResults}
          poll={lockedPoll}
        />

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,720px)_minmax(320px,520px)]">
          <LockedPollContentCard poll={lockedPoll} />
          <div className="flex flex-col gap-6">
            <PollControlsCard poll={lockedPoll} />
            <HostResultsCard poll={lockedPoll} />
          </div>
        </div>
      </main>
    </div>
  );
}

function PollLoadingState() {
  return (
    <div className="min-h-screen bg-mist-50 dark:bg-background">
      <Header />
      <main className="mx-auto flex w-full max-w-(--breakpoint-2xl) items-center justify-center py-20 text-sm font-semibold text-muted-foreground">
        Loading poll details...
      </main>
    </div>
  );
}

function PollUnavailableState() {
  return (
    <div className="min-h-screen bg-mist-50 dark:bg-background">
      <Header />
      <main className="mx-auto flex w-full max-w-(--breakpoint-2xl) items-center justify-center py-20 text-sm font-semibold text-muted-foreground">
        This poll could not be loaded. Return to the session editor and try
        again.
      </main>
    </div>
  );
}

function PollHeader({
  actionMessage,
  errorMessage,
  onLifecycleAction,
  onViewResults,
  poll,
}: {
  actionMessage: string | null;
  errorMessage?: string | null;
  onLifecycleAction: () => void;
  onViewResults: () => void;
  poll: LockedPoll;
}) {
  const pollStatus = poll.status;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-bold tracking-[-0.03em] wrap-break-word text-foreground sm:text-4xl">
            {poll.text}
          </h1>
          <Badge variant="secondary" role="status">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            Edit locked
          </Badge>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <PollLifecycleButton
            onClick={onLifecycleAction}
            pollStatus={pollStatus}
          />
          <Button onClick={onViewResults} size="lg">
            <BarChart3 aria-hidden="true" className="mr-2" size={16} />
            View results
          </Button>
        </div>
      </div>
      <PollMetaBar poll={poll} />
      {errorMessage ? (
        <p
          aria-live="polite"
          className="text-sm font-semibold text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}
      {actionMessage ? (
        <p
          aria-live="polite"
          className="text-sm font-semibold text-muted-foreground"
        >
          {actionMessage}
        </p>
      ) : null}
    </section>
  );
}

function PollLifecycleButton({
  onClick,
  pollStatus,
}: {
  onClick: () => void;
  pollStatus: LockedPoll['status'];
}) {
  return (
    <Button onClick={onClick} size="lg" variant="outline">
      {pollStatus === 'closed' ? (
        <Play aria-hidden="true" className="mr-2" size={16} />
      ) : (
        <CircleCheck aria-hidden="true" className="mr-2" size={16} />
      )}
      {pollStatus === 'closed' ? 'Open poll' : 'Close poll'}
    </Button>
  );
}

function PollMetaBar({ poll }: { poll: LockedPoll }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs text-muted-foreground">
      <span>{typeLabels[poll.type]}</span>
      <span aria-hidden="true">-</span>
      <span>{poll.status === 'open' ? 'Open poll' : 'Closed poll'}</span>
      <span aria-hidden="true">-</span>
      <span>{poll.responses} responses recorded</span>
    </div>
  );
}

function LockedPollContentCard({ poll }: { poll: LockedPoll }) {
  return (
    <Card
      aria-labelledby="locked-poll-content-heading"
      className="flex flex-col gap-6 p-6 sm:p-7"
    >
      <Alert role="note">
        <LockKeyhole />
        <AlertTitle>Read-only poll</AlertTitle>
        <AlertDescription>
          This poll has responses, so its text and options cannot be edited.
          You can still control its lifecycle and view results.
        </AlertDescription>
      </Alert>
      <div>
        <h2
          className="text-sm font-semibold text-foreground"
          id="locked-poll-content-heading"
        >
          Poll text
        </h2>
        <p className="mt-2 rounded-sm border border-border bg-background p-4 text-base leading-6 font-semibold text-foreground">
          {poll.text}
        </p>
      </div>
      {poll.type === 'open-ended' ? (
        <div className="rounded-sm border border-border bg-background p-4 text-sm text-muted-foreground">
          Participants submit free-form responses within the configured
          response limit.
        </div>
      ) : (
        <PollOptionsList options={poll.options} />
      )}
      <p className="text-xs leading-5 text-muted-foreground">
        Need to change the sequence? Reorder this poll from the Session
        Editor.
      </p>
    </Card>
  );
}

function PollOptionsList({ options }: { options: LockedPoll['options'] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">
        Options - read only
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {options.map((option, index) => (
          <LockedOption index={index} key={option.id} option={option} />
        ))}
      </ul>
    </div>
  );
}

function PollControlsCard({ poll }: { poll: LockedPoll }) {
  return (
    <Card className="flex flex-col gap-5 p-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Poll controls</h2>
        <p className="mt-2 text-sm leading-5 text-muted-foreground">
          Opening this poll will close any other active poll immediately.
        </p>
      </div>
      <div className="flex items-start gap-3 rounded-sm bg-muted p-4">
        <CircleCheck
          aria-hidden="true"
          className={
            poll.status === 'closed'
              ? 'text-muted-foreground'
              : 'text-foreground'
          }
          size={18}
        />
        <p className="text-sm font-semibold text-muted-foreground">
          Poll is currently {poll.status}.
        </p>
      </div>
      <a
        className="inline-flex min-h-11 items-center justify-center rounded-sm border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
        href="/session-editor"
      >
        Reorder in Session Editor
      </a>
    </Card>
  );
}

function HostResultsCard({ poll }: { poll: LockedPoll }) {
  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Host-visible results
          </h2>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {poll.participantResultsVisible
              ? 'Visible to participants'
              : 'Hidden from participants'}
          </p>
        </div>
        <span className="font-mono text-sm font-bold text-foreground">
          {poll.responses} total
        </span>
      </div>
      {poll.results.length > 0 ? (
        <div className="flex flex-col gap-5 rounded-md border border-border p-4">
          {poll.results.map((result) => (
            <ResultRow key={result.id} result={result} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No aggregate results are available yet.
        </p>
      )}
    </Card>
  );
}

function ResultRow({ result }: { result: LockedPoll['results'][number] }) {
  return (
    <div
      aria-label={`${result.label}: ${result.percentage}%`}
      className="flex w-full flex-col gap-2"
      role="group"
    >
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="min-w-0 font-semibold wrap-break-word">
          {result.label}
        </span>
        <span className="shrink-0 text-xs font-semibold text-primary">
          {result.percentage}%
        </span>
      </div>
      <Progress
        aria-label={`${result.label}: ${result.percentage}%`}
        value={Math.min(100, Math.max(0, result.percentage))}
      />
      <span className="text-xs text-muted-foreground">
        {result.count} responses
      </span>
    </div>
  );
}

function LockedOption({
  index,
  option,
}: {
  index: number;
  option: LockedPoll['options'][number];
}) {
  return (
    <li className="flex min-h-13 items-center gap-3 rounded-sm border border-border bg-background px-4 py-3">
      <span
        aria-hidden="true"
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-bold text-muted-foreground"
      >
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 text-sm wrap-break-word text-foreground">
        {option.label}
      </span>
      <LockKeyhole
        aria-hidden="true"
        className="shrink-0 text-muted-foreground"
        size={15}
      />
    </li>
  );
}

function Header() {
  return (
    <GlassHeader containerClassName="max-w-(--breakpoint-2xl) px-4 sm:px-6 lg:px-16">
      <nav
        aria-label="Locked poll navigation"
        className="flex w-full items-center justify-between"
      >
        <a
          className="inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-muted-foreground hover:text-foreground"
          href="/session-editor"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Session editor
        </a>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <Brand aria-label="Pulse home" href="/" size="sm" />
        </div>
      </nav>
    </GlassHeader>
  );
}
