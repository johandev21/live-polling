import { BarChart3 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { hostPollTypeLabel, type HostResultPoll } from '../model/host-results';

type EmptyResultsProps = {
  poll: HostResultPoll;
};

export function EmptyResults({ poll }: EmptyResultsProps) {
  return (
    <Card
      aria-labelledby="empty-results-title"
      className="flex flex-col items-center justify-center p-8 text-center sm:p-12"
    >
      <div className="flex items-center gap-2">
        <Badge variant="outline">{hostPollTypeLabel(poll.type)}</Badge>
        <Badge variant="secondary">No responses</Badge>
      </div>

      <h2
        className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl"
        id="empty-results-title"
      >
        No responses yet
      </h2>

      <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground sm:text-sm">
        There are no effective responses recorded for this poll yet.
      </p>

      <div className="mt-6 flex items-center justify-center gap-3 rounded-lg border border-border bg-muted/40 px-6 py-4">
        <BarChart3
          aria-hidden="true"
          className="text-muted-foreground"
          size={24}
          strokeWidth={1.8}
        />
        <span className="font-mono text-xs font-bold text-muted-foreground">
          0 total responses
        </span>
      </div>

      <p className="mt-5 max-w-sm text-[11px] leading-4 text-muted-foreground">
        You can reveal results even when the response count is zero.
        Participants will see the empty state once results are revealed.
      </p>
    </Card>
  );
}

