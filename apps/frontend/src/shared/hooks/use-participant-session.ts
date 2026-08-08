import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, ApiError } from '@/shared/lib/api-client';
import {
  participantResponseSchema,
  participantResultsSchema,
  participantSessionResponseSchema,
  type ParticipantResponseSnapshot,
  type ParticipantResults,
  type ParticipantSessionResponse,
} from '@/shared/lib/contracts';

export const PARTICIPANT_SESSION_QUERY_KEY = ['participant-session-snapshot'] as const;

export const PARTICIPANT_POLL_RESULTS_QUERY_KEY = ['participant-poll-results'] as const;

export function useParticipantSessionSnapshot(token: string | null) {
  return useQuery<ParticipantSessionResponse, ApiError>({
    enabled: Boolean(token),
    queryFn: async () => {
      const raw = await apiClient.get('/participant/session', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return participantSessionResponseSchema.parse(raw);
    },
    queryKey: [...PARTICIPANT_SESSION_QUERY_KEY, token],
  });
}

export function useParticipantPollResults(
  token: string | null,
  pollId: string | undefined,
  enabled = true,
) {
  return useQuery<ParticipantResults, ApiError>({
    enabled: Boolean(token && pollId && enabled),
    queryFn: async () => {
      const raw = await apiClient.get(
        `/participant/polls/${encodeURIComponent(pollId!)}/results`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return participantResultsSchema.parse(raw);
    },
    queryKey: [...PARTICIPANT_POLL_RESULTS_QUERY_KEY, token, pollId],
  });
}

export type SubmitResponseOptions = {
  idempotencyKey?: string;
  optionIds?: string[];
  pollId: string;
  text?: string;
  token: string;
};

export function useSubmitResponse() {
  const queryClient = useQueryClient();

  return useMutation<ParticipantResponseSnapshot, ApiError, SubmitResponseOptions>({
    mutationFn: async ({ pollId, optionIds, text, idempotencyKey, token }) => {
      const key = idempotencyKey || crypto.randomUUID();
      const raw = await apiClient.put(
        `/participant/polls/${encodeURIComponent(pollId)}/response`,
        {
          idempotencyKey: key,
          optionIds,
          text,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      // Backend returns { response, revision } or the response directly
      const responseData = (raw as { response?: unknown })?.response || raw;
      return participantResponseSchema.parse(responseData);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PARTICIPANT_SESSION_QUERY_KEY });
    },
  });
}
