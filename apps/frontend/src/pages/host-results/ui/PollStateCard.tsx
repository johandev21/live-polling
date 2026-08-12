import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import {
  hostPollTypeLabel,
  type HostResultPoll,
  type HostResultPollLifecycle,
  type HostResultVisibility,
} from '../model/host-results';

type PollStateCardProps = {
  onToggleLifecycle: () => void;
  onToggleVisibility: () => void;
  poll: HostResultPoll;
};

const lifecycleLabels = {
  closed: 'Closed',
  open: 'Open',
} satisfies Record<HostResultPollLifecycle, string>;

const visibilityLabels = {
  hidden: 'Hidden from participants',
  revealed: 'Revealed to participants',
} satisfies Record<HostResultVisibility, string>;

export function PollStateCard({
  onToggleLifecycle,
  onToggleVisibility,
  poll,
}: PollStateCardProps) {
  return (
    <Card aria-labelledby="poll-state-title" className="space-y-5 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold" id="poll-state-title">
          Poll state & actions
        </h2>
        <Badge variant={poll.lifecycle === 'open' ? 'default' : 'secondary'} className="px-2.5 py-0.5 text-xs font-medium">
          {lifecycleLabels[poll.lifecycle]}
        </Badge>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-xl bg-muted/40 p-4">
        <div>
          <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Type
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {hostPollTypeLabel(poll.type)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Visibility
          </dt>
          <dd className="mt-1 truncate text-sm font-medium text-foreground">
            {visibilityLabels[poll.visibility]}
          </dd>
        </div>
      </dl>

      <div className="space-y-2.5 pt-1">
        <Button
          className="w-full text-sm font-medium"
          onClick={onToggleVisibility}
          variant="default"
        >
          {poll.visibility === 'hidden'
            ? 'Reveal results to participants'
            : 'Hide results from participants'}
        </Button>
        <Button
          className="w-full text-sm font-medium"
          onClick={onToggleLifecycle}
          variant="outline"
        >
          {poll.lifecycle === 'open' ? 'Close poll' : 'Open poll'}
        </Button>
      </div>

      <div className="rounded-lg bg-muted/30 p-3.5">
        <p className="text-xs font-normal leading-relaxed text-muted-foreground">
          Host results are always visible, including results hidden from participants.
        </p>
      </div>
    </Card>
  );
}


