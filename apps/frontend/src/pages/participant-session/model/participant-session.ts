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

export function responseDraftForPoll(poll: ParticipantPoll): string | string[] {
  if (poll.type === 'multiple-choice') {
    return [];
  }

  return '';
}

export function participantResponseLabel(
  poll: ParticipantPoll,
  response: ParticipantResponse,
) {
  if (response === null) {
    return 'Response confirmed by the server';
  }

  const labels = (Array.isArray(response) ? response : [response])
    .map(
      (optionId) =>
        poll.options.find((option) => option.id === optionId)?.label,
    )
    .filter((label): label is string => Boolean(label));

  if (labels.length > 0) {
    return labels.join(', ');
  }

  if (poll.type === 'open-ended') {
    return typeof response === 'string' ? response : '';
  }

  return 'Response confirmed by the server';
}
