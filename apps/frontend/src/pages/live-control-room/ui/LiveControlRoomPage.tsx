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

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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

type ConnectionState =
  | 'connected'
  | 'connecting'
  | 'reconnecting'
  | 'stale'
  | 'synchronized';

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

  const activePoll = polls.find((poll) => poll.id === activePollId) ?? polls[0];
  const displayError = errorMessage || actionError;

  if (isLoading) {
    return <LoadingState />;
  }

  if (!activePoll) {
    return <NoActivePollState />;
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

  function handleOpenSharePanel() {
    setOpenPanel('share');
  }

  function handleOpenPresencePanel() {
    setOpenPanel('presence');
  }

  function handleClosePanel() {
    setOpenPanel(null);
  }

  function handleRequestEndSession() {
    setShowEndDialog(true);
  }

  function handleCloseEndDialog() {
    setShowEndDialog(false);
  }

  const activePollIndex = polls.findIndex((poll) => poll.id === activePoll.id);
  const previousPoll = polls[activePollIndex - 1];
  const nextPoll = polls[activePollIndex + 1];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ControlRoomHeader connectionState={connectionState} />

      <main className="mx-auto w-full max-w-360 px-4 py-7 sm:px-6 lg:px-12 lg:py-9">
        <SessionHeader
          participantCount={participantCount}
          roomCode={roomCode}
          sessionName={sessionName}
        />

        {displayError ? <ErrorAlert message={displayError} /> : null}

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <section
            aria-labelledby="active-poll-title"
            className="min-w-0 space-y-4"
          >
            <ActivePollCard poll={activePoll} pollCount={polls.length} />
            <ActivePollControls
              onToggleLifecycle={handleToggleLifecycle}
              onToggleVisibility={handleToggleVisibility}
              poll={activePoll}
            />
            <PollSequenceCard
              activePollId={activePoll.id}
              onSelectPoll={setActivePollId}
              polls={polls}
            />
          </section>

          <aside aria-label="Live session tools" className="space-y-4">
            <ShareSessionCard
              onOpenSharePanel={handleOpenSharePanel}
              roomCode={roomCode}
            />
            <PresenceSummaryCard
              onOpenPresencePanel={handleOpenPresencePanel}
              participantCount={participantCount}
              participants={participants}
            />
            <SessionToolsCard
              onEndSession={handleRequestEndSession}
              sessionId={sessionId}
            />
          </aside>
        </div>

        <PollNavigation
          activePoll={activePoll}
          nextPoll={nextPoll}
          onSelectPoll={setActivePollId}
          previousPoll={previousPoll}
        />
      </main>

      {openPanel === 'share' ? (
        <ShareSessionPanel
          invitationLink={invitationLink}
          onClose={handleClosePanel}
          roomCode={roomCode}
        />
      ) : null}
      {openPanel === 'presence' ? (
        <ParticipantPresencePanel
          onClose={handleClosePanel}
          participantCount={participantCount}
          participants={participants}
        />
      ) : null}
      {showEndDialog ? (
        <EndSessionDialog
          onClose={handleCloseEndDialog}
          onConfirm={handleEndSession}
          sessionName={sessionName}
        />
      ) : null}
    </div>
  );
}

function ControlRoomHeader({ connectionState }: { connectionState: ConnectionState }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-360 items-center justify-between gap-4 p-4 sm:px-6 lg:px-12">
        <Brand aria-label="Pulse home" size="md" />
        <div className="flex items-center gap-2 sm:gap-4">
          <ConnectionStatus state={connectionState} />
          <a
            className="hidden text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-primary hover:underline sm:inline"
            href="/host/dashboard"
          >
            Exit control room
          </a>
        </div>
      </div>
    </header>
  );
}

function SessionHeader({
  participantCount,
  roomCode,
  sessionName,
}: {
  participantCount: number;
  roomCode: string;
  sessionName: string;
}) {
  return (
    <header className="flex flex-col gap-6 border-b border-border pb-7 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
            {sessionName}
          </h1>
          <StatusBadge label="Live session" tone="success" />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Room Code {roomCode}
        </p>
      </div>
      <ParticipantCount participantCount={participantCount} />
    </header>
  );
}

