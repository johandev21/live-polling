/* oxlint-disable typescript/unbound-method */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/lib/api-client';
import {
  useCreatePoll,
  useReorderPolls,
  useSessionDetails,
  useSessionPolls,
  useStartSession,
} from './use-host-polls';

const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';
const mockPollId1 = '123e4567-e89b-12d3-a456-426614174001';
const mockPollId2 = '123e4567-e89b-12d3-a456-426614174002';
const mockOptId1 = '123e4567-e89b-12d3-a456-426614174003';

describe('use-host-polls hooks', () => {
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

  it('fetches session details and polls', async () => {
    const mockSession = {
      id: mockSessionId,
      name: 'Test Session',
      roomCode: 'TEST01',
      status: 'draft',
      revision: 1,
      createdAt: '2026-08-07T12:00:00Z',
      updatedAt: '2026-08-07T12:00:00Z',
      startedAt: null,
      endedAt: null,
    };
    const mockPolls = [
      {
        id: mockPollId1,
        sessionId: mockSessionId,
        text: 'Fav Framework?',
        type: 'single_choice',
        position: 0,
        maxSelections: null,
        isOpen: false,
        resultsRevealed: false,
        hasResponses: false,
        options: [{ id: mockOptId1, text: 'React', position: 0 }],
        createdAt: '2026-08-07T12:00:00Z',
        updatedAt: '2026-08-07T12:00:00Z',
      },
    ];

    vi.spyOn(apiClient, 'get')
      .mockResolvedValueOnce(mockSession)
      .mockResolvedValueOnce({ polls: mockPolls });

    const { result: sessionRes } = renderHook(
      () => useSessionDetails(mockSessionId),
      { wrapper },
    );
    const { result: pollsRes } = renderHook(
      () => useSessionPolls(mockSessionId),
      { wrapper },
    );

    await waitFor(() => expect(sessionRes.current.isSuccess).toBe(true));
    await waitFor(() => expect(pollsRes.current.isSuccess).toBe(true));

    expect(sessionRes.current.data?.name).toBe('Test Session');
    expect(pollsRes.current.data).toHaveLength(1);
    expect(pollsRes.current.data?.[0].text).toBe('Fav Framework?');
  });

  it('creates a poll via POST /sessions/:id/polls', async () => {
    const createdPoll = {
      id: mockPollId2,
      sessionId: mockSessionId,
      text: 'What feature next?',
      type: 'open_ended',
      position: 1,
      maxSelections: null,
      isOpen: false,
      resultsRevealed: false,
      hasResponses: false,
      options: [],
      createdAt: '2026-08-07T12:00:00Z',
      updatedAt: '2026-08-07T12:00:00Z',
    };

    vi.spyOn(apiClient, 'post').mockResolvedValue(createdPoll);

    const { result } = renderHook(() => useCreatePoll(), { wrapper });

    const res = await result.current.mutateAsync({
      sessionId: mockSessionId,
      text: 'What feature next?',
      type: 'open_ended',
    });

    expect(apiClient.post).toHaveBeenCalledWith(`/sessions/${mockSessionId}/polls`, {
      maxSelections: undefined,
      options: undefined,
      text: 'What feature next?',
      type: 'open_ended',
    });
    expect(res.text).toBe('What feature next?');
  });

  it('starts session via POST /sessions/:id/start', async () => {
    const startedSession = {
      id: mockSessionId,
      name: 'Test Session',
      roomCode: 'TEST01',
      status: 'live',
      revision: 2,
      createdAt: '2026-08-07T12:00:00Z',
      updatedAt: '2026-08-07T12:00:00Z',
      startedAt: '2026-08-07T12:05:00Z',
      endedAt: null,
    };

    vi.spyOn(apiClient, 'post').mockResolvedValue(startedSession);

    const { result } = renderHook(() => useStartSession(), { wrapper });

    const res = await result.current.mutateAsync({ sessionId: mockSessionId });

    expect(apiClient.post).toHaveBeenCalledWith(`/sessions/${mockSessionId}/start`);
    expect(res.status).toBe('live');
  });

  it('reorders polls via POST /sessions/:id/polls/reorder', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue(undefined);

    const { result } = renderHook(() => useReorderPolls(), { wrapper });

    await result.current.mutateAsync({
      pollIds: [mockPollId2, mockPollId1],
      sessionId: mockSessionId,
    });

    expect(apiClient.post).toHaveBeenCalledWith(`/sessions/${mockSessionId}/polls/reorder`, {
      pollIds: [mockPollId2, mockPollId1],
    });
  });
});
