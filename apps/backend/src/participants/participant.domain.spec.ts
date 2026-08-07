import { describe, expect, it } from 'vitest';
import {
  InvalidDisplayNameError,
  InvalidParticipantTokenError,
  TOKEN_TTL_SECONDS,
  decodeParticipantToken,
  encodeParticipantToken,
  normalizeDisplayName,
} from './participant.domain';

const SECRET = 'participant-token-secret-for-tests';

describe('participant.domain', () => {
  describe('normalizeDisplayName', () => {
    it('trims and accepts names up to 40 characters', () => {
      expect(normalizeDisplayName('  Ada  ')).toBe('Ada');
      expect(normalizeDisplayName('x'.repeat(40))).toBe('x'.repeat(40));
    });

    it('rejects empty and overlong names', () => {
      expect(() => normalizeDisplayName('   ')).toThrow(
        InvalidDisplayNameError,
      );
      expect(() => normalizeDisplayName('x'.repeat(41))).toThrow(
        InvalidDisplayNameError,
      );
    });
  });

  describe('token codec', () => {
    const now = Math.floor(Date.now() / 1_000);
    const payload = {
      sub: 'abc-123',
      sid: 'session-1',
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    };

    it('round-trips a token', () => {
      const token = encodeParticipantToken(payload, SECRET);
      expect(decodeParticipantToken(token, SECRET)).toEqual(payload);
    });

    it('rejects tokens signed with a different secret', () => {
      const token = encodeParticipantToken(payload, SECRET);
      expect(() => decodeParticipantToken(token, 'other-secret')).toThrow(
        InvalidParticipantTokenError,
      );
    });

    it('rejects tampered payloads', () => {
      const token = encodeParticipantToken(payload, SECRET);
      const [body, signature] = token.split('.');
      const tampered = JSON.parse(
        Buffer.from(body as string, 'base64url').toString('utf8'),
      ) as typeof payload;
      tampered.sid = 'other-session';
      const forged = `${Buffer.from(JSON.stringify(tampered)).toString('base64url')}.${signature}`;
      expect(() => decodeParticipantToken(forged, SECRET)).toThrow(
        InvalidParticipantTokenError,
      );
    });

    it('rejects malformed tokens', () => {
      expect(() => decodeParticipantToken('nope', SECRET)).toThrow(
        InvalidParticipantTokenError,
      );
      expect(() => decodeParticipantToken('a.b.c', SECRET)).toThrow(
        InvalidParticipantTokenError,
      );
    });

    it('rejects expired tokens', () => {
      const token = encodeParticipantToken(payload, SECRET);
      expect(() =>
        decodeParticipantToken(token, SECRET, payload.exp + 1),
      ).toThrow(InvalidParticipantTokenError);
    });
  });
});
