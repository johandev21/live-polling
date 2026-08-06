export type RoomCodeStatus =
  | 'draft'
  | 'ended'
  | 'idle'
  | 'invalid'
  | 'ready'
  | 'unavailable';

export const roomCodeExamples = {
  draft: 'DRAFT1',
  ended: 'ENDED1',
  ready: '7K4P9D',
  unavailable: 'DOWN01',
} as const;

export function normalizeRoomCode(value: string) {
  return value
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6);
}

export function getRoomCodeStatus(roomCode: string): RoomCodeStatus {
  if (!roomCode) {
    return 'idle';
  }

  if (!/^[A-Z0-9]{6}$/.test(roomCode)) {
    return 'invalid';
  }

  if (roomCode === roomCodeExamples.draft) {
    return 'draft';
  }

  if (roomCode === roomCodeExamples.ended) {
    return 'ended';
  }

  if (roomCode === roomCodeExamples.unavailable) {
    return 'unavailable';
  }

  return 'ready';
}
