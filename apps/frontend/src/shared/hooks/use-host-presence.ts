import { useEffect, useState } from 'react';

import type { ConnectionState } from '@/shared/ui';
import { getSocketInstance } from '@/shared/lib/socket-client';

export type HostPresenceParticipant = Readonly<{
  id: string;
  name: string;
  status: 'away' | 'offline' | 'online';
  statusLabel: string;
}>;

export type HostPresence = Readonly<{
  connectionState: ConnectionState;
  participantCount: number;
  participants: readonly HostPresenceParticipant[];
}>;

const initialPresence: HostPresence = {
  connectionState: 'connecting',
  participantCount: 0,
  participants: [],
};

export function useHostPresence(sessionId: string | undefined): HostPresence {
  const [presence, setPresence] = useState<HostPresence>(initialPresence);

  useEffect(() => {
    if (!sessionId) return;

    const socket = getSocketInstance({ role: 'host', sessionId });
    if (!socket) return;

    function handlePresence(payload: {
      count?: number;
      participants?: readonly {
        participantId: string;
        displayName: string;
      }[];
    }) {
      setPresence({
        connectionState: 'synchronized',
        participantCount: payload.count ?? 0,
        participants: (payload.participants ?? []).map((participant) => ({
          id: participant.participantId,
          name: participant.displayName,
          status: 'online',
          statusLabel: 'Online · Now',
        })),
      });
    }

    function handleConnect() {
      setPresence((current) => ({ ...current, connectionState: 'connected' }));
    }

    function handleReconnect() {
      setPresence((current) => ({
        ...current,
        connectionState: 'synchronized',
      }));
    }

    function handleReconnecting() {
      setPresence((current) => ({
        ...current,
        connectionState: 'reconnecting',
      }));
    }

    function handleError() {
      setPresence((current) => ({ ...current, connectionState: 'stale' }));
    }

    socket.on('presence.updated', handlePresence);
    socket.on('connect', handleConnect);
    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_attempt', handleReconnecting);
    socket.on('error', handleError);

    return () => {
      socket.off('presence.updated', handlePresence);
      socket.off('connect', handleConnect);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_attempt', handleReconnecting);
      socket.off('error', handleError);
    };
  }, [sessionId]);

  return presence;
}
