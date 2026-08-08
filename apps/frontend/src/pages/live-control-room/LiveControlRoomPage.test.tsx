/* oxlint-disable typescript/unbound-method */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { LivePoll } from './model/live-control-room';
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

const samplePolls: LivePoll[] = [
  {
    id: 'poll-1',
    lifecycle: 'open',
    options: [
      { count: 8, id: 'opt-a', label: 'Option A' },
      { count: 4, id: 'opt-b', label: 'Option B' },
    ],
    position: 1,
    question: 'Which option is best?',
    responses: [],
    resultVisibility: 'hidden',
    totalResponses: 12,
    type: 'single-choice',
  },
  {
    id: 'poll-2',
    lifecycle: 'closed',
    options: [],
    position: 2,
    question: 'Any open feedback?',
    responses: [
      { id: 'resp-1', submittedAt: '09:42', text: 'Great session so far.' },
    ],
    resultVisibility: 'revealed',
    totalResponses: 3,
    type: 'open-ended',
  },
];

function renderControlRoom(props?: Partial<React.ComponentProps<typeof LiveControlRoomPage>>) {
  return render(
    <LiveControlRoomPage
      connectionState="synchronized"
      invitationLink="https://pulse.test/join/ROOM01"
      participantCount={15}
      participants={[
        { id: 'p-1', name: 'Avery', status: 'online', statusLabel: 'Online · Now' },
      ]}
      polls={samplePolls}
      roomCode="ROOM01"
      sessionId="sess-1"
      sessionName="Live Town Hall"
      sessionStatus="live"
      {...props}
    />,
  );
}

describe('LiveControlRoomPage', () => {
  it('renders control room header and active poll', () => {
    renderControlRoom();

    expect(screen.getByRole('heading', { name: /Live Town Hall/i })).toBeDefined();
    expect(screen.getByRole('heading', { name: /Which option is best\?/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Close poll/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Reveal results/i })).toBeDefined();
  });

  it('triggers onClosePollSubmit when toggling open poll lifecycle', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn().mockResolvedValue(undefined);

    renderControlRoom({ onClosePollSubmit: handleClose });

    const closeBtn = screen.getByRole('button', { name: /Close poll/i });
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalledWith('poll-1');
  });

  it('triggers onRevealResultsSubmit when toggling hidden results visibility', async () => {
    const user = userEvent.setup();
    const handleReveal = vi.fn().mockResolvedValue(undefined);

    renderControlRoom({ onRevealResultsSubmit: handleReveal });

    const revealBtn = screen.getByRole('button', { name: /Reveal results/i });
    await user.click(revealBtn);

    expect(handleReveal).toHaveBeenCalledWith('poll-1');
  });

  it('renders ended session state when session has ended', () => {
    renderControlRoom({ sessionStatus: 'ended' });

    expect(screen.getByText(/Live Town Hall is now read-only/i)).toBeDefined();
    expect(screen.getByRole('link', { name: /View ended history/i })).toBeDefined();
  });
});
