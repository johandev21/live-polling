/* oxlint-disable react/only-export-components */
import { useState } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import { z } from 'zod';

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

import { fixtureSessionEditorSession } from '@/pages/session-editor/model/session-editor';
import {
  useCreatePoll,
  useDeletePoll,
  useReorderPolls,
  useSessionDetails,
  useSessionPolls,
  useStartSession,
} from '@/shared/hooks/use-host-polls';
import {
  useCreateSession,
  useDeleteSession,
  useHostSessions,
} from '@/shared/hooks/use-host-sessions';
import { useJoinSession } from '@/shared/hooks/use-participant-auth';
import {
  useParticipantSessionSnapshot,
  useSubmitResponse,
} from '@/shared/hooks/use-participant-session';
import { getParticipantToken } from '@/shared/lib/participant-storage';
import type { PollSnapshot, SessionSnapshot } from '@/shared/lib/contracts';
import { DefaultRouteFallback } from './route-fallback';

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

export const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: DefaultRouteFallback,
});

const landingRoute = createRoute({
  component: LandingPage,
  getParentRoute: () => rootRoute,
  path: '/',
});

const hostEmailRoute = createRoute({
  component: HostEmailEntryPage,
  getParentRoute: () => rootRoute,
  path: '/host/email',
});

function MagicLinkRouteComponent() {
  const { email } = useSearch({ from: magicLinkRoute.id });
  return <MagicLinkConfirmationPage email={email} />;
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
    <InvalidMagicLinkPage
      email={email}
      initialKind={kind === 'invalid' ? 'invalid' : 'expired'}
    />
  );
}

const invalidMagicLinkRoute = createRoute({
  component: InvalidMagicLinkRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/host/magic-link/invalid',
  validateSearch: invalidMagicLinkSearchSchema,
});

function mapSnapshotToDashboardSession(snapshot: SessionSnapshot) {
  const updatedDate = snapshot.updatedAt ? new Date(snapshot.updatedAt) : new Date();
  return {
    id: snapshot.id,
    lifecycle: snapshot.status,
    name: snapshot.name,
    participantCount: 0,
    pollCount: 0,
    roomCode: snapshot.roomCode,
    updatedLabel: `Updated ${updatedDate.toLocaleDateString()}`,
  };
}

