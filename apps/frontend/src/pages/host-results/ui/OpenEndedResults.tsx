import { Clock3 } from 'lucide-react';

import { Surface } from '@/shared/ui';

import type { HostResultPoll } from '../model/host-results';

type OpenEndedResultsProps = {
  poll: HostResultPoll;
};

export function OpenEndedResults({ poll }: OpenEndedResultsProps) {
  return (
    <Surface
      as="section"
      aria-labelledby="open-ended-results-title"
      className="space-y-5"
      elevation="card"
      padding="lg"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold" id="open-ended-results-title">
          Chronological responses
        </h2>
        <span className="inline-flex items-center gap-2 font-[var(--font-mono)] text-[10px] font-bold text-[var(--color-success)]">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-[var(--color-success)]"
          />
          Updating live
        </span>
      </div>
      <p className="text-sm text-[var(--color-text-tertiary)]">
        Open-ended poll · Host-visible response text
      </p>

      <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] px-4 py-4">
        <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
          Total response count
        </span>
        <span className="font-[var(--font-mono)] text-2xl font-bold text-[var(--color-primary)]">
          {poll.totalResponses}
        </span>
      </div>

      <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
        Responses are shown in chronological order and remain anonymous to
        participants.
      </p>

      <ol className="space-y-2" aria-label="Chronological response list">
        {poll.openEndedResponses.map((response) => (
          <li key={response.id}>
            <Surface
              className="flex items-start gap-3"
              padding="md"
              tone="muted"
            >
              <Clock3
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-[var(--color-primary)]"
                size={16}
                strokeWidth={1.8}
              />
              <div className="min-w-0">
                <p className="font-[var(--font-mono)] text-[10px] font-bold text-[var(--color-text-tertiary)]">
                  {response.submittedAt}
                </p>
                <blockquote className="mt-1 break-words text-sm leading-5 text-[var(--color-text-primary)]">
                  “{response.text}”
                </blockquote>
              </div>
            </Surface>
          </li>
        ))}
      </ol>
    </Surface>
  );
}
