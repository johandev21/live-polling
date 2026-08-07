import { BarChart3 } from 'lucide-react';

import { Surface, StatusBadge } from '@/shared/ui';

import { hostPollTypeLabel, type HostResultPoll } from '../model/host-results';

type EmptyResultsProps = {
  poll: HostResultPoll;
};

export function EmptyResults({ poll }: EmptyResultsProps) {
  return (
    <Surface
      as="section"
      aria-labelledby="empty-results-title"
      className="flex min-h-[28rem] flex-col items-center justify-center text-center"
      elevation="card"
      padding="lg"
    >
      <p className="font-[var(--font-mono)] text-[10px] font-bold tracking-[0.14em] text-[var(--color-primary)]">
        HOST RESULTS · {hostPollTypeLabel(poll.type).toUpperCase()} POLL
      </p>
      <StatusBadge className="mt-4" label="No responses" tone="neutral" />
      <h2
        className="mt-5 text-3xl font-bold tracking-[-0.04em]"
        id="empty-results-title"
      >
        No responses yet
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
        There are no effective responses for this poll.
      </p>
      <div className="mt-7 flex w-full max-w-xl items-center justify-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-bg-canvas)] px-5 py-6">
        <BarChart3
          aria-hidden="true"
          className="text-[var(--color-text-tertiary)]"
          size={30}
          strokeWidth={1.6}
        />
        <span className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-text-tertiary)]">
          0 total responses
        </span>
      </div>
      <p className="mt-6 max-w-lg text-xs leading-5 text-[var(--color-text-secondary)]">
        You can reveal results even when the response count is zero.
        Participants will see the empty state once results are revealed.
      </p>
    </Surface>
  );
}
