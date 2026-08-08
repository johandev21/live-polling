const TOKEN_PREFIX = 'pulse_participant_token_';

export function getParticipantToken(key: string): string | null {
  if (typeof window === 'undefined' || !key) return null;
  try {
    const normalizedKey = key.toUpperCase();
    return (
      localStorage.getItem(`${TOKEN_PREFIX}${normalizedKey}`) ||
      localStorage.getItem(`${TOKEN_PREFIX}${key}`)
    );
  } catch {
    return null;
  }
}

export function setParticipantToken(key: string, token: string): void {
  if (typeof window === 'undefined' || !key) return;
  try {
    const normalizedKey = key.toUpperCase();
    localStorage.setItem(`${TOKEN_PREFIX}${normalizedKey}`, token);
  } catch {
    // Ignore localStorage write errors
  }
}

export function removeParticipantToken(key: string): void {
  if (typeof window === 'undefined' || !key) return;
  try {
    const normalizedKey = key.toUpperCase();
    localStorage.removeItem(`${TOKEN_PREFIX}${normalizedKey}`);
    localStorage.removeItem(`${TOKEN_PREFIX}${key}`);
  } catch {
    // Ignore localStorage remove errors
  }
}
