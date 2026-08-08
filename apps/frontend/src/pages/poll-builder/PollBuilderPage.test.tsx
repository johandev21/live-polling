/* oxlint-disable typescript/unbound-method */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { PollDraft } from './model/poll-builder';
import { PollBuilderPage } from './ui/PollBuilderPage';

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

const sampleDraft: PollDraft = {
  options: ['React', 'Vue'],
  text: 'Favorite Framework?',
  type: 'single-choice',
};

describe('PollBuilderPage', () => {
  it('renders poll builder form and choices', () => {
    render(<PollBuilderPage initialDraft={sampleDraft} />);

    expect(screen.getByRole('heading', { name: /Build a poll/i })).toBeDefined();
    expect(screen.getByPlaceholderText(/What would you like to ask\?/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Save poll/i })).toBeDefined();
  });

  it('submits poll draft via onSavePollSubmit', async () => {
    const user = userEvent.setup();
    const handleSaveSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <PollBuilderPage
        initialDraft={sampleDraft}
        onSavePollSubmit={handleSaveSubmit}
      />,
    );

    const saveBtn = screen.getByRole('button', { name: /Save poll/i });
    await user.click(saveBtn);

    expect(handleSaveSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Favorite Framework?',
        type: 'single-choice',
      }),
    );
  });
});
