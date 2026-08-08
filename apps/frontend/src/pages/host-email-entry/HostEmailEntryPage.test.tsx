/* oxlint-disable typescript/unbound-method */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient, ApiError } from '@/shared/lib/api-client';
import { ERROR_CODES } from '@/shared/lib/contracts';
import { HostEmailEntryPage } from './ui/HostEmailEntryPage';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<object>('@tanstack/react-router');
  return {
    ...actual,
    Link: ({ to, children, ...props }: { to?: string; children?: React.ReactNode }) => (
      <a href={to || '#'} {...props}>
        {children}
      </a>
    ),
  };
});

describe('HostEmailEntryPage', () => {
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

  function renderWithProviders(ui: React.ReactNode) {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  }

  it('renders sign-in heading and email input', () => {
    renderWithProviders(<HostEmailEntryPage />);

    expect(screen.getByRole('heading', { name: /Sign in to Pulse/i })).toBeDefined();
    expect(screen.getByLabelText(/Email address/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Send magic link/i })).toBeDefined();
  });

  it('shows inline error when email format is invalid', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HostEmailEntryPage />);

    const input = screen.getByLabelText(/Email address/i);
    await user.type(input, 'invalid-email');
    await user.click(screen.getByRole('button', { name: /Send magic link/i }));

    expect(await screen.findByText(/Enter a valid email address/i)).toBeDefined();
  });

  it('sends magic link and transitions to sent confirmation state on success', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'post').mockResolvedValue({});

    renderWithProviders(<HostEmailEntryPage />);

    const input = screen.getByLabelText(/Email address/i);
    await user.type(input, 'host@example.com');
    await user.click(screen.getByRole('button', { name: /Send magic link/i }));

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/auth/sign-in/magic-link',
      { email: 'host@example.com' },
    );

    expect(await screen.findByText(/Magic link sent/i)).toBeDefined();
    expect(screen.getByText(/host@example.com/i)).toBeDefined();
    expect(screen.getByRole('link', { name: /Continue to confirmation/i })).toBeDefined();
  });

  it('renders rate-limited state when API returns RATE_LIMITED code', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      new ApiError(ERROR_CODES.RATE_LIMITED, 'Too many requests', 429),
    );

    renderWithProviders(<HostEmailEntryPage />);

    const input = screen.getByLabelText(/Email address/i);
    await user.type(input, 'busy@example.com');
    await user.click(screen.getByRole('button', { name: /Send magic link/i }));

    expect(await screen.findByText('Too many requests')).toBeDefined();
  });
});
