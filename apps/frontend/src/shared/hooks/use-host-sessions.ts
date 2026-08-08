import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, ApiError } from '@/shared/lib/api-client';
import {
  sessionListResponseSchema,
  sessionSnapshotSchema,
  type SessionSnapshot,
} from '@/shared/lib/contracts';

export const HOST_SESSIONS_QUERY_KEY = ['host-sessions'] as const;

export function useHostSessions() {
  return useQuery<SessionSnapshot[], ApiError>({
    queryFn: async () => {
      const raw = await apiClient.get('/sessions');
      const parsed = sessionListResponseSchema.safeParse(raw);
      if (parsed.success) {
        return parsed.data.sessions;
      }
      // If parsing fails due to empty array or direct data structure
      if (Array.isArray(raw)) {
        return raw as SessionSnapshot[];
      }
      return [];
    },
    queryKey: HOST_SESSIONS_QUERY_KEY,
  });
}

export type CreateSessionOptions = {
  name: string;
};

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation<SessionSnapshot, ApiError, CreateSessionOptions>({
    mutationFn: async ({ name }) => {
      const raw = await apiClient.post('/sessions', { name });
      const parsed = sessionSnapshotSchema.safeParse(raw);
      if (parsed.success) {
        return parsed.data;
      }
      return raw as SessionSnapshot;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HOST_SESSIONS_QUERY_KEY });
    },
  });
}

export type DeleteSessionOptions = {
  id: string;
  confirm?: boolean;
};

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, DeleteSessionOptions>({
    mutationFn: async ({ id, confirm = true }) => {
      await apiClient.delete(`/sessions/${encodeURIComponent(id)}`, {
        confirm,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HOST_SESSIONS_QUERY_KEY });
    },
  });
}
