import { useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleDot,
  ExternalLink,
  GripVertical,
  Layers,
  ListChecks,
  MessageSquare,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Brand, Button, Callout, StatusBadge, Surface } from '@/shared/ui';

import {
  fixtureSessionEditorSession,
  type EditorPoll,
  type EditorPollStatus,
  type EditorPollType,
  type SessionEditorSession,
} from '../model/session-editor';

export type SessionEditorPageProps = Readonly<{
  initialSession?: SessionEditorSession;
  onAddPoll?: (session: SessionEditorSession) => void;
  onEditPoll?: (poll: EditorPoll) => void;
  onOpenLockedPoll?: (poll: EditorPoll) => void;
  onStartSession?: (session: SessionEditorSession) => void;
}>;

const pollTypeLabels: Record<EditorPollType, string> = {
  'multiple-choice': 'Multiple-choice poll',
  'open-ended': 'Open-ended poll',
  'single-choice': 'Single-choice poll',
};

const pollTypeIcons: Record<EditorPollType, LucideIcon> = {
  'multiple-choice': ListChecks,
  'open-ended': MessageSquare,
  'single-choice': CircleDot,
};

const pollStatusLabels: Record<EditorPollStatus, string> = {
  closed: 'Closed',
  configured: 'Configured',
  open: 'Open',
};

function getLifecycleNavigation(session: SessionEditorSession) {
  if (session.lifecycle === 'draft') {
    return null;
  }

  const sessionSlug = session.id.startsWith('session-')
    ? session.id.slice('session-'.length)
    : session.id;
  const destination = session.lifecycle === 'live' ? 'live' : 'history';

  return {
    href: `/host/sessions/${encodeURIComponent(sessionSlug)}/${destination}`,
    label:
      session.lifecycle === 'live'
        ? 'Open live control room'
        : 'View ended history',
  };
}

function LifecycleNavigationLink({
  className,
  session,
}: {
  className: string;
  session: SessionEditorSession;
}) {
  const navigation = getLifecycleNavigation(session);

  if (!navigation) {
    return null;
  }

  return (
    <a className={className} href={navigation.href}>
      <ExternalLink aria-hidden="true" size={15} strokeWidth={1.8} />
      {navigation.label}
    </a>
  );
}

function Header({ session }: { session: SessionEditorSession }) {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <nav
        aria-label="Session editor navigation"
        className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 py-4 sm:px-6 lg:px-16"
      >
        <a
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
          href="/host-dashboard"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Your sessions
        </a>
        <div className="flex items-center gap-4">
          <LifecycleNavigationLink
            className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-sm)] px-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-primary)]"
            session={session}
          />
          <Brand aria-label="Pulse home" href="/" size="sm" />
        </div>
      </nav>
    </header>
  );
}

function PollType({ poll }: { poll: EditorPoll }) {
  const TypeIcon = pollTypeIcons[poll.type];
  return (
    <span className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)]">
      <TypeIcon
        aria-hidden="true"
        className="text-[var(--color-primary)]"
        size={15}
      />
      <span>{pollTypeLabels[poll.type]}</span>
      <span
        className={
          poll.status === 'open'
            ? 'font-semibold text-[var(--color-success)]'
            : 'font-semibold text-[var(--color-text-tertiary)]'
        }
      >
        {pollStatusLabels[poll.status]}
      </span>
    </span>
  );
}

function ReadinessRail({ session }: { session: SessionEditorSession }) {
  const hasName = session.name.trim().length > 0;
  const hasPolls = session.polls.length > 0;
  const isDraft = session.lifecycle === 'draft';
  const railTitle = isDraft
    ? 'Ready to go live?'
    : session.lifecycle === 'live'
      ? 'Session is live'
      : 'Session ended';
  const railFooter = isDraft
    ? 'Participants cannot join until the session is started.'
    : session.lifecycle === 'live'
      ? 'Use the live control room for lifecycle actions.'
      : 'This session is read-only history.';
  const lifecycleStepLabel = isDraft
    ? 'Start the session'
    : session.lifecycle === 'live'
      ? 'Control the live session'
      : 'Review session history';
  const lifecycleStepDetail = isDraft
    ? 'Participants join after start'
    : session.lifecycle === 'live'
      ? 'Open the live control room'
      : 'View the completed poll history';
  return (
    <Surface as="aside" className="flex flex-col gap-5 p-6" padding="none">
      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
          {railTitle}
        </h2>
        <p className="mt-2 text-sm leading-5 text-[var(--color-text-secondary)]">
          {isDraft
            ? 'Your polls are configured and will keep this order when the session starts.'
            : 'Editing is unavailable after a session starts. Use the permitted session view instead.'}
        </p>
      </div>
      <ul
        className="flex flex-col gap-4"
        aria-label="Session readiness checklist"
      >
        <li className="flex items-start gap-3">
          <CircleCheck
            aria-hidden="true"
            className={
              hasName
                ? 'text-[var(--color-success)]'
                : 'text-[var(--color-text-tertiary)]'
            }
            size={18}
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
              Session name
            </span>
            <span className="block text-xs text-[var(--color-text-tertiary)]">
              {hasName ? 'Added' : 'Required'}
            </span>
          </span>
        </li>
        <li className="flex items-start gap-3">
          <CircleCheck
            aria-hidden="true"
            className={
              hasPolls
                ? 'text-[var(--color-success)]'
                : 'text-[var(--color-text-tertiary)]'
            }
            size={18}
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
              Polls configured
            </span>
            <span className="block text-xs text-[var(--color-text-tertiary)]">
              {hasPolls
                ? `${session.polls.length} ready`
                : 'At least one required'}
            </span>
          </span>
        </li>
        <li className="flex items-start gap-3">
          <CircleCheck
            aria-hidden="true"
            className={
              isDraft
                ? 'text-[var(--color-text-tertiary)]'
                : 'text-[var(--color-success)]'
            }
            size={18}
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
              {lifecycleStepLabel}
            </span>
            <span className="block text-xs text-[var(--color-text-tertiary)]">
              {lifecycleStepDetail}
            </span>
          </span>
        </li>
      </ul>
      <div className="space-y-2">
        <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
          {railFooter}
        </p>
        <LifecycleNavigationLink
          className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-primary)] hover:underline"
          session={session}
        />
      </div>
    </Surface>
  );
}

