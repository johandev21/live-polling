export const SESSION_STATUSES = ['draft', 'live', 'ended'] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export class InvalidSessionTransitionError extends Error {
  constructor(
    readonly from: SessionStatus,
    readonly to: SessionStatus,
  ) {
    super(`Invalid session transition: ${from} -> ${to}`);
    this.name = 'InvalidSessionTransitionError';
  }
}

export function transitionSessionStatus(
  from: SessionStatus,
  to: SessionStatus,
): SessionStatus {
  if (from === 'draft' && to === 'live') return 'live';
  if (from === 'live' && to === 'ended') return 'ended';
  throw new InvalidSessionTransitionError(from, to);
}

export function canUpdateSessionName(status: SessionStatus): boolean {
  return status === 'draft';
}

export function isDraft(status: SessionStatus): boolean {
  return status === 'draft';
}

export function isLive(status: SessionStatus): boolean {
  return status === 'live';
}

export function isEnded(status: SessionStatus): boolean {
  return status === 'ended';
}
