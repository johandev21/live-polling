import { useState } from 'react';
import { Check, Copy, Info, QrCode, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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
      className="w-full max-w-3xl overflow-hidden rounded-t-lg border border-border bg-card text-foreground shadow-sm sm:rounded-lg"
      onClose={onClose}
      titleId="share-session-title"
    >
      <header className="flex items-start justify-between gap-4 border-b px-5 py-5 sm:px-7">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-primary">
            LIVE SESSION
          </p>
          <h2
            className="mt-1 text-2xl font-bold tracking-[-0.03em]"
            id="share-session-title"
          >
            Invite participants
          </h2>
        </div>
        <Button
          aria-label="Close sharing panel"
          className="text-muted-foreground"
          onClick={onClose}
          size="icon-sm"
          variant="ghost"
          type="button"
        >
          <X aria-hidden="true" size={20} strokeWidth={1.8} />
        </Button>
      </header>

      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="min-w-0 space-y-5">
          <div>
            <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-muted-foreground">
              ROOM CODE
            </p>
            <p className="mt-2 break-all font-mono text-5xl font-bold tracking-[0.08em] text-primary sm:text-6xl">
              {roomCode}
            </p>
            <p className="mt-3 text-sm leading-5 text-muted-foreground">
              Participants can enter this code on the join page. No participant
              account is required.
            </p>
          </div>

          <div className="space-y-2">
            <label
              className="font-mono text-[11px] font-bold tracking-[0.14em] text-muted-foreground"
              htmlFor="invitation-link"
            >
              INVITATION LINK
            </label>
            <div className="flex min-w-0 items-center gap-2 rounded-sm border border-border bg-background p-2 pl-3">
              <Input
                aria-label="Invitation Link"
                className="min-w-0 flex-1 border-0 bg-transparent font-mono text-xs shadow-none focus-visible:ring-0"
                id="invitation-link"
                readOnly
                value={displayLink}
              />
              <Button
                aria-label={
                  copied ? 'Invitation Link copied' : 'Copy Invitation Link'
                }
                className="shrink-0"
                onClick={handleCopy}
                size="sm"
                variant="secondary"
                type="button"
              >
                {copied ? (
                  <Check aria-hidden="true" size={15} strokeWidth={2} />
                ) : (
                  <Copy aria-hidden="true" size={15} strokeWidth={1.8} />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
            <p
              aria-atomic="true"
              aria-live="polite"
              className={[
                'min-h-5 text-xs font-semibold',
                copied
                  ? 'text-foreground'
                  : copyFailed
                    ? 'text-destructive'
                    : 'text-muted-foreground',
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

           <Card className="flex items-start gap-3 border-0 bg-muted p-4">
            <Info
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-primary"
              size={18}
              strokeWidth={1.8}
            />
            <p className="text-sm leading-5 text-muted-foreground">
              Share privately with your group. The Room Code works on every
              device, and the Invitation Link takes participants directly to the
              join flow.
            </p>
           </Card>
        </div>

        <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-md border border-border bg-background p-5 text-center">
          <div className="grid size-36 place-items-center rounded-sm border border-border bg-card text-primary">
            <QrCode aria-hidden="true" size={78} strokeWidth={1.25} />
          </div>
          <p className="font-semibold text-foreground">
            Optional QR code
          </p>
          <p className="max-w-48 text-xs leading-4 text-muted-foreground">
            QR scanning is optional. The Room Code works everywhere.
          </p>
        </div>
      </div>

      <footer className="flex flex-col gap-3 bg-muted px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <p className="text-sm text-muted-foreground">
          Sharing privately with your room
        </p>
        <Button onClick={onClose} variant="secondary">
          Done
        </Button>
      </footer>
    </LiveRoomDialog>
  );
}
