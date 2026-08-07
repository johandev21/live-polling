import { describe, expect, it } from 'vitest';
import {
  InvalidSessionTransitionError,
  SESSION_STATUSES,
  SessionStatus,
  canUpdateSessionName,
  transitionSessionStatus,
} from './session.domain';

describe('session.domain', () => {
  it('transitions draft -> live', () => {
    expect(transitionSessionStatus('draft', 'live')).toBe('live');
  });

  it('transitions live -> ended', () => {
    expect(transitionSessionStatus('live', 'ended')).toBe('ended');
  });

  it('rejects every invalid transition', () => {
    const invalid: Array<[SessionStatus, SessionStatus]> = [
      ['draft', 'ended'],
      ['live', 'draft'],
      ['ended', 'draft'],
      ['ended', 'live'],
      ['ended', 'ended'],
      ['draft', 'draft'],
      ['live', 'live'],
    ];
    for (const [from, to] of invalid) {
      expect(() => transitionSessionStatus(from, to)).toThrow(
        InvalidSessionTransitionError,
      );
    }
  });

  it('allows name updates only for draft sessions', () => {
    for (const status of SESSION_STATUSES) {
      expect(canUpdateSessionName(status)).toBe(status === 'draft');
    }
  });
});
