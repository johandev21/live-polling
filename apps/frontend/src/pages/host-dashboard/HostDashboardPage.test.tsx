/* oxlint-disable typescript/unbound-method */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { DashboardSession } from './model/host-dashboard';
import { HostDashboardPage } from './ui/HostDashboardPage';

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

const sampleSessions: DashboardSession[] = [
  {
    id: 's-1',
    lifecycle: 'draft',
    name: 'Draft Session 1',
    participantCount: 0,
    pollCount: 2,
    roomCode: 'ROOM01',
    updatedLabel: 'Edited today',
  },
  {
    id: 's-2',
    lifecycle: 'live',
    name: 'Live Session 2',
    participantCount: 15,
    pollCount: 4,
    roomCode: 'ROOM02',
    updatedLabel: 'Active now',
  },
  {
    id: 's-3',
    lifecycle: 'ended',
    name: 'Ended Session 3',
    participantCount: 20,
    pollCount: 5,
    roomCode: 'ROOM03',
    updatedLabel: 'Ended yesterday',
  },
];

describe('HostDashboardPage', () => {
  it('renders session sections and groups sessions by status', () => {
    render(<HostDashboardPage sessions={sampleSessions} />);

    expect(screen.getByRole('heading', { name: 'Your sessions' })).toBeDefined();
    expect(screen.getAllByText('Live Session 2').length).toBeGreaterThan(0);
    expect(screen.getByText('Draft Session 1')).toBeDefined();
    expect(screen.getByText('Ended Session 3')).toBeDefined();
  });

  it('renders empty state when session list is empty', () => {
    render(<HostDashboardPage sessions={[]} />);

    expect(screen.getByText('No sessions yet')).toBeDefined();
    expect(screen.getByRole('button', { name: /Create your first session/i })).toBeDefined();
  });

  it('filters sessions when filter tabs are clicked', async () => {
    const user = userEvent.setup();
    render(<HostDashboardPage sessions={sampleSessions} />);

    const draftTab = screen.getByRole('tab', { name: /Draft/i });
    await user.click(draftTab);

    expect(screen.getByText('Draft Session 1')).toBeDefined();
    expect(screen.queryByText('Ended Session 3')).toBeNull();
  });

  it('triggers delete callback after double click confirmation', async () => {
    const handleDelete = vi.fn();
    render(
      <HostDashboardPage
        onDeleteSession={handleDelete}
        sessions={sampleSessions}
      />,
    );

    const deleteBtn = screen.getByRole('button', { name: /Delete Draft Session 1/i });
    fireEvent.click(deleteBtn);

    // First click prompts confirmation
    expect(screen.getByText(/Confirm delete/i)).toBeDefined();

    // Second click executes delete
    fireEvent.click(screen.getByText(/Confirm delete/i));
    expect(handleDelete).toHaveBeenCalledWith(sampleSessions[0]);
  });
});