function ParticipantCount({ participantCount }: { participantCount: number }) {
  return (
    <div className="flex items-center gap-3">
      <Users
        aria-hidden="true"
        className="text-primary"
        size={20}
        strokeWidth={1.8}
      />
      <div>
        <p className="font-mono text-xl leading-none font-bold">
          {participantCount}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          participants connected · approximate
        </p>
      </div>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="mt-4">
      <Alert variant="destructive">
        <AlertTitle>Action failed</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
}

function ActivePollCard({ poll, pollCount }: { poll: LivePoll; pollCount: number }) {
  return (
    <Card className="space-y-6 p-8 sm:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-primary">
            ACTIVE POLL · {formatPollNumber(poll.position)} OF{' '}
            {formatPollNumber(pollCount)}
          </p>
          <h2
            className="mt-3 max-w-3xl text-3xl leading-tight font-bold tracking-[-0.04em] sm:text-4xl"
            id="active-poll-title"
          >
            {poll.question}
          </h2>
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            {pollTypeLabel(poll.type)} · Responses update live
          </p>
        </div>
        <StatusBadge
          label={pollLifecycleLabels[poll.lifecycle]}
          tone={poll.lifecycle === 'open' ? 'success' : 'neutral'}
        />
      </div>

      <PollResults poll={poll} />

      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-xs font-bold text-muted-foreground">
          {poll.totalResponses} total responses
        </p>
        <p className={getResultVisibilityClassName(poll.resultVisibility)}>
          {resultVisibilityLabels[poll.resultVisibility]}
        </p>
      </div>
    </Card>
  );
}

function ActivePollControls({
  onToggleLifecycle,
  onToggleVisibility,
  poll,
}: {
  onToggleLifecycle: () => void;
  onToggleVisibility: () => void;
  poll: LivePoll;
}) {
  const isOpen = poll.lifecycle === 'open';
  const isHidden = poll.resultVisibility === 'hidden';

  return (
    <Card
      aria-label="Active poll controls"
      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onToggleLifecycle} variant="secondary">
          <span className="inline-flex items-center gap-2">
            {isOpen ? (
              <Pause aria-hidden="true" size={16} strokeWidth={1.8} />
            ) : (
              <Play aria-hidden="true" size={16} strokeWidth={1.8} />
            )}
            {isOpen ? 'Close poll' : 'Open poll'}
          </span>
        </Button>
        <Button onClick={onToggleVisibility} variant="default">
          <span className="inline-flex items-center gap-2">
            {isHidden ? (
              <Eye aria-hidden="true" size={16} strokeWidth={1.8} />
            ) : (
              <EyeOff aria-hidden="true" size={16} strokeWidth={1.8} />
            )}
            {isHidden ? 'Reveal results' : 'Hide results'}
          </span>
        </Button>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">
        Actions apply immediately
      </p>
    </Card>
  );
}

function PollSequenceCard({
  activePollId,
  onSelectPoll,
  polls,
}: {
  activePollId: string;
  onSelectPoll: (pollId: string) => void;
  polls: readonly LivePoll[];
}) {
  return (
    <Card aria-labelledby="poll-sequence-title" className="p-6">
      <div className="flex items-center justify-between gap-4">
        <h2
          className="font-mono text-[10px] font-bold tracking-[0.14em] text-muted-foreground"
          id="poll-sequence-title"
        >
          POLL SEQUENCE
        </h2>
        <span className="text-xs text-muted-foreground">Select a poll</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {polls.map((poll) => (
          <PollSequenceButton
            isActive={poll.id === activePollId}
            key={poll.id}
            onSelect={() => onSelectPoll(poll.id)}
            poll={poll}
          />
        ))}
      </div>
    </Card>
  );
}

function PollSequenceButton({
  isActive,
  onSelect,
  poll,
}: {
  isActive: boolean;
  onSelect: () => void;
  poll: LivePoll;
}) {
  return (
    <button
      aria-pressed={isActive}
      className={getPollSequenceButtonClassName(isActive)}
      onClick={onSelect}
      type="button"
    >
      <span className="font-mono text-[10px] font-bold">
        {formatPollNumber(poll.position)}
      </span>
      <span className="mt-1 line-clamp-2 block text-xs leading-4 font-semibold">
        {poll.question}
      </span>
      <span className="mt-2 block text-[10px] text-muted-foreground">
        {pollTypeShortLabels[poll.type]}
      </span>
    </button>
  );
}

