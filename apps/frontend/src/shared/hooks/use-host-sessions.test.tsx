/* oxlint-disable typescript/unbound-method */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/lib/api-client';
import {
  useCreateSession,
  useDeleteSession,
  useHostSessions,
} from './use-host-sessions';

describe('useHostSessions hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
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

  it('fetches host sessions from GET /sessions', async () => {
    const mockSessions = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Weekly Sync',
        roomCode: 'SYNC12',
        status: 'draft',
        revision: 1,
        createdAt: '2026-08-07T12:00:00Z',
        updatedAt: '2026-08-07T12:00:00Z',
        startedAt: null,
        endedAt: null,
      },
    ];

    vi.spyOn(apiClient, 'get').mockResolvedValue({ sessions: mockSessions });

    const { result } = renderHook(() => useHostSessions(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith('/sessions');
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].name).toBe('Weekly Sync');
  });

  it('creates session via POST /sessions', async () => {
    const createdSession = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'New Offsite',
      roomCode: 'OFF123',
      status: 'draft',
      revision: 1,
      createdAt: '2026-08-07T12:00:00Z',
      updatedAt: '2026-08-07T12:00:00Z',
      startedAt: null,
      endedAt: null,
    };

    vi.spyOn(apiClient, 'post').mockResolvedValue(createdSession);

    const { result } = renderHook(() => useCreateSession(), { wrapper });

    const session = await result.current.mutateAsync({ name: 'New Offsite' });

    expect(apiClient.post).toHaveBeenCalledWith('/sessions', {
      name: 'New Offsite',
    });
    expect(session.name).toBe('New Offsite');
  });

  it('deletes session via DELETE /sessions/:id', async () => {
    vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteSession(), { wrapper });

    await result.current.mutateAsync({ id: '123e4567-e89b-12d3-a456-426614174001', confirm: true });

    expect(apiClient.delete).toHaveBeenCalledWith(
      '/sessions/123e4567-e89b-12d3-a456-426614174001',
      { confirm: true },
    );
  });
});
