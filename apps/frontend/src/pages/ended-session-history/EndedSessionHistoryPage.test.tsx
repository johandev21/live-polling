/* oxlint-disable typescript/unbound-method */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

describe('EndedSessionHistoryPage', () => {
  it('renders read-only ended session history summary and polls', () => {
    render(<EndedSessionHistoryPage />);

    expect(screen.getByRole('heading', { name: /Team offsite · June 2025/i })).toBeDefined();
    expect(screen.getByText('READ-ONLY HISTORY')).toBeDefined();
    expect(screen.getByText('COMPLETE POLL HISTORY')).toBeDefined();
  });
});
