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
      className="space-y-6 p-6 sm:p-8"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold" id="open-ended-results-title">
            Chronological responses
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Open-ended poll, host-visible response text ({poll.totalResponses}{' '}
            total)
          </p>
        </div>
        <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold text-foreground">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-primary"
          />
          Updating live
        </span>
      </div>

      <ol
        aria-label="Chronological response list"
        className="grid grid-cols-1 gap-3 md:grid-cols-2"
      >
        {poll.openEndedResponses.map((response) => (
          <li key={response.id}>
            <div className="flex h-full flex-col justify-between rounded-lg border border-border bg-muted/40 p-4 transition-colors hover:bg-muted/60">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock3 aria-hidden="true" size={14} strokeWidth={1.8} />
                <span className="font-mono text-[10px] font-bold">
                  {response.submittedAt}
                </span>
              </div>
              <blockquote className="mt-2 text-sm leading-5 wrap-break-word text-foreground">
                “{response.text}”
              </blockquote>
            </div>
          </li>
        ))}
      </ol>

      <div className="border-t border-border pt-4">
        <p className="text-[11px] leading-4 text-muted-foreground">
          Responses are shown in chronological order and remain anonymous to
          participants.
        </p>
      </div>
    </Card>
  );
}

