import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import type { HostResultPoll } from '../model/host-results';

type OpenEndedResultsProps = {
  poll: HostResultPoll;
};

export function OpenEndedResults({ poll }: OpenEndedResultsProps) {
  return (
    <Card
      aria-labelledby="open-ended-results-title"
      className="space-y-6 p-6 sm:p-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold sm:text-xl" id="open-ended-results-title">
            Chronological responses
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Open-ended poll, host-visible response text ({poll.totalResponses}{' '}
            total)
          </p>
        </div>
        <Badge variant="secondary" className="w-fit px-2.5 py-0.5 text-xs font-medium">
          Updating live
        </Badge>
      </div>

      <ol
        aria-label="Chronological response list"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {poll.openEndedResponses.map((response) => (
          <li key={response.id}>
            <div className="flex h-full flex-col justify-between rounded-xl bg-muted/40 p-4 transition-colors hover:bg-muted/60 sm:p-5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-medium text-muted-foreground">
                  {response.submittedAt}
                </span>
              </div>
              <blockquote className="mt-3 text-sm sm:text-base font-normal leading-relaxed text-foreground">
                “{response.text}”
              </blockquote>
            </div>
          </li>
        ))}
      </ol>

      <div className="pt-2">
        <p className="text-xs font-normal text-muted-foreground">
          Responses are shown in chronological order and remain anonymous to
          participants.
        </p>
      </div>
    </Card>
  );
}


