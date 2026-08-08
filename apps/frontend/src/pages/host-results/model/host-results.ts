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

export function hostPollTypeLabel(type: HostResultPollType): string {
  const labels: Record<HostResultPollType, string> = {
    'multiple-choice': 'Multiple-choice',
    'open-ended': 'Open-ended',
    'single-choice': 'Single-choice',
  };

  return labels[type];
}
