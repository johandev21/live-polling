import { beforeEach, describe, expect, it } from 'vitest';

import {
  getParticipantToken,
  removeParticipantToken,
  setParticipantToken,
} from './participant-storage';

describe('participant-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves participant token case-insensitively', () => {
    setParticipantToken('ROOM01', 'token-123');

    expect(getParticipantToken('ROOM01')).toBe('token-123');
    expect(getParticipantToken('room01')).toBe('token-123');
  });

  it('removes participant token', () => {
    setParticipantToken('ROOM01', 'token-123');
    removeParticipantToken('room01');

    expect(getParticipantToken('ROOM01')).toBeNull();
  });
});
