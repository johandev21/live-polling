import { useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  FilePlus2,
  History,
  Layers,
  LogOut,
  MoreHorizontal,
  PencilLine,
  Plus,
  Radio,
  Trash2,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Brand } from '@/shared/ui/brand';

import {
  type DashboardSession,
  type SessionFilter,
  type SessionLifecycle,
} from '../model/host-dashboard';

export type HostDashboardPageProps = Readonly<{
  error?: string | null;
  hostEmail?: string | null;
  hostName?: string | null;
  isAuthLoading?: boolean;
  isLoading?: boolean;
  onCreateSession?: () => void;
  onDeleteSession?: (session: DashboardSession) => void;
  onOpenSession?: (session: DashboardSession) => void;
  onSignOut?: () => void;
  sessions?: readonly DashboardSession[];
}>;

const filterLabels: Record<SessionFilter, string> = {
  all: 'All sessions',
  draft: 'Draft',
  live: 'Live',
  ended: 'Ended',
};

const filterOrder = [
  'all',
  'draft',
  'live',
  'ended',
] as const satisfies readonly SessionFilter[];

const lifecycleLabels: Record<SessionLifecycle, string> = {
  draft: 'Draft Session',
  ended: 'Ended Session',
  live: 'Live Session',
};

const sessionActions: Record<
  SessionLifecycle,
  Readonly<{ icon: LucideIcon; label: string; variant: 'default' | 'outline' }>
> = {
  draft: { icon: PencilLine, label: 'Continue setup', variant: 'outline' },
  live: { icon: Radio, label: 'Open live session', variant: 'default' },
  ended: { icon: History, label: 'View results', variant: 'outline' },
};

const emptyStateCopy: Record<SessionFilter, Readonly<{ title: string; description: string }>> = {
  all: {
    title: 'No sessions yet',
    description:
      'Create your first session to start collecting responses from a room, class, or team.',
  },
  draft: {
    title: 'No draft sessions',
    description:
      'Draft sessions you start will appear here so you can continue setting them up.',
  },
  live: {
    title: 'No live sessions',
    description:
      'When you start a draft session, it appears here with its Room Code ready to share.',
  },
  ended: {
    title: 'No ended sessions',
    description: 'Sessions that have ended appear here with their full polling history.',
  },
};

const emptyStateIcons: Record<SessionFilter, LucideIcon> = {
  all: Layers,
  draft: FilePlus2,
  live: Radio,
  ended: History,
};

const helpTopics: readonly Readonly<{ body: string; icon: LucideIcon; title: string }>[] = [
  {
    icon: Plus,
    title: 'Create a session',
    body: 'Add polls in the editor, then start the session when you are ready to collect responses.',
  },
  {
    icon: Radio,
    title: 'Share with participants',
    body: 'Tell participants the Room Code, or send the Invitation Link from the live control room.',
  },
  {
    icon: History,
    title: 'View results',
    body: 'Open an ended session to review its history: counts, percentages, and open-ended responses.',
  },
];

