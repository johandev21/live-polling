import { Eye, EyeOff, LockKeyhole, Play, Square } from 'lucide-react';

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
    <Card aria-labelledby="poll-state-title" className="space-y-4 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold" id="poll-state-title">
          Poll state & actions
        </h2>
        <Badge variant={poll.lifecycle === 'open' ? 'default' : 'secondary'}>
          {lifecycleLabels[poll.lifecycle]}
        </Badge>
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/40 p-3 text-xs">
        <div>
          <dt className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Type
          </dt>
          <dd className="mt-1 font-semibold text-foreground">
            {hostPollTypeLabel(poll.type)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Visibility
          </dt>
          <dd className="mt-1 font-semibold text-foreground truncate">
            {visibilityLabels[poll.visibility]}
          </dd>
        </div>
      </dl>

      <div className="space-y-2 border-t border-border pt-3">
        <Button
          className="w-full"
          onClick={onToggleVisibility}
          variant="default"
        >
          <span className="inline-flex items-center gap-2">
            {poll.visibility === 'hidden' ? (
              <Eye aria-hidden="true" size={16} strokeWidth={1.8} />
            ) : (
              <EyeOff aria-hidden="true" size={16} strokeWidth={1.8} />
            )}
            {poll.visibility === 'hidden'
              ? 'Reveal results to participants'
              : 'Hide results from participants'}
          </span>
        </Button>
        <Button
          className="w-full"
          onClick={onToggleLifecycle}
          variant="outline"
        >
          <span className="inline-flex items-center gap-2">
            {poll.lifecycle === 'open' ? (
              <Square aria-hidden="true" size={16} strokeWidth={1.8} />
            ) : (
              <Play aria-hidden="true" size={16} strokeWidth={1.8} />
            )}
            {poll.lifecycle === 'open' ? 'Close poll' : 'Open poll'}
          </span>
        </Button>
      </div>

      <div className="flex items-start gap-2.5 rounded-md border border-border/60 bg-muted/30 p-3">
        <LockKeyhole
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-muted-foreground"
          size={14}
          strokeWidth={1.8}
        />
        <p className="text-[11px] leading-4 text-muted-foreground">
          Host results are always visible, including results hidden from participants.
        </p>
      </div>
    </Card>
  );
}

