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

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brand } from '@/shared/ui/brand';

import {
  type EditorPoll,
  type EditorPollStatus,
  type EditorPollType,
  type SessionEditorSession,
} from '../model/session-editor';

export type SessionEditorPageProps = Readonly<{
  errorMessage?: string | null;
  initialSession?: SessionEditorSession;
  isLoading?: boolean;
  onAddPoll?: (session: SessionEditorSession) => void;
  onDeletePollSubmit?: (pollId: string) => Promise<void> | void;
  onEditPoll?: (poll: EditorPoll) => void;
  onMovePollSubmit?: (pollId: string, direction: -1 | 1) => Promise<void> | void;
  onOpenLockedPoll?: (poll: EditorPoll) => void;
  onStartSession?: (session: SessionEditorSession) => void;
  onStartSessionSubmit?: () => Promise<void> | void;
}>;

const undefinedSession: SessionEditorSession = {
  id: '',
  lifecycle: 'draft',
  name: '',
  polls: [],
};

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

export function SessionEditorPage({
  errorMessage,
  initialSession,
  isLoading = false,
  onAddPoll,
  onDeletePollSubmit,
  onEditPoll,
  onMovePollSubmit,
  onOpenLockedPoll,
  onStartSession,
  onStartSessionSubmit,
}: SessionEditorPageProps) {
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  if (isLoading) {
    return <SessionLoadingState session={initialSession} />;
  }

  if (!initialSession) {
    return <SessionUnavailableState />;
  }

  const session = initialSession;
  const isEmpty = session.polls.length === 0;
  const isDraft = session.lifecycle === 'draft';
  const startDisabled = !isDraft || isEmpty;
  const startReason = getStartReason(session);

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

    if (poll.hasResponses) {
      setActionMessage('This poll has responses and is locked for editing.');
      onOpenLockedPoll?.(poll);
      return;
    }
    setActionMessage(`Editing ${poll.text}.`);
    onEditPoll?.(poll);
  }

  async function handleDeletePoll(pollId: string) {
    if (!isDraft) {
      setActionMessage('Only draft sessions can be edited.');
      return;
    }

    if (!onDeletePollSubmit) {
      setActionMessage('Poll removal is unavailable.');
      return;
    }

    try {
      await onDeletePollSubmit(pollId);
      setActionMessage('Poll removed from this draft.');
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : 'Failed to delete poll.',
      );
    }
  }

  async function handleMovePoll(pollId: string, direction: -1 | 1) {
    if (!isDraft) {
      setActionMessage('Only draft sessions can be edited.');
      return;
    }

    if (!onMovePollSubmit) {
      setActionMessage('Reordering is unavailable.');
      return;
    }

    try {
      await onMovePollSubmit(pollId, direction);
      setActionMessage(
        direction === -1 ? 'Poll moved earlier.' : 'Poll moved later.',
      );
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : 'Failed to reorder polls.',
      );
    }
  }

  async function handleStartSession() {
    if (startDisabled) {
      return;
    }

    if (!onStartSessionSubmit) {
      setActionMessage('Starting a session is unavailable.');
      return;
    }

    try {
      await onStartSessionSubmit();
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : 'Failed to start session.',
      );
      return;
    }

    setActionMessage(
      'Session started. Participants can join with the Room Code.',
    );
    onStartSession?.(session);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header session={session} />
      <main className="mx-auto flex w-full max-w-(--breakpoint-2xl) flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-16">
        <SessionHeaderSection
          actionMessage={actionMessage}
          errorMessage={errorMessage}
          isDraft={isDraft}
          onAddPoll={handleAddPoll}
          onStartSession={handleStartSession}
          session={session}
          startDisabled={startDisabled}
          startReason={startReason}
        />

        {isEmpty ? (
          <EmptyPollState
            isDraft={isDraft}
            onAddPoll={handleAddPoll}
            session={session}
          />
        ) : (
          <PollSequenceList
            isDraft={isDraft}
            onDeletePoll={handleDeletePoll}
            onEditPoll={handleEditPoll}
            onMovePoll={handleMovePoll}
            session={session}
          />
        )}
      </main>
    </div>
  );
}

