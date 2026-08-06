import {
  Archive,
  LockKeyhole,
  Square,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react';

import { Button, Surface, StatusBadge } from '@/shared/ui';

import { LiveRoomDialog } from './LiveRoomDialog';

type EndSessionDialogProps = {
  onClose: () => void;
  onConfirm: () => void;
  sessionName: string;
};

type ConsequenceProps = {
  detail: string;
  icon: typeof LockKeyhole;
  label: string;
};

function Consequence({
  detail,
  icon: ConsequenceIcon,
  label,
}: ConsequenceProps) {
  return (
    <li className="flex items-start gap-3">
      <ConsequenceIcon
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-[var(--color-text-secondary)]"
        size={17}
        strokeWidth={1.8}
      />
      <span className="min-w-0">
        <strong className="block text-sm text-[var(--color-text-primary)]">
          {label}
        </strong>
        <span className="mt-0.5 block text-xs leading-5 text-[var(--color-text-secondary)]">
          {detail}
        </span>
      </span>
    </li>
  );
}

export function EndSessionDialog({
  onClose,
  onConfirm,
  sessionName,
}: EndSessionDialogProps) {
  return (
    <LiveRoomDialog
      className="w-full max-w-2xl overflow-hidden rounded-t-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-card)] sm:rounded-[var(--radius-lg)]"
      onClose={onClose}
      titleId="end-session-title"
    >
      <header className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-5 py-5 sm:px-7">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="truncate text-sm font-bold text-[var(--color-text-primary)]">
            {sessionName}
          </span>
          <StatusBadge label="Live session" tone="success" />
        </div>
        <button
          aria-label="Close end session confirmation"
          className="rounded-[var(--radius-sm)] p-2 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={20} strokeWidth={1.8} />
        </button>
      </header>

      <div className="flex flex-col items-center gap-5 px-5 py-7 text-center sm:px-10 sm:py-9">
        <span className="grid size-16 place-items-center rounded-full bg-[var(--color-surface-error)] text-[var(--color-error)]">
          <TriangleAlert aria-hidden="true" size={30} strokeWidth={1.7} />
        </span>
        <div>
          <h2
            className="text-3xl font-bold tracking-[-0.04em]"
            id="end-session-title"
          >
            End this session?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--color-text-secondary)]">
            Ending is permanent. Participants will no longer be able to submit
            responses, and the session will move to read-only history.
          </p>
        </div>

        <Surface
          as="ul"
          className="w-full max-w-lg space-y-4 text-left"
          padding="md"
          tone="muted"
        >
          <Consequence
            detail="No new responses can be accepted after ending."
            icon={LockKeyhole}
            label="Responses close"
          />
          <Consequence
            detail="You can still view the complete poll history and results."
            icon={Archive}
            label="Read-only history"
          />
          <Consequence
            detail="Everyone currently connected will lose access immediately."
            icon={Users}
            label="Participants disconnect"
          />
        </Surface>
      </div>

      <footer className="flex flex-col-reverse gap-3 bg-[var(--color-surface-muted)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <Button onClick={onClose} variant="quiet">
          Keep session live
        </Button>
        <Button
          onClick={onConfirm}
          startIcon="lockKeyhole"
          variant="destructive"
        >
          <span className="inline-flex items-center gap-2">
            <Square aria-hidden="true" size={16} strokeWidth={1.8} />
            End session
          </span>
        </Button>
      </footer>
    </LiveRoomDialog>
  );
}
