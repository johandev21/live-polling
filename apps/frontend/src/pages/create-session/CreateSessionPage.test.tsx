/* oxlint-disable typescript/unbound-method */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CreateSessionPage } from './ui/CreateSessionPage';

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

describe('CreateSessionPage', () => {
  it('renders session creation form', () => {
    render(<CreateSessionPage />);

    expect(screen.getByRole('heading', { name: /Create a session/i })).toBeDefined();
    expect(screen.getByPlaceholderText(/Team offsite/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Add your first poll/i })).toBeDefined();
  });

  it('shows error when submitting empty name', async () => {
    const user = userEvent.setup();
    render(<CreateSessionPage />);

    await user.click(screen.getByRole('button', { name: /Add your first poll/i }));

    expect(
      await screen.findByText(/Add a name so participants know what this session is about/i),
    ).toBeDefined();
  });

  it('calls submit handler when valid name is entered', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CreateSessionPage onCreateSessionSubmit={handleSubmit} />);

    const input = screen.getByPlaceholderText(/Team offsite/i);
    await user.type(input, 'Q3 Strategy Meeting');
    await user.click(screen.getByRole('button', { name: /Add your first poll/i }));

    expect(handleSubmit).toHaveBeenCalledWith('Q3 Strategy Meeting');
  });
});
