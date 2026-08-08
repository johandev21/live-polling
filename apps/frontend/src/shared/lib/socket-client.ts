import { io, Socket } from 'socket.io-client';

export type SocketRole = 'host' | 'participant';

export type ConnectSocketOptions = {
  baseUrl?: string;
  role: SocketRole;
  sessionId: string;
  token?: string | null;
};

let socketInstance: Socket | null = null;

export function getSocketInstance(options?: ConnectSocketOptions): Socket | null {
  if (typeof window === 'undefined') return null;

  if (!socketInstance && options) {
    const origin = options.baseUrl || window.location.origin;
    socketInstance = io(origin, {
      auth: {
        role: options.role,
        sessionId: options.sessionId,
        token: options.token || undefined,
      },
      autoConnect: true,
      reconnection: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
