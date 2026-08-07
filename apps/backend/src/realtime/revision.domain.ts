export type RevisionCheck = 'stale' | 'duplicate' | 'next' | 'gap';

export function classifyRevision(
  known: number,
  received: number,
): RevisionCheck {
  if (received < known) return 'stale';
  if (received === known) return 'duplicate';
  if (received === known + 1) return 'next';
  return 'gap';
}
