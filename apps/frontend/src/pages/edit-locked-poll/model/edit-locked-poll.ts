export type LockedPollType = 'multiple-choice' | 'open-ended' | 'single-choice';

export type LockedPollResult = Readonly<{
  count: number;
  id: string;
  label: string;
  percentage: number;
}>;

export type LockedPollOption = Readonly<{
  id: string;
  label: string;
}>;

export type LockedPoll = Readonly<{
  id: string;
  options: readonly LockedPollOption[];
  participantResultsVisible: boolean;
  responses: number;
  results: readonly LockedPollResult[];
  status: 'closed' | 'open';
  text: string;
  type: LockedPollType;
}>;

export const fixtureLockedPoll: LockedPoll = {
  id: 'poll-time',
  options: [
    { id: 'option-deep-work', label: 'Deep work' },
    { id: 'option-team-connection', label: 'Team connection' },
    { id: 'option-learning-time', label: 'Learning time' },
  ],
  participantResultsVisible: false,
  responses: 32,
  results: [
    { count: 18, id: 'result-deep-work', label: 'Deep work', percentage: 56 },
    {
      count: 9,
      id: 'result-team-connection',
      label: 'Team connection',
      percentage: 28,
    },
    {
      count: 5,
      id: 'result-learning-time',
      label: 'Learning time',
      percentage: 16,
    },
  ],
  status: 'closed',
  text: 'What should we make more time for?',
  type: 'single-choice',
};
