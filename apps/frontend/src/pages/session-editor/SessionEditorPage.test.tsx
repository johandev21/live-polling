/* oxlint-disable typescript/unbound-method */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { SessionEditorSession } from './model/session-editor';
import { SessionEditorPage } from './ui/SessionEditorPage';

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

const sampleEditorSession: SessionEditorSession = {
  id: 'sess-123',
  lifecycle: 'draft',
  name: 'Draft Strategy Session',
  polls: [
    {
      id: 'poll-1',
      options: ['Option A', 'Option B'],
      responses: 0,
      status: 'configured',
      text: 'Question One',
      type: 'single-choice',
    },
    {
      id: 'poll-2',
      options: ['Option C', 'Option D'],
      responses: 0,
      status: 'configured',
      text: 'Question Two',
      type: 'multiple-choice',
    },
  ],
};

describe('SessionEditorPage', () => {
  it('renders session title and list of polls', () => {
    render(<SessionEditorPage initialSession={sampleEditorSession} />);

    expect(screen.getByText('Draft Strategy Session')).toBeDefined();
    expect(screen.getByText('Question One')).toBeDefined();
    expect(screen.getByText('Question Two')).toBeDefined();
    expect(screen.getByRole('button', { name: /Start session/i })).toBeDefined();
  });

  it('triggers start session submit callback when Start Session is clicked', async () => {
    const user = userEvent.setup();
    const handleStart = vi.fn().mockResolvedValue(undefined);

    render(
      <SessionEditorPage
        initialSession={sampleEditorSession}
        onStartSessionSubmit={handleStart}
      />,
    );

    const startBtn = screen.getByRole('button', { name: /Start session/i });
    await user.click(startBtn);

    expect(handleStart).toHaveBeenCalled();
  });

  it('disables start session when session has no polls', () => {
    const emptySession: SessionEditorSession = {
      ...sampleEditorSession,
      polls: [],
    };
    render(<SessionEditorPage initialSession={emptySession} />);

    const startBtn = screen.getByRole('button', { name: /Start session/i });
    expect(startBtn).toHaveProperty('disabled', true);
  });

  it('triggers delete poll submit callback', async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn().mockResolvedValue(undefined);
    render(
      <SessionEditorPage
        initialSession={sampleEditorSession}
        onDeletePollSubmit={handleDelete}
      />,
    );

    const deleteBtn = screen.getByRole('button', { name: /Delete poll 1/i });
    await user.click(deleteBtn);

    expect(handleDelete).toHaveBeenCalledWith('poll-1');
  });
});
