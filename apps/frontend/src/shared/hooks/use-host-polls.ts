import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, ApiError } from '@/shared/lib/api-client';
import {
  pollListResponseSchema,
  pollSnapshotSchema,
  sessionSnapshotSchema,
  type PollSnapshot,
  type SessionSnapshot,
} from '@/shared/lib/contracts';
import { HOST_SESSIONS_QUERY_KEY } from './use-host-sessions';

export const sessionDetailsQueryKey = (sessionId: string) =>
  ['session-details', sessionId] as const;

export const sessionPollsQueryKey = (sessionId: string) =>
  ['session-polls', sessionId] as const;

export function useSessionDetails(sessionId: string | undefined) {
  return useQuery<SessionSnapshot, ApiError>({
    enabled: Boolean(sessionId),
    queryFn: async () => {
      const raw = await apiClient.get(`/sessions/${encodeURIComponent(sessionId!)}`);
      return sessionSnapshotSchema.parse(raw);
    },
    queryKey: sessionDetailsQueryKey(sessionId || ''),
  });
}

export function useSessionPolls(sessionId: string | undefined) {
  return useQuery<PollSnapshot[], ApiError>({
    enabled: Boolean(sessionId),
    queryFn: async () => {
      const raw = await apiClient.get(
        `/sessions/${encodeURIComponent(sessionId!)}/polls`,
      );
      const parsed = pollListResponseSchema.safeParse(raw);
      if (parsed.success) {
        return parsed.data.polls;
      }
      if (Array.isArray(raw)) {
        return raw as PollSnapshot[];
      }
      return [];
    },
    queryKey: sessionPollsQueryKey(sessionId || ''),
  });
}

export type StartSessionOptions = {
  sessionId: string;
};

export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation<SessionSnapshot, ApiError, StartSessionOptions>({
    mutationFn: async ({ sessionId }) => {
      const raw = await apiClient.post(
        `/sessions/${encodeURIComponent(sessionId)}/start`,
      );
      return sessionSnapshotSchema.parse(raw);
    },
    onSuccess: (_, { sessionId }) => {
      void queryClient.invalidateQueries({ queryKey: HOST_SESSIONS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: sessionDetailsQueryKey(sessionId),
      });
      void queryClient.invalidateQueries({
        queryKey: sessionPollsQueryKey(sessionId),
      });
    },
  });
}

export type CreatePollOptions = {
  maxSelections?: number | null;
  options?: string[];
  sessionId: string;
  text: string;
  type: 'single_choice' | 'multiple_choice' | 'open_ended';
};

export function useCreatePoll() {
  const queryClient = useQueryClient();

  return useMutation<PollSnapshot, ApiError, CreatePollOptions>({
    mutationFn: async ({ sessionId, type, text, options, maxSelections }) => {
      const raw = await apiClient.post(
        `/sessions/${encodeURIComponent(sessionId)}/polls`,
        {
          maxSelections,
          options,
          text,
          type,
        },
      );
      return pollSnapshotSchema.parse(raw);
    },
    onSuccess: (_, { sessionId }) => {
      void queryClient.invalidateQueries({
        queryKey: sessionPollsQueryKey(sessionId),
      });
      void queryClient.invalidateQueries({
        queryKey: sessionDetailsQueryKey(sessionId),
      });
    },
  });
}

export type UpdatePollOptions = {
  maxSelections?: number | null;
  options?: string[];
  pollId: string;
  sessionId: string;
  text: string;
};

export function useUpdatePoll() {
  const queryClient = useQueryClient();

  return useMutation<PollSnapshot, ApiError, UpdatePollOptions>({
    mutationFn: async ({ sessionId, pollId, text, options, maxSelections }) => {
      const raw = await apiClient.patch(
        `/sessions/${encodeURIComponent(sessionId)}/polls/${encodeURIComponent(pollId)}`,
        {
          maxSelections,
          options,
          text,
        },
      );
      return pollSnapshotSchema.parse(raw);
    },
    onSuccess: (_, { sessionId }) => {
      void queryClient.invalidateQueries({
        queryKey: sessionPollsQueryKey(sessionId),
      });
    },
  });
}

export type DeletePollOptions = {
  pollId: string;
  sessionId: string;
};

export function useDeletePoll() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, DeletePollOptions>({
    mutationFn: async ({ sessionId, pollId }) => {
      await apiClient.delete(
        `/sessions/${encodeURIComponent(sessionId)}/polls/${encodeURIComponent(pollId)}`,
      );
    },
    onSuccess: (_, { sessionId }) => {
      void queryClient.invalidateQueries({
        queryKey: sessionPollsQueryKey(sessionId),
      });
      void queryClient.invalidateQueries({
        queryKey: sessionDetailsQueryKey(sessionId),
      });
    },
  });
}

export type ReorderPollsOptions = {
  pollIds: string[];
  sessionId: string;
};

export function useReorderPolls() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, ReorderPollsOptions>({
    mutationFn: async ({ sessionId, pollIds }) => {
      await apiClient.post(
        `/sessions/${encodeURIComponent(sessionId)}/polls/reorder`,
        { pollIds },
      );
    },
    onSuccess: (_, { sessionId }) => {
      void queryClient.invalidateQueries({
        queryKey: sessionPollsQueryKey(sessionId),
      });
    },
  });
}
