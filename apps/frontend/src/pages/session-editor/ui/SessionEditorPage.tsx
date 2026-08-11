import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleDot,
  ExternalLink,
  GripVertical,
  ListChecks,
  MessageSquare,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { ModeToggle } from '@/components/mode-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Brand } from '@/shared/ui/brand';
import { GlassHeader } from '@/shared/ui/glass-header';


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
  onReorderPollsSubmit?: (pollIds: string[]) => Promise<void> | void;
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
  onReorderPollsSubmit,
  onOpenLockedPoll,
  onStartSession,
  onStartSessionSubmit,
}: SessionEditorPageProps) {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [polls, setPolls] = useState<readonly EditorPoll[]>(
    initialSession?.polls ?? [],
  );

  useEffect(() => {
    if (initialSession?.polls) {
      setPolls(initialSession.polls);
    }
  }, [initialSession?.polls]);

  if (isLoading) {
    return <SessionLoadingState session={initialSession} />;
  }

  if (!initialSession) {
    return <SessionUnavailableState />;
  }

  const session = {
    ...initialSession,
    polls,
  };

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

    const currentIndex = polls.findIndex((p) => p.id === pollId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= polls.length) {
      return;
    }

    const nextPolls = [...polls];
    const currentItem = nextPolls[currentIndex];
    const targetItem = nextPolls[targetIndex];
    if (!currentItem || !targetItem) return;

    nextPolls[currentIndex] = targetItem;
    nextPolls[targetIndex] = currentItem;

    setPolls(nextPolls);
    setActionMessage(direction === -1 ? 'Poll moved earlier.' : 'Poll moved later.');

    const newIds = nextPolls.map((p) => p.id);
    if (onReorderPollsSubmit) {
      try {
        await onReorderPollsSubmit(newIds);
      } catch (err) {
        setActionMessage(
          err instanceof Error ? err.message : 'Failed to reorder polls.',
        );
      }
    } else if (onMovePollSubmit) {
      try {
        await onMovePollSubmit(pollId, direction);
      } catch (err) {
        setActionMessage(
          err instanceof Error ? err.message : 'Failed to reorder polls.',
        );
      }
    }
  }

  async function handleReorderPolls(nextPolls: EditorPoll[]) {
    setPolls(nextPolls);
    setActionMessage('Poll sequence reordered.');

    const newIds = nextPolls.map((p) => p.id);
    if (onReorderPollsSubmit) {
      try {
        await onReorderPollsSubmit(newIds);
      } catch (err) {
        setActionMessage(
          err instanceof Error ? err.message : 'Failed to save new poll order.',
        );
      }
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
    <div className="min-h-screen bg-mist-50 font-sans text-foreground dark:bg-background">
      <Header session={session} />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          {/* Main Content Column */}
          <div className="flex flex-col gap-6">
            <SessionTitleHeader
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
              <EmptyPollState isDraft={isDraft} onAddPoll={handleAddPoll} />
            ) : (
              <PollSequenceList
                isDraft={isDraft}
                onDeletePoll={handleDeletePoll}
                onEditPoll={handleEditPoll}
                onMovePoll={handleMovePoll}
                onReorderPolls={handleReorderPolls}
                session={session}
              />
            )}
          </div>

          {/* Contextual Sidebar Column */}
          <aside className="lg:sticky lg:top-20">
            <ReadinessSidebar
              isDraft={isDraft}
              onAddPoll={handleAddPoll}
              onStartSession={handleStartSession}
              session={session}
              startDisabled={startDisabled}
              startReason={startReason}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}

function Header({ session }: { session: SessionEditorSession }) {
  return (
    <GlassHeader>
      <nav
        aria-label="Session editor navigation"
        className="flex w-full items-center justify-between"
      >
        <a
          className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground sm:text-base"
          href="/host/dashboard"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          <span>Your sessions</span>
        </a>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <LifecycleNavigationLink
            className="inline-flex min-h-9 items-center gap-2 rounded-md px-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground sm:text-sm"
            session={session}
          />
          <Brand aria-label="Pulse home" href="/" size="sm" />
        </div>
      </nav>
    </GlassHeader>
  );
}

function SessionTitleHeader({
  actionMessage,
  errorMessage,
  isDraft,
  onAddPoll,
  session,
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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {session.name}
          </h1>
          <LifecycleBadge lifecycle={session.lifecycle} />
        </div>

        {isDraft ? (
          <Button onClick={onAddPoll} size="sm" variant="outline">
            <Plus aria-hidden="true" size={16} />
            <span>Add poll</span>
          </Button>
        ) : null}
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {actionMessage ? (
        <p aria-live="polite" className="text-xs font-medium text-muted-foreground sm:text-sm">
          {actionMessage}
        </p>
      ) : null}
    </div>
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
      {lifecycle === 'draft' ? 'Draft Session' : `${lifecycle} Session`}
    </Badge>
  );
}

