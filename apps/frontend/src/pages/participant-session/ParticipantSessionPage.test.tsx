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
    Link: ({
      to,
      children,
      ...props
    }: {
      to?: string;
      children?: React.ReactNode;
    }) => (
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

const sampleMultipleChoiceSnapshot: ParticipantSessionSnapshot = {
  ...sampleOpenPollSnapshot,
  poll: {
    ...sampleOpenPollSnapshot.poll,
    maxSelections: 2,
    options: [
      { id: 'opt-a', label: 'Option A' },
      { id: 'opt-b', label: 'Option B' },
      { id: 'opt-c', label: 'Option C' },
    ],
    type: 'multiple-choice',
  },
};

const sampleOpenEndedSnapshot: ParticipantSessionSnapshot = {
  ...sampleOpenPollSnapshot,
  poll: {
    ...sampleOpenPollSnapshot.poll,
    options: [],
    responseLimit: 500,
    type: 'open-ended',
  },
};

describe('ParticipantSessionPage', () => {
  it('renders waiting state when no active poll is open', () => {
    render(<ParticipantSessionPage initialSnapshot={sampleWaitingSnapshot} />);

    expect(screen.getAllByText('Live Town Hall').length).toBeGreaterThan(0);
    expect(screen.getByText(/You are in/i)).toBeDefined();
  });

  it('renders active open poll prompt and options', () => {
    render(<ParticipantSessionPage initialSnapshot={sampleOpenPollSnapshot} />);

    expect(
      screen.getByText('What feature should we prioritize?'),
    ).toBeDefined();
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

  it('blocks submission until a single choice is selected', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ParticipantSessionPage
        initialSnapshot={sampleOpenPollSnapshot}
        onResponseSubmit={handleSubmit}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /Submit response/i });
    await user.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText('Select one option before submitting.'),
    ).toBeDefined();
  });

  it('submits every selected option for a multiple-choice poll', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ParticipantSessionPage
        initialSnapshot={sampleMultipleChoiceSnapshot}
        onResponseSubmit={handleSubmit}
      />,
    );

    await user.click(screen.getByText('Option A'));
    await user.click(screen.getByText('Option B'));

    const submitBtn = screen.getByRole('button', { name: /Submit response/i });
    await user.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith(['opt-a', 'opt-b']);
  });

  it('rejects more selections than the poll maximum allows', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ParticipantSessionPage
        initialSnapshot={sampleMultipleChoiceSnapshot}
        onResponseSubmit={handleSubmit}
      />,
    );

    await user.click(screen.getByText('Option A'));
    await user.click(screen.getByText('Option B'));
    await user.click(screen.getByText('Option C'));

    const submitBtn = screen.getByRole('button', { name: /Submit response/i });
    await user.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(
      screen.getAllByText('Choose no more than 2 options.').length,
    ).toBeGreaterThan(0);
  });

  it('submits typed text for an open-ended poll', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ParticipantSessionPage
        initialSnapshot={sampleOpenEndedSnapshot}
        onResponseSubmit={handleSubmit}
      />,
    );

    await user.type(
      screen.getByLabelText('Your response'),
      'Prioritize accessibility',
    );

    const submitBtn = screen.getByRole('button', { name: /Submit response/i });
    await user.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith('Prioritize accessibility');
  });

  it('rejects whitespace-only text for an open-ended poll', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ParticipantSessionPage
        initialSnapshot={sampleOpenEndedSnapshot}
        onResponseSubmit={handleSubmit}
      />,
    );

    await user.type(screen.getByLabelText('Your response'), '   ');

    const submitBtn = screen.getByRole('button', { name: /Submit response/i });
    await user.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText('Enter a response before submitting.'),
    ).toBeDefined();
  });

  it('prefills a stored response and submits it as an update', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ParticipantSessionPage
        initialSnapshot={{
          ...sampleOpenPollSnapshot,
          response: 'opt-a',
        }}
        onResponseSubmit={handleSubmit}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /Update response/i });
    await user.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith('opt-a');
  });
});
