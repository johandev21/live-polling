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
