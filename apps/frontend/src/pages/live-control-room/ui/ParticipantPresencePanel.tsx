import { Users, X } from 'lucide-react';

import { Surface } from '@/shared/ui';

import type { ParticipantPresence } from '../model/live-control-room';
import { LiveRoomDialog } from './LiveRoomDialog';

type ParticipantPresencePanelProps = {
  onClose: () => void;
  participantCount: number;
  participants: readonly ParticipantPresence[];
};

const statusDotClasses = {
  away: 'bg-[var(--color-warning)]',
  offline: 'bg-[var(--color-text-tertiary)]',
  online: 'bg-[var(--color-success)]',
} satisfies Record<ParticipantPresence['status'], string>;

export function ParticipantPresencePanel({
  onClose,
  participantCount,
  participants,
}: ParticipantPresencePanelProps) {
  const onlineCount = participants.filter(
    (participant) => participant.status === 'online',
  ).length;

  return (
    <LiveRoomDialog
      className="w-full max-w-2xl overflow-hidden rounded-t-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-card)] sm:rounded-[var(--radius-lg)]"
      onClose={onClose}
      titleId="participant-presence-title"
    >
      <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-5 sm:px-7">
        <div>
          <p className="font-[var(--font-mono)] text-[10px] font-bold tracking-[0.16em] text-[var(--color-primary)]">
            LIVE SESSION · HOST VIEW
          </p>
          <h2
            className="mt-1 text-2xl font-bold tracking-[-0.03em]"
            id="participant-presence-title"
          >
            Participant presence
          </h2>
        </div>
        <button
          aria-label="Close participant presence panel"
          className="rounded-[var(--radius-sm)] p-2 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={20} strokeWidth={1.8} />
        </button>
      </header>

      <Surface
        className="flex flex-col gap-4 rounded-none border-x-0 border-t-0 bg-[var(--color-primary-soft)] sm:flex-row sm:items-center sm:justify-between"
        padding="md"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--color-surface)] text-[var(--color-primary)]">
            <Users aria-hidden="true" size={22} strokeWidth={1.7} />
          </span>
          <div>
            <p className="text-lg font-bold text-[var(--color-text-primary)]">
              {participantCount} participants
            </p>
            <p className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-success)]">
              {onlineCount} shown online now
            </p>
          </div>
        </div>
        <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
          Approximate count
        </span>
      </Surface>

      <div className="max-h-[min(55vh,28rem)] overflow-y-auto px-5 py-5 sm:px-7">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
          Connected participants
        </h3>
        <ul className="mt-3 divide-y divide-[var(--color-border)]">
          {participants.map((participant) => (
            <li
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              key={participant.id}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-surface-muted)] text-xs font-bold text-[var(--color-primary)]">
                  {participant.name.charAt(0)}
                </span>
                <span className="min-w-0 truncate text-sm font-semibold text-[var(--color-text-primary)]">
                  {participant.name}
                </span>
              </div>
              <span className="flex shrink-0 items-center gap-2 font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)]">
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-full ${statusDotClasses[participant.status]}`}
                />
                {participant.statusLabel}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <footer className="bg-[var(--color-surface-muted)] px-5 py-5 sm:px-7">
        <p className="text-sm font-bold text-[var(--color-text-primary)]">
          Host-only information
        </p>
        <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
          Presence is approximate. This panel never shows participant responses
          or response details, and presence does not determine whether a
          response is retained.
        </p>
      </footer>
    </LiveRoomDialog>
  );
}
