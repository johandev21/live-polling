/* oxlint-disable react/only-export-components */
import { useState } from 'react';
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import { z } from 'zod';

export type RouterContext = {
  auth: {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: { email: string; id: string; name?: string | null } | null;
  };
};

import { CreateSessionPage } from '@/pages/create-session';
import { EditLockedPollPage } from '@/pages/edit-locked-poll';
import { EndedSessionHistoryPage } from '@/pages/ended-session-history';
import { HostDashboardPage } from '@/pages/host-dashboard';
import { HostEmailEntryPage } from '@/pages/host-email-entry';
import { HostResultsPage } from '@/pages/host-results';
import { InvalidMagicLinkPage } from '@/pages/invalid-magic-link';
import { JoinByRoomCodePage } from '@/pages/join-by-room-code';
import { LandingPage } from '@/pages/landing';
import { LiveControlRoomPage } from '@/pages/live-control-room';
import { MagicLinkConfirmationPage } from '@/pages/magic-link-confirmation';
import { ParticipantNameEntryPage } from '@/pages/participant-name-entry';
import { ParticipantSessionPage } from '@/pages/participant-session';
import { PollBuilderPage } from '@/pages/poll-builder';
import { SessionEditorPage } from '@/pages/session-editor';

import type { EditorPoll } from '@/pages/session-editor/model/session-editor';
import type { LockedPoll } from '@/pages/edit-locked-poll/model/edit-locked-poll';
import type { EndedHistoryPoll } from '@/pages/ended-session-history/model/ended-session-history';
import type { HostResultPoll } from '@/pages/host-results/model/host-results';
import type { LivePoll } from '@/pages/live-control-room/model/live-control-room';
import type { PollDraft } from '@/pages/poll-builder/model/poll-builder';
import type { ParticipantSessionSnapshot } from '@/pages/participant-session/model/participant-session';
import {
  useCreatePoll,
  useDeletePoll,
  useReorderPolls,
  useSessionDetails,
  useSessionPolls,
  useStartSession,
  useUpdatePoll,
} from '@/shared/hooks/use-host-polls';
import {
  useCreateSession,
  useDeleteSession,
  useHostSessions,
} from '@/shared/hooks/use-host-sessions';
import { useSignOutHost, useHostSession } from '@/shared/hooks/use-host-auth';
import { usePollResultsMap } from '@/shared/hooks/use-host-poll-results';
import { useHostPresence } from '@/shared/hooks/use-host-presence';
import { useJoinSession } from '@/shared/hooks/use-participant-auth';
import {
  useParticipantSessionSnapshot,
  useParticipantPollResults,
  useSubmitResponse,
} from '@/shared/hooks/use-participant-session';
import {
  useClosePoll,
  useEndSession,
  useHideResults,
  useOpenPoll,
  useRealtimeSocket,
  useRevealResults,
} from '@/shared/hooks/use-realtime-session';
import { getParticipantToken } from '@/shared/lib/participant-storage';
import type {
  HostResults,
  ParticipantSessionResponse,
  PollSnapshot,
  SessionSnapshot,
} from '@/shared/lib/contracts';
import { DefaultRouteFallback } from './route-fallback';
import { SignedOutGuard } from './signed-out-guard';

function dashboardSessionSlug(id: string): string {
  return id.startsWith('session-') ? id.slice('session-'.length) : id;
}

function sessionEditorPath(slug: string): string {
  return `/host/sessions/${encodeURIComponent(slug)}`;
}

function sessionPollBuilderPath(slug: string): string {
  return `${sessionEditorPath(slug)}/polls/new`;
}

function sessionLockedPollPath(slug: string): string {
  return `${sessionEditorPath(slug)}/polls/locked`;
}

function sessionLivePath(slug: string): string {
  return `${sessionEditorPath(slug)}/live`;
}

function sessionResultsPath(slug: string): string {
  return `${sessionEditorPath(slug)}/results`;
}

function sessionHistoryPath(slug: string): string {
  return `${sessionEditorPath(slug)}/history`;
}

const magicLinkSearchSchema = z.object({
  email: z.string().optional(),
});

const invalidMagicLinkSearchSchema = z.object({
  email: z.string().optional(),
  kind: z.enum(['invalid', 'expired']).optional(),
});

const hostResultsSearchSchema = z.object({
  pollId: z.string().optional(),
});

const pollBuilderSearchSchema = z.object({
  pollId: z.string().optional(),
});

const joinSearchSchema = z.object({
  roomCode: z.string().optional(),
});

const participantNameSearchSchema = z.object({
  roomCode: z.string().optional(),
});

const participantSessionSearchSchema = z.object({
  participantName: z.string().optional(),
  roomCode: z.string().optional(),
});

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  notFoundComponent: DefaultRouteFallback,
});