function HostDashboardRouteComponent() {
  const navigate = useNavigate();
  const { data: rawSessions, isLoading, error } = useHostSessions();
  const deleteSession = useDeleteSession();

  const sessions = rawSessions ? rawSessions.map(mapSnapshotToDashboardSession) : [];

  return (
    <HostDashboardPage
      error={error ? error.message || 'Failed to load sessions' : null}
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

function mapPollSnapshotToEditorPoll(poll: PollSnapshot) {
  const typeMap: Record<string, 'multiple-choice' | 'open-ended' | 'single-choice'> = {
    multiple_choice: 'multiple-choice',
    open_ended: 'open-ended',
    single_choice: 'single-choice',
  };
  return {
    id: poll.id,
    options: poll.options ? poll.options.map((opt) => opt.text) : [],
    responses: poll.hasResponses ? 1 : 0,
    status: (poll.isOpen ? 'open' : 'configured') as 'closed' | 'configured' | 'open',
    text: poll.text,
    type: typeMap[poll.type] || 'single-choice',
  };
}

function SessionEditorRouteComponent() {
  const navigate = useNavigate();
  const { sessionSlug } = useParams({ from: sessionEditorRoute.id });
  const sessionId = sessionSlug || '';

  const { data: sessionSnapshot, isLoading: isSessionLoading } = useSessionDetails(sessionId);
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
    : fixtureSessionEditorSession;

  const errorMessage =
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
      onEditPoll={() => {
        void navigate({ to: sessionPollBuilderPath(sessionId) });
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
      onOpenLockedPoll={() => {
        void navigate({ to: sessionLockedPollPath(sessionId) });
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

function PollBuilderRouteComponent() {
  const navigate = useNavigate();
  const { sessionSlug } = useParams({ from: pollBuilderRoute.id });
  const sessionId = sessionSlug || '';

  const createPoll = useCreatePoll();

  return (
    <PollBuilderPage
      errorMessage={createPoll.error?.message || null}
      isSubmitting={createPoll.isPending}
      onCancel={() => {
        void navigate({ to: sessionEditorPath(sessionId) });
      }}
      onSavePollSubmit={async (draft) => {
        const typeMap: Record<string, 'single_choice' | 'multiple_choice' | 'open_ended'> = {
          'multiple-choice': 'multiple_choice',
          'open-ended': 'open_ended',
          'single-choice': 'single_choice',
        };
        await createPoll.mutateAsync({
          maxSelections: draft.maximumSelections ?? null,
          options: draft.type === 'open-ended' ? undefined : draft.options,
          sessionId,
          text: draft.text,
          type: typeMap[draft.type] || 'single_choice',
        });
        void navigate({ to: sessionEditorPath(sessionId) });
      }}
    />
  );
}

const pollBuilderRoute = createRoute({
  component: PollBuilderRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/host/sessions/$sessionSlug/polls/new',
});

function LockedPollRouteComponent() {
  const navigate = useNavigate();
  const { sessionSlug } = useParams({ from: lockedPollRoute.id });
  const slug = sessionSlug || 'team-offsite';

  return (
    <EditLockedPollPage
      onViewResults={() => {
        void navigate({ to: sessionResultsPath(slug) });
      }}
    />
  );
}

const lockedPollRoute = createRoute({
  component: LockedPollRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/host/sessions/$sessionSlug/polls/locked',
});

function LiveControlRoomRouteComponent() {
  const navigate = useNavigate();
  const { sessionSlug } = useParams({ from: liveControlRoomRoute.id });
  const slug = sessionSlug || 'team-offsite';

  return (
    <LiveControlRoomPage
      onSessionEnded={() => {
        void navigate({ to: sessionHistoryPath(slug) });
      }}
    />
  );
}

const liveControlRoomRoute = createRoute({
  component: LiveControlRoomRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/host/sessions/$sessionSlug/live',
});

function HostResultsRouteComponent() {
  const { pollId } = useSearch({ from: hostResultsRoute.id });
  return <HostResultsPage initialPollId={pollId} />;
}

const hostResultsRoute = createRoute({
  component: HostResultsRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/host/sessions/$sessionSlug/results',
  validateSearch: hostResultsSearchSchema,
});

const endedSessionHistoryRoute = createRoute({
  component: EndedSessionHistoryPage,
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
            // Need name or token missing
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
        const code = roomCode || '7K4P9D';
        const existingToken = getParticipantToken(code);
        const res = await joinSession.mutateAsync({
          name,
          roomCode: code,
          token: existingToken || undefined,
        });
        void navigate({ to: `/session/${encodeURIComponent(res.session.id)}` });
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

function mapBackendSnapshotToParticipantSnapshot(
  data: any,
): any {
  if (!data) return undefined;
  const { session, activePoll, myResponse } = data;

  const typeMap: Record<string, string> = {
    multiple_choice: 'multiple-choice',
    open_ended: 'open-ended',
    single_choice: 'single-choice',
  };

  const poll = activePoll
    ? {
        id: activePoll.id,
        maxSelections: activePoll.maxSelections ?? undefined,
        options: activePoll.options
          ? activePoll.options.map((opt: any) => ({ id: opt.id, label: opt.text }))
          : [],
        prompt: activePoll.text,
        results: [],
        totalResponses: 0,
        type: typeMap[activePoll.type] || 'single-choice',
      }
    : undefined;

  let responseState = 'none';
  let response = null;

  if (myResponse) {
    responseState = 'accepted';
    if (activePoll?.type === 'multiple_choice') {
      response = myResponse.optionIds || [];
    } else if (activePoll?.type === 'open_ended') {
      response = myResponse.text || '';
    } else {
      response = myResponse.optionIds?.[0] || null;
    }
  }

  return {
    connectionState: 'connected',
    participantCount: 0,
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
  const { participantName } = useSearch({ from: participantSessionRoute.id });
  const token = getParticipantToken(sessionSlug || '');

  const { data: rawSnapshot, isLoading } = useParticipantSessionSnapshot(token);
  const submitResponse = useSubmitResponse();

  const snapshot = mapBackendSnapshotToParticipantSnapshot(rawSnapshot);

  return (
    <ParticipantSessionPage
      errorMessage={submitResponse.error?.message || null}
      initialParticipantName={participantName}
      initialSnapshot={snapshot}
      isLoading={isLoading}
      isSubmitting={submitResponse.isPending}
      onResponseSubmit={async (draft) => {
        if (!rawSnapshot?.activePoll || !token) return;
        const pollId = rawSnapshot.activePoll.id;
        const pollType = rawSnapshot.activePoll.type;

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
          pollId,
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

const legacySessionEditorRoute = createRoute({
  beforeLoad: () => {
    throw redirect({
      params: { sessionSlug: 'team-offsite' },
      to: '/host/sessions/$sessionSlug',
    });
  },
  getParentRoute: () => rootRoute,
  path: '/session-editor',
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

const legacyParticipantSessionRoute = createRoute({
  beforeLoad: ({ search }) => {
    throw redirect({
      params: { sessionSlug: 'team-offsite' },
      search,
      to: '/session/$sessionSlug',
    });
  },
  getParentRoute: () => rootRoute,
  path: '/participant/session',
  validateSearch: participantSessionSearchSchema,
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
  legacySessionEditorRoute,
  legacyParticipantNameRoute,
  legacyParticipantSessionRoute,
]);

export const router = createRouter({
  defaultPreload: 'intent',
  routeTree,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
