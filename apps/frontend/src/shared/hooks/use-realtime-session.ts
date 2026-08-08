import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient, ApiError } from '@/shared/lib/api-client';
import { sessionSnapshotSchema, type SessionSnapshot } from '@/shared/lib/contracts';
import {
  disconnectSocket,
  getSocketInstance,
  type SocketRole,
} from '@/shared/lib/socket-client';
import { HOST_SESSIONS_QUERY_KEY } from './use-host-sessions';
import {
  sessionDetailsQueryKey,
  sessionPollsQueryKey,
} from './use-host-polls';
import { sessionPollResultsQueryKey } from './use-host-poll-results';
import { PARTICIPANT_SESSION_QUERY_KEY, PARTICIPANT_POLL_RESULTS_QUERY_KEY } from './use-participant-session';

export type PollActionOptions = {
  pollId: string;
  sessionId: string;
};

export function useOpenPoll() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, PollActionOptions>({
    mutationFn: async ({ sessionId, pollId }) => {
      await apiClient.post(
        `/sessions/${encodeURIComponent(sessionId)}/polls/${encodeURIComponent(pollId)}/open`,
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

export function useClosePoll() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, PollActionOptions>({
    mutationFn: async ({ sessionId, pollId }) => {
      await apiClient.post(
        `/sessions/${encodeURIComponent(sessionId)}/polls/${encodeURIComponent(pollId)}/close`,
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

export function useRevealResults() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, PollActionOptions>({
    mutationFn: async ({ sessionId, pollId }) => {
      await apiClient.post(
        `/sessions/${encodeURIComponent(sessionId)}/polls/${encodeURIComponent(pollId)}/reveal`,
      );
    },
    onSuccess: (_, { sessionId }) => {
      void queryClient.invalidateQueries({
        queryKey: sessionPollsQueryKey(sessionId),
      });
    },
  });
}

export function useHideResults() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, PollActionOptions>({
    mutationFn: async ({ sessionId, pollId }) => {
      await apiClient.post(
        `/sessions/${encodeURIComponent(sessionId)}/polls/${encodeURIComponent(pollId)}/hide`,
      );
    },
    onSuccess: (_, { sessionId }) => {
      void queryClient.invalidateQueries({
        queryKey: sessionPollsQueryKey(sessionId),
      });
    },
  });
}

export type EndSessionOptions = {
  sessionId: string;
};

export function useEndSession() {
  const queryClient = useQueryClient();

  return useMutation<SessionSnapshot, ApiError, EndSessionOptions>({
    mutationFn: async ({ sessionId }) => {
      const raw = await apiClient.post(
        `/sessions/${encodeURIComponent(sessionId)}/end`,
      );
      return sessionSnapshotSchema.parse(raw);
    },
    onSuccess: (_, { sessionId }) => {
      void queryClient.invalidateQueries({ queryKey: HOST_SESSIONS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: sessionDetailsQueryKey(sessionId),
      });
    },
  });
}

export type RealtimeSocketOptions = {
  enabled?: boolean;
  role: SocketRole;
  sessionId: string;
  token?: string | null;
};

export function useRealtimeSocket({
  enabled = true,
  role,
  sessionId,
  token,
}: RealtimeSocketOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !sessionId) return;

    const socket = getSocketInstance({
      role,
      sessionId,
      token,
    });

    if (!socket) return;

    function handleEvent() {
      void queryClient.invalidateQueries({ queryKey: HOST_SESSIONS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: sessionDetailsQueryKey(sessionId),
      });
      void queryClient.invalidateQueries({
        queryKey: sessionPollsQueryKey(sessionId),
      });
      void queryClient.invalidateQueries({
        queryKey: sessionPollResultsQueryKey(sessionId),
      });
      void queryClient.invalidateQueries({
        queryKey: PARTICIPANT_SESSION_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: PARTICIPANT_POLL_RESULTS_QUERY_KEY,
      });
    }

    const events = [
      'session.updated',
      'session.ended',
      'session.deleted',
      'poll.created',
      'poll.updated',
      'poll.deleted',
      'poll.reordered',
      'poll.opened',
      'poll.closed',
      'results.revealed',
      'results.hidden',
      'response.accepted',
      'presence.updated',
      'resync.requested',
    ] as const;

    for (const event of events) {
      socket.on(event, handleEvent);
    }

    // Heartbeat for participants
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    if (role === 'participant') {
      heartbeatInterval = setInterval(() => {
        socket.emit('presence.heartbeat', { sessionId });
      }, 15000);
    }

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      for (const event of events) {
        socket.off(event, handleEvent);
      }
      disconnectSocket();
    };
  }, [enabled, role, sessionId, token, queryClient]);
}
