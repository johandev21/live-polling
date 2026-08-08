/* oxlint-disable typescript/unbound-method */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { LockedPoll } from './model/edit-locked-poll';
import { EditLockedPollPage } from './ui/EditLockedPollPage';

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

const sampleLockedPoll: LockedPoll = {
  id: 'locked-1',
  options: [
    { id: 'o-1', label: 'Option A' },
    { id: 'o-2', label: 'Option B' },
  ],
  participantResultsVisible: false,
  responses: 12,
  results: [
    { count: 8, id: 'r-1', label: 'Option A', percentage: 67 },
    { count: 4, id: 'r-2', label: 'Option B', percentage: 33 },
  ],
  status: 'closed',
  text: 'Locked Poll Question',
  type: 'single-choice',
};

describe('EditLockedPollPage', () => {
  it('renders read-only locked poll banner and options', () => {
    render(<EditLockedPollPage poll={sampleLockedPoll} />);

    expect(screen.getByText(/Read-only poll/i)).toBeDefined();
    expect(screen.getAllByText('Locked Poll Question').length).toBeGreaterThan(0);
    expect(screen.getByText('12 responses recorded')).toBeDefined();
  });

  it('triggers view results callback', async () => {
    const user = userEvent.setup();
    const handleViewResults = vi.fn();

    render(
      <EditLockedPollPage
        onViewResults={handleViewResults}
        poll={sampleLockedPoll}
      />,
    );

    const viewBtn = screen.getByRole('button', { name: /View results/i });
    await user.click(viewBtn);

    expect(handleViewResults).toHaveBeenCalledWith(sampleLockedPoll);
  });
});
