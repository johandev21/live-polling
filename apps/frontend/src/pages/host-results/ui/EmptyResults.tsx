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
      <div className="flex items-center gap-2.5">
        <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-medium">
          {hostPollTypeLabel(poll.type)}
        </Badge>
        <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium">
          No responses
        </Badge>
      </div>

      <h2
        className="mt-5 text-xl font-semibold tracking-tight sm:text-2xl"
        id="empty-results-title"
      >
        No responses yet
      </h2>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        There are no effective responses recorded for this poll yet.
      </p>

      <div className="mt-6 rounded-lg bg-muted/40 px-6 py-3">
        <span className="font-mono text-sm font-medium text-muted-foreground">
          0 total responses
        </span>
      </div>

      <p className="mt-5 max-w-sm text-xs font-normal text-muted-foreground">
        You can reveal results even when the response count is zero.
        Participants will see the empty state once results are revealed.
      </p>
    </Card>
  );
}


