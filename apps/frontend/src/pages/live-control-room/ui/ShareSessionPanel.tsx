import { useState } from 'react';
import { Check, Copy, Info, QrCode, X } from 'lucide-react';

import { Button, Surface } from '@/shared/ui';

import { LiveRoomDialog } from './LiveRoomDialog';

type ShareSessionPanelProps = {
  invitationLink: string;
  onClose: () => void;
  roomCode: string;
};

type CopyStatus = 'idle' | 'copied' | 'error';

export function ShareSessionPanel({
  invitationLink,
  onClose,
  roomCode,
}: ShareSessionPanelProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const displayLink = invitationLink.replace(/^https?:\/\//, '');
  const copied = copyStatus === 'copied';
  const copyFailed = copyStatus === 'error';

  async function handleCopy() {
    setCopyStatus('idle');

    const clipboard =
      typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
    if (!clipboard || typeof clipboard.writeText !== 'function') {
      setCopyStatus('error');
      return;
    }

    try {
      await clipboard.writeText(invitationLink);
      setCopyStatus('copied');
      globalThis.setTimeout(() => setCopyStatus('idle'), 2200);
    } catch {
      setCopyStatus('error');
    }
  }

  return (
    <LiveRoomDialog
      className="w-full max-w-3xl overflow-hidden rounded-t-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-card)] sm:rounded-[var(--radius-lg)]"
      onClose={onClose}
      titleId="share-session-title"
    >
      <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-5 sm:px-7">
        <div>
          <p className="font-[var(--font-mono)] text-[10px] font-bold tracking-[0.16em] text-[var(--color-primary)]">
            LIVE SESSION
          </p>
          <h2
            className="mt-1 text-2xl font-bold tracking-[-0.03em]"
            id="share-session-title"
          >
            Invite participants
          </h2>
        </div>
        <button
          aria-label="Close sharing panel"
          className="rounded-[var(--radius-sm)] p-2 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={20} strokeWidth={1.8} />
        </button>
      </header>

      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="min-w-0 space-y-5">
          <div>
            <p className="font-[var(--font-mono)] text-[11px] font-bold tracking-[0.14em] text-[var(--color-text-tertiary)]">
              ROOM CODE
            </p>
            <p className="mt-2 break-all font-[var(--font-mono)] text-5xl font-bold tracking-[0.08em] text-[var(--color-primary)] sm:text-6xl">
              {roomCode}
            </p>
            <p className="mt-3 text-sm leading-5 text-[var(--color-text-secondary)]">
              Participants can enter this code on the join page. No participant
              account is required.
            </p>
          </div>

          <div className="space-y-2">
            <label
              className="font-[var(--font-mono)] text-[11px] font-bold tracking-[0.14em] text-[var(--color-text-tertiary)]"
              htmlFor="invitation-link"
            >
              INVITATION LINK
            </label>
            <div className="flex min-w-0 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-canvas)] p-2 pl-3">
              <input
                aria-label="Invitation Link"
                className="min-w-0 flex-1 bg-transparent font-[var(--font-mono)] text-xs text-[var(--color-text-primary)] outline-none"
                id="invitation-link"
                readOnly
                value={displayLink}
              />
              <button
                aria-label={
                  copied ? 'Invitation Link copied' : 'Copy Invitation Link'
                }
                className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] px-3 text-xs font-bold text-[var(--color-primary)] transition-colors hover:brightness-95"
                onClick={handleCopy}
                type="button"
              >
                {copied ? (
                  <Check aria-hidden="true" size={15} strokeWidth={2} />
                ) : (
                  <Copy aria-hidden="true" size={15} strokeWidth={1.8} />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p
              aria-atomic="true"
              aria-live="polite"
              className={[
                'min-h-5 text-xs font-semibold',
                copied
                  ? 'text-[var(--color-success)]'
                  : copyFailed
                    ? 'text-[var(--color-error)]'
                    : 'text-[var(--color-text-tertiary)]',
              ].join(' ')}
              role="status"
            >
              {copied
                ? 'Invitation Link copied to clipboard.'
                : copyFailed
                  ? 'Copying is unavailable. Select the Invitation Link and copy it manually.'
                  : ''}
            </p>
          </div>

          <Surface className="flex items-start gap-3" padding="sm" tone="muted">
            <Info
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-[var(--color-primary)]"
              size={18}
              strokeWidth={1.8}
            />
            <p className="text-sm leading-5 text-[var(--color-text-secondary)]">
              Share privately with your group. The Room Code works on every
              device, and the Invitation Link takes participants directly to the
              join flow.
            </p>
          </Surface>
        </div>

        <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-canvas)] p-5 text-center">
          <div className="grid size-36 place-items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)]">
            <QrCode aria-hidden="true" size={78} strokeWidth={1.25} />
          </div>
          <p className="font-semibold text-[var(--color-text-primary)]">
            Optional QR code
          </p>
          <p className="max-w-48 text-xs leading-4 text-[var(--color-text-tertiary)]">
            QR scanning is optional. The Room Code works everywhere.
          </p>
        </div>
      </div>

      <footer className="flex flex-col gap-3 bg-[var(--color-surface-muted)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Sharing privately with your room
        </p>
        <Button onClick={onClose} size="md" variant="secondary">
          Done
        </Button>
      </footer>
    </LiveRoomDialog>
  );
}
