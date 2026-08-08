import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  Pause,
  Play,
  Share2,
  Square,
  Users,
} from 'lucide-react';

import {
  Brand,
  Button,
  Callout,
  ConnectionStatus,
  ResultBar,
  StatusBadge,
  Surface,
  type ConnectionState,
} from '@/shared/ui';

import {
  pollTypeLabel,
  type LivePoll,
  type LivePollType,
  type ParticipantPresence,
  type PollLifecycle,
  type ResultVisibility,
} from '../model/live-control-room';
import { EndSessionDialog } from './EndSessionDialog';
import { ParticipantPresencePanel } from './ParticipantPresencePanel';
import { ShareSessionPanel } from './ShareSessionPanel';

export type LiveControlRoomPageProps = {
  connectionState: ConnectionState;
  errorMessage?: string | null;
  invitationLink: string;
  isLoading?: boolean;
  onClosePollSubmit?: (pollId: string) => Promise<void> | void;
  onEndSessionSubmit?: () => Promise<void> | void;
  onHideResultsSubmit?: (pollId: string) => Promise<void> | void;
  onOpenPollSubmit?: (pollId: string) => Promise<void> | void;
  onRevealResultsSubmit?: (pollId: string) => Promise<void> | void;
  onSessionEnded?: () => void;
  participantCount: number;
  participants: readonly ParticipantPresence[];
  polls: readonly LivePoll[];
  roomCode: string;
  sessionId: string;
  sessionName: string;
  sessionStatus: 'ended' | 'live';
};

type OpenPanel = 'presence' | 'share' | null;

const pollTypeShortLabels = {
  'multiple-choice': 'Multiple-choice',
  'open-ended': 'Open-ended',
  'single-choice': 'Single-choice',
} satisfies Record<LivePollType, string>;

const pollLifecycleLabels = {
  closed: 'Closed poll',
  open: 'Open poll',
} satisfies Record<PollLifecycle, string>;

const resultVisibilityLabels = {
  hidden: 'Results hidden from participants',
  revealed: 'Results revealed to participants',
} satisfies Record<ResultVisibility, string>;

function calculatePercentage(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

function PollResults({ poll }: { poll: LivePoll }) {
  if (poll.type === 'open-ended') {
    return (
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
            Latest responses
          </h3>
          <span className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-primary)]">
            {poll.totalResponses} total
          </span>
        </div>
        {poll.responses.length > 0 ? (
          <ul className="space-y-2">
            {poll.responses.map((response) => (
              <li
                className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-canvas)] px-3 py-2 text-sm text-[var(--color-text-secondary)]"
                key={response.id}
              >
                <span className="mr-2 font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)]">
                  {response.submittedAt}
                </span>
                {response.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-text-tertiary)]">
            Responses will appear here as participants submit them.
          </p>
        )}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {poll.options.map((option) => (
        <li
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          key={option.id}
        >
          <ResultBar
            ariaLabel={`${option.label}: ${calculatePercentage(option.count, poll.totalResponses)} percent`}
            count={option.count}
            label={option.label}
            percentage={calculatePercentage(option.count, poll.totalResponses)}
          />
        </li>
      ))}
    </ul>
  );
}

function EndedSessionState({
  endedHistoryHref,
  sessionName,
}: {
  endedHistoryHref: string;
  sessionName: string;
}) {
  return (
    <main className="min-h-screen bg-[var(--color-bg-canvas)] px-4 py-8 sm:px-6 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center">
        <Surface className="w-full text-center" elevation="card" padding="lg">
          <StatusBadge label="Ended session" tone="neutral" />
          <h1 className="mt-5 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
            {sessionName} is now read-only
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)]">
            Participants can no longer respond. The complete host-visible poll
            history remains available from the ended session history page.
          </p>
          <a
            className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-text-on-primary)] transition-[filter,transform] hover:brightness-95 active:translate-y-px"
            href={endedHistoryHref}
          >
            <ExternalLink aria-hidden="true" size={17} strokeWidth={1.8} />
            View ended history
          </a>
        </Surface>
      </div>
    </main>
  );
}

