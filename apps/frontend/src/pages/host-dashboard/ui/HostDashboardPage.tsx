import { useState } from 'react';
import { ArrowUpRight, Layers, Plus, Radio, Trash2, Users } from 'lucide-react';
import { Tabs } from '@base-ui/react/tabs';

import { Brand, Button, StatusBadge, Surface } from '@/shared/ui';

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

const lifecycleTones = {
  draft: 'warning',
  ended: 'neutral',
  live: 'success',
} as const satisfies Record<
  SessionLifecycle,
  'neutral' | 'success' | 'warning'
>;

function SessionStatus({ lifecycle }: { lifecycle: SessionLifecycle }) {
  return (
    <StatusBadge
      label={lifecycleLabels[lifecycle]}
      showDot
      tone={lifecycleTones[lifecycle]}
    />
  );
}

function Header() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <nav
        aria-label="Host navigation"
        className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 py-4 sm:px-6 lg:px-16"
      >
        <Brand aria-label="Pulse home" href="/" size="md" />
        <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)] sm:gap-5">
          <a
            className="font-semibold hover:text-[var(--color-primary)]"
            href="#help"
          >
            Help
          </a>
          <button
            aria-label="Open host profile"
            className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-sm font-bold text-[var(--color-primary)]"
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
    <div className="min-h-screen bg-[var(--color-bg-canvas)]">
      <Header />
      <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-16">
        <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="font-[var(--font-mono)] text-xs font-bold tracking-[0.16em] text-[var(--color-primary)]">
              HOST DASHBOARD
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-4xl">
              Your sessions
            </h1>
            <p className="mt-2 text-base leading-6 text-[var(--color-text-secondary)]">
              Create, manage, and return to your live polling sessions.
            </p>
          </div>
          <Button onClick={handleCreateSession} size="md">
            <Plus aria-hidden="true" className="mr-2" size={17} />
            Create a session
          </Button>
        </section>

        {error ? (
          <p
            aria-live="polite"
            className="-mt-4 text-sm font-semibold text-[var(--color-error)]"
          >
            {error}
          </p>
        ) : null}

        {actionMessage ? (
          <p
            aria-live="polite"
            className="-mt-4 text-sm font-semibold text-[var(--color-success)]"
          >
            {actionMessage}
          </p>
        ) : null}

        {isLoading ? (
          <div className="py-12 text-center text-sm font-semibold text-[var(--color-text-secondary)]">
            Loading sessions...
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
                    <p className="font-[var(--font-mono)] text-xs font-bold tracking-[0.14em] text-[var(--color-primary)]">
                      QUICK ACCESS
                    </p>
                    <h2
                      className="mt-1 text-xl font-bold text-[var(--color-text-primary)]"
                      id="quick-access-heading"
                    >
                      Live sessions
                    </h2>
                  </div>
                  <span className="text-sm text-[var(--color-text-tertiary)]">
                    {liveSessions.length} active session
                    {liveSessions.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {liveSessions.map((session) => (
                    <Surface
                      as="article"
                      className="flex flex-col gap-5 border-[var(--color-primary)]/35 p-5 sm:flex-row sm:items-center sm:justify-between"
                      elevation="card"
                      key={session.id}
                      padding="none"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Radio
                            aria-hidden="true"
                            className="text-[var(--color-success)]"
                            size={16}
                          />
                          <SessionStatus lifecycle={session.lifecycle} />
                        </div>
                        <h3 className="mt-3 break-words text-lg font-bold text-[var(--color-text-primary)]">
                          {session.name}
                        </h3>
                        <p className="mt-1 font-[var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">
                          Room Code {session.roomCode}
                        </p>
                      </div>
                      <Button
                        endIcon="arrowRight"
                        onClick={() => handleOpenSession(session)}
                        size="sm"
                      >
                        Open live session
                      </Button>
                    </Surface>
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
                  <p className="font-[var(--font-mono)] text-xs font-bold tracking-[0.14em] text-[var(--color-primary)]">
                    SESSION LIBRARY
                  </p>
                  <h2
                    className="mt-1 text-xl font-bold text-[var(--color-text-primary)]"
                    id="all-sessions-heading"
                  >
                    Browse your sessions
                  </h2>
                </div>
                <span className="text-sm text-[var(--color-text-tertiary)]">
                  {visibleSessions.length} shown
                </span>
              </div>

              <Tabs.Root
                value={activeFilter}
                onValueChange={(val) =>
                  val && setActiveFilter(val as SessionFilter)
                }
              >
                <Tabs.List
                  aria-label="Filter sessions"
                  className="flex w-full flex-wrap gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
                >
                  {filterOrder.map((filter) => (
                    <Tabs.Tab
                      className="min-h-9 rounded-[calc(var(--radius-sm)-2px)] px-4 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)] data-[selected]:bg-[var(--color-primary-soft)] data-[selected]:text-[var(--color-primary)]"
                      id={`session-filter-${filter}`}
                      key={filter}
                      value={filter}
                    >
                      {filterLabels[filter]}
                      <span className="ml-1 font-[var(--font-mono)] text-xs opacity-70">
                        {filterCounts[filter]}
                      </span>
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs.Root>

              {visibleSessions.length === 0 ? (
                <Surface
                  as="section"
                  className="flex min-h-80 flex-col items-center justify-center gap-4 px-6 py-12 text-center"
                  elevation="card"
                  padding="none"
                >
                  <span className="flex size-16 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <Layers aria-hidden="true" size={28} />
                  </span>
                  <div className="max-w-lg">
                    <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">
                      {sessions.length === 0
                        ? 'No sessions yet'
                        : `No ${filterLabels[activeFilter].toLowerCase()} here`}
                    </h3>
                    <p className="mt-2 text-base leading-6 text-[var(--color-text-secondary)]">
                      {sessions.length === 0
                        ? 'Create your first session to start collecting responses from a room, class, or team.'
                        : 'Try another filter or create a new session to keep building your polling library.'}
                    </p>
                  </div>
                  <Button onClick={handleCreateSession} size="md">
                    <Plus aria-hidden="true" className="mr-2" size={17} />
                    {sessions.length === 0
                      ? 'Create your first session'
                      : 'Create a session'}
                  </Button>
                  <p className="max-w-xl text-xs leading-5 text-[var(--color-text-tertiary)]">
                    Sessions are private by default and accessible through a Room
                    Code or Invitation Link.
                  </p>
                </Surface>
              ) : (
                <ul className="grid gap-3">
                  {visibleSessions.map((session) => (
                    <li key={session.id}>
                      <Surface
                        as="article"
                        className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                        padding="none"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <SessionStatus lifecycle={session.lifecycle} />
                            <span className="font-[var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">
                              {session.updatedLabel}
                            </span>
                          </div>
                          <h3 className="mt-3 break-words text-lg font-bold text-[var(--color-text-primary)]">
                            {session.name}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--color-text-secondary)]">
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
                            <span className="font-[var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">
                              {session.roomCode}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            onClick={() => handleOpenSession(session)}
                            size="sm"
                            variant="secondary"
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
                                : 'quiet'
                            }
                          >
                            <Trash2 aria-hidden="true" size={15} />
                            {confirmingDeleteId === session.id
                              ? 'Confirm delete'
                              : ''}
                          </Button>
                        </div>
                      </Surface>
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
