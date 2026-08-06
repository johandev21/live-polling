import type { ConnectionState } from '@/shared/ui';

export type LivePollType = 'multiple-choice' | 'open-ended' | 'single-choice';

export type PollLifecycle = 'closed' | 'open';
export type ResultVisibility = 'hidden' | 'revealed';

export type LivePollOption = {
  count: number;
  id: string;
  label: string;
};

export type LivePollResponse = {
  id: string;
  submittedAt: string;
  text: string;
};

export type LivePoll = {
  id: string;
  lifecycle: PollLifecycle;
  options: readonly LivePollOption[];
  position: number;
  question: string;
  responses: readonly LivePollResponse[];
  resultVisibility: ResultVisibility;
  totalResponses: number;
  type: LivePollType;
};

export type ParticipantPresence = {
  id: string;
  name: string;
  status: 'away' | 'offline' | 'online';
  statusLabel: string;
};

export type LiveControlRoomFixture = {
  connectionState: ConnectionState;
  invitationLink: string;
  participantCount: number;
  participants: readonly ParticipantPresence[];
  polls: readonly LivePoll[];
  roomCode: string;
  sessionName: string;
  sessionSubtitle: string;
};

export const liveControlRoomFixture: LiveControlRoomFixture = {
  connectionState: 'synchronized',
  invitationLink: 'https://pulse.app/join/7K4P9D',
  participantCount: 128,
  participants: [
    {
      id: 'avery-morgan',
      name: 'Avery Morgan',
      status: 'online',
      statusLabel: 'Online · Now',
    },
    {
      id: 'jordan-lee',
      name: 'Jordan Lee',
      status: 'online',
      statusLabel: 'Online · Now',
    },
    {
      id: 'sam-rivera',
      name: 'Sam Rivera',
      status: 'away',
      statusLabel: 'Away · 2 min ago',
    },
    {
      id: 'taylor-kim',
      name: 'Taylor Kim',
      status: 'online',
      statusLabel: 'Online · Now',
    },
    {
      id: 'morgan-chen',
      name: 'Morgan Chen',
      status: 'online',
      statusLabel: 'Online · Now',
    },
    {
      id: 'riley-patel',
      name: 'Riley Patel',
      status: 'offline',
      statusLabel: 'Offline · 5 min ago',
    },
  ],
  polls: [
    {
      id: 'poll-focus-time',
      lifecycle: 'open',
      options: [
        { count: 74, id: 'deep-work', label: 'Deep work' },
        { count: 35, id: 'team-connection', label: 'Team connection' },
        { count: 19, id: 'learning-time', label: 'Learning time' },
      ],
      position: 1,
      question: 'What should we make more time for?',
      responses: [],
      resultVisibility: 'hidden',
      totalResponses: 128,
      type: 'single-choice',
    },
    {
      id: 'poll-learning-format',
      lifecycle: 'closed',
      options: [
        { count: 20, id: 'hands-on-practice', label: 'Hands-on practice' },
        { count: 13, id: 'conversation', label: 'Conversation' },
        { count: 9, id: 'reading', label: 'Reading and reflection' },
      ],
      position: 2,
      question: 'Which format helps you learn best?',
      responses: [],
      resultVisibility: 'revealed',
      totalResponses: 32,
      type: 'multiple-choice',
    },
    {
      id: 'poll-takeaway',
      lifecycle: 'closed',
      options: [],
      position: 3,
      question: 'What is one thing you want to leave with?',
      responses: [
        {
          id: 'takeaway-1',
          submittedAt: '09:42',
          text: 'A clearer way to protect deep work.',
        },
        {
          id: 'takeaway-2',
          submittedAt: '09:44',
          text: 'More confidence to share unfinished ideas.',
        },
      ],
      resultVisibility: 'hidden',
      totalResponses: 24,
      type: 'open-ended',
    },
  ],
  roomCode: '7K4P9D',
  sessionName: 'Team offsite · June 2025',
  sessionSubtitle: 'Keep the room moving one clear response at a time.',
};

export function pollTypeLabel(type: LivePollType): string {
  const labels: Record<LivePollType, string> = {
    'multiple-choice': 'Multiple-choice poll',
    'open-ended': 'Open-ended poll',
    'single-choice': 'Single-choice poll',
  };

  return labels[type];
}
