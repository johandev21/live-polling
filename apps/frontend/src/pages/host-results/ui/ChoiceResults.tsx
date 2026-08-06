import { Surface, ResultBar } from '@/shared/ui';

import type { HostResultPoll } from '../model/host-results';

type ChoiceResultsProps = {
  poll: HostResultPoll;
};

function calculatePercentage(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

export function ChoiceResults({ poll }: ChoiceResultsProps) {
  return (
    <Surface
      as="section"
      aria-labelledby="choice-results-title"
      className="space-y-5"
      elevation="card"
      padding="lg"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold" id="choice-results-title">
          Response breakdown
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
        {poll.type === 'multiple-choice'
          ? 'Multiple-choice poll · Percentage of effective responses'
          : 'Single-choice poll · Percentage of effective responses'}
      </p>

      <ul className="space-y-3">
        {poll.options.map((option) => (
          <li key={option.id}>
            <Surface padding="md">
              <ResultBar
                ariaLabel={`${option.label}: ${calculatePercentage(option.count, poll.totalResponses)} percent of responses`}
                count={option.count}
                label={option.label}
                percentage={calculatePercentage(
                  option.count,
                  poll.totalResponses,
                )}
              />
            </Surface>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] px-4 py-4">
        <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
          Total response count
        </span>
        <span className="font-[var(--font-mono)] text-2xl font-bold text-[var(--color-primary)]">
          {poll.totalResponses}
        </span>
      </div>

      {poll.type === 'multiple-choice' ? (
        <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
          Percentages may add up to more than 100% because participants could
          select multiple options.
        </p>
      ) : (
        <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
          Results reflect one effective response per participant. Replaced
          responses are counted only in their latest state.
        </p>
      )}
    </Surface>
  );
}
