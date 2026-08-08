/* oxlint-disable typescript/unbound-method */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { JoinByRoomCodePage } from './ui/JoinByRoomCodePage';

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

describe('JoinByRoomCodePage', () => {
  it('renders room code join form', () => {
    render(<JoinByRoomCodePage />);

    expect(screen.getByRole('heading', { name: /Join a session/i })).toBeDefined();
    expect(screen.getByPlaceholderText(/7K4P9D/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Join session/i })).toBeDefined();
  });

  it('triggers onJoinSubmit with normalized room code', async () => {
    const user = userEvent.setup();
    const handleJoin = vi.fn().mockResolvedValue(undefined);

    render(<JoinByRoomCodePage onJoinSubmit={handleJoin} />);

    const input = screen.getByPlaceholderText(/7K4P9D/i);
    await user.type(input, 'room01');

    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(handleJoin).toHaveBeenCalledWith('ROOM01');
  });

  it('renders draft notice when statusOverride is draft', () => {
    render(<JoinByRoomCodePage statusOverride="draft" />);

    expect(screen.getByText(/This session is not live yet/i)).toBeDefined();
  });

  it('renders ended notice when statusOverride is ended', () => {
    render(<JoinByRoomCodePage statusOverride="ended" />);

    expect(screen.getAllByText(/This session has ended/i).length).toBeGreaterThan(0);
  });
});
