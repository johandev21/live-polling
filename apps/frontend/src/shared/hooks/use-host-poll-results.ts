import { useQuery } from '@tanstack/react-query';

import { apiClient, ApiError } from '@/shared/lib/api-client';
import {
  hostResultsSchema,
  type HostResults,
  type PollSnapshot,
} from '@/shared/lib/contracts';

export const hostPollResultsQueryKey = (sessionId: string, pollId: string) =>
  ['host-poll-results', sessionId, pollId] as const;

export function useHostPollResults(
  sessionId: string | undefined,
  pollId: string | undefined,
) {
  return useQuery<HostResults, ApiError>({
    enabled: Boolean(sessionId && pollId),
    queryFn: async () => {
      const raw = await apiClient.get(
        `/sessions/${encodeURIComponent(sessionId!)}/polls/${encodeURIComponent(pollId!)}/results`,
      );
      return hostResultsSchema.parse(raw);
    },
    queryKey: hostPollResultsQueryKey(sessionId || '', pollId || ''),
  });
}

export const sessionPollResultsQueryKey = (sessionId: string) =>
  ['session-poll-results', sessionId] as const;

export function usePollResultsMap(
  sessionId: string | undefined,
  polls: readonly PollSnapshot[] | undefined,
) {
  return useQuery<Record<string, HostResults>, ApiError>({
    enabled: Boolean(sessionId && polls && polls.length > 0),
    queryFn: async () => {
      const entries = await Promise.all(
        (polls ?? []).map(async (poll) => {
          const raw = await apiClient.get(
            `/sessions/${encodeURIComponent(sessionId!)}/polls/${encodeURIComponent(poll.id)}/results`,
          );
          return [poll.id, hostResultsSchema.parse(raw)] as const;
        }),
      );
      return Object.fromEntries(entries);
    },
    queryKey: sessionPollResultsQueryKey(sessionId || ''),
  });
}
