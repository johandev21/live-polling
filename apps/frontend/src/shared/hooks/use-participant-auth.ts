import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, ApiError } from '@/shared/lib/api-client';
import {
  joinResponseSchema,
  participantMeResponseSchema,
  participantSnapshotSchema,
  type JoinResponse,
  type ParticipantMeResponse,
  type ParticipantSnapshot,
} from '@/shared/lib/contracts';
import { setParticipantToken } from '@/shared/lib/participant-storage';

export const PARTICIPANT_ME_QUERY_KEY = ['participant-me'] as const;

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
        name,
        roomCode,
        token,
      });
      return joinResponseSchema.parse(raw);
    },
    onSuccess: (data, { roomCode }) => {
      setParticipantToken(roomCode, data.token);
      setParticipantToken(data.session.id, data.token);
      void queryClient.invalidateQueries({ queryKey: PARTICIPANT_ME_QUERY_KEY });
    },
  });
}

export function useParticipantMe(token: string | null) {
  return useQuery<ParticipantMeResponse, ApiError>({
    enabled: Boolean(token),
    queryFn: async () => {
      const raw = await apiClient.get('/participant/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return participantMeResponseSchema.parse(raw);
    },
    queryKey: [...PARTICIPANT_ME_QUERY_KEY, token],
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
        { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return participantSnapshotSchema.parse(raw);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PARTICIPANT_ME_QUERY_KEY });
    },
  });
}
