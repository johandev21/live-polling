import { describe, expect, it } from 'vitest';
import {
  InvalidResponseError,
  MAX_OPEN_RESPONSE_TEXT,
  canSubmit,
  normalizeIdempotencyKey,
  normalizeOpenText,
  validateChoiceSelection,
} from './response.domain';

const OPTIONS = ['opt-a', 'opt-b', 'opt-c'];

describe('response.domain', () => {
  describe('normalizeOpenText', () => {
    it('trims and accepts text up to 500 characters', () => {
      expect(normalizeOpenText('  Great talk!  ')).toBe('Great talk!');
      expect(normalizeOpenText('x'.repeat(500))).toHaveLength(500);
    });

    it('rejects missing, empty, and overlong text', () => {
      expect(() => normalizeOpenText(undefined)).toThrow(InvalidResponseError);
      expect(() => normalizeOpenText('   ')).toThrow(InvalidResponseError);
      expect(() => normalizeOpenText('x'.repeat(501))).toThrow(
        InvalidResponseError,
      );
      expect(MAX_OPEN_RESPONSE_TEXT).toBe(500);
    });
  });

  describe('normalizeIdempotencyKey', () => {
    it('trims keys up to 64 characters', () => {
      expect(normalizeIdempotencyKey('  key-1  ')).toBe('key-1');
    });

    it('rejects empty and overlong keys', () => {
      expect(() => normalizeIdempotencyKey('   ')).toThrow(
        InvalidResponseError,
      );
      expect(() => normalizeIdempotencyKey('x'.repeat(65))).toThrow(
        InvalidResponseError,
      );
    });
  });

  describe('validateChoiceSelection', () => {
    it('accepts exactly one option for single-choice', () => {
      expect(
        validateChoiceSelection(
          ['opt-b'],
          { type: 'single_choice', maxSelections: null },
          OPTIONS,
        ),
      ).toEqual(['opt-b']);
    });

    it('rejects single-choice selections that are empty or multiple', () => {
      expect(() =>
        validateChoiceSelection(
          [],
          { type: 'single_choice', maxSelections: null },
          OPTIONS,
        ),
      ).toThrow(InvalidResponseError);
      expect(() =>
        validateChoiceSelection(
          ['opt-a', 'opt-b'],
          { type: 'single_choice', maxSelections: null },
          OPTIONS,
        ),
      ).toThrow(InvalidResponseError);
    });

    it('enforces the multiple-choice maximum selection count', () => {
      expect(
        validateChoiceSelection(
          ['opt-a', 'opt-b'],
          { type: 'multiple_choice', maxSelections: 2 },
          OPTIONS,
        ),
      ).toEqual(['opt-a', 'opt-b']);
      expect(() =>
        validateChoiceSelection(
          ['opt-a', 'opt-b', 'opt-c'],
          { type: 'multiple_choice', maxSelections: 2 },
          OPTIONS,
        ),
      ).toThrow(InvalidResponseError);
    });

    it('falls back to the option count when maxSelections is unset', () => {
      expect(
        validateChoiceSelection(
          ['opt-a', 'opt-b', 'opt-c'],
          { type: 'multiple_choice', maxSelections: null },
          OPTIONS,
        ),
      ).toHaveLength(3);
    });

    it('rejects duplicates and foreign options', () => {
      expect(() =>
        validateChoiceSelection(
          ['opt-a', 'opt-a'],
          { type: 'multiple_choice', maxSelections: null },
          OPTIONS,
        ),
      ).toThrow(InvalidResponseError);
      expect(() =>
        validateChoiceSelection(
          ['opt-a', 'foreign'],
          { type: 'multiple_choice', maxSelections: null },
          OPTIONS,
        ),
      ).toThrow(InvalidResponseError);
      expect(() =>
        validateChoiceSelection(
          undefined,
          { type: 'multiple_choice', maxSelections: null },
          OPTIONS,
        ),
      ).toThrow(InvalidResponseError);
    });
  });

  describe('canSubmit', () => {
    it('allows submissions only to open polls in live sessions', () => {
      expect(canSubmit('live', true)).toEqual({ allowed: true });
      expect(canSubmit('live', false)).toEqual({
        allowed: false,
        reason: 'poll',
      });
      expect(canSubmit('draft', true)).toEqual({
        allowed: false,
        reason: 'session',
      });
      expect(canSubmit('ended', true)).toEqual({
        allowed: false,
        reason: 'session',
      });
    });
  });
});