function ShareSessionCard({
  onOpenSharePanel,
  roomCode,
}: {
  onOpenSharePanel: () => void;
  roomCode: string;
}) {
  return (
    <section className="rounded-lg bg-primary p-6 text-primary-foreground shadow-sm">
      <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-primary-foreground/80">
        SHARE THIS SESSION
      </p>
      <div className="mt-3 flex items-start justify-between gap-3">
        <p className="font-mono text-4xl font-bold tracking-widest break-all sm:text-5xl">
          {roomCode}
        </p>
        <Share2
          aria-hidden="true"
          className="mt-1 shrink-0"
          size={22}
          strokeWidth={1.7}
        />
      </div>
      <p className="mt-4 text-sm leading-5 text-primary-foreground/80">
        Participants can join with this Room Code or the Invitation Link.
      </p>
      <Button
        className="mt-5 w-full border-0 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        onClick={onOpenSharePanel}
        variant="secondary"
      >
        <span className="inline-flex items-center gap-2">
          <Share2 aria-hidden="true" size={16} strokeWidth={1.8} />
          Open sharing panel
        </span>
      </Button>
    </section>
  );
}

function PresenceSummaryCard({
  onOpenPresencePanel,
  participantCount,
  participants,
}: {
  onOpenPresencePanel: () => void;
  participantCount: number;
  participants: readonly ParticipantPresence[];
}) {
  return (
    <Card aria-labelledby="presence-summary-title" className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold" id="presence-summary-title">
          Participant presence
        </h2>
        <span className="font-mono text-[11px] font-bold text-foreground">
          {participantCount} online
        </span>
      </div>
      <p className="text-xs text-muted-foreground">Approximate and host-only</p>
      <ul className="space-y-2">
        {participants.slice(0, 4).map((participant) => (
          <li
            className="flex items-center justify-between gap-3"
            key={participant.id}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2 shrink-0 rounded-full bg-primary" />
              <span className="truncate text-sm text-foreground">
                {participant.name}
              </span>
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {getParticipantStatusLabel(participant.status)}
            </span>
          </li>
        ))}
      </ul>
      <button
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-sm border border-border px-3 text-xs font-bold text-primary transition-colors hover:bg-muted"
        onClick={onOpenPresencePanel}
        type="button"
      >
        <Users aria-hidden="true" size={15} strokeWidth={1.8} />
        View full presence
      </button>
    </Card>
  );
}

function SessionToolsCard({
  onEndSession,
  sessionId,
}: {
  onEndSession: () => void;
  sessionId: string;
}) {
  return (
    <Card aria-labelledby="session-tools-title" className="p-6">
      <h2 className="text-lg font-bold" id="session-tools-title">
        Session tools
      </h2>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        Connection status is independent from poll lifecycle and response
        retention.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <a
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          href={`/host/sessions/${encodeURIComponent(sessionId)}/results`}
        >
          <ExternalLink aria-hidden="true" size={16} strokeWidth={1.8} />
          View host results
        </a>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-destructive/50 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
          onClick={onEndSession}
          type="button"
        >
          <Square aria-hidden="true" size={16} strokeWidth={1.8} />
          End session
        </button>
      </div>
    </Card>
  );
}

function PollNavigation({
  activePoll,
  nextPoll,
  onSelectPoll,
  previousPoll,
}: {
  activePoll: LivePoll;
  nextPoll?: LivePoll;
  onSelectPoll: (pollId: string) => void;
  previousPoll?: LivePoll;
}) {
  return (
    <nav
      aria-label="Poll navigation"
      className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 lg:max-w-[calc(100%-22rem-1.5rem)]"
    >
      <button
        className="inline-flex min-h-10 items-center gap-1 rounded-sm px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!previousPoll}
        onClick={() => previousPoll && onSelectPoll(previousPoll.id)}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={17} strokeWidth={1.8} />
        Previous poll
      </button>
      <span className="hidden text-center text-xs font-semibold text-muted-foreground sm:block">
        {formatPollNumber(activePoll.position)} · {activePoll.question}
      </span>
      <button
        className="inline-flex min-h-10 items-center gap-1 rounded-sm px-2 text-xs font-semibold text-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!nextPoll}
        onClick={() => nextPoll && onSelectPoll(nextPoll.id)}
        type="button"
      >
        Next poll
        <ChevronRight aria-hidden="true" size={17} strokeWidth={1.8} />
      </button>
    </nav>
  );
}

function LoadingState() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <Card className="p-8 sm:p-10">
        <p className="text-sm font-semibold text-muted-foreground">
          Loading control room...
        </p>
      </Card>
    </main>
  );
}

