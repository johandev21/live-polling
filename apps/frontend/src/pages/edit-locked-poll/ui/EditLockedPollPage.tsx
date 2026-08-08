import { useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CircleCheck,
  LockKeyhole,
  Play,
} from 'lucide-react';

import {
  Brand,
  Button,
  Callout,
  ResultBar,
  StatusBadge,
  Surface,
} from '@/shared/ui';

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

function Header() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <nav
        aria-label="Locked poll navigation"
        className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 py-4 sm:px-6 lg:px-16"
      >
        <a
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
          href="/session-editor"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Session editor
        </a>
        <Brand aria-label="Pulse home" href="/" size="sm" />
      </nav>
    </header>
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
    <li className="flex min-h-13 items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-canvas)] px-4 py-3">
      <span
        aria-hidden="true"
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-muted)] font-[var(--font-mono)] text-xs font-bold text-[var(--color-text-tertiary)]"
      >
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 break-words text-sm text-[var(--color-text-primary)]">
        {option.label}
      </span>
      <LockKeyhole
        aria-hidden="true"
        className="shrink-0 text-[var(--color-text-tertiary)]"
        size={15}
      />
    </li>
  );
}

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
    return (
      <div className="min-h-screen bg-[var(--color-bg-canvas)]">
        <Header />
        <main className="mx-auto flex w-full max-w-screen-2xl items-center justify-center py-20 text-sm font-semibold text-[var(--color-text-secondary)]">
          Loading poll details...
        </main>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-canvas)]">
        <Header />
        <main className="mx-auto flex w-full max-w-screen-2xl items-center justify-center py-20 text-sm font-semibold text-[var(--color-text-secondary)]">
          This poll could not be loaded. Return to the session editor and try
          again.
        </main>
      </div>
    );
  }

  const lockedPoll = poll;
  const pollStatus = lockedPoll.status;

  function handleLifecycleAction() {
    const nextStatus = pollStatus === 'closed' ? 'open' : 'closed';
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
    <div className="min-h-screen bg-[var(--color-bg-canvas)]">
      <Header />
      <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-16">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
              <h1 className="break-words text-3xl font-bold tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-4xl">
                {poll.text}
              </h1>
              <StatusBadge label="Edit locked" showDot tone="warning" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                onClick={handleLifecycleAction}
                size="md"
                variant="secondary"
              >
                {pollStatus === 'closed' ? (
                  <Play aria-hidden="true" className="mr-2" size={16} />
                ) : (
                  <CircleCheck aria-hidden="true" className="mr-2" size={16} />
                )}
                {pollStatus === 'closed' ? 'Open poll' : 'Close poll'}
              </Button>
              <Button onClick={handleViewResults} size="md">
                <BarChart3 aria-hidden="true" className="mr-2" size={16} />
                View results
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)]">
            <span>{typeLabels[poll.type]}</span>
            <span aria-hidden="true">-</span>
            <span>{pollStatus === 'open' ? 'Open poll' : 'Closed poll'}</span>
            <span aria-hidden="true">-</span>
            <span>{poll.responses} responses recorded</span>
          </div>
          {errorMessage ? (
            <p
              aria-live="polite"
              className="text-sm font-semibold text-[var(--color-error)]"
            >
              {errorMessage}
            </p>
          ) : null}
          {actionMessage ? (
            <p
              aria-live="polite"
              className="text-sm font-semibold text-[var(--color-success)]"
            >
              {actionMessage}
            </p>
          ) : null}
        </section>

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,720px)_minmax(320px,520px)]">
          <Surface
            as="section"
            aria-labelledby="locked-poll-content-heading"
            className="flex flex-col gap-6 p-6 sm:p-7"
            elevation="card"
            padding="none"
          >
            <Callout icon="lockKeyhole" title="Read-only poll" tone="info">
              This poll has responses, so its text and options cannot be edited.
              You can still control its lifecycle and view results.
            </Callout>
            <div>
              <h2
                className="text-sm font-semibold text-[var(--color-text-primary)]"
                id="locked-poll-content-heading"
              >
                Poll text
              </h2>
              <p className="mt-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-canvas)] p-4 text-base font-semibold leading-6 text-[var(--color-text-primary)]">
                {poll.text}
              </p>
            </div>
            {poll.type === 'open-ended' ? (
              <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-canvas)] p-4 text-sm text-[var(--color-text-secondary)]">
                Participants submit free-form responses within the configured
                response limit.
              </div>
            ) : (
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Options - read only
                </h2>
                <ul className="mt-3 flex flex-col gap-3">
                  {poll.options.map((option, index) => (
                    <LockedOption
                      index={index}
                      key={option.id}
                      option={option}
                    />
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
              Need to change the sequence? Reorder this poll from the Session
              Editor.
            </p>
          </Surface>

          <div className="flex flex-col gap-6">
            <Surface
              as="section"
              className="flex flex-col gap-5 p-6"
              padding="none"
            >
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                  Poll controls
                </h2>
                <p className="mt-2 text-sm leading-5 text-[var(--color-text-secondary)]">
                  Opening this poll will close any other active poll
                  immediately.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] p-4">
                <CircleCheck
                  aria-hidden="true"
                  className={
                    pollStatus === 'closed'
                      ? 'text-[var(--color-text-tertiary)]'
                      : 'text-[var(--color-success)]'
                  }
                  size={18}
                />
                <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  Poll is currently {pollStatus}.
                </p>
              </div>
              <a
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]"
                href="/session-editor"
              >
                Reorder in Session Editor
              </a>
            </Surface>

            <Surface
              as="section"
              className="flex flex-col gap-5 p-6"
              padding="none"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                    Host-visible results
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-[var(--color-warning)]">
                    {poll.participantResultsVisible
                      ? 'Visible to participants'
                      : 'Hidden from participants'}
                  </p>
                </div>
                <span className="font-[var(--font-mono)] text-sm font-bold text-[var(--color-text-primary)]">
                  {poll.responses} total
                </span>
              </div>
              {poll.results.length > 0 ? (
                <div className="flex flex-col gap-5 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                  {poll.results.map((result) => (
                    <ResultBar
                      ariaLabel={`${result.label}: ${result.percentage}%`}
                      count={result.count}
                      key={result.id}
                      label={result.label}
                      percentage={result.percentage}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  No aggregate results are available yet.
                </p>
              )}
            </Surface>
          </div>
        </div>
      </main>
    </div>
  );
}
