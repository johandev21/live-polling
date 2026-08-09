/* oxlint-disable typescript/unbound-method */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/lib/api-client';
import { useHostSessionGuard } from './use-host-auth';

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

function signedInSessionPayload() {
  return {
    session: {
      expiresAt: '2026-08-16T12:00:00Z',
      id: 'session-1',
      userId: 'user-1',
    },
    user: {
      email: 'host@example.com',
      id: 'user-1',
      name: 'Host Person',
    },
  };
}

describe('useHostSessionGuard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    navigateMock.mockReset();
    vi.restoreAllMocks();
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  it('returns true while the session is still loading', () => {
    vi.spyOn(apiClient, 'get').mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useHostSessionGuard(), { wrapper });

    expect(result.current).toBe(true);
  });

  it('redirects to the dashboard when the user is authenticated', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue(signedInSessionPayload());

    const { result } = renderHook(() => useHostSessionGuard(), { wrapper });

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith({
        replace: true,
        to: '/host/dashboard',
      }),
    );

    expect(result.current).toBe(true);
  });

  it('renders the public page when the user is signed out', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ session: null, user: null });

    const { result } = renderHook(() => useHostSessionGuard(), { wrapper });

    await waitFor(() => expect(result.current).toBe(false));

    expect(navigateMock).not.toHaveBeenCalled();
  });
});
