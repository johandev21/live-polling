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

  const liveSessions = sessions.filter(
    (session) => session.lifecycle === 'live',
  );
  const visibleSessions = sessions.filter(
    (session) => activeFilter === 'all' || session.lifecycle === activeFilter,
  );

  const filterCounts = sessions.reduce<Record<SessionFilter, number>>(
    (counts, session) => {
      counts[session.lifecycle] += 1;
      counts.all += 1;
      return counts;
    },
    { all: 0, draft: 0, ended: 0, live: 0 },
  );

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
          <Button onClick={handleCreateSession} size="lg">
            <Plus aria-hidden="true" size={17} />
            Create a session
          </Button>
        </section>

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
            <div className="flex flex-col items-center gap-3 py-12" role="status">
              <Skeleton className="h-4 w-40" />
              <span className="sr-only">Loading sessions...</span>
            </div>
        ) : (
          <>
            {liveSessions.length > 0 ? (
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
                    {liveSessions.length} active session
                    {liveSessions.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {liveSessions.map((session) => (
                    <Card
                      className="flex flex-col gap-5 border-primary/35 p-5 sm:flex-row sm:items-center sm:justify-between"
                      key={session.id}
                    >
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
                      <Button onClick={() => handleOpenSession(session)} size="sm">
                        Open live session
                        <ArrowUpRight aria-hidden="true" size={15} />
                      </Button>
                    </Card>
                  ))}
                </div>
              </section>
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

                <Tabs
                  value={activeFilter}
                  onValueChange={(val) =>
                    val && setActiveFilter(val as SessionFilter)
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
                          {filterCounts[filter]}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

              {visibleSessions.length === 0 ? (
                <Card
                  className="flex min-h-80 flex-col items-center justify-center gap-4 px-6 py-12 text-center"
                >
                  <span className="flex size-16 items-center justify-center rounded-full bg-muted text-foreground">
                    <Layers aria-hidden="true" size={28} />
                  </span>
                  <div className="max-w-lg">
                    <h3 className="text-2xl font-bold text-foreground">
                      {sessions.length === 0
                        ? 'No sessions yet'
                        : `No ${filterLabels[activeFilter].toLowerCase()} here`}
                    </h3>
                    <p className="mt-2 text-base leading-6 text-muted-foreground">
                      {sessions.length === 0
                        ? 'Create your first session to start collecting responses from a room, class, or team.'
                        : 'Try another filter or create a new session to keep building your polling library.'}
                    </p>
                  </div>
                  <Button onClick={handleCreateSession} size="lg">
                    <Plus aria-hidden="true" size={17} />
                    {sessions.length === 0
                      ? 'Create your first session'
                      : 'Create a session'}
                  </Button>
                  <p className="max-w-xl text-xs leading-5 text-muted-foreground">
                    Sessions are private by default and accessible through a Room
                    Code or Invitation Link.
                  </p>
                </Card>
              ) : (
                <ul className="grid gap-3">
                  {visibleSessions.map((session) => (
                    <li key={session.id}>
                      <Card
                        className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                      >
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
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <Layers aria-hidden="true" size={15} />
                              {session.pollCount} poll
                              {session.pollCount === 1 ? '' : 's'}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Users aria-hidden="true" size={15} />
                              {session.lifecycle === 'live'
                                ? `Approx. ${session.participantCount} participants`
                                : `${session.participantCount} participants recorded`}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {session.roomCode}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            onClick={() => handleOpenSession(session)}
                            size="sm"
                            variant="outline"
                          >
                            {session.lifecycle === 'live'
                              ? 'Open session'
                              : session.lifecycle === 'ended'
                                ? 'View history'
                                : 'Edit session'}
                            <ArrowUpRight
                              aria-hidden="true"
                              className="ml-1"
                              size={15}
                            />
                          </Button>
                          <Button
                            aria-label={`Delete ${session.name}`}
                            onClick={() => handleDeleteClick(session)}
                            size="sm"
                            variant={
                              confirmingDeleteId === session.id
                                ? 'destructive'
                                : 'ghost'
                            }
                          >
                            <Trash2 aria-hidden="true" size={15} />
                            {confirmingDeleteId === session.id
                              ? 'Confirm delete'
                              : ''}
                          </Button>
                        </div>
                      </Card>
                    </li>
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
