import { Users, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { ParticipantPresence } from '../model/live-control-room';
import { LiveRoomDialog } from './LiveRoomDialog';

type ParticipantPresencePanelProps = {
  onClose: () => void;
  participantCount: number;
  participants: readonly ParticipantPresence[];
};

const statusDotClasses = {
  away: 'bg-foreground',
  offline: 'bg-muted-foreground',
  online: 'bg-primary',
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
      className="sm:max-w-lg"
      onClose={onClose}
      titleId="participant-presence-title"
    >
      <header className="flex items-center justify-between gap-4 p-5 pb-2 sm:px-7">
        <div>
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">
            LIVE SESSION (HOST VIEW)
          </p>
          <h2
            className="mt-0.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl"
            id="participant-presence-title"
          >
            Participant presence
          </h2>
        </div>
        <Button
          aria-label="Close participant presence panel"
          className="text-muted-foreground hover:text-foreground"
          onClick={onClose}
          size="icon-sm"
          variant="ghost"
          type="button"
        >
          <X aria-hidden="true" size={18} strokeWidth={1.8} />
        </Button>
      </header>

      <Card className="flex flex-col gap-3 border-0 bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-background text-primary">
            <Users aria-hidden="true" size={18} strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-base font-semibold text-foreground sm:text-lg">
              {participantCount} connected
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              {onlineCount} shown online now
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Approximate count
        </span>
      </Card>

      <ScrollArea className="max-h-[min(50vh,24rem)] p-5 sm:px-7">
        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Connected participants
        </h3>
        <ul className="mt-3 space-y-2">
          {participants.map((participant) => (
            <li
              className="flex items-center justify-between gap-4 py-1.5"
              key={participant.id}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted font-mono text-xs font-semibold text-primary">
                  {participant.name.charAt(0)}
                </span>
                <span className="min-w-0 truncate text-xs font-medium text-foreground sm:text-sm">
                  {participant.name}
                </span>
              </div>
              <span className="flex shrink-0 items-center gap-2 text-xs font-medium text-muted-foreground">
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-full ${statusDotClasses[participant.status]}`}
                />
                {participant.statusLabel}
              </span>
            </li>
          ))}
        </ul>
      </ScrollArea>

      <footer className="bg-muted/30 p-5 sm:px-7">
        <p className="text-xs font-semibold text-foreground sm:text-sm">
          Host-only information
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Presence is approximate. This panel never shows participant responses
          or response details, and presence does not determine whether a
          response is retained.
        </p>
      </footer>
    </LiveRoomDialog>
  );
}
