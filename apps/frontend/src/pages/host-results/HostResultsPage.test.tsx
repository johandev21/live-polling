/* oxlint-disable typescript/unbound-method */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { HostResultPoll } from './model/host-results';
import { HostResultsPage } from './ui/HostResultsPage';

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

const sampleResultPolls: HostResultPoll[] = [
  {
    id: 'poll-1',
    lifecycle: 'closed',
    number: 1,
    openEndedResponses: [],
    options: [
      { count: 8, id: 'opt-a', label: 'Option A' },
      { count: 4, id: 'opt-b', label: 'Option B' },
    ],
    question: 'Which option is best?',
    totalResponses: 12,
    type: 'single-choice',
    visibility: 'hidden',
  },
];

describe('HostResultsPage', () => {
  it('renders host results header and current poll results', () => {
    render(
      <HostResultsPage
        polls={sampleResultPolls}
        sessionId="sess-1"
        sessionName="Live Town Hall"
      />,
    );

    expect(screen.getByRole('heading', { name: /Live Town Hall/i })).toBeDefined();
    expect(screen.getByText('HOST RESULTS')).toBeDefined();
    expect(screen.getByText('Which option is best?')).toBeDefined();
  });
});
