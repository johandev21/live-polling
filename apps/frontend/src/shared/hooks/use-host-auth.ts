import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { apiClient, ApiError } from '@/shared/lib/api-client';
import {
  authSessionSchema,
  ERROR_CODES,
  type AuthSessionResponse,
} from '@/shared/lib/contracts';

import { HOST_SESSIONS_QUERY_KEY } from './use-host-sessions';

export const HOST_SESSION_QUERY_KEY = ['host-session'] as const;

export function useHostSession() {
  return useQuery<AuthSessionResponse, ApiError>({
    queryFn: async () => {
      try {
        const raw = await apiClient.get('/api/auth/session');
        const parsed = authSessionSchema.safeParse(raw);
        if (parsed.success) {
          return parsed.data;
        }
        return { session: null, user: null };
      } catch (err) {
        if (err instanceof ApiError && err.code === ERROR_CODES.UNAUTHORIZED) {
          return { session: null, user: null };
        }
        throw err;
      }
    },
    queryKey: HOST_SESSION_QUERY_KEY,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useHostSessionGuard(): boolean {
  const navigate = useNavigate();
  const { data, isLoading } = useHostSession();
  const isAuthenticated = Boolean(data?.user);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      void navigate({ replace: true, to: '/host/dashboard' });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return isLoading || isAuthenticated;
}

export type SendMagicLinkOptions = {
  email: string;
};

export function useSendMagicLink() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, SendMagicLinkOptions>({
    mutationFn: async ({ email }) => {
      await apiClient.post('/api/auth/sign-in/magic-link', { email });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HOST_SESSION_QUERY_KEY });
    },
  });
}

export function useSignOutHost() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      await apiClient.post('/api/auth/sign-out');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HOST_SESSION_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: HOST_SESSIONS_QUERY_KEY });
    },
  });
}
