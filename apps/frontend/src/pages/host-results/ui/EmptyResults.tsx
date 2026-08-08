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
      className="flex min-h-[28rem] flex-col items-center justify-center p-8 text-center sm:p-10"
    >
      <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-primary">
        HOST RESULTS · {hostPollTypeLabel(poll.type).toUpperCase()} POLL
      </p>
      <Badge className="mt-4" variant="secondary">No responses</Badge>
      <h2
        className="mt-5 text-3xl font-bold tracking-[-0.04em]"
        id="empty-results-title"
      >
        No responses yet
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        There are no effective responses for this poll.
      </p>
      <div className="mt-7 flex w-full max-w-xl items-center justify-center gap-3 rounded-md bg-background px-5 py-6">
        <BarChart3
          aria-hidden="true"
          className="text-muted-foreground"
          size={30}
          strokeWidth={1.6}
        />
        <span className="font-mono text-xs font-bold text-muted-foreground">
          0 total responses
        </span>
      </div>
      <p className="mt-6 max-w-lg text-xs leading-5 text-muted-foreground">
        You can reveal results even when the response count is zero.
        Participants will see the empty state once results are revealed.
      </p>
    </Card>
  );
}