function NoActivePollState() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <Card className="p-8 sm:p-10">
        <p className="text-sm text-muted-foreground">
          No active poll configured.
        </p>
      </Card>
    </main>
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
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center">
        <Card className="w-full p-8 text-center sm:p-10">
          <StatusBadge label="Ended session" tone="neutral" />
          <h1 className="mt-5 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
            {sessionName} is now read-only
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Participants can no longer respond. The complete host-visible poll
            history remains available from the ended session history page.
          </p>
          <a
            className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-95 active:translate-y-px"
            href={endedHistoryHref}
          >
            <ExternalLink aria-hidden="true" size={17} strokeWidth={1.8} />
            View ended history
          </a>
        </Card>
      </div>
    </main>
  );
}

function PollResults({ poll }: { poll: LivePoll }) {
  if (poll.type === 'open-ended') {
    return (
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-sm font-bold text-foreground">
            Latest responses
          </h3>
          <span className="font-mono text-xs font-bold text-primary">
            {poll.totalResponses} total
          </span>
        </div>
        {poll.responses.length > 0 ? (
          <ul className="space-y-2">
            {poll.responses.map((response) => (
              <li
                className="rounded-sm border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
                key={response.id}
              >
                <span className="mr-2 font-mono text-[10px] text-muted-foreground">
                  {response.submittedAt}
                </span>
                {response.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-sm bg-muted p-3 text-sm text-muted-foreground">
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
          className="rounded-md border border-border bg-card p-4"
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

function ResultBar({
  ariaLabel,
  count,
  label,
  percentage,
}: {
  ariaLabel: string;
  count: number;
  label: string;
  percentage: number;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="flex w-full flex-col gap-2"
      role="group"
    >
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="min-w-0 font-semibold wrap-break-word">{label}</span>
        <span className="shrink-0 font-mono text-xs font-semibold text-primary">
          {percentage}%
        </span>
      </div>
      <Progress
        aria-label={ariaLabel}
        className="h-2"
        value={Math.min(100, Math.max(0, percentage))}
      />
      <span className="text-xs text-muted-foreground">{count} responses</span>
    </div>
  );
}

function ConnectionStatus({ state }: { state: ConnectionState }) {
  const labels: Record<ConnectionState, string> = {
    connected: 'Connected',
    connecting: 'Connecting',
    reconnecting: 'Reconnecting',
    stale: 'Resync needed',
    synchronized: 'Synchronized',
  };
  return (
    <StatusBadge
      label={labels[state]}
      tone={
        state === 'reconnecting' || state === 'stale'
          ? 'warning'
          : state === 'connecting'
            ? 'neutral'
            : 'success'
      }
    />
  );
}

function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning';
}) {
  return (
    <Badge
      className={cn(
        tone === 'success' && 'bg-primary text-primary-foreground',
        tone === 'warning' && 'bg-muted text-foreground',
      )}
      variant={tone === 'neutral' ? 'secondary' : 'default'}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}

function Brand({
  href = '/',
  ...props
}: { 'aria-label'?: string; href?: string; size?: string }) {
  const content = (
    <>
      <span aria-hidden="true" className="size-7 shrink-0 rounded-full bg-primary" />
      <span className="text-xl leading-none font-bold tracking-tight">pulse</span>
    </>
  );
  return href ? (
    <a {...props} className="inline-flex items-center gap-2.5" href={href}>
      {content}
    </a>
  ) : (
    <span {...props} className="inline-flex items-center gap-2.5">
      {content}
    </span>
  );
}

function formatPollNumber(number: number): string {
  return String(number).padStart(2, '0');
}

function getResultVisibilityClassName(visibility: ResultVisibility): string {
  return visibility === 'hidden'
    ? 'text-xs font-semibold text-muted-foreground'
    : 'text-xs font-semibold text-foreground';
}

function getPollSequenceButtonClassName(isActive: boolean): string {
  return isActive
    ? 'min-w-0 rounded-sm bg-secondary p-3 text-left text-primary ring-1 ring-primary'
    : 'min-w-0 rounded-sm bg-background p-3 text-left text-muted-foreground transition-colors hover:bg-muted';
}

function getParticipantStatusLabel(status: ParticipantPresence['status']): string {
  return status === 'online' ? 'Online' : status;
}

function calculatePercentage(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}
