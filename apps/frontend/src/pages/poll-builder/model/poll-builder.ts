export type PollType = 'multiple-choice' | 'open-ended' | 'single-choice';

export type PollDraft = {
  type: PollType;
  text: string;
  options: string[];
  maximumSelections?: number;
  responseLimit?: number;
};

export const fixturePollDraft: PollDraft = {
  type: 'single-choice',
  text: 'What should we make more time for?',
  options: ['Deep work', 'Team connection', 'Learning time'],
  maximumSelections: 2,
  responseLimit: 500,
};
