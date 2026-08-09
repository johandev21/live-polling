/* oxlint-disable typescript/unbound-method */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TooltipProvider } from '@/components/ui/tooltip';

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

function renderDashboard(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

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
    renderDashboard(<HostDashboardPage sessions={sampleSessions} />);

    expect(screen.getByRole('heading', { name: 'Your sessions' })).toBeDefined();
    expect(screen.getAllByText('Live Session 2').length).toBeGreaterThan(0);
    expect(screen.getByText('Draft Session 1')).toBeDefined();
    expect(screen.getByText('Ended Session 3')).toBeDefined();
  });

  it('renders empty state when session list is empty', () => {
    renderDashboard(<HostDashboardPage sessions={[]} />);

    expect(screen.getByText('No sessions yet')).toBeDefined();
    expect(screen.getByRole('button', { name: /Create your first session/i })).toBeDefined();
  });

  it('filters sessions when filter tabs are clicked', async () => {
    const user = userEvent.setup();
    renderDashboard(<HostDashboardPage sessions={sampleSessions} />);

    const draftTab = screen.getByRole('tab', { name: /Draft/i });
    await user.click(draftTab);

    expect(screen.getByText('Draft Session 1')).toBeDefined();
    expect(screen.queryByText('Ended Session 3')).toBeNull();
  });

  it('derives avatar initials from the signed-in host name', () => {
    renderDashboard(
      <HostDashboardPage
        hostEmail="johan@example.com"
        hostName="Johan Meier"
        sessions={[]}
      />,
    );

    expect(
      screen.getByRole('button', { name: /Open account menu/i }).textContent,
    ).toContain('JM');
  });

  it('derives avatar initials from the email when no name exists', () => {
    renderDashboard(
      <HostDashboardPage hostEmail="johan@example.com" sessions={[]} />,
    );

    expect(
      screen.getByRole('button', { name: /Open account menu/i }).textContent,
    ).toContain('JO');
  });

  it('signs out from the account menu', async () => {
    const user = userEvent.setup();
    const handleSignOut = vi.fn();
    renderDashboard(
      <HostDashboardPage
        hostEmail="johan@example.com"
        hostName="Johan Meier"
        onSignOut={handleSignOut}
        sessions={[]}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Open account menu/i }));
    await user.click(await screen.findByRole('menuitem', { name: /Sign out/i }));

    expect(handleSignOut).toHaveBeenCalledTimes(1);
  });

  it('opens help guidance from the header', async () => {
    const user = userEvent.setup();
    renderDashboard(<HostDashboardPage sessions={[]} />);

    await user.click(screen.getByRole('button', { name: 'Help' }));

    const dialog = await screen.findByRole('dialog', { name: /Help with Pulse/i });
    expect(dialog).toBeDefined();
    expect(within(dialog).getByText(/Room Code/i)).toBeDefined();
    expect(within(dialog).getByText(/View results/i)).toBeDefined();
  });

  it('confirms session deletion in a dialog before calling onDeleteSession', async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn();
    renderDashboard(
      <HostDashboardPage
        onDeleteSession={handleDelete}
        sessions={sampleSessions}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /Session actions for Draft Session 1/i }),
    );
    await user.click(
      await screen.findByRole('menuitem', { name: 'Delete' }),
    );

    expect(screen.getByRole('alertdialog')).toBeDefined();
    expect(screen.getByText(/will be permanently removed/i)).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Delete session' }));
    expect(handleDelete).toHaveBeenCalledWith(sampleSessions[0]);
  });
});