function SessionLoadingState({ session }: { session?: SessionEditorSession }) {
  return (
    <div className="min-h-screen bg-background">
      <Header session={session ?? undefinedSession} />
      <main className="mx-auto flex w-full max-w-(--breakpoint-2xl) items-center justify-center py-20 text-sm font-semibold text-muted-foreground">
        Loading session details...
      </main>
    </div>
  );
}

function SessionUnavailableState() {
  return (
    <div className="min-h-screen bg-background">
      <Header session={undefinedSession} />
      <main className="mx-auto flex w-full max-w-(--breakpoint-2xl) items-center justify-center py-20 text-sm font-semibold text-muted-foreground">
        This session could not be loaded. Return to the dashboard and try
        again.
      </main>
    </div>
  );
}

function SessionHeaderSection({
  actionMessage,
  errorMessage,
  isDraft,
  onAddPoll,
  onStartSession,
  session,
  startDisabled,
  startReason,
}: {
  actionMessage: string | null;
  errorMessage?: string | null;
  isDraft: boolean;
  onAddPoll: () => void;
  onStartSession: () => void;
  session: SessionEditorSession;
  startDisabled: boolean;
  startReason: string;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-bold tracking-[-0.03em] wrap-break-word text-foreground">
            {session.name}
          </h1>
          <LifecycleBadge lifecycle={session.lifecycle} />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {isDraft ? (
            <DraftActionsBar
              onAddPoll={onAddPoll}
              onStartSession={onStartSession}
              startDisabled={startDisabled}
            />
          ) : (
            <LifecycleNavigationLink
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground hover:brightness-95"
              session={session}
            />
          )}
        </div>
      </div>
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      <SessionLifecycleAlert lifecycle={session.lifecycle} />
      <p className="text-sm text-muted-foreground" role="status">
        {startReason}
      </p>
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

function LifecycleBadge({
  lifecycle,
}: {
  lifecycle: SessionEditorSession['lifecycle'];
}) {
  const variant =
    lifecycle === 'draft'
      ? 'secondary'
      : lifecycle === 'live'
        ? 'default'
        : 'outline';

  return (
    <Badge variant={variant} role="status">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {lifecycle === 'draft' ? 'Draft Session' : `${lifecycle} Session`}
    </Badge>
  );
}

function DraftActionsBar({
  onAddPoll,
  onStartSession,
  startDisabled,
}: {
  onAddPoll: () => void;
  onStartSession: () => void;
  startDisabled: boolean;
}) {
  return (
    <>
      <Button onClick={onAddPoll} size="lg" variant="outline">
        <Plus aria-hidden="true" className="mr-2" size={16} />
        Add poll
      </Button>
      <Button disabled={startDisabled} onClick={onStartSession} size="lg">
        <Play aria-hidden="true" className="mr-2" size={16} />
        Start session
      </Button>
    </>
  );
}

function SessionLifecycleAlert({
  lifecycle,
}: {
  lifecycle: SessionEditorSession['lifecycle'];
}) {
  if (lifecycle === 'draft') {
    return (
      <Alert role="note">
        <AlertTitle>Session readiness</AlertTitle>
        <AlertDescription>
          Participants cannot join yet. Add or edit polls before you start
          the session.
        </AlertDescription>
      </Alert>
    );
  }

  if (lifecycle === 'live') {
    return (
      <Alert role="note">
        <AlertTitle>Session is live</AlertTitle>
        <AlertDescription>
          Participants can join this session. The first open poll is
          accepting responses.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert role="note">
      <AlertTitle>Session ended</AlertTitle>
      <AlertDescription>
        This session has ended. Polls and results are available as
        read-only history.
      </AlertDescription>
    </Alert>
  );
}

function EmptyPollState({
  isDraft,
  onAddPoll,
  session,
}: {
  isDraft: boolean;
  onAddPoll: () => void;
  session: SessionEditorSession;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,900px)_320px]">
      <Card className="flex min-h-105 flex-col items-center justify-center gap-5 px-6 py-12 text-center">
        <span className="flex size-18 items-center justify-center rounded-full bg-muted text-foreground">
          <Layers aria-hidden="true" size={30} />
        </span>
        <div className="max-w-lg">
          <h2 className="text-2xl font-bold text-foreground">
            No polls configured
          </h2>
          <p className="mt-2 text-base leading-6 text-muted-foreground">
            {isDraft
              ? 'Add at least one poll to start your session. You can reorder polls and edit them before going live.'
              : 'This session has no editable poll list. Review the permitted session view instead.'}
          </p>
        </div>
        {isDraft ? (
          <Button onClick={onAddPoll} size="lg">
            <Plus aria-hidden="true" className="mr-2" size={18} />
            Add your first poll
          </Button>
        ) : (
          <LifecycleNavigationLink
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-primary px-5 text-base font-semibold text-primary-foreground hover:brightness-95"
            session={session}
          />
        )}
      </Card>
      <ReadinessRail session={session} />
    </section>
  );
}

function PollSequenceList({
  isDraft,
  onDeletePoll,
  onEditPoll,
  onMovePoll,
  session,
}: {
  isDraft: boolean;
  onDeletePoll: (pollId: string) => void;
  onEditPoll: (poll: EditorPoll) => void;
  onMovePoll: (pollId: string, direction: -1 | 1) => void;
  session: SessionEditorSession;
}) {
  const pollCountLabel = session.polls.length === 1 ? 'poll' : 'polls';

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,900px)_320px]">
      <section aria-labelledby="poll-sequence-heading">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2
            className="text-xs font-bold tracking-[0.14em] text-foreground"
            id="poll-sequence-heading"
          >
            Poll sequence - {session.polls.length} {pollCountLabel}
          </h2>
          <span className="text-xs text-muted-foreground">
            {isDraft ? 'Reorder before starting' : 'Read-only poll history'}
          </span>
        </div>
        <ol className="flex flex-col gap-3">
          {session.polls.map((poll, index) => (
            <li key={poll.id}>
              <PollRow
                index={index}
                isDraft={isDraft}
                isFirst={index === 0}
                isLast={index === session.polls.length - 1}
                onDelete={onDeletePoll}
                onEdit={onEditPoll}
                onMove={onMovePoll}
                poll={poll}
              />
            </li>
          ))}
        </ol>
      </section>
      <ReadinessRail session={session} />
    </section>
  );
}

