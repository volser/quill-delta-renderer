import { describe, expect, it } from 'vitest';
import { buildAttrString } from './build-attr-string';

describe('buildAttrString', () => {
  it('should return empty string for empty record', () => {
    expect(buildAttrString({})).toBe('');
  });

  it('should skip empty-string values', () => {
    expect(buildAttrString({ class: '', id: 'foo' })).toBe(' id="foo"');
  });

  it('should build single attribute with leading space', () => {
    expect(buildAttrString({ class: 'bold' })).toBe(' class="bold"');
  });

  it('should join multiple attributes with spaces', () => {
    expect(buildAttrString({ class: 'a', id: 'b' })).toBe(' class="a" id="b"');
  });
});