export function HostDashboardPage({
  error,
  hostEmail,
  hostName,
  isAuthLoading = false,
  isLoading = false,
  onCreateSession,
  onDeleteSession,
  onOpenSession,
  onSignOut,
  sessions = [],
}: HostDashboardPageProps) {
  const [activeFilter, setActiveFilter] = useState<SessionFilter>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DashboardSession | null>(
    null,
  );

  const liveSessions = getLiveSessions(sessions);
  const visibleSessions = getFilteredSessions(sessions, activeFilter);

  function handleCreateSession() {
    setActionMessage('Create session is ready for your next setup.');
    onCreateSession?.();
  }

  function handleOpenSession(session: DashboardSession) {
    setActionMessage(`Opened ${session.name}.`);
    onOpenSession?.(session);
  }

  function handleRequestDelete(session: DashboardSession) {
    setDeleteTarget(session);
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    onDeleteSession?.(deleteTarget);
    setActionMessage(`Deleted session "${deleteTarget.name}".`);
    setDeleteTarget(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        hostEmail={hostEmail}
        hostName={hostName}
        isAuthLoading={isAuthLoading}
        onSignOut={onSignOut}
      />
      <main className="mx-auto flex w-full max-w-(--breakpoint-2xl) flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-16">
        <DashboardIntro onCreateSession={handleCreateSession} />

        {error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {actionMessage ? (
          <p
            aria-live="polite"
            className="text-sm font-semibold text-muted-foreground"
          >
            {actionMessage}
          </p>
        ) : null}

        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            {liveSessions.length > 0 ? (
              <QuickAccessSection
                onOpenSession={handleOpenSession}
                sessions={liveSessions}
              />
            ) : null}

            <section
              aria-labelledby="all-sessions-heading"
              className="flex flex-col gap-4"
              id="session-library"
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2
                  className="text-lg font-bold text-foreground"
                  id="all-sessions-heading"
                >
                  Browse your sessions
                </h2>
                <p className="text-sm text-muted-foreground">
                  {visibleSessions.length} session
                  {pluralSuffix(visibleSessions.length)} shown
                </p>
              </div>

              <SessionFilterTabs
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />

              {visibleSessions.length === 0 ? (
                <EmptyLibraryState
                  activeFilter={activeFilter}
                  hasAnySessions={sessions.length > 0}
                  onCreateSession={handleCreateSession}
                  onFilterChange={setActiveFilter}
                />
              ) : (
                <ul className="grid grid-cols-1 gap-3">
                  {visibleSessions.map((session) => (
                    <SessionLibraryCard
                      key={session.id}
                      onDeleteClick={handleRequestDelete}
                      onOpenSession={handleOpenSession}
                      session={session}
                    />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      {deleteTarget ? (
        <DeleteSessionDialog
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          session={deleteTarget}
        />
      ) : null}
    </div>
  );
}

function Header({
  hostEmail,
  hostName,
  isAuthLoading,
  onSignOut,
}: {
  hostEmail?: string | null;
  hostName?: string | null;
  isAuthLoading?: boolean;
  onSignOut?: () => void;
}) {
  const initials = getInitials(hostName, hostEmail);
  const accountName = hostName?.trim() || hostEmail || 'Host account';
  const accountMenuLabel = hostName?.trim()
    ? `Open account menu for ${hostName.trim()}`
    : 'Open account menu';

  return (
    <header className="border-b border-border bg-background">
      <nav
        aria-label="Host navigation"
        className="mx-auto flex w-full max-w-(--breakpoint-2xl) items-center justify-between p-4 sm:px-6 lg:px-16"
      >
        <Brand aria-label="Pulse home" href="/" size="md" />
        <div className="flex items-center gap-2 sm:gap-4">
          <HelpDialog />
          {isAuthLoading ? (
            <Skeleton aria-hidden="true" className="size-9 rounded-full" />
          ) : (
            <AccountMenu
              accountMenuLabel={accountMenuLabel}
              accountName={accountName}
              hostEmail={hostEmail}
              initials={initials}
              onSignOut={onSignOut}
            />
          )}
        </div>
      </nav>
    </header>
  );
}

function AccountMenu({
  accountMenuLabel,
  accountName,
  hostEmail,
  initials,
  onSignOut,
}: {
  accountMenuLabel: string;
  accountName: string;
  hostEmail?: string | null;
  initials: string;
  onSignOut?: () => void;
}) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              aria-label={accountMenuLabel}
              className="rounded-full"
            >
              <Avatar className="size-9 transition-opacity hover:opacity-90">
                <AvatarFallback className="bg-muted text-sm font-bold text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
          }
        />
        <TooltipContent>{accountName}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <p className="truncate text-sm font-semibold text-foreground">
              {accountName}
            </p>
            {hostEmail ? (
              <p className="truncate text-xs text-muted-foreground">{hostEmail}</p>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            onSignOut?.();
          }}
          variant="destructive"
        >
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            className="font-semibold text-muted-foreground hover:text-foreground"
            size="sm"
            variant="ghost"
          >
            Help
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Help with Pulse</DialogTitle>
          <DialogDescription>
            Quick answers for the essentials.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {helpTopics.map(({ body, icon: TopicIcon, title }) => (
            <div className="flex gap-3" key={title}>
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <TopicIcon aria-hidden="true" size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DashboardIntro({
  onCreateSession,
}: {
  onCreateSession: () => void;
}) {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-bold tracking-[0.16em] text-foreground">
          HOST DASHBOARD
        </p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
          Your sessions
        </h1>
        <p className="mt-1.5 text-base leading-6 text-muted-foreground">
          Create, manage, and return to your live polling sessions.
        </p>
      </div>
      <Button
        className="w-full sm:w-auto"
        onClick={onCreateSession}
        size="lg"
      >
        <Plus aria-hidden="true" size={17} />
        Create a session
      </Button>
    </section>
  );
}

function QuickAccessSection({
  onOpenSession,
  sessions,
}: {
  onOpenSession: (session: DashboardSession) => void;
  sessions: readonly DashboardSession[];
}) {
  return (
    <section
      aria-labelledby="quick-access-heading"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-lg font-bold text-foreground"
          id="quick-access-heading"
        >
          Live sessions
        </h2>
        <p className="text-sm text-muted-foreground">
          {sessions.length} active session{pluralSuffix(sessions.length)}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sessions.map((session) => (
          <LiveSessionCard
            key={session.id}
            onOpenSession={onOpenSession}
            session={session}
          />
        ))}
      </div>
    </section>
  );
}

function LiveSessionCard({
  onOpenSession,
  session,
}: {
  onOpenSession: (session: DashboardSession) => void;
  session: DashboardSession;
}) {
  function handleOpen() {
    onOpenSession(session);
  }

  return (
    <Card className="group/card p-5 transition-shadow duration-150 focus-within:ring-2 focus-within:ring-ring/50 hover:shadow-sm hover:ring-primary/40 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Radio aria-hidden="true" className="text-foreground" size={16} />
          <SessionStatus lifecycle={session.lifecycle} />
        </div>
        <h3 className="mt-2.5">
          <button
            aria-label={`Open live session ${session.name}`}
            className="inline-flex max-w-full items-center gap-1.5 rounded-md text-lg font-bold text-foreground underline-offset-4 transition-colors hover:underline active:opacity-80"
            onClick={handleOpen}
            type="button"
          >
            <span className="truncate">{session.name}</span>
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 shrink-0 opacity-0 transition-opacity group-focus-within/card:opacity-100 group-hover/card:opacity-100"
            />
          </button>
        </h3>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Room Code {session.roomCode}
        </p>
      </div>
      <Button onClick={handleOpen} size="sm">
        Open live session
        <ArrowUpRight aria-hidden="true" size={15} />
      </Button>
    </Card>
  );
}

function SessionFilterTabs({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: SessionFilter;
  onFilterChange: (filter: SessionFilter) => void;
}) {
  return (
    <Tabs
      value={activeFilter}
      onValueChange={(val) =>
        val && onFilterChange(val as SessionFilter)
      }
    >
      <TabsList
        aria-label="Filter sessions"
        className="grid h-auto! w-full grid-cols-2 gap-1 sm:flex sm:h-8 sm:w-fit sm:flex-row sm:gap-0"
      >
        {filterOrder.map((filter) => (
          <TabsTrigger
            className="min-h-9 sm:min-h-0"
            key={filter}
            value={filter}
          >
            {filterLabels[filter]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function EmptyLibraryState({
  activeFilter,
  hasAnySessions,
  onCreateSession,
  onFilterChange,
}: {
  activeFilter: SessionFilter;
  hasAnySessions: boolean;
  onCreateSession: () => void;
  onFilterChange: (filter: SessionFilter) => void;
}) {
  const EmptyIcon = emptyStateIcons[activeFilter];
  const copy = emptyStateCopy[activeFilter];

  return (
    <Card className="flex min-h-64 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
        <EmptyIcon aria-hidden="true" size={22} />
      </span>
      <div className="max-w-lg">
        <h3 className="text-xl font-bold text-foreground">{copy.title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          {copy.description}
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 sm:flex-row">
        <Button onClick={onCreateSession} size="lg">
          <Plus aria-hidden="true" size={17} />
          {hasAnySessions ? 'Create a session' : 'Create your first session'}
        </Button>
        {hasAnySessions && activeFilter !== 'all' ? (
          <Button
            onClick={() => onFilterChange('all')}
            size="lg"
            variant="ghost"
          >
            Show all sessions
          </Button>
        ) : null}
      </div>
      {!hasAnySessions ? (
        <p className="max-w-xl text-xs leading-5 text-muted-foreground">
          Sessions are private by default and accessible through a Room Code or
          Invitation Link.
        </p>
      ) : null}
    </Card>
  );
}

function SessionLibraryCard({
  onDeleteClick,
  onOpenSession,
  session,
}: {
  onDeleteClick: (session: DashboardSession) => void;
  onOpenSession: (session: DashboardSession) => void;
  session: DashboardSession;
}) {
  function handleOpen() {
    onOpenSession(session);
  }

  function handleDelete() {
    onDeleteClick(session);
  }

  return (
    <li className="min-w-0">
      <Card className="group/card p-5 transition-shadow duration-150 focus-within:ring-2 focus-within:ring-ring/50 hover:shadow-sm hover:ring-foreground/20 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SessionStatus lifecycle={session.lifecycle} />
            <span className="font-mono text-xs text-muted-foreground">
              {session.updatedLabel}
            </span>
          </div>
          <h3 className="mt-2.5">
            <button
              aria-label={`Open ${session.name}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-md text-lg font-bold text-foreground underline-offset-4 transition-colors hover:underline active:opacity-80"
              onClick={handleOpen}
              type="button"
            >
              <span className="truncate">{session.name}</span>
              <ArrowUpRight
                aria-hidden="true"
                className="size-4 shrink-0 opacity-0 transition-opacity group-focus-within/card:opacity-100 group-hover/card:opacity-100"
              />
            </button>
          </h3>
          <SessionMetadataLine session={session} />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <SessionActionButton
            lifecycle={session.lifecycle}
            onOpen={handleOpen}
          />
          <SessionMenuButton
            onDeleteClick={handleDelete}
            session={session}
          />
        </div>
      </Card>
    </li>
  );
}

function SessionMetadataLine({ session }: { session: DashboardSession }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Layers aria-hidden="true" size={15} />
        {session.pollCount} poll{pluralSuffix(session.pollCount)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Users aria-hidden="true" size={15} />
        {getParticipantLabel(session)}
      </span>
      {session.lifecycle !== 'ended' ? (
        <span className="font-mono text-xs text-muted-foreground">
          Room Code {session.roomCode}
        </span>
      ) : null}
    </div>
  );
}

function SessionActionButton({
  lifecycle,
  onOpen,
}: {
  lifecycle: SessionLifecycle;
  onOpen: () => void;
}) {
  const { icon: ActionIcon, label, variant } = sessionActions[lifecycle];
  return (
    <Button onClick={onOpen} size="sm" variant={variant}>
      <ActionIcon aria-hidden="true" size={15} />
      {label}
    </Button>
  );
}

function SessionMenuButton({
  onDeleteClick,
  session,
}: {
  onDeleteClick: () => void;
  session: DashboardSession;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Session actions for ${session.name}`}
        render={
          <Button size="icon-sm" variant="ghost">
            <MoreHorizontal aria-hidden="true" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="gap-2 px-2.5 py-1.5"
          onClick={onDeleteClick}
          variant="destructive"
        >
          <Trash2 aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DeleteSessionDialog({
  onClose,
  onConfirm,
  session,
}: {
  onClose: () => void;
  onConfirm: () => void;
  session: DashboardSession;
}) {
  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this session?</AlertDialogTitle>
          <AlertDialogDescription>
            “{session.name}” and all of its responses will be permanently
            removed. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            Delete session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3" role="status">
      {[0, 1, 2].map((item) => (
        <Card className="p-5" key={item}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-56 max-w-full" />
              <Skeleton className="h-3 w-72 max-w-full" />
            </div>
            <Skeleton className="h-7 w-28" />
          </div>
        </Card>
      ))}
      <span className="sr-only">Loading sessions...</span>
    </div>
  );
}

function SessionStatus({ lifecycle }: { lifecycle: SessionLifecycle }) {
  return (
    <Badge
      variant={
        lifecycle === 'live'
          ? 'default'
          : lifecycle === 'draft'
            ? 'secondary'
            : 'outline'
      }
      role="status"
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {lifecycleLabels[lifecycle]}
    </Badge>
  );
}

function getInitials(
  name?: string | null,
  email?: string | null,
): string {
  const source = name?.trim() || getEmailInitialSource(email);
  if (!source) return '?';
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (firstLetter(words[0]) + firstLetter(words[1])).toUpperCase();
  }
  return (words[0] ?? '').slice(0, 2).toUpperCase();
}

function getEmailInitialSource(email?: string | null): string {
  return (email ?? '').split('@')[0]?.replace(/[._\-+]+/g, ' ').trim() ?? '';
}

function firstLetter(word: string): string {
  return word.charAt(0);
}

function getLiveSessions(
  sessions: readonly DashboardSession[],
): DashboardSession[] {
  return sessions.filter((session) => session.lifecycle === 'live');
}

function getFilteredSessions(
  sessions: readonly DashboardSession[],
  filter: SessionFilter,
): DashboardSession[] {
  return sessions.filter(
    (session) => filter === 'all' || session.lifecycle === filter,
  );
}

function getParticipantLabel(session: DashboardSession): string {
  return session.lifecycle === 'live'
    ? `Approx. ${session.participantCount} participants`
    : `${session.participantCount} participants recorded`;
}

function pluralSuffix(count: number): string {
  return count === 1 ? '' : 's';
}