function PollRow({
  index,
  isDraft,
  isFirst,
  isLast,
  onDelete,
  onEdit,
  onMove,
  poll,
}: {
  index: number;
  isDraft: boolean;
  isFirst: boolean;
  isLast: boolean;
  onDelete: (pollId: string) => void;
  onEdit: (poll: EditorPoll) => void;
  onMove: (pollId: string, direction: -1 | 1) => void;
  poll: EditorPoll;
}) {
  const position = String(index + 1).padStart(2, '0');

  function handleMoveEarlier() {
    onMove(poll.id, -1);
  }

  function handleMoveLater() {
    onMove(poll.id, 1);
  }

  function handleEdit() {
    onEdit(poll);
  }

  function handleDelete() {
    onDelete(poll.id);
  }

  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <div className="flex items-center gap-3 sm:flex-col">
        <span className="flex min-h-10 min-w-10 items-center justify-center rounded-sm bg-muted font-mono text-xs font-bold text-muted-foreground">
          {position}
        </span>
        {isDraft ? (
          <GripVertical
            aria-hidden="true"
            className="hidden text-muted-foreground sm:block"
            size={17}
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-bold wrap-break-word text-foreground">
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
            className="inline-flex size-9 items-center justify-center rounded-sm border border-border text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isFirst}
            onClick={handleMoveEarlier}
            type="button"
          >
            <ChevronUp aria-hidden="true" size={16} />
          </button>
          <button
            aria-label={`Move poll ${index + 1} later`}
            className="inline-flex size-9 items-center justify-center rounded-sm border border-border text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isLast}
            onClick={handleMoveLater}
            type="button"
          >
            <ChevronDown aria-hidden="true" size={16} />
          </button>
          <Button onClick={handleEdit} size="sm" variant="outline">
            <Pencil aria-hidden="true" className="mr-2" size={14} />
            {poll.hasResponses ? 'View locked poll' : 'Edit'}
          </Button>
          <button
            aria-label={`Delete poll ${index + 1}`}
            className="inline-flex size-9 items-center justify-center rounded-sm border border-transparent text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            type="button"
          >
            <Trash2 aria-hidden="true" size={16} />
          </button>
        </div>
      ) : (
        <span className="text-xs font-semibold text-muted-foreground">
          Read-only
        </span>
      )}
    </Card>
  );
}

