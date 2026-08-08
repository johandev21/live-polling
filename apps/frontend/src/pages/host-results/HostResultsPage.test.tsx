/* oxlint-disable typescript/unbound-method */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

describe('HostResultsPage', () => {
  it('renders host results header and current poll results', () => {
    render(<HostResultsPage />);

    expect(screen.getByRole('heading', { name: /Team offsite · June 2025/i })).toBeDefined();
    expect(screen.getByText('HOST RESULTS')).toBeDefined();
  });
});
