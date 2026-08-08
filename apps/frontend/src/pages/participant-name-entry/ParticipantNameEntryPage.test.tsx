/* oxlint-disable typescript/unbound-method */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ParticipantNameEntryPage } from './ui/ParticipantNameEntryPage';

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

describe('ParticipantNameEntryPage', () => {
  it('renders display name form', () => {
    render(<ParticipantNameEntryPage roomCode="ROOM01" />);

    expect(screen.getByRole('heading', { name: /What should we call you\?/i })).toBeDefined();
    expect(screen.getByPlaceholderText(/Avery/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Join session/i })).toBeDefined();
  });

  it('shows error when submitting empty display name', () => {
    render(<ParticipantNameEntryPage />);

    const input = screen.getByPlaceholderText(/Avery/i);
    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(
      screen.getAllByText('Enter a display name to join the session.').length,
    ).toBeGreaterThan(0);
  });

  it('triggers onJoinSubmit with entered display name', async () => {
    const user = userEvent.setup();
    const handleJoin = vi.fn().mockResolvedValue(undefined);

    render(<ParticipantNameEntryPage onJoinSubmit={handleJoin} />);

    const input = screen.getByPlaceholderText(/Avery/i);
    await user.type(input, 'Jordan');
    
    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(handleJoin).toHaveBeenCalledWith('Jordan');
  });
});
