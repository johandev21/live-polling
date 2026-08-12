import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import type { HostResultPoll } from '../model/host-results';

type ChoiceResultsProps = {
  poll: HostResultPoll;
};

function calculatePercentage(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

export function ChoiceResults({ poll }: ChoiceResultsProps) {
  const maxCount = Math.max(0, ...poll.options.map((opt) => opt.count));

  return (
    <Card
      aria-labelledby="choice-results-title"
      className="space-y-6 p-6 sm:p-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold sm:text-xl" id="choice-results-title">
            Response breakdown
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {poll.type === 'multiple-choice'
              ? 'Multiple-choice poll, percentage of effective responses'
              : 'Single-choice poll, percentage of effective responses'}
          </p>
        </div>
        <Badge variant="secondary" className="w-fit px-2.5 py-0.5 text-xs font-medium">
          Updating live
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="hidden px-4 py-2 text-xs font-medium tracking-wider text-muted-foreground uppercase sm:grid sm:grid-cols-[1fr_2fr_5rem_6rem] sm:items-center sm:gap-4">
          <span>Option</span>
          <span>Distribution</span>
          <span className="text-right">%</span>
          <span className="text-right">Responses</span>
        </div>

        <ul className="space-y-2.5">
          {poll.options.map((option) => {
            const percentage = calculatePercentage(
              option.count,
              poll.totalResponses,
            );
            const isLeading =
              option.count === maxCount && maxCount > 0 && poll.totalResponses > 0;

            return (
              <li key={option.id}>
                <div
                  aria-label={`${option.label}: ${percentage} percent of responses (${option.count} responses)`}
                  className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4 transition-colors hover:bg-muted/60 sm:grid sm:grid-cols-[1fr_2fr_5rem_6rem] sm:items-center sm:gap-4"
                  role="group"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground sm:text-base">
                      {option.label}
                    </span>
                    {isLeading ? (
                      <Badge className="px-2 py-0.5 text-xs font-medium" variant="secondary">
                        Top choice
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <Progress className="h-2.5 flex-1" value={percentage} />
                  </div>

                  <div className="flex items-center justify-between sm:justify-end">
                    <span className="font-mono text-sm font-semibold text-foreground sm:text-base">
                      {percentage}%
                    </span>
                    <span className="text-xs font-normal text-muted-foreground sm:hidden">
                      {option.count} resp
                    </span>
                  </div>

                  <div className="hidden text-right font-mono text-sm font-normal text-muted-foreground sm:block">
                    {option.count}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col justify-between gap-3 pt-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
          <span>Total effective responses:</span>
          <span className="font-mono text-sm font-semibold text-foreground">
            {poll.totalResponses}
          </span>
        </div>

        {poll.type === 'multiple-choice' ? (
          <p className="text-xs font-normal text-muted-foreground">
            Percentages may total &gt;100% due to multiple selections.
          </p>
        ) : (
          <p className="text-xs font-normal text-muted-foreground">
            Reflects one effective response per participant.
          </p>
        )}
      </div>
    </Card>
  );
}

