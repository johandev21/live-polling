/* oxlint-disable typescript/unbound-method */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { EndedSessionHistoryData } from './model/ended-session-history';
import { EndedSessionHistoryPage } from './ui/EndedSessionHistoryPage';

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

const sampleHistory: EndedSessionHistoryData = {
  endedAt: 'Aug 7, 2026',
  polls: [
    {
      choiceResults: [
        { count: 8, id: 'o-1', label: 'Option A', percentage: 67 },
        { count: 4, id: 'o-2', label: 'Option B', percentage: 33 },
      ],
      id: 'poll-1',
      number: 1,
      openEndedResponses: [],
      hostCanViewResults: true,
      participantResultVisibility: 'hidden',
      prompt: 'Which option is best?',
      totalResponses: 12,
      type: 'single-choice',
    },
  ],
  sessionName: 'Live Town Hall',
  totalResponses: 12,
};

describe('EndedSessionHistoryPage', () => {
  it('renders read-only ended session history summary and polls', () => {
    render(<EndedSessionHistoryPage history={sampleHistory} />);

    expect(screen.getByRole('heading', { name: /Live Town Hall/i })).toBeDefined();
    expect(screen.getByText('READ-ONLY HISTORY')).toBeDefined();
    expect(screen.getByText('COMPLETE POLL HISTORY')).toBeDefined();
    expect(screen.getByText(/Which option is best\?/)).toBeDefined();
  });
});
