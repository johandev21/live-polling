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
      className="w-full max-w-2xl overflow-hidden rounded-t-lg border border-border bg-card text-foreground shadow-sm sm:rounded-lg"
      onClose={onClose}
      titleId="participant-presence-title"
    >
      <header className="flex items-start justify-between gap-4 border-b border-border p-5 sm:px-7">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-primary">
            LIVE SESSION · HOST VIEW
          </p>
          <h2
            className="mt-1 text-2xl font-bold tracking-[-0.03em]"
            id="participant-presence-title"
          >
            Participant presence
          </h2>
        </div>
        <Button
          aria-label="Close participant presence panel"
          className="text-muted-foreground"
          onClick={onClose}
          size="icon-sm"
          variant="ghost"
          type="button"
        >
          <X aria-hidden="true" size={20} strokeWidth={1.8} />
        </Button>
      </header>

      <Card className="flex flex-col gap-4 rounded-none border-x-0 border-t-0 bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-card text-primary">
            <Users aria-hidden="true" size={22} strokeWidth={1.7} />
          </span>
          <div>
            <p className="text-lg font-bold text-foreground">
              {participantCount} participants
            </p>
            <p className="font-mono text-xs font-bold text-foreground">
              {onlineCount} shown online now
            </p>
          </div>
        </div>
        <span className="text-sm font-semibold text-muted-foreground">
          Approximate count
        </span>
      </Card>

      <ScrollArea className="max-h-[min(55vh,28rem)] p-5 sm:px-7">
        <h3 className="text-sm font-bold text-foreground">
          Connected participants
        </h3>
        <ul className="mt-3 divide-y divide-border">
          {participants.map((participant) => (
            <li
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              key={participant.id}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-primary">
                  {participant.name.charAt(0)}
                </span>
                <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                  {participant.name}
                </span>
              </div>
              <span className="flex shrink-0 items-center gap-2 font-mono text-[10px] text-muted-foreground">
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

      <footer className="bg-muted p-5 sm:px-7">
        <p className="text-sm font-bold text-foreground">
          Host-only information
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Presence is approximate. This panel never shows participant responses
          or response details, and presence does not determine whether a
          response is retained.
        </p>
      </footer>
    </LiveRoomDialog>
  );
}
