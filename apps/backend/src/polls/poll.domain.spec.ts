import { describe, expect, it } from 'vitest';
import {
  InvalidPollError,
  normalizePollInput,
  validateMaxSelections,
  validateOptions,
} from './poll.domain';

describe('poll.domain', () => {
  describe('validateOptions', () => {
    it('trims option text', () => {
      expect(validateOptions([' A ', 'B', ' C '])).toEqual(['A', 'B', 'C']);
    });

    it('rejects fewer than 2 or more than 10 options', () => {
      expect(() => validateOptions(['a'])).toThrow(InvalidPollError);
      expect(() =>
        validateOptions(Array.from({ length: 11 }, (_, i) => `o${i}`)),
      ).toThrow(InvalidPollError);
      expect(
        validateOptions(Array.from({ length: 10 }, (_, i) => `o${i}`)),
      ).toHaveLength(10);
    });

    it('rejects empty and overlong options', () => {
      expect(() => validateOptions(['', 'b'])).toThrow(InvalidPollError);
      expect(() => validateOptions(['  ', 'b'])).toThrow(InvalidPollError);
      expect(() => validateOptions(['x'.repeat(121), 'b'])).toThrow(
        InvalidPollError,
      );
    });

    it('rejects duplicate options case-insensitively', () => {
      expect(() => validateOptions(['Blue', 'blue'])).toThrow(InvalidPollError);
      expect(() => validateOptions(['Blue', 'BLUE', 'b'])).toThrow(
        InvalidPollError,
      );
      expect(validateOptions(['Blue', 'green'])).toEqual(['Blue', 'green']);
    });
  });

  describe('validateMaxSelections', () => {
    it('accepts null and undefined as no limit', () => {
      expect(validateMaxSelections(null, ['a', 'b', 'c'])).toBeNull();
      expect(validateMaxSelections(undefined, ['a', 'b', 'c'])).toBeNull();
    });

    it('rejects selections outside 2..10 or above the option count', () => {
      expect(() => validateMaxSelections(1, ['a', 'b'])).toThrow(
        InvalidPollError,
      );
      expect(() => validateMaxSelections(11, ['a', 'b', 'c'])).toThrow(
        InvalidPollError,
      );
      expect(() => validateMaxSelections(4, ['a', 'b', 'c'])).toThrow(
        InvalidPollError,
      );
      expect(validateMaxSelections(3, ['a', 'b', 'c'])).toBe(3);
    });
  });

  describe('normalizePollInput', () => {
    it('rejects maxSelections on single-choice polls', () => {
      expect(() =>
        normalizePollInput('single_choice', 'Q?', ['a', 'b'], 2),
      ).toThrow(InvalidPollError);
    });

    it('normalizes multiple-choice polls and keeps maxSelections', () => {
      const result = normalizePollInput(
        'multiple_choice',
        '  Pick?  ',
        [' Red ', 'blue'],
        2,
      );
      expect(result).toEqual({
        text: 'Pick?',
        options: ['Red', 'blue'],
        maxSelections: 2,
      });
    });

    it('rejects text outside 1..500 characters', () => {
      expect(() =>
        normalizePollInput('single_choice', '   ', ['a', 'b'], null),
      ).toThrow(InvalidPollError);
      expect(() =>
        normalizePollInput('single_choice', 'x'.repeat(501), ['a', 'b'], null),
      ).toThrow(InvalidPollError);
    });

    it('rejects open-ended polls with options or maxSelections', () => {
      expect(() =>
        normalizePollInput('open_ended', 'Why?', ['a'], null),
      ).toThrow(InvalidPollError);
      expect(() =>
        normalizePollInput('open_ended', 'Why?', undefined, 2),
      ).toThrow(InvalidPollError);
      expect(
        normalizePollInput('open_ended', ' Why? ', undefined, null),
      ).toEqual({
        text: 'Why?',
        options: [],
        maxSelections: null,
      });
    });

    it('rejects choice polls without options', () => {
      expect(() =>
        normalizePollInput('single_choice', 'Q?', undefined, null),
      ).toThrow(InvalidPollError);
    });

    it('rejects maxSelections above the option count after trimming', () => {
      expect(() =>
        normalizePollInput('multiple_choice', 'Q?', ['a', ' b '], 3),
      ).toThrow(InvalidPollError);
    });
  });
});
