/* oxlint-disable typescript/unbound-method */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/lib/api-client';
import {
  useParticipantSessionSnapshot,
  useSubmitResponse,
} from './use-participant-session';

const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';
const mockPollId = '123e4567-e89b-12d3-a456-426614174001';
const mockParticipantId = '123e4567-e89b-12d3-a456-426614174002';
const mockOptionId = '123e4567-e89b-12d3-a456-426614174003';
const mockResponseId = '123e4567-e89b-12d3-a456-426614174004';

describe('use-participant-session hooks', () => {
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

  it('fetches participant session snapshot', async () => {
    const mockSnapshot = {
      session: {
        id: mockSessionId,
        name: 'Live Session',
        roomCode: 'ROOM01',
        status: 'live',
        revision: 1,
        createdAt: '2026-08-07T12:00:00Z',
        updatedAt: '2026-08-07T12:00:00Z',
        startedAt: '2026-08-07T12:00:00Z',
        endedAt: null,
      },
      displayName: 'Avery',
      polls: [
        {
          id: mockPollId,
          text: 'What feature to build next?',
          type: 'single_choice',
          position: 0,
          maxSelections: null,
          isOpen: true,
          resultsRevealed: false,
          options: [{ id: mockOptionId, text: 'Feature A', position: 0 }],
        },
      ],
      myResponse: null,
      participantCount: 3,
    };

    vi.spyOn(apiClient, 'get').mockResolvedValue(mockSnapshot);

    const { result } = renderHook(
      () => useParticipantSessionSnapshot('token-123'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith('/participant/session', {
      headers: { Authorization: 'Bearer token-123' },
    });
    expect(result.current.data?.session.name).toBe('Live Session');
    expect(result.current.data?.polls[0]?.text).toBe(
      'What feature to build next?',
    );
    expect(result.current.data?.polls[0]?.isOpen).toBe(true);
    expect(result.current.data?.participantCount).toBe(3);
  });

  it('submits response with idempotency key via PUT /participant/polls/:id/response', async () => {
    const mockSubmittedResponse = {
      id: mockResponseId,
      pollId: mockPollId,
      participantId: mockParticipantId,
      optionIds: [mockOptionId],
      text: null,
      createdAt: '2026-08-07T12:00:00Z',
      updatedAt: '2026-08-07T12:00:00Z',
    };

    vi.spyOn(apiClient, 'put').mockResolvedValue({
      response: mockSubmittedResponse,
      revision: 1,
    });

    const { result } = renderHook(() => useSubmitResponse(), { wrapper });

    const res = await result.current.mutateAsync({
      idempotencyKey: 'idempotency-key-abc',
      optionIds: [mockOptionId],
      pollId: mockPollId,
      token: 'token-123',
    });

    expect(apiClient.put).toHaveBeenCalledWith(
      `/participant/polls/${mockPollId}/response`,
      {
        idempotencyKey: 'idempotency-key-abc',
        optionIds: [mockOptionId],
        text: undefined,
      },
      {
        headers: { Authorization: 'Bearer token-123' },
      },
    );
    expect(res.id).toBe(mockResponseId);
  });
});