const landingRoute = createRoute({
  component: LandingPage,
  getParentRoute: () => rootRoute,
  path: '/',
});

function HostEmailRouteComponent() {
  return (
    <SignedOutGuard>
      <HostEmailEntryPage />
    </SignedOutGuard>
  );
}

const hostEmailRoute = createRoute({
  component: HostEmailRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/host/email',
});

function MagicLinkRouteComponent() {
  const { email } = useSearch({ from: magicLinkRoute.id });
  return (
    <SignedOutGuard>
      <MagicLinkConfirmationPage email={email} />
    </SignedOutGuard>
  );
}

const magicLinkRoute = createRoute({
  component: MagicLinkRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/host/magic-link',
  validateSearch: magicLinkSearchSchema,
});

function InvalidMagicLinkRouteComponent() {
  const { email, kind } = useSearch({ from: invalidMagicLinkRoute.id });
  return (
    <SignedOutGuard>
      <InvalidMagicLinkPage
        email={email}
        initialKind={kind === 'invalid' ? 'invalid' : 'expired'}
      />
    </SignedOutGuard>
  );
}

const invalidMagicLinkRoute = createRoute({
  component: InvalidMagicLinkRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/host/magic-link/invalid',
  validateSearch: invalidMagicLinkSearchSchema,
});

