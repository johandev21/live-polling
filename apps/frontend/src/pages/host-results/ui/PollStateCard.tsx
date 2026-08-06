import { Eye, EyeOff, LockKeyhole, Play, Square } from 'lucide-react';

import { Button, StatusBadge, Surface } from '@/shared/ui';

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
    <Surface
      as="section"
      aria-labelledby="poll-state-title"
      className="space-y-4"
      padding="md"
    >
      <h2 className="text-lg font-bold" id="poll-state-title">
        Poll state
      </h2>
      <dl className="space-y-3">
        <div className="flex items-center justify-between gap-4 text-sm">
          <dt className="text-[var(--color-text-secondary)]">Poll type</dt>
          <dd className="font-bold text-[var(--color-primary)]">
            {hostPollTypeLabel(poll.type)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <dt className="text-[var(--color-text-secondary)]">Lifecycle</dt>
          <dd>
            <StatusBadge
              label={lifecycleLabels[poll.lifecycle]}
              tone={poll.lifecycle === 'open' ? 'success' : 'neutral'}
            />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <dt className="text-[var(--color-text-secondary)]">
            Participant visibility
          </dt>
          <dd>
            <StatusBadge
              label={visibilityLabels[poll.visibility]}
              tone={poll.visibility === 'revealed' ? 'success' : 'warning'}
            />
          </dd>
        </div>
      </dl>

      <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
        <Button
          className="w-full"
          onClick={onToggleVisibility}
          variant="primary"
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
          variant="secondary"
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

      <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4">
        <LockKeyhole
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-[var(--color-primary)]"
          size={17}
          strokeWidth={1.8}
        />
        <p className="text-xs leading-5 text-[var(--color-text-secondary)]">
          You can always see host results, including results that remain hidden
          from participants.
        </p>
      </div>
    </Surface>
  );
}
