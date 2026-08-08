import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient, ApiError } from './api-client';
import { ERROR_CODES } from './contracts';

describe('apiClient', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends JSON requests with credentials included', async () => {
    const mockResponse = { success: true };
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => mockResponse,
      ok: true,
      status: 200,
    });
    globalThis.fetch = mockFetch;

    const result = await apiClient.post('/test-endpoint', { key: 'value' });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/test-endpoint',
      expect.objectContaining({
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify({ key: 'value' }),
      }),
    );
  });

  it('attaches participant Bearer token when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ ok: true }),
      ok: true,
      status: 200,
    });
    globalThis.fetch = mockFetch;

    await apiClient.get('/participant/session', {
      participantToken: 'test-token-123',
    });

    const calls = mockFetch.mock.calls;
    expect(calls.length).toBe(1);
    const headers = calls[0][1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test-token-123');
  });

  it('parses structured API errors matching ERROR_CODES', async () => {
    const errorBody = {
      code: 'RATE_LIMITED',
      message: 'Too many attempts',
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => errorBody,
      ok: false,
      status: 429,
    });

    await expect(apiClient.post('/api/auth/sign-in/magic-link', { email: 'test@example.com' })).rejects.toThrow(
      ApiError,
    );

    try {
      await apiClient.post('/api/auth/sign-in/magic-link', { email: 'test@example.com' });
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe(ERROR_CODES.RATE_LIMITED);
      expect(apiErr.status).toBe(429);
      expect(apiErr.message).toBe('Too many attempts');
    }
  });

  it('returns undefined for 204 No Content responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => null,
      ok: true,
      status: 204,
    });

    const result = await apiClient.delete('/sessions/123');
    expect(result).toBeUndefined();
  });
});
