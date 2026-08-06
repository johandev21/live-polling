import type { ConnectionState } from '@/shared/ui';

export type ParticipantPollType =
  | 'multiple-choice'
  | 'open-ended'
  | 'single-choice';
export type ParticipantPollLifecycle = 'closed' | 'none' | 'open';
export type ParticipantResultVisibility = 'hidden' | 'revealed';
export type ParticipantResponseState =
  | 'accepted'
  | 'none'
  | 'pending'
  | 'rejected';
export type ParticipantSessionLifecycle = 'ended' | 'live';

export type ParticipantPollOption = Readonly<{
  id: string;
  label: string;
}>;

export type ParticipantPollResult = Readonly<{
  count: number;
  id: string;
  label: string;
  percentage: number;
}>;

export type ParticipantPoll = Readonly<{
  id: string;
  maxSelections?: number;
  options: readonly ParticipantPollOption[];
  prompt: string;
  results: readonly ParticipantPollResult[];
  responseLimit?: number;
  totalResponses: number;
  type: ParticipantPollType;
}>;

export type ParticipantResponse = string | readonly string[] | null;

export type ParticipantSessionSnapshot = Readonly<{
  connectionState: ConnectionState;
  participantCount: number;
  poll: ParticipantPoll;
  pollLifecycle: ParticipantPollLifecycle;
  response: ParticipantResponse;
  responseState: ParticipantResponseState;
  resultVisibility: ParticipantResultVisibility;
  sessionLifecycle: ParticipantSessionLifecycle;
  sessionName: string;
}>;

export const participantPollFixtures: Readonly<
  Record<ParticipantPollType, ParticipantPoll>
> = {
  'multiple-choice': {
    id: 'best-work-parts',
    maxSelections: 2,
    options: [
      { id: 'deep-work', label: 'Deep work' },
      { id: 'team-connection', label: 'Team connection' },
      { id: 'learning-time', label: 'Learning time' },
      { id: 'planning-time', label: 'Planning time' },
    ],
    prompt: 'Which parts of the week help you do your best work?',
    results: [
      { count: 74, id: 'deep-work', label: 'Deep work', percentage: 58 },
      {
        count: 35,
        id: 'team-connection',
        label: 'Team connection',
        percentage: 27,
      },
      {
        count: 19,
        id: 'learning-time',
        label: 'Learning time',
        percentage: 15,
      },
    ],
    totalResponses: 128,
    type: 'multiple-choice',
  },
  'open-ended': {
    id: 'takeaway',
    options: [],
    prompt: 'What is one thing you want to leave with?',
    results: [],
    responseLimit: 500,
    totalResponses: 47,
    type: 'open-ended',
  },
  'single-choice': {
    id: 'make-more-time',
    options: [
      { id: 'deep-work', label: 'Deep work' },
      { id: 'team-connection', label: 'Team connection' },
      { id: 'learning-time', label: 'Learning time' },
    ],
    prompt: 'What should we make more time for?',
    results: [
      { count: 74, id: 'deep-work', label: 'Deep work', percentage: 58 },
      {
        count: 35,
        id: 'team-connection',
        label: 'Team connection',
        percentage: 27,
      },
      {
        count: 19,
        id: 'learning-time',
        label: 'Learning time',
        percentage: 15,
      },
    ],
    totalResponses: 128,
    type: 'single-choice',
  },
};

export const participantFixtureSnapshot: ParticipantSessionSnapshot = {
  connectionState: 'connected',
  participantCount: 128,
  poll: participantPollFixtures['single-choice'],
  pollLifecycle: 'open',
  response: null,
  responseState: 'none',
  resultVisibility: 'hidden',
  sessionLifecycle: 'live',
  sessionName: 'Team offsite · June 2025',
};

export function responseDraftForPoll(poll: ParticipantPoll): string | string[] {
  if (poll.type === 'multiple-choice') {
    return [];
  }

  return '';
}

export function demoResponseForPoll(poll: ParticipantPoll): string | string[] {
  if (poll.type === 'multiple-choice') {
    return ['deep-work', 'team-connection'];
  }

  if (poll.type === 'open-ended') {
    return 'A clear next step I can bring back to the team.';
  }

  return 'team-connection';
}

export function participantResponseLabel(
  poll: ParticipantPoll,
  response: ParticipantResponse,
) {
  if (response === null) {
    return 'Response confirmed by the server';
  }

  if (poll.type !== 'multiple-choice') {
    return typeof response === 'string' ? response : response.join(', ');
  }

  if (!Array.isArray(response)) {
    return response;
  }

  const labels = response
    .map(
      (optionId) =>
        poll.options.find((option) => option.id === optionId)?.label,
    )
    .filter((label): label is string => Boolean(label));

  return labels.length > 0
    ? labels.join(', ')
    : 'Response confirmed by the server';
}
