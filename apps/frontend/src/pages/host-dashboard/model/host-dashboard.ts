export type SessionLifecycle = 'draft' | 'ended' | 'live';

export type SessionFilter = 'all' | SessionLifecycle;

export type DashboardSession = Readonly<{
  id: string;
  lifecycle: SessionLifecycle;
  name: string;
  pollCount: number;
  participantCount: number;
  roomCode: string;
  updatedLabel: string;
}>;

export const fixtureSessions: readonly DashboardSession[] = [
  {
    id: 'session-team-offsite',
    lifecycle: 'draft',
    name: 'Team offsite - June 2025',
    pollCount: 3,
    participantCount: 0,
    roomCode: 'TEAM25',
    updatedLabel: 'Edited 12 minutes ago',
  },
  {
    id: 'session-quarterly-retro',
    lifecycle: 'live',
    name: 'Quarterly retrospective',
    pollCount: 6,
    participantCount: 42,
    roomCode: 'RETRO42',
    updatedLabel: 'Active now',
  },
  {
    id: 'session-product-research',
    lifecycle: 'ended',
    name: 'Product research roundtable',
    pollCount: 4,
    participantCount: 28,
    roomCode: 'RESEARCH',
    updatedLabel: 'Ended yesterday',
  },
];
