export type EndedHistoryPollType =
  | 'multiple-choice'
  | 'open-ended'
  | 'single-choice';

export type EndedHistoryResultVisibility = 'hidden' | 'revealed';

export type EndedHistoryChoiceResult = Readonly<{
  count: number;
  id: string;
  label: string;
  percentage: number;
}>;

export type EndedHistoryResponse = Readonly<{
  id: string;
  submittedAt: string;
  text: string;
}>;

export type EndedHistoryPoll = Readonly<{
  choiceResults: readonly EndedHistoryChoiceResult[];
  id: string;
  number: number;
  openEndedResponses: readonly EndedHistoryResponse[];
  hostCanViewResults: boolean;
  participantResultVisibility: EndedHistoryResultVisibility;
  prompt: string;
  totalResponses: number;
  type: EndedHistoryPollType;
}>;

export type EndedSessionHistoryData = Readonly<{
  endedAt: string;
  polls: readonly EndedHistoryPoll[];
  sessionName: string;
  totalResponses: number;
}>;

export const endedSessionHistoryFixture: EndedSessionHistoryData = {
  endedAt: 'June 14, 2025',
  polls: [
    {
      choiceResults: [
        {
          count: 74,
          id: 'result-deep-work',
          label: 'Deep work',
          percentage: 58,
        },
        {
          count: 35,
          id: 'result-team-connection',
          label: 'Team connection',
          percentage: 27,
        },
        {
          count: 19,
          id: 'result-learning-time',
          label: 'Learning time',
          percentage: 15,
        },
      ],
      id: 'poll-focus-time',
      number: 1,
      openEndedResponses: [],
      hostCanViewResults: true,
      participantResultVisibility: 'hidden',
      prompt: 'What should we make more time for?',
      totalResponses: 128,
      type: 'single-choice',
    },
    {
      choiceResults: [
        {
          count: 20,
          id: 'result-hands-on-practice',
          label: 'Hands-on practice',
          percentage: 62,
        },
        {
          count: 13,
          id: 'result-conversation',
          label: 'Conversation',
          percentage: 41,
        },
      ],
      id: 'poll-learning-format',
      number: 2,
      openEndedResponses: [],
      hostCanViewResults: true,
      participantResultVisibility: 'revealed',
      prompt: 'Which format helps you learn best?',
      totalResponses: 32,
      type: 'multiple-choice',
    },
    {
      choiceResults: [],
      id: 'poll-takeaway',
      number: 3,
      openEndedResponses: [
        {
          id: 'response-deep-work',
          submittedAt: '09:42',
          text: 'A clearer way to protect deep work.',
        },
        {
          id: 'response-unfinished-ideas',
          submittedAt: '09:47',
          text: 'More confidence to share unfinished ideas.',
        },
      ],
      hostCanViewResults: true,
      participantResultVisibility: 'hidden',
      prompt: 'What is one thing you want to leave with?',
      totalResponses: 24,
      type: 'open-ended',
    },
  ],
  sessionName: 'Team offsite · June 2025',
  totalResponses: 184,
};