function updatedLabelFor(date: Date, status: SessionSnapshot['status']): string {
  if (status === 'live') return 'Active now';
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return 'Updated just now';
  if (minutes < 60) return `Updated ${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Updated ${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `Updated ${date.toLocaleDateString()}`;
}

function mapSnapshotToDashboardSession(snapshot: SessionSnapshot) {
  const updatedDate = snapshot.updatedAt
    ? new Date(snapshot.updatedAt)
    : new Date();
  return {
    id: snapshot.id,
    lifecycle: snapshot.status,
    name: snapshot.name,
    participantCount: snapshot.participantCount ?? 0,
    pollCount: snapshot.pollCount ?? 0,
    roomCode: snapshot.roomCode,
    updatedLabel: updatedLabelFor(updatedDate, snapshot.status),
  };
}

function HostDashboardRouteComponent() {
  const navigate = useNavigate();
  const { data: rawSessions, isLoading, error } = useHostSessions();
  const deleteSession = useDeleteSession();
  const { data: hostSession, isLoading: isAuthLoading } = useHostSession();
  const signOut = useSignOutHost();

  const sessions = rawSessions ? rawSessions.map(mapSnapshotToDashboardSession) : [];

  return (
    <HostDashboardPage
      error={error ? error.message || 'Failed to load sessions' : null}
      hostEmail={hostSession?.user?.email}
      hostName={hostSession?.user?.name}
      isAuthLoading={isAuthLoading}
      isLoading={isLoading}
      onCreateSession={() => {
        void navigate({ to: '/host/sessions/new' });
      }}
      onDeleteSession={(session) => {
        deleteSession.mutate({ id: session.id, confirm: true });
      }}
      onOpenSession={(session) => {
        const slug = dashboardSessionSlug(session.id);
        const path =
          session.lifecycle === 'live'
            ? sessionLivePath(slug)
            : session.lifecycle === 'ended'
              ? sessionHistoryPath(slug)
              : sessionEditorPath(slug);
        void navigate({ to: path });
      }}
      onSignOut={async () => {
        try {
          await signOut.mutateAsync();
        } finally {
          void navigate({ to: '/' });
        }
      }}
      sessions={sessions}
    />
  );
}

const hostDashboardRoute = createRoute({
  component: HostDashboardRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/host/dashboard',
});

function CreateSessionRouteComponent() {
  const navigate = useNavigate();
  const createSession = useCreateSession();

  return (
    <CreateSessionPage
      errorMessage={createSession.error ? createSession.error.message || 'Failed to create session' : null}
      isSubmitting={createSession.isPending}
      onCancel={() => {
        void navigate({ to: '/host/dashboard' });
      }}
      onCreateSessionSubmit={async (name) => {
        const created = await createSession.mutateAsync({ name });
        const slug = dashboardSessionSlug(created.id);
        void navigate({ to: sessionEditorPath(slug) });
      }}
    />
  );
}

const createSessionRoute = createRoute({
  component: CreateSessionRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/host/sessions/new',
});

const pollTypeMap = {
  multiple_choice: 'multiple-choice',
  open_ended: 'open-ended',
  single_choice: 'single-choice',
} as const;

function mapPollType(
  type: PollSnapshot['type'],
): 'multiple-choice' | 'open-ended' | 'single-choice' {
  return pollTypeMap[type] ?? 'single-choice';
}

function mapPollSnapshotToEditorPoll(poll: PollSnapshot): EditorPoll {
  const status: EditorPoll['status'] = poll.isOpen
    ? 'open'
    : poll.hasResponses
      ? 'closed'
      : 'configured';
  return {
    id: poll.id,
    options: poll.options ? poll.options.map((opt) => opt.text) : [],
    hasResponses: poll.hasResponses,
    status,
    text: poll.text,
    type: mapPollType(poll.type),
  };
}

function SessionEditorRouteComponent() {
  const navigate = useNavigate();
  const { sessionSlug } = useParams({ from: sessionEditorRoute.id });
  const sessionId = sessionSlug || '';

  const { data: sessionSnapshot, isLoading: isSessionLoading, error: sessionError } = useSessionDetails(sessionId);
  const { data: pollSnapshots, isLoading: isPollsLoading } = useSessionPolls(sessionId);

  const startSession = useStartSession();
  const deletePoll = useDeletePoll();
  const reorderPolls = useReorderPolls();

  const sessionData = sessionSnapshot
    ? {
        id: sessionSnapshot.id,
        lifecycle: sessionSnapshot.status,
        name: sessionSnapshot.name,
        polls: pollSnapshots ? pollSnapshots.map(mapPollSnapshotToEditorPoll) : [],
      }
    : undefined;

  const errorMessage =
    sessionError?.message ||
    startSession.error?.message ||
    deletePoll.error?.message ||
    reorderPolls.error?.message ||
    null;

  return (
    <SessionEditorPage
      errorMessage={errorMessage}
      initialSession={sessionData}
      isLoading={isSessionLoading || isPollsLoading}
      onAddPoll={() => {
        void navigate({ to: sessionPollBuilderPath(sessionId) });
      }}
      onDeletePollSubmit={async (pollId) => {
        await deletePoll.mutateAsync({ pollId, sessionId });
      }}
      onEditPoll={(poll) => {
        void navigate({
          to: sessionPollBuilderPath(sessionId),
          search: { pollId: poll.id },
        });
      }}
      onMovePollSubmit={async (pollId, direction) => {
        if (!pollSnapshots) return;
        const currentIndex = pollSnapshots.findIndex((p) => p.id === pollId);
        const targetIndex = currentIndex + direction;
        if (currentIndex < 0 || targetIndex < 0 || targetIndex >= pollSnapshots.length) {
          return;
        }
        const nextPolls = [...pollSnapshots];
        const currentItem = nextPolls[currentIndex];
        const targetItem = nextPolls[targetIndex];
        if (!currentItem || !targetItem) return;
        nextPolls[currentIndex] = targetItem;
        nextPolls[targetIndex] = currentItem;
        await reorderPolls.mutateAsync({
          pollIds: nextPolls.map((p) => p.id),
          sessionId,
        });
      }}
      onOpenLockedPoll={(poll) => {
        void navigate({
          to: sessionLockedPollPath(sessionId),
          search: { pollId: poll.id },
        });
      }}
      onStartSession={() => {
        void navigate({ to: sessionLivePath(sessionId) });
      }}
      onStartSessionSubmit={async () => {
        await startSession.mutateAsync({ sessionId });
      }}
    />
  );
}

const sessionEditorRoute = createRoute({
  component: SessionEditorRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/host/sessions/$sessionSlug',
});

function mapPollSnapshotToDraft(poll: PollSnapshot): PollDraft {
  return {
    type: mapPollType(poll.type),
    text: poll.text,
    options: poll.options.map((option) => option.text),
    maximumSelections: poll.maxSelections ?? undefined,
  };
}

function PollBuilderRouteComponent() {
  const navigate = useNavigate();
  const { sessionSlug } = useParams({ from: pollBuilderRoute.id });
  const { pollId } = useSearch({ from: pollBuilderRoute.id });
  const sessionId = sessionSlug || '';

  const { data: pollSnapshots } = useSessionPolls(sessionId);
  const createPoll = useCreatePoll();
  const updatePoll = useUpdatePoll();

  const editingPoll = pollId
    ? pollSnapshots?.find((poll) => poll.id === pollId)
    : undefined;
  const initialDraft = editingPoll ? mapPollSnapshotToDraft(editingPoll) : undefined;

  return (
    <PollBuilderPage
      errorMessage={
        createPoll.error?.message || updatePoll.error?.message || null
      }
      initialDraft={initialDraft}
      isSubmitting={createPoll.isPending || updatePoll.isPending}
      key={editingPoll?.id ?? 'new'}
      onCancel={() => {
        void navigate({ to: sessionEditorPath(sessionId) });
      }}
      onSavePollSubmit={async (draft) => {
        const typeMap: Record<string, 'single_choice' | 'multiple_choice' | 'open_ended'> = {
          'multiple-choice': 'multiple_choice',
          'open-ended': 'open_ended',
          'single-choice': 'single_choice',
        };
        const options = draft.type === 'open-ended' ? undefined : draft.options;
        if (editingPoll) {
          await updatePoll.mutateAsync({
            maxSelections: draft.maximumSelections ?? null,
            options,
            pollId: editingPoll.id,
            sessionId,
            text: draft.text,
          });
        } else {
          await createPoll.mutateAsync({
            maxSelections: draft.maximumSelections ?? null,
            options,
            sessionId,
            text: draft.text,
            type: typeMap[draft.type] || 'single_choice',
          });
        }
        void navigate({ to: sessionEditorPath(sessionId) });
      }}
    />
  );
}

const pollBuilderRoute = createRoute({
  component: PollBuilderRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/host/sessions/$sessionSlug/polls/new',
  validateSearch: pollBuilderSearchSchema,
});

function mapPollSnapshotToLockedPoll(
  poll: PollSnapshot,
  results: HostResults,
): LockedPoll {
  return {
    id: poll.id,
    options: poll.options.map((option) => ({ id: option.id, label: option.text })),
    participantResultsVisible: poll.resultsRevealed,
    responses: results.total,
    results: results.counts.map((count) => ({
      count: count.count,
      id: count.optionId,
      label: count.text,
      percentage: count.percentage,
    })),
    status: poll.isOpen ? 'open' : 'closed',
    text: poll.text,
    type: mapPollType(poll.type),
  };
}

function LockedPollRouteComponent() {
  const navigate = useNavigate();
  const { sessionSlug } = useParams({ from: lockedPollRoute.id });
  const { pollId } = useSearch({ from: lockedPollRoute.id });
  const sessionId = sessionSlug || '';

  const { data: pollSnapshots, isLoading: isPollsLoading } =
    useSessionPolls(sessionId);
  const openPoll = useOpenPoll();
  const closePoll = useClosePoll();

  const lockedPoll =
    pollSnapshots?.find((poll) => poll.id === pollId) ??
    pollSnapshots?.find((poll) => poll.hasResponses) ??
    pollSnapshots?.[0];

  const { data: results, isLoading: isResultsLoading } = usePollResultsMap(
    sessionId,
    lockedPoll ? [lockedPoll] : undefined,
  );

  const poll: LockedPoll | undefined =
    lockedPoll && results?.[lockedPoll.id]
      ? mapPollSnapshotToLockedPoll(lockedPoll, results[lockedPoll.id])
      : undefined;

  return (
    <EditLockedPollPage
      errorMessage={
        openPoll.error?.message || closePoll.error?.message || null
      }
      isLoading={isPollsLoading || isResultsLoading}
      onClosePoll={async (p) => {
        await closePoll.mutateAsync({ pollId: p.id, sessionId });
      }}
      onOpenPoll={async (p) => {
        await openPoll.mutateAsync({ pollId: p.id, sessionId });
      }}
      onViewResults={() => {
        void navigate({
          to: sessionResultsPath(sessionId),
          search: lockedPoll ? { pollId: lockedPoll.id } : undefined,
        });
      }}
      poll={poll}
    />
  );
}

const lockedPollRoute = createRoute({
  component: LockedPollRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/host/sessions/$sessionSlug/polls/locked',
  validateSearch: hostResultsSearchSchema,
});

function mapPollSnapshotToLivePoll(
  poll: PollSnapshot,
  results: HostResults | undefined,
): LivePoll {
  return {
    id: poll.id,
    lifecycle: poll.isOpen ? 'open' : 'closed',
    options: poll.options.map((option) => ({
      count: results?.counts.find((c) => c.optionId === option.id)?.count ?? 0,
      id: option.id,
      label: option.text,
    })),
    position: poll.position + 1,
    question: poll.text,
    responses: (results?.responses ?? []).map((response) => ({
      id: response.id,
      submittedAt: new Date(response.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      text: response.text,
    })),
    resultVisibility: poll.resultsRevealed ? 'revealed' : 'hidden',
    totalResponses: results?.total ?? 0,
    type: mapPollType(poll.type),
  };
}

function LiveControlRoomRouteComponent() {
  const navigate = useNavigate();
  const { sessionSlug } = useParams({ from: liveControlRoomRoute.id });
  const sessionId = sessionSlug || '';

  const { data: sessionSnapshot, isLoading: isSessionLoading } =
    useSessionDetails(sessionId);
  const { data: pollSnapshots, isLoading: isPollsLoading } =
    useSessionPolls(sessionId);
  const { data: resultsMap, isLoading: isResultsLoading } = usePollResultsMap(
    sessionId,
    pollSnapshots,
  );
  const presence = useHostPresence(sessionId);

  useRealtimeSocket({
    enabled: Boolean(sessionId),
    role: 'host',
    sessionId,
  });

  const openPoll = useOpenPoll();
  const closePoll = useClosePoll();
  const revealResults = useRevealResults();
  const hideResults = useHideResults();
  const endSession = useEndSession();

  const polls: LivePoll[] = (pollSnapshots ?? []).map((poll) =>
    mapPollSnapshotToLivePoll(poll, resultsMap?.[poll.id]),
  );
  const roomCode = sessionSnapshot?.roomCode ?? '';
  const invitationLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${roomCode}`
      : '';

  return (
    <LiveControlRoomPage
      connectionState={presence.connectionState}
      errorMessage={
        openPoll.error?.message ||
        closePoll.error?.message ||
        revealResults.error?.message ||
        hideResults.error?.message ||
        endSession.error?.message ||
        null
      }
      invitationLink={invitationLink}
      isLoading={isSessionLoading || isPollsLoading || isResultsLoading}
      onClosePollSubmit={async (pollId) => {
        await closePoll.mutateAsync({ pollId, sessionId });
      }}
      onEndSessionSubmit={async () => {
        await endSession.mutateAsync({ sessionId });
      }}
      onHideResultsSubmit={async (pollId) => {
        await hideResults.mutateAsync({ pollId, sessionId });
      }}
      onOpenPollSubmit={async (pollId) => {
        await openPoll.mutateAsync({ pollId, sessionId });
      }}
      onRevealResultsSubmit={async (pollId) => {
        await revealResults.mutateAsync({ pollId, sessionId });
      }}
      onSessionEnded={() => {
        void navigate({ to: sessionHistoryPath(sessionId) });
      }}
      participantCount={presence.participantCount}
      participants={presence.participants}
      polls={polls}
      roomCode={roomCode}
      sessionId={sessionId}
      sessionName={sessionSnapshot?.name ?? ''}
      sessionStatus={sessionSnapshot?.status === 'ended' ? 'ended' : 'live'}
    />
  );
}

