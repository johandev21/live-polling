import { useState } from 'react';
import { Check, Copy, Info, X } from 'lucide-react';

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
  const displayLink = getDisplayLink(invitationLink);
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
      className="sm:max-w-xl"
      onClose={onClose}
      titleId="share-session-title"
    >
      <DialogHeader onClose={onClose} />

      <div className="space-y-5 p-6 sm:p-7">
        <RoomCodeSection roomCode={roomCode} />
        <InvitationLinkSection
          copied={copied}
          copyFailed={copyFailed}
          displayLink={displayLink}
          onCopy={handleCopy}
        />
        <SharingNote />
      </div>

      <DialogFooter onClose={onClose} />
    </LiveRoomDialog>
  );
}

function DialogHeader({ onClose }: { onClose: () => void }) {
  return (
    <header className="flex items-center justify-between gap-4 p-5 pb-2 sm:px-7">
      <div>
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">
          LIVE SESSION
        </p>
        <h2
          className="mt-0.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          id="share-session-title"
        >
          Invite participants
        </h2>
      </div>
      <Button
        aria-label="Close sharing panel"
        className="text-muted-foreground hover:text-foreground"
        onClick={onClose}
        size="icon-sm"
        variant="ghost"
        type="button"
      >
        <X aria-hidden="true" size={18} strokeWidth={1.8} />
      </Button>
    </header>
  );
}

function RoomCodeSection({ roomCode }: { roomCode: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Room Code
      </p>
      <p className="font-mono text-4xl font-bold tracking-widest text-primary sm:text-5xl">
        {roomCode}
      </p>
      <p className="text-xs text-muted-foreground sm:text-sm">
        Participants can enter this code on the join page. No account required.
      </p>
    </div>
  );
}

function InvitationLinkSection({
  copied,
  copyFailed,
  displayLink,
  onCopy,
}: {
  copied: boolean;
  copyFailed: boolean;
  displayLink: string;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-2">
      <label
        className="block text-xs font-medium text-muted-foreground"
        htmlFor="invitation-link"
      >
        Invitation Link
      </label>
      <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-background p-1.5 pl-3">
        <Input
          aria-label="Invitation Link"
          className="min-w-0 flex-1 border-0 bg-transparent font-mono text-xs shadow-none focus-visible:ring-0"
          id="invitation-link"
          readOnly
          value={displayLink}
        />
        <Button
          aria-label={copied ? 'Invitation Link copied' : 'Copy Invitation Link'}
          className="shrink-0"
          onClick={onCopy}
          size="sm"
          variant="secondary"
          type="button"
        >
          {copied ? (
            <Check aria-hidden="true" size={14} strokeWidth={2} />
          ) : (
            <Copy aria-hidden="true" size={14} strokeWidth={1.8} />
          )}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
      <p
        aria-atomic="true"
        aria-live="polite"
        className={['min-h-5 text-xs font-medium', getCopyStatusClassName(copied, copyFailed)].join(' ')}
        role="status"
      >
        {getCopyStatusMessage(copied, copyFailed)}
      </p>
    </div>
  );
}

function SharingNote() {
  return (
    <Card className="flex items-start gap-3 border-border/80 bg-muted/30 p-4">
      <Info
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-primary"
        size={16}
        strokeWidth={1.8}
      />
      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
        Share privately with your group. The Room Code works on every device,
        and the Invitation Link takes participants directly to the join flow.
      </p>
    </Card>
  );
}

function DialogFooter({ onClose }: { onClose: () => void }) {
  return (
    <footer className="flex flex-col gap-3 bg-muted/40 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground sm:text-sm">
        Sharing privately with your room
      </p>
      <Button onClick={onClose} variant="secondary" size="sm">
        Done
      </Button>
    </footer>
  );
}

function getDisplayLink(invitationLink: string): string {
  return invitationLink.replace(/^https?:\/\//, '');
}

function getCopyStatusMessage(copied: boolean, copyFailed: boolean): string {
  if (copied) return 'Invitation Link copied to clipboard.';
  if (copyFailed) {
    return 'Copying is unavailable. Select the Invitation Link and copy it manually.';
  }
  return '';
}

function getCopyStatusClassName(copied: boolean, copyFailed: boolean): string {
  if (copied) return 'text-foreground';
  if (copyFailed) return 'text-destructive';
  return 'text-muted-foreground';
}
