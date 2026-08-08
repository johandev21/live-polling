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