const liveControlRoomRoute = createRoute({
  component: LiveControlRoomRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/host/sessions/$sessionSlug/live',
});

function mapPollSnapshotToHostResultPoll(
  poll: PollSnapshot,
  results: HostResults | undefined,
): HostResultPoll {
  return {
    id: poll.id,
    lifecycle: poll.isOpen ? 'open' : 'closed',
    number: poll.position + 1,
    openEndedResponses: (results?.responses ?? []).map((response) => ({
      id: response.id,
      submittedAt: new Date(response.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      text: response.text,
    })),
    options: poll.options.map((option) => ({
      count: results?.counts.find((c) => c.optionId === option.id)?.count ?? 0,
      id: option.id,
      label: option.text,
    })),
    question: poll.text,
    totalResponses: results?.total ?? 0,
    type: mapPollType(poll.type),
    visibility: poll.resultsRevealed ? 'revealed' : 'hidden',
  };
}

function HostResultsRouteComponent() {
  const { sessionSlug } = useParams({ from: hostResultsRoute.id });
  const { pollId } = useSearch({ from: hostResultsRoute.id });
  const sessionId = sessionSlug || '';

  const { data: sessionSnapshot, isLoading: isSessionLoading } =
    useSessionDetails(sessionId);
  const { data: pollSnapshots, isLoading: isPollsLoading } =
    useSessionPolls(sessionId);
  const { data: resultsMap, isLoading: isResultsLoading } = usePollResultsMap(
    sessionId,
    pollSnapshots,
  );
  const openPoll = useOpenPoll();
  const closePoll = useClosePoll();
  const revealResults = useRevealResults();
  const hideResults = useHideResults();

  const polls: HostResultPoll[] = (pollSnapshots ?? []).map((poll) =>
    mapPollSnapshotToHostResultPoll(poll, resultsMap?.[poll.id]),
  );

  return (
    <HostResultsPage
      errorMessage={
        openPoll.error?.message ||
        closePoll.error?.message ||
        revealResults.error?.message ||
        hideResults.error?.message ||
        null
      }
      initialPollId={pollId}
      isLoading={isSessionLoading || isPollsLoading || isResultsLoading}
      onToggleLifecycle={async (id) => {
        const poll = polls.find((p) => p.id === id);
        if (!poll) return;
        if (poll.lifecycle === 'open') {
          await closePoll.mutateAsync({ pollId: id, sessionId });
        } else {
          await openPoll.mutateAsync({ pollId: id, sessionId });
        }
      }}
      onToggleVisibility={async (id) => {
        const poll = polls.find((p) => p.id === id);
        if (!poll) return;
        if (poll.visibility === 'revealed') {
          await hideResults.mutateAsync({ pollId: id, sessionId });
        } else {
          await revealResults.mutateAsync({ pollId: id, sessionId });
        }
      }}
      polls={polls}
      sessionId={sessionId}
      sessionName={sessionSnapshot?.name ?? ''}
    />
  );
}

const hostResultsRoute = createRoute({
  component: HostResultsRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/host/sessions/$sessionSlug/results',
  validateSearch: hostResultsSearchSchema,
});

function mapPollSnapshotToEndedHistoryPoll(
  poll: PollSnapshot,
  results: HostResults | undefined,
): EndedHistoryPoll {
  return {
    choiceResults: (results?.counts ?? []).map((count) => ({
      count: count.count,
      id: count.optionId,
      label: count.text,
      percentage: count.percentage,
    })),
    id: poll.id,
    number: poll.position + 1,
    openEndedResponses: (results?.responses ?? []).map((response) => ({
      id: response.id,
      submittedAt: new Date(response.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      text: response.text,
    })),
    hostCanViewResults: true,
    participantResultVisibility: poll.resultsRevealed ? 'revealed' : 'hidden',
    prompt: poll.text,
    totalResponses: results?.total ?? 0,
    type: mapPollType(poll.type),
  };
}

function EndedSessionHistoryRouteComponent() {
  const { sessionSlug } = useParams({ from: endedSessionHistoryRoute.id });
  const sessionId = sessionSlug || '';

  const { data: sessionSnapshot, isLoading: isSessionLoading } =
    useSessionDetails(sessionId);
  const { data: pollSnapshots, isLoading: isPollsLoading } =
    useSessionPolls(sessionId);
  const { data: resultsMap, isLoading: isResultsLoading } = usePollResultsMap(
    sessionId,
    pollSnapshots,
  );

  if (!sessionSnapshot) {
    return (
      <EndedSessionHistoryPage
        isLoading={isSessionLoading || isPollsLoading || isResultsLoading}
      />
    );
  }

  const polls = (pollSnapshots ?? []).map((poll) =>
    mapPollSnapshotToEndedHistoryPoll(poll, resultsMap?.[poll.id]),
  );
  const totalResponses = polls.reduce((sum, poll) => sum + poll.totalResponses, 0);
  const endedAt = sessionSnapshot.endedAt
    ? new Date(sessionSnapshot.endedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Date unavailable';

  return (
    <EndedSessionHistoryPage
      history={{
        endedAt,
        polls,
        sessionName: sessionSnapshot.name,
        totalResponses,
      }}
      isLoading={isSessionLoading || isPollsLoading || isResultsLoading}
    />
  );
}

const endedSessionHistoryRoute = createRoute({
  component: EndedSessionHistoryRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/host/sessions/$sessionSlug/history',
});

function JoinRouteComponent() {
  const navigate = useNavigate();
  const { roomCode } = useSearch({ from: joinRoute.id });
  const joinSession = useJoinSession();
  const [statusOverride, setStatusOverride] = useState<'draft' | 'ended' | 'invalid' | 'ready' | undefined>();

  return (
    <JoinByRoomCodePage
      errorMessage={joinSession.error?.message || null}
      initialRoomCode={roomCode}
      isSubmitting={joinSession.isPending}
      onJoinSubmit={async (code) => {
        const existingToken = getParticipantToken(code);
        try {
          await joinSession.mutateAsync({
            roomCode: code,
            token: existingToken || undefined,
          });
          setStatusOverride('ready');
          void navigate({ to: `/join/name?roomCode=${encodeURIComponent(code)}` });
        } catch (err: any) {
          if (err?.code === 'SESSION_DRAFT') {
            setStatusOverride('draft');
          } else if (err?.code === 'SESSION_ENDED') {
            setStatusOverride('ended');
          } else if (err?.code === 'SESSION_NOT_FOUND') {
            setStatusOverride('invalid');
          } else {
            setStatusOverride('ready');
            void navigate({ to: `/join/name?roomCode=${encodeURIComponent(code)}` });
          }
        }
      }}
      statusOverride={statusOverride}
    />
  );
}

const joinRoute = createRoute({
  component: JoinRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/join',
  validateSearch: joinSearchSchema,
});

function InvitationJoinRouteComponent() {
  const navigate = useNavigate();
  const { roomCode } = useSearch({ from: invitationJoinRoute.id });
  const joinSession = useJoinSession();
  const [statusOverride, setStatusOverride] = useState<'draft' | 'ended' | 'invalid' | 'ready' | undefined>();

  return (
    <JoinByRoomCodePage
      errorMessage={joinSession.error?.message || null}
      initialRoomCode={roomCode}
      isSubmitting={joinSession.isPending}
      onJoinSubmit={async (code) => {
        const existingToken = getParticipantToken(code);
        try {
          await joinSession.mutateAsync({
            roomCode: code,
            token: existingToken || undefined,
          });
          setStatusOverride('ready');
          void navigate({ to: `/join/name?roomCode=${encodeURIComponent(code)}` });
        } catch (err: any) {
          if (err?.code === 'SESSION_DRAFT') {
            setStatusOverride('draft');
          } else if (err?.code === 'SESSION_ENDED') {
            setStatusOverride('ended');
          } else if (err?.code === 'SESSION_NOT_FOUND') {
            setStatusOverride('invalid');
          } else {
            setStatusOverride('ready');
            void navigate({ to: `/join/name?roomCode=${encodeURIComponent(code)}` });
          }
        }
      }}
      statusOverride={statusOverride}
    />
  );
}

const invitationJoinRoute = createRoute({
  component: InvitationJoinRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/join/invitation',
  validateSearch: joinSearchSchema,
});

function ParticipantNameRouteComponent() {
  const navigate = useNavigate();
  const { roomCode } = useSearch({ from: participantNameRoute.id });
  const joinSession = useJoinSession();

  return (
    <ParticipantNameEntryPage
      errorMessage={joinSession.error?.message || null}
      isSubmitting={joinSession.isPending}
      onJoinSubmit={async (name) => {
        if (!roomCode) {
          void navigate({ to: '/join' });
          return;
        }
        const existingToken = getParticipantToken(roomCode);
        const res = await joinSession.mutateAsync({
          name,
          roomCode,
          token: existingToken || undefined,
        });
        void navigate({
          to: `/session/${encodeURIComponent(res.snapshot.session.id)}`,
          search: { participantName: name, roomCode },
        });
      }}
      roomCode={roomCode}
    />
  );
}

const participantNameRoute = createRoute({
  component: ParticipantNameRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/join/name',
  validateSearch: participantNameSearchSchema,
});

function JoinByCodeRouteComponent() {
  const navigate = useNavigate();
  const { roomCode } = useParams({ from: joinByCodeRoute.id });
  const joinSession = useJoinSession();
  const [statusOverride, setStatusOverride] = useState<'draft' | 'ended' | 'invalid' | 'ready' | undefined>();

  return (
    <JoinByRoomCodePage
      errorMessage={joinSession.error?.message || null}
      initialRoomCode={roomCode}
      isSubmitting={joinSession.isPending}
      onJoinSubmit={async (code) => {
        const existingToken = getParticipantToken(code);
        try {
          await joinSession.mutateAsync({
            roomCode: code,
            token: existingToken || undefined,
          });
          setStatusOverride('ready');
          void navigate({ to: `/join/name?roomCode=${encodeURIComponent(code)}` });
        } catch (err: any) {
          if (err?.code === 'SESSION_DRAFT') {
            setStatusOverride('draft');
          } else if (err?.code === 'SESSION_ENDED') {
            setStatusOverride('ended');
          } else if (err?.code === 'SESSION_NOT_FOUND') {
            setStatusOverride('invalid');
          } else {
            setStatusOverride('ready');
            void navigate({ to: `/join/name?roomCode=${encodeURIComponent(code)}` });
          }
        }
      }}
      statusOverride={statusOverride}
    />
  );
}

const joinByCodeRoute = createRoute({
  component: JoinByCodeRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/join/$roomCode',
});

function emptyParticipantPoll() {
  return {
    id: '',
    options: [],
    prompt: '',
    results: [],
    totalResponses: 0,
    type: 'single-choice' as const,
  };
}

function mapBackendSnapshotToParticipantSnapshot(
  data: ParticipantSessionResponse | undefined,
  results?: { total: number; counts: readonly { optionId: string; count: number; percentage: number }[] },
): ParticipantSessionSnapshot | undefined {
  if (!data) return undefined;
  const { session, polls, myResponse, participantCount } = data;

  const activePoll = polls.find((poll) => poll.isOpen) ?? null;

  const poll = activePoll
    ? {
        id: activePoll.id,
        maxSelections: activePoll.maxSelections ?? undefined,
        options: activePoll.options.map((option) => ({
          id: option.id,
          label: option.text,
        })),
        prompt: activePoll.text,
        results: (results?.counts ?? []).map((count) => ({
          count: count.count,
          id: count.optionId,
          label:
            activePoll.options.find((option) => option.id === count.optionId)
              ?.text ?? count.optionId,
          percentage: count.percentage,
        })),
        responseLimit: undefined,
        totalResponses: results?.total ?? 0,
        type: mapPollType(activePoll.type),
      }
    : emptyParticipantPoll();

  let responseState: 'accepted' | 'none' = 'none';
  let response: string | readonly string[] | null = null;

  if (myResponse) {
    responseState = 'accepted';
    if (activePoll?.type === 'multiple_choice') {
      response = myResponse.optionIds ?? [];
    } else if (activePoll?.type === 'open_ended') {
      response = myResponse.text ?? '';
    } else {
      response = myResponse.optionIds?.[0] ?? null;
    }
  }

  return {
    connectionState: 'connected',
    participantCount,
    poll,
    pollLifecycle: !activePoll ? 'none' : activePoll.isOpen ? 'open' : 'closed',
    response,
    responseState,
    resultVisibility: activePoll?.resultsRevealed ? 'revealed' : 'hidden',
    sessionLifecycle: session.status === 'ended' ? 'ended' : 'live',
    sessionName: session.name,
  };
}

function ParticipantSessionRouteComponent() {
  const { sessionSlug } = useParams({ from: participantSessionRoute.id });
  const { participantName, roomCode } = useSearch({
    from: participantSessionRoute.id,
  });
  const token = getParticipantToken(sessionSlug || '');
  useRealtimeSocket({
    enabled: Boolean(sessionSlug && token),
    role: 'participant',
    sessionId: sessionSlug || '',
    token,
  });

  const { data: rawSnapshot, isLoading } = useParticipantSessionSnapshot(token);
  const activePollSnapshot = rawSnapshot?.polls.find((poll) => poll.isOpen);
  const { data: participantResults } = useParticipantPollResults(
    token,
    activePollSnapshot?.id,
    Boolean(activePollSnapshot?.resultsRevealed && rawSnapshot),
  );
  const submitResponse = useSubmitResponse();

  const snapshot = mapBackendSnapshotToParticipantSnapshot(
    rawSnapshot,
    participantResults,
  );

  return (
    <ParticipantSessionPage
      changeNameHref={
        roomCode
          ? `/join/name?roomCode=${encodeURIComponent(roomCode)}`
          : undefined
      }
      errorMessage={submitResponse.error?.message || null}
      initialParticipantName={participantName ?? rawSnapshot?.displayName}
      initialSnapshot={snapshot}
      isLoading={isLoading}
      isSubmitting={submitResponse.isPending}
      onResponseSubmit={async (draft) => {
        if (!rawSnapshot) return;
        const activePoll = rawSnapshot.polls.find((poll) => poll.isOpen);
        if (!activePoll || !token) return;
        const pollType = activePoll.type;

        let optionIds: string[] | undefined;
        let text: string | undefined;

        if (pollType === 'multiple_choice') {
          optionIds = Array.isArray(draft) ? draft : [];
        } else if (pollType === 'open_ended') {
          text = typeof draft === 'string' ? draft : '';
        } else {
          optionIds = typeof draft === 'string' && draft ? [draft] : [];
        }

        await submitResponse.mutateAsync({
          idempotencyKey: crypto.randomUUID(),
          optionIds,
          pollId: activePoll.id,
          text,
          token,
        });
      }}
    />
  );
}

const participantSessionRoute = createRoute({
  component: ParticipantSessionRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/session/$sessionSlug',
  validateSearch: participantSessionSearchSchema,
});

// Legacy compatibility redirects
const legacyDashboardRoute = createRoute({
  beforeLoad: () => {
    throw redirect({ to: '/host/dashboard' });
  },
  getParentRoute: () => rootRoute,
  path: '/host-dashboard',
});

const legacyParticipantNameRoute = createRoute({
  beforeLoad: ({ search }) => {
    throw redirect({
      search,
      to: '/join/name',
    });
  },
  getParentRoute: () => rootRoute,
  path: '/participant/name',
  validateSearch: participantNameSearchSchema,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  hostEmailRoute,
  magicLinkRoute,
  invalidMagicLinkRoute,
  hostDashboardRoute,
  createSessionRoute,
  sessionEditorRoute,
  pollBuilderRoute,
  lockedPollRoute,
  liveControlRoomRoute,
  hostResultsRoute,
  endedSessionHistoryRoute,
  joinRoute,
  invitationJoinRoute,
  participantNameRoute,
  joinByCodeRoute,
  participantSessionRoute,
  legacyDashboardRoute,
  legacyParticipantNameRoute,
]);

export const router = createRouter({
  context: {
    auth: {
      isAuthenticated: false,
      isLoading: true,
      user: null,
    },
  },
  defaultPreload: 'intent',
  routeTree,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
