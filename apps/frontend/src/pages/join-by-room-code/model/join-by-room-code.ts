export type RoomCodeStatus =
  | 'draft'
  | 'ended'
  | 'idle'
  | 'invalid'
  | 'ready'
  | 'unavailable';

export function normalizeRoomCode(value: string) {
  return value
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6);
}
