/* oxlint-disable typescript/unbound-method */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/lib/api-client';
import { getParticipantToken } from '@/shared/lib/participant-storage';
import {
  useJoinSession,
  useUpdateParticipantName,
} from './use-participant-auth';

const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';
const mockParticipantId = '123e4567-e89b-12d3-a456-426614174001';

const mockSnapshot = {
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
  displayName: 'Avery',
  polls: [],
  myResponse: null,
  participantCount: 0,
};

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
        displayName: 'Avery',
        createdAt: '2026-08-07T12:00:00Z',
        updatedAt: '2026-08-07T12:00:00Z',
      },
      snapshot: mockSnapshot,
    };

    vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useJoinSession(), { wrapper });

    const data = await result.current.mutateAsync({
      name: 'Avery',
      roomCode: 'ROOM01',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/join', {
      displayName: 'Avery',
      roomCode: 'ROOM01',
      token: undefined,
    });
    expect(data.token).toBe('part-token-abc');
    expect(getParticipantToken('ROOM01')).toBe('part-token-abc');
    expect(getParticipantToken(mockSessionId)).toBe('part-token-abc');
  });

  it('updates display name via PATCH /participant/me', async () => {
    const mockUpdatedParticipant = {
      id: mockParticipantId,
      sessionId: mockSessionId,
      displayName: 'Avery Renamed',
      createdAt: '2026-08-07T12:00:00Z',
      updatedAt: '2026-08-07T12:00:00Z',
    };

    vi.spyOn(apiClient, 'patch').mockResolvedValue(mockUpdatedParticipant);

    const { result } = renderHook(() => useUpdateParticipantName(), { wrapper });

    const updated = await result.current.mutateAsync({
      name: 'Avery Renamed',
      token: 'part-token-abc',
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/participant/me',
      { displayName: 'Avery Renamed' },
      { headers: { Authorization: 'Bearer part-token-abc' } },
    );
    expect(updated.displayName).toBe('Avery Renamed');
  });
});
