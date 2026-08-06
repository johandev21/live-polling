import { createElement } from 'react';

import { EndedSessionHistoryPage } from '@/pages/ended-session-history';
import { CreateSessionPage } from '@/pages/create-session';
import { HostDashboardPage } from '@/pages/host-dashboard';
import { HostEmailEntryPage } from '@/pages/host-email-entry';
import {
  HostResultsPage,
  type HostResultsPageProps,
} from '@/pages/host-results';
import {
  InvalidMagicLinkPage,
  type InvalidMagicLinkPageProps,
} from '@/pages/invalid-magic-link';
import {
  JoinByRoomCodePage,
  type JoinByRoomCodePageProps,
} from '@/pages/join-by-room-code';
import { LandingPage } from '@/pages/landing';
import {
  LiveControlRoomPage,
  type LiveControlRoomPageProps,
} from '@/pages/live-control-room';
import {
  MagicLinkConfirmationPage,
  type MagicLinkConfirmationPageProps,
} from '@/pages/magic-link-confirmation';
import {
  ParticipantNameEntryPage,
  type ParticipantNameEntryPageProps,
} from '@/pages/participant-name-entry';
import {
  ParticipantSessionPage,
  type ParticipantSessionPageProps,
} from '@/pages/participant-session';
import { PollBuilderPage } from '@/pages/poll-builder';
import { EditLockedPollPage } from '@/pages/edit-locked-poll';
import { SessionEditorPage } from '@/pages/session-editor';

import {
  createAppRouter,
  definePageRoutes,
  type AppRoute,
  type AppRouteProps,
} from './router';

function searchParam(search: string, name: string): string | undefined {
  return new URLSearchParams(search).get(name) ?? undefined;
}

function sessionSlug(params: AppRouteProps['params']): string {
  return params.sessionSlug ?? 'team-offsite';
}

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

function LandingRoute() {
  return createElement(LandingPage);
}

function HostEmailRoute() {
  return createElement(HostEmailEntryPage);
}

function MagicLinkRoute({ search }: AppRouteProps) {
  return createElement<MagicLinkConfirmationPageProps>(
    MagicLinkConfirmationPage,
    {
      email: searchParam(search, 'email'),
    },
  );
}

function InvalidMagicLinkRoute({ search }: AppRouteProps) {
  const kind = searchParam(search, 'kind');

  return createElement<InvalidMagicLinkPageProps>(InvalidMagicLinkPage, {
    email: searchParam(search, 'email'),
    initialKind: kind === 'invalid' ? 'invalid' : 'expired',
  });
}

function HostDashboardRoute({ navigate }: AppRouteProps) {
  return createElement(HostDashboardPage, {
    onCreateSession: () => navigate('/host/sessions/new'),
    onOpenSession: (session) => {
      const slug = dashboardSessionSlug(session.id);
      const path =
        session.lifecycle === 'live'
          ? sessionLivePath(slug)
          : session.lifecycle === 'ended'
            ? sessionHistoryPath(slug)
            : sessionEditorPath(slug);
      navigate(path);
    },
  });
}

function CreateSessionRoute({ navigate }: AppRouteProps) {
  return createElement(CreateSessionPage, {
    onCancel: () => navigate('/host/dashboard'),
    onContinue: () => navigate(sessionEditorPath('team-offsite')),
  });
}

function SessionEditorRoute({ navigate, params }: AppRouteProps) {
  const slug = sessionSlug(params);

  return createElement(SessionEditorPage, {
    onAddPoll: () => navigate(sessionPollBuilderPath(slug)),
    onEditPoll: () => navigate(sessionPollBuilderPath(slug)),
    onOpenLockedPoll: () => navigate(sessionLockedPollPath(slug)),
    onStartSession: () => navigate(sessionLivePath(slug)),
  });
}

function PollBuilderRoute({ navigate, params }: AppRouteProps) {
  const slug = sessionSlug(params);

  return createElement(PollBuilderPage, {
    onCancel: () => navigate(sessionEditorPath(slug)),
    onSave: () => navigate(sessionEditorPath(slug)),
  });
}

function LockedPollRoute({ navigate, params }: AppRouteProps) {
  const slug = sessionSlug(params);

  return createElement(EditLockedPollPage, {
    onViewResults: () => navigate(sessionResultsPath(slug)),
  });
}