export function SessionEditorPage({
  initialSession = fixtureSessionEditorSession,
  onAddPoll,
  onEditPoll,
  onOpenLockedPoll,
  onStartSession,
}: SessionEditorPageProps) {
  const [session, setSession] = useState<SessionEditorSession>(initialSession);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const isEmpty = session.polls.length === 0;
  const isDraft = session.lifecycle === 'draft';
  const startDisabled = !isDraft || isEmpty;
  const startReason = isDraft
    ? isEmpty
      ? 'Add at least one poll before starting the session.'
      : 'Participants cannot join until you start the session.'
    : session.lifecycle === 'live'
      ? 'This live session is read-only here. Use the live control room for lifecycle actions.'
      : 'This ended session is read-only. Review the completed history instead.';

  function handleAddPoll() {
    if (!isDraft) {
      setActionMessage('Only draft sessions can be edited.');
      return;
    }

    setActionMessage('Poll builder ready for a new poll.');
    onAddPoll?.(session);
  }

  function handleEditPoll(poll: EditorPoll) {
    if (!isDraft) {
      setActionMessage('Only draft sessions can be edited.');
      return;
    }

    if (poll.responses > 0) {
      setActionMessage('This poll has responses and is locked for editing.');
      onOpenLockedPoll?.(poll);
      return;
    }
    setActionMessage(`Editing ${poll.text}.`);
    onEditPoll?.(poll);
  }

  function handleDeletePoll(pollId: string) {
    if (!isDraft) {
      setActionMessage('Only draft sessions can be edited.');
      return;
    }

    setSession((current) => ({
      ...current,
      polls: current.polls.filter((poll) => poll.id !== pollId),
    }));
    setActionMessage('Poll removed from this draft.');
  }

  function handleMovePoll(pollId: string, direction: -1 | 1) {
    if (!isDraft) {
      setActionMessage('Only draft sessions can be edited.');
      return;
    }

    setSession((current) => {
      const currentIndex = current.polls.findIndex(
        (poll) => poll.id === pollId,
      );
      const targetIndex = currentIndex + direction;
      if (
        currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= current.polls.length
      ) {
        return current;
      }

      const nextPolls = [...current.polls];
      const currentPoll = nextPolls[currentIndex];
      const targetPoll = nextPolls[targetIndex];
      if (!currentPoll || !targetPoll) {
        return current;
      }
      nextPolls[currentIndex] = targetPoll;
      nextPolls[targetIndex] = currentPoll;
      return { ...current, polls: nextPolls };
    });
    setActionMessage(
      direction === -1 ? 'Poll moved earlier.' : 'Poll moved later.',
    );
  }

  function handleStartSession() {
    if (startDisabled) {
      return;
    }

    const nextSession: SessionEditorSession = {
      ...session,
      lifecycle: 'live',
      polls: session.polls.map((poll, index) =>
        index === 0 ? { ...poll, status: 'open' } : poll,
      ),
    };
    setSession(nextSession);
    setActionMessage(
      'Session started. Participants can join with the Room Code.',
    );
    onStartSession?.(nextSession);
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)]">
      <Header session={session} />
      <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-16">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
              <h1 className="break-words text-3xl font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">
                {session.name}
              </h1>
              <StatusBadge
                label={
                  session.lifecycle === 'draft'
                    ? 'Draft Session'
                    : `${session.lifecycle} Session`
                }
                showDot
                tone={
                  session.lifecycle === 'draft'
                    ? 'warning'
                    : session.lifecycle === 'live'
                      ? 'success'
                      : 'neutral'
                }
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {isDraft ? (
                <>
                  <Button onClick={handleAddPoll} size="md" variant="secondary">
                    <Plus aria-hidden="true" className="mr-2" size={16} />
                    Add poll
                  </Button>
                  <Button
                    disabled={startDisabled}
                    onClick={handleStartSession}
                    size="md"
                  >
                    <Play aria-hidden="true" className="mr-2" size={16} />
                    Start session
                  </Button>
                </>
              ) : (
                <LifecycleNavigationLink
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-text-on-primary)] hover:brightness-95"
                  session={session}
                />
              )}
            </div>
          </div>
          {session.lifecycle === 'draft' ? (
            <Callout icon="info" tone="warning">
              Participants cannot join yet. Add or edit polls before you start
              the session.
            </Callout>
          ) : session.lifecycle === 'live' ? (
            <Callout icon="check" tone="success">
              Participants can join this session. The first open poll is
              accepting responses.
            </Callout>
          ) : (
            <Callout icon="info" tone="neutral">
              This session has ended. Polls and results are available as
              read-only history.
            </Callout>
          )}
          <p
            className="text-sm text-[var(--color-text-secondary)]"
            role="status"
          >
            {startReason}
          </p>
          {actionMessage ? (
            <p
              aria-live="polite"
              className="text-sm font-semibold text-[var(--color-success)]"
            >
              {actionMessage}
            </p>
          ) : null}
        </section>

        {isEmpty ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,900px)_320px]">
            <Surface
              as="section"
              className="flex min-h-[420px] flex-col items-center justify-center gap-5 px-6 py-12 text-center"
              elevation="card"
              padding="none"
            >
              <span className="flex size-18 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <Layers aria-hidden="true" size={30} />
              </span>
              <div className="max-w-lg">
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                  No polls configured
                </h2>
                <p className="mt-2 text-base leading-6 text-[var(--color-text-secondary)]">
                  {isDraft
                    ? 'Add at least one poll to start your session. You can reorder polls and edit them before going live.'
                    : 'This session has no editable poll list. Review the permitted session view instead.'}
                </p>
              </div>
              {isDraft ? (
                <Button onClick={handleAddPoll} size="lg">
                  <Plus aria-hidden="true" className="mr-2" size={18} />
                  Add your first poll
                </Button>
              ) : (
                <LifecycleNavigationLink
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-5 text-base font-semibold text-[var(--color-text-on-primary)] hover:brightness-95"
                  session={session}
                />
              )}
            </Surface>
            <ReadinessRail session={session} />
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,900px)_320px]">
            <section aria-labelledby="poll-sequence-heading">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                <h2
                  className="font-[var(--font-mono)] text-xs font-bold tracking-[0.14em] text-[var(--color-primary)]"
                  id="poll-sequence-heading"
                >
                  Poll sequence - {session.polls.length} poll
                  {session.polls.length === 1 ? '' : 's'}
                </h2>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {isDraft
                    ? 'Reorder before starting'
                    : 'Read-only poll history'}
                </span>
              </div>
              <ol className="flex flex-col gap-3">
                {session.polls.map((poll, index) => (
                  <li key={poll.id}>
                    <Surface
                      as="article"
                      className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5"
                      padding="none"
                    >
                      <div className="flex items-center gap-3 sm:flex-col">
                        <span className="flex min-h-10 min-w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] font-[var(--font-mono)] text-xs font-bold text-[var(--color-text-tertiary)]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {isDraft ? (
                          <GripVertical
                            aria-hidden="true"
                            className="hidden text-[var(--color-text-tertiary)] sm:block"
                            size={17}
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-base font-bold text-[var(--color-text-primary)]">
                          {poll.text}
                        </h3>
                        <div className="mt-2">
                          <PollType poll={poll} />
                        </div>
                      </div>
                      {isDraft ? (
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <button
                            aria-label={`Move poll ${index + 1} earlier`}
                            className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={index === 0}
                            onClick={() => handleMovePoll(poll.id, -1)}
                            type="button"
                          >
                            <ChevronUp aria-hidden="true" size={16} />
                          </button>
                          <button
                            aria-label={`Move poll ${index + 1} later`}
                            className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={index === session.polls.length - 1}
                            onClick={() => handleMovePoll(poll.id, 1)}
                            type="button"
                          >
                            <ChevronDown aria-hidden="true" size={16} />
                          </button>
                          <Button
                            onClick={() => handleEditPoll(poll)}
                            size="sm"
                            variant="secondary"
                          >
                            <Pencil
                              aria-hidden="true"
                              className="mr-2"
                              size={14}
                            />
                            {poll.responses > 0 ? 'View locked poll' : 'Edit'}
                          </Button>
                          <button
                            aria-label={`Delete poll ${index + 1}`}
                            className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-transparent text-[var(--color-error)] hover:bg-[var(--color-surface-error)]"
                            onClick={() => handleDeletePoll(poll.id)}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">
                          Read-only
                        </span>
                      )}
                    </Surface>
                  </li>
                ))}
              </ol>
            </section>
            <ReadinessRail session={session} />
          </section>
        )}
      </main>
    </div>
  );
}
