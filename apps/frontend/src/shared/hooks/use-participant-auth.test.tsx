/* oxlint-disable typescript/unbound-method */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/lib/api-client';
import { getParticipantToken } from '@/shared/lib/participant-storage';
import {
  useJoinSession,
  useParticipantMe,
  useUpdateParticipantName,
} from './use-participant-auth';

const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';
const mockParticipantId = '123e4567-e89b-12d3-a456-426614174001';

describe('use-participant-auth hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.restoreAllMocks();
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  it('joins session and persists participant token', async () => {
    const mockResponse = {
      token: 'part-token-abc',
      participant: {
        id: mockParticipantId,
        sessionId: mockSessionId,
        name: 'Avery',
        createdAt: '2026-08-07T12:00:00Z',
      },
      session: {
        id: mockSessionId,
        name: 'Live Poll Session',
        roomCode: 'ROOM01',
        status: 'live',
        revision: 1,
        createdAt: '2026-08-07T12:00:00Z',
        updatedAt: '2026-08-07T12:00:00Z',
        startedAt: '2026-08-07T12:00:00Z',
        endedAt: null,
      },
    };

    vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useJoinSession(), { wrapper });

    const data = await result.current.mutateAsync({
      name: 'Avery',
      roomCode: 'ROOM01',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/join', {
      name: 'Avery',
      roomCode: 'ROOM01',
      token: undefined,
    });
    expect(data.token).toBe('part-token-abc');
    expect(getParticipantToken('ROOM01')).toBe('part-token-abc');
  });

  it('fetches current participant identity via GET /participant/me', async () => {
    const mockMeResponse = {
      participant: {
        id: mockParticipantId,
        sessionId: mockSessionId,
        name: 'Avery',
        createdAt: '2026-08-07T12:00:00Z',
      },
      session: {
        id: mockSessionId,
        name: 'Live Poll Session',
        roomCode: 'ROOM01',
        status: 'live',
        revision: 1,
        createdAt: '2026-08-07T12:00:00Z',
        updatedAt: '2026-08-07T12:00:00Z',
        startedAt: '2026-08-07T12:00:00Z',
        endedAt: null,
      },
    };

    vi.spyOn(apiClient, 'get').mockResolvedValue(mockMeResponse);

    const { result } = renderHook(
      () => useParticipantMe('part-token-abc'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith('/participant/me', {
      headers: { Authorization: 'Bearer part-token-abc' },
    });
    expect(result.current.data?.participant.name).toBe('Avery');
  });

  it('updates display name via PATCH /participant/me', async () => {
    const mockUpdatedParticipant = {
      id: mockParticipantId,
      sessionId: mockSessionId,
      name: 'Avery Renamed',
      createdAt: '2026-08-07T12:00:00Z',
    };

    vi.spyOn(apiClient, 'patch').mockResolvedValue(mockUpdatedParticipant);

    const { result } = renderHook(() => useUpdateParticipantName(), { wrapper });

    const updated = await result.current.mutateAsync({
      name: 'Avery Renamed',
      token: 'part-token-abc',
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/participant/me',
      { name: 'Avery Renamed' },
      { headers: { Authorization: 'Bearer part-token-abc' } },
    );
    expect(updated.name).toBe('Avery Renamed');
  });
});