export function LiveControlRoomPage({
  connectionState,
  errorMessage,
  invitationLink,
  isLoading = false,
  onClosePollSubmit,
  onEndSessionSubmit,
  onHideResultsSubmit,
  onOpenPollSubmit,
  onRevealResultsSubmit,
  onSessionEnded,
  participantCount,
  participants,
  polls,
  roomCode,
  sessionId,
  sessionName,
  sessionStatus,
}: LiveControlRoomPageProps) {
  const [activePollId, setActivePollId] = useState('');
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const activePoll =
    polls.find((poll) => poll.id === activePollId) ?? polls[0];

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-bg-canvas)] px-4">
        <Surface elevation="card" padding="lg">
          <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
            Loading control room...
          </p>
        </Surface>
      </main>
    );
  }

  if (!activePoll) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-bg-canvas)] px-4">
        <Surface elevation="card" padding="lg">
          <p className="text-sm text-[var(--color-text-secondary)]">
            No active poll configured.
          </p>
        </Surface>
      </main>
    );
  }

  if (sessionStatus === 'ended') {
    return (
      <EndedSessionState
        endedHistoryHref={`/host/sessions/${encodeURIComponent(sessionId)}/history`}
        sessionName={sessionName}
      />
    );
  }

  async function handleToggleLifecycle() {
    setActionError(null);
    const nextLifecycle = activePoll.lifecycle === 'open' ? 'closed' : 'open';

    try {
      if (nextLifecycle === 'open' && onOpenPollSubmit) {
        await onOpenPollSubmit(activePoll.id);
      } else if (nextLifecycle === 'closed' && onClosePollSubmit) {
        await onClosePollSubmit(activePoll.id);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.');
    }
  }

  async function handleToggleVisibility() {
    setActionError(null);
    const nextVisibility =
      activePoll.resultVisibility === 'hidden' ? 'revealed' : 'hidden';

    try {
      if (nextVisibility === 'revealed' && onRevealResultsSubmit) {
        await onRevealResultsSubmit(activePoll.id);
      } else if (nextVisibility === 'hidden' && onHideResultsSubmit) {
        await onHideResultsSubmit(activePoll.id);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.');
    }
  }

  async function handleEndSession() {
    setShowEndDialog(false);

    if (!onEndSessionSubmit) {
      setActionError('Ending the session is unavailable.');
      return;
    }

    try {
      await onEndSessionSubmit();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to end session.');
      return;
    }

    onSessionEnded?.();
  }

  const activePollIndex = polls.findIndex((poll) => poll.id === activePoll.id);
  const previousPoll = polls[activePollIndex - 1];
  const nextPoll = polls[activePollIndex + 1];

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-12">
          <Brand aria-label="Pulse home" size="md" />
          <div className="flex items-center gap-2 sm:gap-4">
            <ConnectionStatus state={connectionState} />
            <a
              className="hidden text-xs font-semibold text-[var(--color-text-secondary)] underline-offset-4 hover:text-[var(--color-primary)] hover:underline sm:inline"
              href="/host/dashboard"
            >
              Exit control room
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 lg:px-12 lg:py-9">
        <header className="flex flex-col gap-6 border-b border-[var(--color-border)] pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                {sessionName}
              </h1>
              <StatusBadge label="Live session" tone="success" />
            </div>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Room Code {roomCode}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Users
              aria-hidden="true"
              className="text-[var(--color-primary)]"
              size={20}
              strokeWidth={1.8}
            />
            <div>
              <p className="font-[var(--font-mono)] text-xl font-bold leading-none">
                {participantCount}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                participants connected · approximate
              </p>
            </div>
          </div>
        </header>

        {errorMessage || actionError ? (
          <div className="mt-4">
            <Callout icon="alertCircle" title="Action failed" tone="error">
              {errorMessage || actionError}
            </Callout>
          </div>
        ) : null}

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <section
            className="min-w-0 space-y-4"
            aria-labelledby="active-poll-title"
          >
            <Surface
              as="article"
              className="space-y-6"
              elevation="card"
              padding="lg"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-[var(--font-mono)] text-[11px] font-bold tracking-[0.14em] text-[var(--color-primary)]">
                    ACTIVE POLL · {String(activePoll.position).padStart(2, '0')}{' '}
                    OF {String(polls.length).padStart(2, '0')}
                  </p>
                  <h2
                    className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-[-0.04em] sm:text-4xl"
                    id="active-poll-title"
                  >
                    {activePoll.question}
                  </h2>
                  <p className="mt-3 font-[var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">
                    {pollTypeLabel(activePoll.type)} · Responses update live
                  </p>
                </div>
                <StatusBadge
                  label={pollLifecycleLabels[activePoll.lifecycle]}
                  tone={activePoll.lifecycle === 'open' ? 'success' : 'neutral'}
                />
              </div>

              <PollResults poll={activePoll} />

              <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-text-secondary)]">
                  {activePoll.totalResponses} total responses
                </p>
                <p
                  className={
                    activePoll.resultVisibility === 'hidden'
                      ? 'text-xs font-semibold text-[var(--color-warning)]'
                      : 'text-xs font-semibold text-[var(--color-success)]'
                  }
                >
                  {resultVisibilityLabels[activePoll.resultVisibility]}
                </p>
              </div>
            </Surface>

            <Surface
              aria-label="Active poll controls"
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              padding="sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={handleToggleLifecycle} variant="secondary">
                  <span className="inline-flex items-center gap-2">
                    {activePoll.lifecycle === 'open' ? (
                      <Pause aria-hidden="true" size={16} strokeWidth={1.8} />
                    ) : (
                      <Play aria-hidden="true" size={16} strokeWidth={1.8} />
                    )}
                    {activePoll.lifecycle === 'open'
                      ? 'Close poll'
                      : 'Open poll'}
                  </span>
                </Button>
                <Button onClick={handleToggleVisibility} variant="primary">
                  <span className="inline-flex items-center gap-2">
                    {activePoll.resultVisibility === 'hidden' ? (
                      <Eye aria-hidden="true" size={16} strokeWidth={1.8} />
                    ) : (
                      <EyeOff aria-hidden="true" size={16} strokeWidth={1.8} />
                    )}
                    {activePoll.resultVisibility === 'hidden'
                      ? 'Reveal results'
                      : 'Hide results'}
                  </span>
                </Button>
              </div>
              <p className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)]">
                Actions apply immediately
              </p>
            </Surface>

            <Surface aria-labelledby="poll-sequence-title" padding="md">
              <div className="flex items-center justify-between gap-4">
                <h2
                  className="font-[var(--font-mono)] text-[10px] font-bold tracking-[0.14em] text-[var(--color-text-tertiary)]"
                  id="poll-sequence-title"
                >
                  POLL SEQUENCE
                </h2>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  Select a poll
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {polls.map((poll) => {
                  const isActive = poll.id === activePoll.id;

                  return (
                    <button
                      aria-pressed={isActive}
                      className={
                        isActive
                          ? 'min-w-0 rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] px-3 py-3 text-left text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                          : 'min-w-0 rounded-[var(--radius-sm)] bg-[var(--color-bg-canvas)] px-3 py-3 text-left text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)]'
                      }
                      key={poll.id}
                      onClick={() => setActivePollId(poll.id)}
                      type="button"
                    >
                      <span className="font-[var(--font-mono)] text-[10px] font-bold">
                        {String(poll.position).padStart(2, '0')}
                      </span>
                      <span className="mt-1 block line-clamp-2 text-xs font-semibold leading-4">
                        {poll.question}
                      </span>
                      <span className="mt-2 block text-[10px] text-[var(--color-text-tertiary)]">
                        {pollTypeShortLabels[poll.type]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Surface>
          </section>

          <aside className="space-y-4" aria-label="Live session tools">
            <section className="rounded-[var(--radius-lg)] bg-[var(--color-primary)] p-6 text-[var(--color-text-on-primary)] shadow-[var(--shadow-card)]">
              <p className="font-[var(--font-mono)] text-[11px] font-bold tracking-[0.14em] text-[var(--color-text-on-primary-soft)]">
                SHARE THIS SESSION
              </p>
              <div className="mt-3 flex items-start justify-between gap-3">
                <p className="break-all font-[var(--font-mono)] text-4xl font-bold tracking-[0.1em] sm:text-5xl">
                  {roomCode}
                </p>
                <Share2
                  aria-hidden="true"
                  className="mt-1 shrink-0"
                  size={22}
                  strokeWidth={1.7}
                />
              </div>
              <p className="mt-4 text-sm leading-5 text-[var(--color-text-on-primary-muted)]">
                Participants can join with this Room Code or the Invitation
                Link.
              </p>
              <Button
                className="mt-5 w-full border-[var(--color-border-inverse)] bg-[var(--color-surface-inverse-muted)] text-[var(--color-text-on-primary)] hover:bg-[var(--color-surface-inverse-muted)]"
                onClick={() => setOpenPanel('share')}
                variant="secondary"
              >
                <span className="inline-flex items-center gap-2">
                  <Share2 aria-hidden="true" size={16} strokeWidth={1.8} />
                  Open sharing panel
                </span>
              </Button>
            </section>

            <Surface
              as="section"
              aria-labelledby="presence-summary-title"
              className="space-y-4"
              padding="md"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold" id="presence-summary-title">
                  Participant presence
                </h2>
                <span className="font-[var(--font-mono)] text-[11px] font-bold text-[var(--color-success)]">
                  {participantCount} online
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Approximate and host-only
              </p>
              <ul className="space-y-2">
                {participants.slice(0, 4).map((participant) => (
                  <li
                    className="flex items-center justify-between gap-3"
                    key={participant.id}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full bg-[var(--color-success)]" />
                      <span className="truncate text-sm text-[var(--color-text-primary)]">
                        {participant.name}
                      </span>
                    </span>
                    <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)]">
                      {participant.status === 'online'
                        ? 'Online'
                        : participant.status}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-xs font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface-muted)]"
                onClick={() => setOpenPanel('presence')}
                type="button"
              >
                <Users aria-hidden="true" size={15} strokeWidth={1.8} />
                View full presence
              </button>
            </Surface>

            <Surface
              as="section"
              aria-labelledby="session-tools-title"
              padding="md"
            >
              <h2 className="text-lg font-bold" id="session-tools-title">
                Session tools
              </h2>
              <p className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">
                Connection status is independent from poll lifecycle and
                response retention.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <a
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-muted)]"
                  href={`/host/sessions/${encodeURIComponent(sessionId)}/results`}
                >
                  <ExternalLink
                    aria-hidden="true"
                    size={16}
                    strokeWidth={1.8}
                  />
                  View host results
                </a>
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-error)]/50 px-4 text-sm font-semibold text-[var(--color-error)] transition-colors hover:bg-[var(--color-surface-error)]"
                  onClick={() => setShowEndDialog(true)}
                  type="button"
                >
                  <Square aria-hidden="true" size={16} strokeWidth={1.8} />
                  End session
                </button>
              </div>
            </Surface>
          </aside>
        </div>

        <nav
          aria-label="Poll navigation"
          className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4 lg:max-w-[calc(100%-22rem-1.5rem)]"
        >
          <button
            className="inline-flex min-h-10 items-center gap-1 rounded-[var(--radius-sm)] px-2 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!previousPoll}
            onClick={() => previousPoll && setActivePollId(previousPoll.id)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={17} strokeWidth={1.8} />
            Previous poll
          </button>
          <span className="hidden text-center text-xs font-semibold text-[var(--color-text-secondary)] sm:block">
            {String(activePoll.position).padStart(2, '0')} ·{' '}
            {activePoll.question}
          </span>
          <button
            className="inline-flex min-h-10 items-center gap-1 rounded-[var(--radius-sm)] px-2 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!nextPoll}
            onClick={() => nextPoll && setActivePollId(nextPoll.id)}
            type="button"
          >
            Next poll
            <ChevronRight aria-hidden="true" size={17} strokeWidth={1.8} />
          </button>
        </nav>
      </main>

      {openPanel === 'share' ? (
        <ShareSessionPanel
          invitationLink={invitationLink}
          onClose={() => setOpenPanel(null)}
          roomCode={roomCode}
        />
      ) : null}
      {openPanel === 'presence' ? (
        <ParticipantPresencePanel
          onClose={() => setOpenPanel(null)}
          participantCount={participantCount}
          participants={participants}
        />
      ) : null}
      {showEndDialog ? (
        <EndSessionDialog
          onClose={() => setShowEndDialog(false)}
          onConfirm={handleEndSession}
          sessionName={sessionName}
        />
      ) : null}
    </div>
  );
}
