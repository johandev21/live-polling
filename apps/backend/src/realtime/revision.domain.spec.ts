import { describe, expect, it } from 'vitest';
import { classifyRevision } from './revision.domain';

describe('revision.domain', () => {
  it('classifies a revision one above the known revision as next', () => {
    expect(classifyRevision(5, 6)).toBe('next');
  });

  it('classifies a lower revision as stale so it cannot roll state back', () => {
    expect(classifyRevision(5, 4)).toBe('stale');
    expect(classifyRevision(5, 1)).toBe('stale');
  });

  it('classifies the same revision as duplicate', () => {
    expect(classifyRevision(5, 5)).toBe('duplicate');
  });

  it('classifies a jump of more than one as a gap', () => {
    expect(classifyRevision(5, 7)).toBe('gap');
    expect(classifyRevision(1, 10)).toBe('gap');
  });
});