function PollType({ poll }: { poll: EditorPoll }) {
  const TypeIcon = pollTypeIcons[poll.type];
  return (
    <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <TypeIcon aria-hidden="true" className="text-foreground" size={15} />
      <span>{pollTypeLabels[poll.type]}</span>
      <span
        className={
          poll.status === 'open'
            ? 'font-semibold text-foreground'
            : 'font-semibold text-muted-foreground'
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
    <Card className="flex flex-col gap-5 p-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">{railTitle}</h2>
        <p className="mt-2 text-sm leading-5 text-muted-foreground">
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
              hasName ? 'text-foreground' : 'text-muted-foreground'
            }
            size={18}
          />
          <span>
            <span className="block text-sm font-semibold text-foreground">
              Session name
            </span>
            <span className="block text-xs text-muted-foreground">
              {hasName ? 'Added' : 'Required'}
            </span>
          </span>
        </li>
        <li className="flex items-start gap-3">
          <CircleCheck
            aria-hidden="true"
            className={
              hasPolls ? 'text-foreground' : 'text-muted-foreground'
            }
            size={18}
          />
          <span>
            <span className="block text-sm font-semibold text-foreground">
              Polls configured
            </span>
            <span className="block text-xs text-muted-foreground">
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
              isDraft ? 'text-muted-foreground' : 'text-foreground'
            }
            size={18}
          />
          <span>
            <span className="block text-sm font-semibold text-foreground">
              {lifecycleStepLabel}
            </span>
            <span className="block text-xs text-muted-foreground">
              {lifecycleStepDetail}
            </span>
          </span>
        </li>
      </ul>
      <div className="space-y-2">
        <p className="text-xs leading-5 text-muted-foreground">{railFooter}</p>
        <LifecycleNavigationLink
          className="inline-flex items-center gap-2 text-xs font-bold text-foreground hover:underline"
          session={session}
        />
      </div>
    </Card>
  );
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
    <header className="border-b border-border bg-background">
      <nav
        aria-label="Session editor navigation"
        className="mx-auto flex w-full max-w-(--breakpoint-2xl) items-center justify-between p-4 sm:px-6 lg:px-16"
      >
        <a
          className="inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-muted-foreground hover:text-foreground"
          href="/host/dashboard"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Your sessions
        </a>
        <div className="flex items-center gap-4">
          <LifecycleNavigationLink
            className="inline-flex min-h-9 items-center gap-2 rounded-sm px-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            session={session}
          />
          <Brand aria-label="Pulse home" href="/" size="sm" />
        </div>
      </nav>
    </header>
  );
}

function getStartReason(session: SessionEditorSession) {
  if (session.lifecycle === 'draft') {
    return session.polls.length === 0
      ? 'Add at least one poll before starting the session.'
      : 'Participants cannot join until you start the session.';
  }

  return session.lifecycle === 'live'
    ? 'This live session is read-only here. Use the live control room for lifecycle actions.'
    : 'This ended session is read-only. Review the completed history instead.';
}

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
