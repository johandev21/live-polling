import { useState } from 'react';
import { AlertCircle, ArrowUpRight, Layers, Plus, Radio, Trash2, Users } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brand } from '@/shared/ui/brand';

import {
  type DashboardSession,
  type SessionFilter,
  type SessionLifecycle,
} from '../model/host-dashboard';

export type HostDashboardPageProps = Readonly<{
  error?: string | null;
  isLoading?: boolean;
  onCreateSession?: () => void;
  onDeleteSession?: (session: DashboardSession) => void;
  onOpenSession?: (session: DashboardSession) => void;
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

const sessionActionLabels: Record<SessionLifecycle, string> = {
  draft: 'Edit session',
  ended: 'View history',
  live: 'Open session',
};

export function HostDashboardPage({
  error,
  isLoading = false,
  onCreateSession,
  onDeleteSession,
  onOpenSession,
  sessions = [],
}: HostDashboardPageProps) {
  const [activeFilter, setActiveFilter] = useState<SessionFilter>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );

  const liveSessions = getLiveSessions(sessions);
  const visibleSessions = getFilteredSessions(sessions, activeFilter);
  const filterCounts = getFilterCounts(sessions);

  function handleCreateSession() {
    setActionMessage('Create session is ready for your next setup.');
    onCreateSession?.();
  }

  function handleOpenSession(session: DashboardSession) {
    setActionMessage(`Opened ${session.name}.`);
    onOpenSession?.(session);
  }

  function handleDeleteClick(session: DashboardSession) {
    if (confirmingDeleteId === session.id) {
      onDeleteSession?.(session);
      setConfirmingDeleteId(null);
      setActionMessage(`Deleted session "${session.name}".`);
    } else {
      setConfirmingDeleteId(session.id);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex w-full max-w-(--breakpoint-2xl) flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-16">
        <DashboardIntro onCreateSession={handleCreateSession} />

        {error ? (
          <Alert className="-mt-4" variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {actionMessage ? (
          <p
            aria-live="polite"
            className="-mt-4 text-sm font-semibold text-muted-foreground"
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
              className="flex flex-col gap-5"
              id="session-library"
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-[0.14em] text-foreground">
                    SESSION LIBRARY
                  </p>
                  <h2
                    className="mt-1 text-xl font-bold text-foreground"
                    id="all-sessions-heading"
                  >
                    Browse your sessions
                  </h2>
                </div>
                <span className="text-sm text-muted-foreground">
                  {visibleSessions.length} shown
                </span>
              </div>

              <SessionFilterTabs
                activeFilter={activeFilter}
                counts={filterCounts}
                onFilterChange={setActiveFilter}
              />

              {visibleSessions.length === 0 ? (
                <EmptyLibraryState
                  activeFilter={activeFilter}
                  hasAnySessions={sessions.length > 0}
                  onCreateSession={handleCreateSession}
                />
              ) : (
                <ul className="grid gap-3">
                  {visibleSessions.map((session) => (
                    <SessionLibraryCard
                      isConfirmingDelete={confirmingDeleteId === session.id}
                      key={session.id}
                      onDeleteClick={handleDeleteClick}
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
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-border bg-background">
      <nav
        aria-label="Host navigation"
        className="mx-auto flex w-full max-w-(--breakpoint-2xl) items-center justify-between p-4 sm:px-6 lg:px-16"
      >
        <Brand aria-label="Pulse home" href="/" size="md" />
        <div className="flex items-center gap-4 text-sm text-muted-foreground sm:gap-5">
          <a
            className="font-semibold hover:text-foreground"
            href="#help"
          >
            Help
          </a>
          <button
            aria-label="Open host profile"
            className="inline-flex size-9 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground"
            type="button"
          >
            H
          </button>
        </div>
      </nav>
    </header>
  );
}

function DashboardIntro({
  onCreateSession,
}: {
  onCreateSession: () => void;
}) {
  return (
    <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-bold tracking-[0.16em] text-foreground">
          HOST DASHBOARD
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
          Your sessions
        </h1>
        <p className="mt-2 text-base leading-6 text-muted-foreground">
          Create, manage, and return to your live polling sessions.
        </p>
      </div>
      <Button onClick={onCreateSession} size="lg">
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
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-foreground">
            QUICK ACCESS
          </p>
          <h2
            className="mt-1 text-xl font-bold text-foreground"
            id="quick-access-heading"
          >
            Live sessions
          </h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {sessions.length} active session{pluralSuffix(sessions.length)}
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
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
    <Card className="flex flex-col gap-5 border-primary/35 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Radio
            aria-hidden="true"
            className="text-foreground"
            size={16}
          />
          <SessionStatus lifecycle={session.lifecycle} />
        </div>
        <h3 className="mt-3 text-lg font-bold wrap-break-word text-foreground">
          {session.name}
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
  counts,
  onFilterChange,
}: {
  activeFilter: SessionFilter;
  counts: Record<SessionFilter, number>;
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
        className="flex w-full flex-wrap gap-1 rounded-sm border border-border bg-background p-1"
      >
        {filterOrder.map((filter) => (
          <TabsTrigger
            className="min-h-9 rounded-[4px] px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted data-selected:bg-secondary data-selected:text-foreground"
            id={`session-filter-${filter}`}
            key={filter}
            value={filter}
          >
            {filterLabels[filter]}
            <span className="ml-1 font-mono text-xs opacity-70">
              {counts[filter]}
            </span>
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
}: {
  activeFilter: SessionFilter;
  hasAnySessions: boolean;
  onCreateSession: () => void;
}) {
  return (
    <Card
      className="flex min-h-80 flex-col items-center justify-center gap-4 px-6 py-12 text-center"
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-muted text-foreground">
        <Layers aria-hidden="true" size={28} />
      </span>
      <div className="max-w-lg">
        <h3 className="text-2xl font-bold text-foreground">
          {hasAnySessions
            ? `No ${filterLabels[activeFilter].toLowerCase()} here`
            : 'No sessions yet'}
        </h3>
        <p className="mt-2 text-base leading-6 text-muted-foreground">
          {hasAnySessions
            ? 'Try another filter or create a new session to keep building your polling library.'
            : 'Create your first session to start collecting responses from a room, class, or team.'}
        </p>
      </div>
      <Button onClick={onCreateSession} size="lg">
        <Plus aria-hidden="true" size={17} />
        {hasAnySessions ? 'Create a session' : 'Create your first session'}
      </Button>
      <p className="max-w-xl text-xs leading-5 text-muted-foreground">
        Sessions are private by default and accessible through a Room Code or
        Invitation Link.
      </p>
    </Card>
  );
}

function SessionLibraryCard({
  isConfirmingDelete,
  onDeleteClick,
  onOpenSession,
  session,
}: {
  isConfirmingDelete: boolean;
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
    <li>
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <SessionStatus lifecycle={session.lifecycle} />
            <span className="font-mono text-xs text-muted-foreground">
              {session.updatedLabel}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-bold wrap-break-word text-foreground">
            {session.name}
          </h3>
          <SessionMetadataLine session={session} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SessionActionButton
            label={sessionActionLabels[session.lifecycle]}
            onOpen={handleOpen}
          />
          <DeleteSessionButton
            isConfirming={isConfirmingDelete}
            onClick={handleDelete}
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
      <span className="font-mono text-xs text-muted-foreground">
        {session.roomCode}
      </span>
    </div>
  );
}

function SessionActionButton({
  label,
  onOpen,
}: {
  label: string;
  onOpen: () => void;
}) {
  return (
    <Button onClick={onOpen} size="sm" variant="outline">
      {label}
      <ArrowUpRight
        aria-hidden="true"
        className="ml-1"
        size={15}
      />
    </Button>
  );
}

function DeleteSessionButton({
  isConfirming,
  onClick,
  session,
}: {
  isConfirming: boolean;
  onClick: () => void;
  session: DashboardSession;
}) {
  return (
    <Button
      aria-label={`Delete ${session.name}`}
      onClick={onClick}
      size="sm"
      variant={isConfirming ? 'destructive' : 'ghost'}
    >
      <Trash2 aria-hidden="true" size={15} />
      {isConfirming ? 'Confirm delete' : ''}
    </Button>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12" role="status">
      <Skeleton className="h-4 w-40" />
      <span className="sr-only">Loading sessions...</span>
    </div>
  );
}

function SessionStatus({ lifecycle }: { lifecycle: SessionLifecycle }) {
  return (
    <Badge
      variant={lifecycle === 'live' ? 'default' : lifecycle === 'draft' ? 'secondary' : 'outline'}
      role="status"
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {lifecycleLabels[lifecycle]}
    </Badge>
  );
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

function getFilterCounts(
  sessions: readonly DashboardSession[],
): Record<SessionFilter, number> {
  return sessions.reduce<Record<SessionFilter, number>>(
    (counts, session) => {
      counts[session.lifecycle] += 1;
      counts.all += 1;
      return counts;
    },
    { all: 0, draft: 0, ended: 0, live: 0 },
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