function EmptyPollState({
  isDraft,
  onAddPoll,
}: {
  isDraft: boolean;
  onAddPoll: () => void;
}) {
  return (
    <Card className="flex flex-col gap-6 p-6 sm:p-8">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-foreground sm:text-xl">No polls yet</h2>
        <p className="text-sm text-muted-foreground leading-relaxed sm:text-base">
          {isDraft
            ? 'Add polls to your session deck. You can choose single-choice, multiple-choice, or open-ended questions.'
            : 'This session has no configured polls.'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-border/80 bg-muted/30 p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground sm:text-sm">
            <CircleDot size={15} className="text-muted-foreground shrink-0" />
            <span>Single-choice</span>
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm">Participants pick one option.</p>
        </div>
        <div className="rounded-md border border-border/80 bg-muted/30 p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground sm:text-sm">
            <ListChecks size={15} className="text-muted-foreground shrink-0" />
            <span>Multiple-choice</span>
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm">Participants select multiple options.</p>
        </div>
        <div className="rounded-md border border-border/80 bg-muted/30 p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground sm:text-sm">
            <MessageSquare size={15} className="text-muted-foreground shrink-0" />
            <span>Open-ended</span>
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm">Freeform text responses.</p>
        </div>
      </div>

      {isDraft ? (
        <div>
          <Button onClick={onAddPoll} size="lg">
            <Plus aria-hidden="true" size={16} />
            <span>Add your first poll</span>
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

function PollSequenceList({
  isDraft,
  onDeletePoll,
  onEditPoll,
  onMovePoll,
  onReorderPolls,
  session,
}: {
  isDraft: boolean;
  onDeletePoll: (pollId: string) => void;
  onEditPoll: (poll: EditorPoll) => void;
  onMovePoll: (pollId: string, direction: -1 | 1) => void;
  onReorderPolls: (newPolls: EditorPoll[]) => void;
  session: SessionEditorSession;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = session.polls.findIndex((p) => p.id === active.id);
      const newIndex = session.polls.findIndex((p) => p.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        const reordered = arrayMove([...session.polls], oldIndex, newIndex);
        onReorderPolls(reordered);
      }
    }
  }

  const pollCountLabel = session.polls.length === 1 ? 'poll' : 'polls';

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
          Poll Sequence ({session.polls.length} {pollCountLabel})
        </h2>
        <span className="text-xs text-muted-foreground sm:text-sm">
          {isDraft ? 'Drag handle or reorder polls before starting' : 'Read-only poll sequence'}
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={session.polls.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <ol className="flex flex-col gap-3">
            {session.polls.map((poll, index) => (
              <SortablePollRow
                key={poll.id}
                index={index}
                isDraft={isDraft}
                isFirst={index === 0}
                isLast={index === session.polls.length - 1}
                onDelete={onDeletePoll}
                onEdit={onEditPoll}
                onMove={onMovePoll}
                poll={poll}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortablePollRow({
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: poll.id, disabled: !isDraft });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const position = String(index + 1);

  return (
    <li ref={setNodeRef} style={style}>
      <Card
        className={cn(
          'flex flex-col gap-4 p-4 transition-all duration-150 sm:flex-row sm:items-center sm:gap-5',
          isDragging ? 'z-50 shadow-md ring-2 ring-primary/40 opacity-75 bg-card' : 'hover:shadow-sm',
        )}
      >
        <div className="flex items-center gap-3 sm:flex-col">
          <span className="flex size-9 items-center justify-center rounded bg-muted font-mono text-xs font-semibold text-muted-foreground sm:text-sm">
            {position}
          </span>
          {isDraft ? (
            <button
              type="button"
              className="hidden touch-none cursor-grab items-center justify-center p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing sm:flex rounded hover:bg-muted"
              aria-label={`Drag to reorder poll ${index + 1}`}
              {...attributes}
              {...listeners}
            >
              <GripVertical aria-hidden="true" size={16} />
            </button>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-base font-semibold wrap-break-word text-foreground sm:text-lg">
            {poll.text}
          </h3>
          <PollType poll={poll} />
        </div>

        {isDraft ? (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              aria-label={`Move poll ${index + 1} earlier`}
              className="inline-flex size-8 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 lg:hidden"
              disabled={isFirst}
              onClick={() => onMove(poll.id, -1)}
              type="button"
            >
              <ChevronUp aria-hidden="true" size={15} />
            </button>
            <button
              aria-label={`Move poll ${index + 1} later`}
              className="inline-flex size-8 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 lg:hidden"
              disabled={isLast}
              onClick={() => onMove(poll.id, 1)}
              type="button"
            >
              <ChevronDown aria-hidden="true" size={15} />
            </button>
            <Button onClick={() => onEdit(poll)} size="sm" variant="outline">
              <Pencil aria-hidden="true" size={14} />
              <span>{poll.hasResponses ? 'View locked poll' : 'Edit'}</span>
            </Button>
            <button
              aria-label={`Delete poll ${index + 1}`}
              className="inline-flex size-8 items-center justify-center rounded text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(poll.id)}
              type="button"
            >
              <Trash2 aria-hidden="true" size={15} />
            </button>
          </div>
        ) : (
          <span className="text-xs font-medium text-muted-foreground sm:text-sm">
            Read-only
          </span>
        )}
      </Card>
    </li>
  );
}

function PollType({ poll }: { poll: EditorPoll }) {
  const TypeIcon = pollTypeIcons[poll.type];
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
      <TypeIcon aria-hidden="true" className="text-foreground shrink-0" size={14} />
      <span>{pollTypeLabels[poll.type]}</span>
      <span className="font-medium text-foreground">
        {pollStatusLabels[poll.status]}
      </span>
    </div>
  );
}

function ReadinessSidebar({
  isDraft,
  onAddPoll,
  onStartSession,
  session,
  startDisabled,
  startReason,
}: {
  isDraft: boolean;
  onAddPoll: () => void;
  onStartSession: () => void;
  session: SessionEditorSession;
  startDisabled: boolean;
  startReason: string;
}) {
  const hasName = session.name.trim().length > 0;
  const hasPolls = session.polls.length > 0;

  return (
    <Card className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-base font-bold text-foreground sm:text-lg">
          {isDraft ? 'Session Control' : 'Session Status'}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed sm:text-sm">
          {startReason}
        </p>
      </div>

      {isDraft ? (
        <div className="space-y-2">
          <Button
            className="w-full"
            disabled={startDisabled}
            onClick={onStartSession}
            size="lg"
          >
            <Play aria-hidden="true" size={16} />
            <span>Start session</span>
          </Button>
          {!hasPolls ? (
            <p className="text-xs text-muted-foreground text-center sm:text-sm">
              Add 1+ poll to enable starting
            </p>
          ) : null}
        </div>
      ) : (
        <LifecycleNavigationLink
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:brightness-95 sm:text-base"
          session={session}
        />
      )}

      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block sm:text-sm">
          Checklist
        </span>
        <ul className="space-y-2.5 text-xs sm:text-sm">
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-foreground font-medium">
              <CircleCheck
                className={hasName ? 'text-primary' : 'text-muted-foreground/40'}
                size={16}
              />
              Session name
            </span>
            <span className="text-muted-foreground">{hasName ? 'Set' : 'Missing'}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-foreground font-medium">
              <CircleCheck
                className={hasPolls ? 'text-primary' : 'text-muted-foreground/40'}
                size={16}
              />
              Poll deck
            </span>
            <span className="text-muted-foreground">
              {hasPolls ? `${session.polls.length} configured` : '0 polls'}
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-foreground font-medium">
              <CircleCheck
                className={!isDraft ? 'text-primary' : 'text-muted-foreground/40'}
                size={16}
              />
              Live Status
            </span>
            <span className="text-muted-foreground">
              {session.lifecycle === 'draft'
                ? 'Draft'
                : session.lifecycle === 'live'
                  ? 'Live'
                  : 'Ended'}
            </span>
          </li>
        </ul>
      </div>

      {isDraft && hasPolls ? (
        <Button onClick={onAddPoll} variant="outline" size="sm" className="w-full">
          <Plus aria-hidden="true" size={14} />
          <span>Add another poll</span>
        </Button>
      ) : null}
    </Card>
  );
}

function SessionLoadingState({ session }: { session?: SessionEditorSession }) {
  return (
    <div className="min-h-screen bg-background">
      <Header session={session ?? undefinedSession} />
      <main className="mx-auto flex w-full max-w-7xl items-center justify-center py-20 text-sm font-medium text-muted-foreground sm:text-base">
        Loading session details...
      </main>
    </div>
  );
}

function SessionUnavailableState() {
  return (
    <div className="min-h-screen bg-background">
      <Header session={undefinedSession} />
      <main className="mx-auto flex w-full max-w-7xl items-center justify-center py-20 text-sm font-medium text-muted-foreground sm:text-base">
        This session could not be loaded. Return to the dashboard and try again.
      </main>
    </div>
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
      <ExternalLink aria-hidden="true" size={14} />
      <span>{navigation.label}</span>
    </a>
  );
}
