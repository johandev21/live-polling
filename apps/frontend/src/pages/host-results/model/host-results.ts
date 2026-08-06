export type HostResultPollType =
  | 'multiple-choice'
  | 'open-ended'
  | 'single-choice';

export type HostResultPollLifecycle = 'closed' | 'open';
export type HostResultVisibility = 'hidden' | 'revealed';

export type HostChoiceOption = {
  count: number;
  id: string;
  label: string;
};

export type HostOpenEndedResponse = {
  id: string;
  submittedAt: string;
  text: string;
};

export type HostResultPoll = {
  id: string;
  lifecycle: HostResultPollLifecycle;
  number: number;
  openEndedResponses: readonly HostOpenEndedResponse[];
  options: readonly HostChoiceOption[];
  question: string;
  totalResponses: number;
  type: HostResultPollType;
  visibility: HostResultVisibility;
};

export const hostResultsFixture: readonly HostResultPoll[] = [
  {
    id: 'focus-time',
    lifecycle: 'closed',
    number: 1,
    openEndedResponses: [],
    options: [
      { count: 74, id: 'deep-work', label: 'Deep work' },
      { count: 35, id: 'team-connection', label: 'Team connection' },
      { count: 19, id: 'learning-time', label: 'Learning time' },
    ],
    question: 'What should we make more time for?',
    totalResponses: 128,
    type: 'single-choice',
    visibility: 'hidden',
  },
  {
    id: 'learning-format',
    lifecycle: 'open',
    number: 2,
    openEndedResponses: [],
    options: [
      { count: 20, id: 'hands-on-practice', label: 'Hands-on practice' },
      { count: 13, id: 'conversation', label: 'Conversation' },
      { count: 9, id: 'reading', label: 'Reading and reflection' },
    ],
    question: 'Which format helps you learn best?',
    totalResponses: 32,
    type: 'multiple-choice',
    visibility: 'revealed',
  },
  {
    id: 'takeaway',
    lifecycle: 'closed',
    number: 3,
    openEndedResponses: [
      {
        id: 'takeaway-1',
        submittedAt: '09:42',
        text: 'I want a clearer way to protect deep work.',
      },
      {
        id: 'takeaway-2',
        submittedAt: '09:44',
        text: 'A better rhythm between focus and connection.',
      },
      {
        id: 'takeaway-3',
        submittedAt: '09:47',
        text: 'More confidence to share unfinished ideas.',
      },
      {
        id: 'takeaway-4',
        submittedAt: '09:51',
        text: 'Time to learn from the people around me.',
      },
    ],
    options: [],
    question: 'What is one thing you want to leave with?',
    totalResponses: 24,
    type: 'open-ended',
    visibility: 'hidden',
  },
  {
    id: 'support-zero',
    lifecycle: 'open',
    number: 4,
    openEndedResponses: [],
    options: [
      { count: 0, id: 'more-time', label: 'More time to practice' },
      { count: 0, id: 'clearer-examples', label: 'Clearer examples' },
      { count: 0, id: 'peer-feedback', label: 'Peer feedback' },
    ],
    question: 'What support would make the next step easier?',
    totalResponses: 0,
    type: 'single-choice',
    visibility: 'hidden',
  },
];

export function hostPollTypeLabel(type: HostResultPollType): string {
  const labels: Record<HostResultPollType, string> = {
    'multiple-choice': 'Multiple-choice',
    'open-ended': 'Open-ended',
    'single-choice': 'Single-choice',
  };

  return labels[type];
}
