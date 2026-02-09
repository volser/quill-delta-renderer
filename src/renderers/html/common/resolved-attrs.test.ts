import { describe, expect, it } from 'vitest';
import { EMPTY_RESOLVED_ATTRS, hasResolvedAttrs, mergeResolvedAttrs } from './resolved-attrs';

describe('mergeResolvedAttrs', () => {
  it('should merge styles from both sources', () => {
    const result = mergeResolvedAttrs(
      { style: { color: 'red' } },
      { style: { 'background-color': 'blue' } },
    );
    expect(result.style).toEqual({ color: 'red', 'background-color': 'blue' });
  });

  it('should let source style override target on key conflict', () => {
    const result = mergeResolvedAttrs({ style: { color: 'red' } }, { style: { color: 'blue' } });
    expect(result.style).toEqual({ color: 'blue' });
  });

  it('should concatenate classes', () => {
    const result = mergeResolvedAttrs({ classes: ['a', 'b'] }, { classes: ['c'] });
    expect(result.classes).toEqual(['a', 'b', 'c']);
  });

  it('should merge attrs from both sources', () => {
    const result = mergeResolvedAttrs({ attrs: { id: '1' } }, { attrs: { 'data-x': 'y' } });
    expect(result.attrs).toEqual({ id: '1', 'data-x': 'y' });
  });

  it('should handle empty target', () => {
    const result = mergeResolvedAttrs({}, { style: { color: 'red' } });
    expect(result.style).toEqual({ color: 'red' });
    expect(result.classes).toBeUndefined();
    expect(result.attrs).toBeUndefined();
  });

  it('should handle empty source', () => {
    const result = mergeResolvedAttrs({ classes: ['a'] }, {});
    expect(result.classes).toEqual(['a']);
    expect(result.style).toBeUndefined();
    expect(result.attrs).toBeUndefined();
  });

  it('should handle both empty', () => {
    const result = mergeResolvedAttrs({}, {});
    expect(result.style).toBeUndefined();
    expect(result.classes).toBeUndefined();
    expect(result.attrs).toBeUndefined();
  });
});

describe('hasResolvedAttrs', () => {
  it('should return false for empty object', () => {
    expect(hasResolvedAttrs({})).toBe(false);
    expect(hasResolvedAttrs(EMPTY_RESOLVED_ATTRS)).toBe(false);
  });

  it('should return true when style has entries', () => {
    expect(hasResolvedAttrs({ style: { color: 'red' } })).toBe(true);
  });

  it('should return false when style is empty object', () => {
    expect(hasResolvedAttrs({ style: {} })).toBe(false);
  });

  it('should return true when classes has entries', () => {
    expect(hasResolvedAttrs({ classes: ['a'] })).toBe(true);
  });

  it('should return false when classes is empty array', () => {
    expect(hasResolvedAttrs({ classes: [] })).toBe(false);
  });

  it('should return true when attrs has entries', () => {
    expect(hasResolvedAttrs({ attrs: { id: '1' } })).toBe(true);
  });

  it('should return false when attrs is empty object', () => {
    expect(hasResolvedAttrs({ attrs: {} })).toBe(false);
  });
});
