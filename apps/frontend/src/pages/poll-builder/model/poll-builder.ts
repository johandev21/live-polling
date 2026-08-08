export type PollType = 'multiple-choice' | 'open-ended' | 'single-choice';

export type PollDraft = {
  type: PollType;
  text: string;
  options: string[];
  maximumSelections?: number;
  responseLimit?: number;
};
