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
  return (
    <Card
      aria-labelledby="choice-results-title"
      className="space-y-5 p-8 sm:p-10"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold" id="choice-results-title">
          Response breakdown
        </h2>
        <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold text-foreground">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-primary"
          />
          Updating live
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {poll.type === 'multiple-choice'
          ? 'Multiple-choice poll · Percentage of effective responses'
          : 'Single-choice poll · Percentage of effective responses'}
      </p>

      <ul className="space-y-3">
        {poll.options.map((option) => (
          <li key={option.id}>
             <Card className="p-6">
               <div aria-label={`${option.label}: ${calculatePercentage(option.count, poll.totalResponses)} percent of responses`} className="flex flex-col gap-2" role="group">
                 <div className="flex items-baseline justify-between gap-4 text-sm"><span className="font-semibold">{option.label}</span><span className="font-mono text-xs font-semibold text-primary">{calculatePercentage(option.count, poll.totalResponses)}%</span></div>
                 <Progress className="h-2" value={calculatePercentage(option.count, poll.totalResponses)} />
                 <span className="text-xs text-muted-foreground">{option.count} responses</span>
               </div>
             </Card>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-4 rounded-md bg-secondary p-4">
        <span className="text-sm font-semibold text-muted-foreground">
          Total response count
        </span>
        <span className="font-mono text-2xl font-bold text-primary">
          {poll.totalResponses}
        </span>
      </div>

      {poll.type === 'multiple-choice' ? (
        <p className="text-xs leading-5 text-muted-foreground">
          Percentages may add up to more than 100% because participants could
          select multiple options.
        </p>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
          Results reflect one effective response per participant. Replaced
          responses are counted only in their latest state.
        </p>
      )}
    </Card>
  );
}
