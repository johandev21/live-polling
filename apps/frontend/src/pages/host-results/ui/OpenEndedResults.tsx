import { Clock3 } from 'lucide-react';

import { Card } from '@/components/ui/card';

import type { HostResultPoll } from '../model/host-results';

type OpenEndedResultsProps = {
  poll: HostResultPoll;
};

export function OpenEndedResults({ poll }: OpenEndedResultsProps) {
  return (
    <Card
      aria-labelledby="open-ended-results-title"
      className="space-y-5 p-8 sm:p-10"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold" id="open-ended-results-title">
          Chronological responses
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
        Open-ended poll · Host-visible response text
      </p>

      <div className="flex items-center justify-between gap-4 rounded-md bg-secondary px-4 py-4">
        <span className="text-sm font-semibold text-muted-foreground">
          Total response count
        </span>
        <span className="font-mono text-2xl font-bold text-primary">
          {poll.totalResponses}
        </span>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        Responses are shown in chronological order and remain anonymous to
        participants.
      </p>

      <ol className="space-y-2" aria-label="Chronological response list">
        {poll.openEndedResponses.map((response) => (
          <li key={response.id}>
           <Card className="flex items-start gap-3 border-0 bg-muted p-6">
              <Clock3
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-primary"
                size={16}
                strokeWidth={1.8}
              />
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold text-muted-foreground">
                  {response.submittedAt}
                </p>
                <blockquote className="mt-1 break-words text-sm leading-5 text-foreground">
                  “{response.text}”
                </blockquote>
              </div>
           </Card>
          </li>
        ))}
      </ol>
    </Card>
  );
}
