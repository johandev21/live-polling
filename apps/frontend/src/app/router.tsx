/* oxlint-disable react/only-export-components */
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

import {
  useCreateSession,
  useDeleteSession,
  useHostSessions,
} from '@/shared/hooks/use-host-sessions';
import type { SessionSnapshot } from '@/shared/lib/contracts';
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

function SessionEditorRouteComponent() {
  const navigate = useNavigate();
  const { sessionSlug } = useParams({ from: sessionEditorRoute.id });
  const slug = sessionSlug || 'team-offsite';

  return (
    <SessionEditorPage
      onAddPoll={() => {
        void navigate({ to: sessionPollBuilderPath(slug) });
      }}
      onEditPoll={() => {
        void navigate({ to: sessionPollBuilderPath(slug) });
      }}
      onOpenLockedPoll={() => {
        void navigate({ to: sessionLockedPollPath(slug) });
      }}
      onStartSession={() => {
        void navigate({ to: sessionLivePath(slug) });
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
  const slug = sessionSlug || 'team-offsite';

  return (
    <PollBuilderPage
      onCancel={() => {
        void navigate({ to: sessionEditorPath(slug) });
      }}
      onSave={() => {
        void navigate({ to: sessionEditorPath(slug) });
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
  const { roomCode } = useSearch({ from: joinRoute.id });
  return <JoinByRoomCodePage initialRoomCode={roomCode} />;
}

const joinRoute = createRoute({
  component: JoinRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/join',
  validateSearch: joinSearchSchema,
});

function InvitationJoinRouteComponent() {
  const { roomCode } = useSearch({ from: invitationJoinRoute.id });
  return <JoinByRoomCodePage initialRoomCode={roomCode} />;
}

const invitationJoinRoute = createRoute({
  component: InvitationJoinRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/join/invitation',
  validateSearch: joinSearchSchema,
});

function ParticipantNameRouteComponent() {
  const { roomCode } = useSearch({ from: participantNameRoute.id });
  return <ParticipantNameEntryPage roomCode={roomCode} />;
}

const participantNameRoute = createRoute({
  component: ParticipantNameRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/join/name',
  validateSearch: participantNameSearchSchema,
});

function JoinByCodeRouteComponent() {
  const { roomCode } = useParams({ from: joinByCodeRoute.id });
  return <JoinByRoomCodePage initialRoomCode={roomCode} />;
}

const joinByCodeRoute = createRoute({
  component: JoinByCodeRouteComponent,
  getParentRoute: () => rootRoute,
  path: '/join/$roomCode',
});

function ParticipantSessionRouteComponent() {
  const { participantName } = useSearch({
    from: participantSessionRoute.id,
  });
  return <ParticipantSessionPage initialParticipantName={participantName} />;
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
