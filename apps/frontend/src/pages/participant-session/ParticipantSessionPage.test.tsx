/* oxlint-disable typescript/unbound-method */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { ParticipantSessionSnapshot } from './model/participant-session';
import { ParticipantSessionPage } from './ui/ParticipantSessionPage';

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

const sampleWaitingSnapshot: ParticipantSessionSnapshot = {
  connectionState: 'connected',
  participantCount: 15,
  poll: {
    id: 'p-1',
    options: [],
    prompt: '',
    results: [],
    totalResponses: 0,
    type: 'single-choice',
  },
  pollLifecycle: 'none',
  response: null,
  responseState: 'none',
  resultVisibility: 'hidden',
  sessionLifecycle: 'live',
  sessionName: 'Live Town Hall',
};

const sampleOpenPollSnapshot: ParticipantSessionSnapshot = {
  ...sampleWaitingSnapshot,
  poll: {
    id: 'p-1',
    options: [
      { id: 'opt-a', label: 'Option A' },
      { id: 'opt-b', label: 'Option B' },
    ],
    prompt: 'What feature should we prioritize?',
    results: [],
    totalResponses: 0,
    type: 'single-choice',
  },
  pollLifecycle: 'open',
};

describe('ParticipantSessionPage', () => {
  it('renders waiting state when no active poll is open', () => {
    render(<ParticipantSessionPage initialSnapshot={sampleWaitingSnapshot} />);

    expect(screen.getAllByText('Live Town Hall').length).toBeGreaterThan(0);
    expect(screen.getByText(/You are in/i)).toBeDefined();
  });

  it('renders active open poll prompt and options', () => {
    render(<ParticipantSessionPage initialSnapshot={sampleOpenPollSnapshot} />);

    expect(screen.getByText('What feature should we prioritize?')).toBeDefined();
    expect(screen.getByText('Option A')).toBeDefined();
    expect(screen.getByText('Option B')).toBeDefined();
  });

  it('triggers onResponseSubmit when submitting single-choice poll', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ParticipantSessionPage
        initialSnapshot={sampleOpenPollSnapshot}
        onResponseSubmit={handleSubmit}
      />,
    );

    const optionA = screen.getByText('Option A');
    await user.click(optionA);

    const submitBtn = screen.getByRole('button', { name: /Submit response/i });
    await user.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith('opt-a');
  });
});
