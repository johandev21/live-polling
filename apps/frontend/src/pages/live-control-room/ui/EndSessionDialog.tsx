import {
  Archive,
  LockKeyhole,
  Square,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
    <div className="flex items-start gap-3">
      <ConsequenceIcon
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-muted-foreground"
        size={16}
        strokeWidth={1.8}
      />
      <span className="min-w-0">
        <strong className="block text-xs font-semibold text-foreground sm:text-sm">
          {label}
        </strong>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
          {detail}
        </span>
      </span>
    </div>
  );
}

export function EndSessionDialog({
  onClose,
  onConfirm,
  sessionName,
}: EndSessionDialogProps) {
  return (
    <LiveRoomDialog
      className="sm:max-w-lg"
      onClose={onClose}
      titleId="end-session-title"
    >
      <header className="flex items-center justify-between gap-4 p-5 pb-2 sm:px-7">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="truncate text-xs font-semibold text-foreground sm:text-sm">
            {sessionName}
          </span>
          <Badge variant="secondary">Live session</Badge>
        </div>
        <Button
          aria-label="Close end session confirmation"
          className="text-muted-foreground hover:text-foreground"
          onClick={onClose}
          size="icon-sm"
          variant="ghost"
          type="button"
        >
          <X aria-hidden="true" size={18} strokeWidth={1.8} />
        </Button>
      </header>

      <div className="flex flex-col items-center gap-5 px-5 py-7 text-center sm:px-8 sm:py-8">
        <span className="grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert aria-hidden="true" size={26} strokeWidth={1.7} />
        </span>
        <div>
          <h2
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            id="end-session-title"
          >
            End this session?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Ending is permanent. Participants will no longer be able to submit
            responses, and the session will move to read-only history.
          </p>
        </div>

        <Alert className="w-full max-w-md space-y-3 text-left" variant="default">
          <AlertDescription>
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
          </AlertDescription>
        </Alert>
      </div>

      <footer className="flex flex-col-reverse gap-3 bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <Button onClick={onClose} variant="ghost" size="sm">
          Keep session live
        </Button>
        <Button
          onClick={onConfirm}
          variant="destructive"
          size="sm"
        >
          <span className="inline-flex items-center gap-2">
            <Square aria-hidden="true" size={15} strokeWidth={1.8} />
            End session
          </span>
        </Button>
      </footer>
    </LiveRoomDialog>
  );
}
