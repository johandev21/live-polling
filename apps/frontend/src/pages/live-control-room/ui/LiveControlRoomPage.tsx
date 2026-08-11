import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Share2,
  Square,
  Users,
} from 'lucide-react';

import { ModeToggle } from '@/components/mode-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { GlassHeader } from '@/shared/ui/glass-header';


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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const activePoll = polls.find((poll) => poll.id === activePollId) ?? polls[0];
  const displayError = errorMessage || actionError;

  const activePollIndex = polls.findIndex((poll) => poll.id === (activePoll?.id ?? ''));
  const previousPoll = polls[activePollIndex - 1];
  const nextPoll = polls[activePollIndex + 1];

  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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

  function handleEnterFullscreen() {
    setIsFullscreen(true);
    if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function handleExitFullscreen() {
    setIsFullscreen(false);
    if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  return (
    <div className="min-h-screen bg-mist-50 font-sans text-foreground dark:bg-background">
      <ControlRoomHeader
        connectionState={connectionState}
        participantCount={participantCount}
        roomCode={roomCode}
        sessionName={sessionName}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {displayError ? <ErrorAlert message={displayError} /> : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          {/* Main Content Column */}
          <section
            aria-labelledby="active-poll-title"
            className="min-w-0 space-y-4"
          >
            <ActivePollCard
              onToggleFullscreen={handleEnterFullscreen}
              onToggleLifecycle={handleToggleLifecycle}
              onToggleVisibility={handleToggleVisibility}
              poll={activePoll}
              pollCount={polls.length}
            />

            <PollSequenceCard
              activePollId={activePoll.id}
              onSelectPoll={setActivePollId}
              polls={polls}
            />

            <PollNavigation
              activePoll={activePoll}
              nextPoll={nextPoll}
              onSelectPoll={setActivePollId}
              previousPoll={previousPoll}
            />
          </section>

          {/* Sticky Sidebar Column */}
          <aside aria-label="Live session tools" className="space-y-4 lg:sticky lg:top-20">
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
      </main>

      {isFullscreen ? (
        <FullscreenPollView
          nextPoll={nextPoll}
          onExitFullscreen={handleExitFullscreen}
          onSelectPoll={setActivePollId}
          onToggleLifecycle={handleToggleLifecycle}
          onToggleVisibility={handleToggleVisibility}
          poll={activePoll}
          pollCount={polls.length}
          previousPoll={previousPoll}
          sessionName={sessionName}
        />
      ) : null}

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

function ControlRoomHeader({
  connectionState,
  participantCount,
  roomCode,
  sessionName,
}: {
  connectionState: ConnectionState;
  participantCount: number;
  roomCode: string;
  sessionName: string;
}) {
  return (
    <GlassHeader>
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Brand aria-label="Pulse home" href="/" size="sm" />
          <h1 className="text-lg font-bold tracking-tight text-foreground truncate sm:text-xl">
            {sessionName}
          </h1>
          <StatusBadge label="Live" tone="success" />
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 font-mono text-xs text-muted-foreground sm:inline-flex">
            Code: <strong className="text-foreground font-semibold">{roomCode}</strong>
          </span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users aria-hidden="true" size={14} className="text-primary" />
            <span className="font-semibold text-foreground">{participantCount}</span>
            <span className="hidden sm:inline">online</span>
          </div>
          <ConnectionStatus state={connectionState} />
          <ModeToggle />
          <a
            className="text-xs font-medium text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            href="/host/dashboard"
          >
            Exit
          </a>
        </div>
      </div>
    </GlassHeader>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="mb-4">
      <Alert variant="destructive">
        <AlertTitle>Action failed</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
}

function ActivePollCard({
  onToggleFullscreen,
  onToggleLifecycle,
  onToggleVisibility,
  poll,
  pollCount,
}: {
  onToggleFullscreen: () => void;
  onToggleLifecycle: () => void;
  onToggleVisibility: () => void;
  poll: LivePoll;
  pollCount: number;
}) {
  const isOpen = poll.lifecycle === 'open';
  const isHidden = poll.resultVisibility === 'hidden';

  return (
    <Card className="flex flex-col h-[540px] sm:h-[580px] lg:h-[600px] p-6 sm:p-7 justify-between">
      {/* Poll Header & Status - Fixed top */}
      <div className="space-y-2 shrink-0 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Active Poll ({formatPollNumber(poll.position)} of {formatPollNumber(pollCount)})
          </span>
          <div className="flex items-center gap-2">
            <StatusBadge
              label={pollLifecycleLabels[poll.lifecycle]}
              tone={poll.lifecycle === 'open' ? 'success' : 'neutral'}
            />
            <Button
              aria-label="Enter fullscreen presentation view"
              onClick={onToggleFullscreen}
              size="icon-xs"
              variant="ghost"
              type="button"
            >
              <Maximize2 aria-hidden="true" size={14} />
            </Button>
          </div>
        </div>

        <h2
          className="text-xl font-bold leading-snug tracking-tight text-foreground sm:text-2xl lg:text-3xl line-clamp-2"
          id="active-poll-title"
        >
          {poll.question}
        </h2>

        <p className="text-xs text-muted-foreground font-medium sm:text-sm">
          {pollTypeLabel(poll.type)}, responses update live
        </p>
      </div>

      {/* Live Results Visualization - Scrollable middle container */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2 pr-1">
        <PollResults poll={poll} />
      </div>

      {/* Action Controls Bar - Fixed bottom */}
      <div className="flex flex-col gap-3 shrink-0 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onToggleLifecycle} size="sm" variant={isOpen ? 'secondary' : 'default'}>
            {isOpen ? (
              <Pause aria-hidden="true" size={15} />
            ) : (
              <Play aria-hidden="true" size={15} />
            )}
            <span>{isOpen ? 'Close poll' : 'Open poll'}</span>
          </Button>
          <Button onClick={onToggleVisibility} size="sm" variant="outline">
            {isHidden ? (
              <Eye aria-hidden="true" size={15} />
            ) : (
              <EyeOff aria-hidden="true" size={15} />
            )}
            <span>{isHidden ? 'Reveal results' : 'Hide results'}</span>
          </Button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {poll.totalResponses} total response{poll.totalResponses === 1 ? '' : 's'}
          </span>
          <span className={getResultVisibilityClassName(poll.resultVisibility)}>
            {resultVisibilityLabels[poll.resultVisibility]}
          </span>
        </div>
      </div>
    </Card>
  );
}

function FullscreenPollView({
  nextPoll,
  onExitFullscreen,
  onSelectPoll,
  onToggleLifecycle,
  onToggleVisibility,
  poll,
  pollCount,
  previousPoll,
  sessionName,
}: {
  nextPoll?: LivePoll;
  onExitFullscreen: () => void;
  onSelectPoll: (pollId: string) => void;
  onToggleLifecycle: () => void;
  onToggleVisibility: () => void;
  poll: LivePoll;
  pollCount: number;
  previousPoll?: LivePoll;
  sessionName: string;
}) {
  const isOpen = poll.lifecycle === 'open';
  const isHidden = poll.resultVisibility === 'hidden';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-background p-6 sm:p-10 text-foreground overflow-y-auto">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between gap-4 pb-2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-foreground truncate hidden sm:inline">
            {sessionName}
          </span>
          <StatusBadge
            label={pollLifecycleLabels[poll.lifecycle]}
            tone={poll.lifecycle === 'open' ? 'success' : 'neutral'}
          />
          <span className="text-xs font-semibold text-primary">
            Poll {formatPollNumber(poll.position)} of {formatPollNumber(pollCount)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            aria-label="Previous poll"
            disabled={!previousPoll}
            onClick={() => previousPoll && onSelectPoll(previousPoll.id)}
            size="icon-sm"
            variant="outline"
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={16} />
          </Button>
          <Button
            aria-label="Next poll"
            disabled={!nextPoll}
            onClick={() => nextPoll && onSelectPoll(nextPoll.id)}
            size="icon-sm"
            variant="outline"
            type="button"
          >
            <ChevronRight aria-hidden="true" size={16} />
          </Button>

          <Button
            aria-label="Exit fullscreen presentation view"
            onClick={onExitFullscreen}
            size="sm"
            variant="ghost"
            type="button"
            className="ml-2 gap-1.5"
          >
            <Minimize2 aria-hidden="true" size={15} />
            <span className="hidden sm:inline">Exit fullscreen</span>
          </Button>
        </div>
      </header>

      {/* Main Focus Content Area */}
      <main className="my-auto py-8 max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {poll.question}
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            {pollTypeLabel(poll.type)}, responses update live
          </p>
        </div>

        <div className="w-full">
          <PollResults poll={poll} />
        </div>
      </main>

      {/* Bottom Floating Controls Bar */}
      <footer className="flex flex-col gap-4 pt-2 shrink-0 sm:flex-row sm:items-center sm:justify-between max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Button onClick={onToggleLifecycle} size="sm" variant={isOpen ? 'secondary' : 'default'}>
            {isOpen ? <Pause aria-hidden="true" size={15} /> : <Play aria-hidden="true" size={15} />}
            <span>{isOpen ? 'Close poll' : 'Open poll'}</span>
          </Button>
          <Button onClick={onToggleVisibility} size="sm" variant="outline">
            {isHidden ? <Eye aria-hidden="true" size={15} /> : <EyeOff aria-hidden="true" size={15} />}
            <span>{isHidden ? 'Reveal results' : 'Hide results'}</span>
          </Button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {poll.totalResponses} total response{poll.totalResponses === 1 ? '' : 's'}
          </span>
          <span className={getResultVisibilityClassName(poll.resultVisibility)}>
            {resultVisibilityLabels[poll.resultVisibility]}
          </span>
        </div>
      </footer>
    </div>
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
    <Card aria-labelledby="poll-sequence-title" className="p-5">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h2
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          id="poll-sequence-title"
        >
          Poll Sequence
        </h2>
        <span className="text-xs text-muted-foreground">Select to view</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
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
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-muted-foreground">
          {formatPollNumber(poll.position)}
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {pollTypeShortLabels[poll.type]}
        </span>
      </div>
      <span className="mt-1 line-clamp-2 block text-xs font-semibold text-foreground leading-snug">
        {poll.question}
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
    <Card className="flex flex-col gap-4 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Share session
        </p>
        <p className="mt-1 font-mono text-4xl font-bold tracking-widest break-all text-foreground">
          {roomCode}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Participants join with this Room Code or Invitation Link.
        </p>
      </div>

      <Button
        className="w-full"
        onClick={onOpenSharePanel}
        variant="secondary"
        size="sm"
      >
        <Share2 aria-hidden="true" size={15} />
        <span>Open sharing panel</span>
      </Button>
    </Card>
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
    <Card aria-labelledby="presence-summary-title" className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-foreground sm:text-lg" id="presence-summary-title">
          Participant presence
        </h2>
        <span className="text-xs font-semibold text-foreground">
          {participantCount} online
        </span>
      </div>

      <ul className="space-y-2">
        {participants.slice(0, 4).map((participant) => (
          <li
            className="flex items-center justify-between gap-3 text-xs"
            key={participant.id}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2 shrink-0 rounded-full bg-primary" />
              <span className="truncate font-medium text-foreground">
                {participant.name}
              </span>
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {getParticipantStatusLabel(participant.status)}
            </span>
          </li>
        ))}
      </ul>

      <Button
        onClick={onOpenPresencePanel}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <Users aria-hidden="true" size={14} />
        <span>View full presence</span>
      </Button>
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
    <Card aria-labelledby="session-tools-title" className="p-5 space-y-3">
      <h2 className="text-base font-bold text-foreground sm:text-lg" id="session-tools-title">
        Session tools
      </h2>
      <div className="flex flex-col gap-2">
        <a
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted"
          href={`/host/sessions/${encodeURIComponent(sessionId)}/results`}
        >
          <ExternalLink aria-hidden="true" size={14} />
          <span>View host results</span>
        </a>
        <Button
          onClick={onEndSession}
          variant="destructive"
          size="sm"
          className="w-full"
        >
          <Square aria-hidden="true" size={14} />
          <span>End session</span>
        </Button>
      </div>
    </Card>
  );
}

function PollNavigation({
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
      className="flex items-center justify-center gap-2 pt-1"
    >
      <Button
        aria-label="Previous poll"
        disabled={!previousPoll}
        onClick={() => previousPoll && onSelectPoll(previousPoll.id)}
        size="icon-sm"
        variant="outline"
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={16} />
      </Button>
      <Button
        aria-label="Next poll"
        disabled={!nextPoll}
        onClick={() => nextPoll && onSelectPoll(nextPoll.id)}
        size="icon-sm"
        variant="outline"
        type="button"
      >
        <ChevronRight aria-hidden="true" size={16} />
      </Button>
    </nav>
  );
}

function LoadingState() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <Card className="p-8 sm:p-10">
        <p className="text-sm font-medium text-muted-foreground">
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
        <Card className="w-full p-8 text-center sm:p-10 space-y-4">
          <StatusBadge label="Ended session" tone="neutral" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {sessionName} is now read-only
          </h1>
          <p className="mx-auto max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Participants can no longer respond. The complete host-visible poll
            history remains available from the ended session history page.
          </p>
          <a
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-xs font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-95 active:translate-y-px sm:text-sm"
            href={endedHistoryHref}
          >
            <ExternalLink aria-hidden="true" size={15} />
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
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Latest responses
          </h3>
          <span className="text-xs font-semibold text-primary">
            {poll.totalResponses} total
          </span>
        </div>
        {poll.responses.length > 0 ? (
          <ul className="space-y-2">
            {poll.responses.map((response) => (
              <li
                className="rounded-md border border-border/80 bg-background p-3 text-xs text-muted-foreground sm:text-sm"
                key={response.id}
              >
                <span className="mr-2 font-mono text-xs text-muted-foreground">
                  {response.submittedAt}
                </span>
                {response.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-md bg-muted/40 p-4 text-xs text-muted-foreground sm:text-sm">
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
          className="rounded-md border border-border/80 bg-card p-4"
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
      <div className="flex items-baseline justify-between gap-4 text-xs sm:text-sm">
        <span className="min-w-0 font-semibold wrap-break-word text-foreground">{label}</span>
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
      <span aria-hidden="true" className="size-6 shrink-0 rounded-full bg-primary" />
      <span className="text-lg leading-none font-bold tracking-tight">pulse</span>
    </>
  );
  return href ? (
    <a {...props} className="inline-flex items-center gap-2" href={href}>
      {content}
    </a>
  ) : (
    <span {...props} className="inline-flex items-center gap-2">
      {content}
    </span>
  );
}

function formatPollNumber(number: number): string {
  return String(number);
}

function getResultVisibilityClassName(visibility: ResultVisibility): string {
  return visibility === 'hidden'
    ? 'text-xs font-medium text-muted-foreground'
    : 'text-xs font-medium text-foreground';
}

function getPollSequenceButtonClassName(isActive: boolean): string {
  return isActive
    ? 'min-w-0 rounded-md bg-secondary/80 p-3 text-left ring-1 ring-primary/80 transition-all'
    : 'min-w-0 rounded-md bg-background p-3 text-left border border-border/80 transition-colors hover:bg-muted/40';
}

function getParticipantStatusLabel(status: ParticipantPresence['status']): string {
  return status === 'online' ? 'Online' : status;
}

function calculatePercentage(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}
