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
  closed: 'Closed poll',
  open: 'Open poll',
} satisfies Record<HostResultPollLifecycle, string>;

const visibilityLabels = {
  hidden: 'Hidden',
  revealed: 'Revealed',
} satisfies Record<HostResultVisibility, string>;

export function PollStateCard({
  onToggleLifecycle,
  onToggleVisibility,
  poll,
}: PollStateCardProps) {
  return (
    <Card aria-labelledby="poll-state-title" className="space-y-4 p-6">
      <h2 className="text-lg font-bold" id="poll-state-title">
        Poll state
      </h2>
      <dl className="space-y-3">
        <div className="flex items-center justify-between gap-4 text-sm">
          <dt className="text-muted-foreground">Poll type</dt>
          <dd className="font-bold text-primary">
            {hostPollTypeLabel(poll.type)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <dt className="text-muted-foreground">Lifecycle</dt>
          <dd>
            <Badge variant={poll.lifecycle === 'open' ? 'default' : 'secondary'}>{lifecycleLabels[poll.lifecycle]}</Badge>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <dt className="text-muted-foreground">
            Participant visibility
          </dt>
          <dd>
            <Badge variant={poll.visibility === 'revealed' ? 'default' : 'secondary'}>{visibilityLabels[poll.visibility]}</Badge>
          </dd>
        </div>
      </dl>

      <div className="space-y-2 border-t border-border pt-4">
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

      <div className="flex items-start gap-3 rounded-md bg-muted p-4">
        <LockKeyhole
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-primary"
          size={17}
          strokeWidth={1.8}
        />
        <p className="text-xs leading-5 text-muted-foreground">
          You can always see host results, including results that remain hidden
          from participants.
        </p>
      </div>
    </Card>
  );
}