function LiveControlRoomRoute({ navigate, params }: AppRouteProps) {
  const slug = sessionSlug(params);

  return createElement<LiveControlRoomPageProps>(LiveControlRoomPage, {
    onSessionEnded: () => navigate(sessionHistoryPath(slug)),
  });
}

function HostResultsRoute({ search }: AppRouteProps) {
  return createElement<HostResultsPageProps>(HostResultsPage, {
    initialPollId: searchParam(search, 'pollId'),
  });
}

function JoinRoute({ params, search }: AppRouteProps) {
  return createElement<JoinByRoomCodePageProps>(JoinByRoomCodePage, {
    initialRoomCode: params.roomCode ?? searchParam(search, 'roomCode'),
  });
}

function InvitationJoinRoute({ search }: AppRouteProps) {
  return createElement<JoinByRoomCodePageProps>(JoinByRoomCodePage, {
    initialRoomCode: searchParam(search, 'roomCode'),
  });
}

function ParticipantNameRoute({ search }: AppRouteProps) {
  return createElement<ParticipantNameEntryPageProps>(
    ParticipantNameEntryPage,
    {
      roomCode: searchParam(search, 'roomCode'),
      sessionPath: '/session/team-offsite',
    },
  );
}

function ParticipantSessionRoute({ search }: AppRouteProps) {
  return createElement<ParticipantSessionPageProps>(ParticipantSessionPage, {
    initialParticipantName: searchParam(search, 'participantName'),
    roomCode: searchParam(search, 'roomCode'),
  });
}

function EndedSessionHistoryRoute() {
  return createElement(EndedSessionHistoryPage);
}

/**
 * Exact routes precede parameterized routes so the fixture's canonical paths
 * remain explicit while other session slugs can use the same page slices.
 * Hash navigation is still handled by createAppRouter's location reader.
 */
export const pageRoutes: readonly AppRoute[] = definePageRoutes([
  { component: LandingRoute, path: '/' },
  { component: HostEmailRoute, path: '/host/email' },
  { component: MagicLinkRoute, path: '/host/magic-link' },
  { component: InvalidMagicLinkRoute, path: '/host/magic-link/invalid' },
  { component: HostDashboardRoute, path: '/host/dashboard' },
  { component: CreateSessionRoute, path: '/host/sessions/new' },
  {
    component: SessionEditorRoute,
    path: '/host/sessions/team-offsite',
  },
  {
    component: PollBuilderRoute,
    path: '/host/sessions/team-offsite/polls/new',
  },
  {
    component: LockedPollRoute,
    path: '/host/sessions/team-offsite/polls/locked',
  },
  {
    component: LiveControlRoomRoute,
    path: '/host/sessions/team-offsite/live',
  },
  { component: HostResultsRoute, path: '/host/sessions/team-offsite/results' },
  {
    component: EndedSessionHistoryRoute,
    path: '/host/sessions/team-offsite/history',
  },
  { component: JoinRoute, path: '/join' },
  { component: InvitationJoinRoute, path: '/join/invitation' },
  { component: ParticipantNameRoute, path: '/join/name' },
  { component: JoinRoute, path: '/join/:roomCode' },
  { component: ParticipantSessionRoute, path: '/session/team-offsite' },

  // Parameterized canonical routes keep the page composition useful for other sessions.
  { component: SessionEditorRoute, path: '/host/sessions/:sessionSlug' },
  {
    component: PollBuilderRoute,
    path: '/host/sessions/:sessionSlug/polls/new',
  },
  {
    component: LockedPollRoute,
    path: '/host/sessions/:sessionSlug/polls/locked',
  },
  { component: LiveControlRoomRoute, path: '/host/sessions/:sessionSlug/live' },
  { component: HostResultsRoute, path: '/host/sessions/:sessionSlug/results' },
  {
    component: EndedSessionHistoryRoute,
    path: '/host/sessions/:sessionSlug/history',
  },
  { component: ParticipantSessionRoute, path: '/session/:sessionSlug' },

  // These aliases keep the existing page-local links usable during migration.
  { component: HostDashboardRoute, path: '/host-dashboard' },
  { component: SessionEditorRoute, path: '/session-editor' },
  { component: ParticipantNameRoute, path: '/participant/name' },
  { component: ParticipantSessionRoute, path: '/participant/session' },
]);
export const appRouter = createAppRouter(pageRoutes);
