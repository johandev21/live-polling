/* oxlint-disable typescript/unbound-method */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LiveControlRoomPage } from './ui/LiveControlRoomPage';

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

describe('LiveControlRoomPage', () => {
  it('renders control room header and active poll', () => {
    render(<LiveControlRoomPage />);

    expect(screen.getByRole('heading', { name: /Team offsite · June 2025/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Close poll/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Reveal results/i })).toBeDefined();
  });

  it('triggers onClosePollSubmit when toggling open poll lifecycle', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn().mockResolvedValue(undefined);

    render(<LiveControlRoomPage onClosePollSubmit={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /Close poll/i });
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalled();
  });

  it('triggers onRevealResultsSubmit when toggling hidden results visibility', async () => {
    const user = userEvent.setup();
    const handleReveal = vi.fn().mockResolvedValue(undefined);

    render(<LiveControlRoomPage onRevealResultsSubmit={handleReveal} />);

    const revealBtn = screen.getByRole('button', { name: /Reveal results/i });
    await user.click(revealBtn);

    expect(handleReveal).toHaveBeenCalled();
  });
});
