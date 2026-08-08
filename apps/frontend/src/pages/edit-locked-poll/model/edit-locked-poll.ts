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
