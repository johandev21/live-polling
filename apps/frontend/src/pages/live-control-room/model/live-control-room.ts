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

export function pollTypeLabel(type: LivePollType): string {
  const labels: Record<LivePollType, string> = {
    'multiple-choice': 'Multiple-choice poll',
    'open-ended': 'Open-ended poll',
    'single-choice': 'Single-choice poll',
  };

  return labels[type];
}
