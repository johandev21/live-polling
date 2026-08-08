import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient, ApiError } from '@/shared/lib/api-client';
import {
  joinResponseSchema,
  participantSnapshotSchema,
  type JoinResponse,
  type ParticipantSnapshot,
} from '@/shared/lib/contracts';
import { setParticipantToken } from '@/shared/lib/participant-storage';
import { PARTICIPANT_SESSION_QUERY_KEY } from './use-participant-session';

export type JoinSessionOptions = {
  name?: string;
  roomCode: string;
  token?: string;
};

export function useJoinSession() {
  const queryClient = useQueryClient();

  return useMutation<JoinResponse, ApiError, JoinSessionOptions>({
    mutationFn: async ({ roomCode, name, token }) => {
      const raw = await apiClient.post('/join', {
        displayName: name,
        roomCode,
        token,
      });
      return joinResponseSchema.parse(raw);
    },
    onSuccess: (data, { roomCode }) => {
      setParticipantToken(roomCode, data.token);
      setParticipantToken(data.snapshot.session.id, data.token);
      void queryClient.invalidateQueries({
        queryKey: PARTICIPANT_SESSION_QUERY_KEY,
      });
    },
  });
}

export type UpdateParticipantNameOptions = {
  name: string;
  token: string;
};

export function useUpdateParticipantName() {
  const queryClient = useQueryClient();

  return useMutation<ParticipantSnapshot, ApiError, UpdateParticipantNameOptions>({
    mutationFn: async ({ name, token }) => {
      const raw = await apiClient.patch(
        '/participant/me',
        { displayName: name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return participantSnapshotSchema.parse(raw);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PARTICIPANT_SESSION_QUERY_KEY });
    },
  });
}
