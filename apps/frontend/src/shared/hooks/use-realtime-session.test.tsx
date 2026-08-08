/* oxlint-disable typescript/unbound-method */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/lib/api-client';
import {
  useClosePoll,
  useEndSession,
  useHideResults,
  useOpenPoll,
  useRevealResults,
} from './use-realtime-session';

const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';
const mockPollId = '123e4567-e89b-12d3-a456-426614174001';

describe('use-realtime-session hooks', () => {
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

  it('opens a poll via POST /sessions/:sessionId/polls/:pollId/open', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({});

    const { result } = renderHook(() => useOpenPoll(), { wrapper });

    await result.current.mutateAsync({
      pollId: mockPollId,
      sessionId: mockSessionId,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      `/sessions/${mockSessionId}/polls/${mockPollId}/open`,
    );
  });

  it('closes a poll via POST /sessions/:sessionId/polls/:pollId/close', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({});

    const { result } = renderHook(() => useClosePoll(), { wrapper });

    await result.current.mutateAsync({
      pollId: mockPollId,
      sessionId: mockSessionId,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      `/sessions/${mockSessionId}/polls/${mockPollId}/close`,
    );
  });

  it('reveals poll results via POST /sessions/:sessionId/polls/:pollId/reveal', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({});

    const { result } = renderHook(() => useRevealResults(), { wrapper });

    await result.current.mutateAsync({
      pollId: mockPollId,
      sessionId: mockSessionId,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      `/sessions/${mockSessionId}/polls/${mockPollId}/reveal`,
    );
  });

  it('hides poll results via POST /sessions/:sessionId/polls/:pollId/hide', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({});

    const { result } = renderHook(() => useHideResults(), { wrapper });

    await result.current.mutateAsync({
      pollId: mockPollId,
      sessionId: mockSessionId,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      `/sessions/${mockSessionId}/polls/${mockPollId}/hide`,
    );
  });

  it('ends session via POST /sessions/:sessionId/end', async () => {
    const mockEndedSession = {
      id: mockSessionId,
      name: 'Offsite',
      roomCode: 'ROOM01',
      status: 'ended',
      revision: 2,
      createdAt: '2026-08-07T12:00:00Z',
      updatedAt: '2026-08-07T12:00:00Z',
      startedAt: '2026-08-07T12:00:00Z',
      endedAt: '2026-08-07T13:00:00Z',
    };

    vi.spyOn(apiClient, 'post').mockResolvedValue(mockEndedSession);

    const { result } = renderHook(() => useEndSession(), { wrapper });

    const res = await result.current.mutateAsync({ sessionId: mockSessionId });

    expect(apiClient.post).toHaveBeenCalledWith(`/sessions/${mockSessionId}/end`);
    expect(res.status).toBe('ended');
  });
});
