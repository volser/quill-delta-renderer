import { describe, expect, it } from 'vitest';
import type { TNode } from '../../../../core/ast-types';
import { getGroupType } from './get-group-type';

function makeNode(type: string, isInline = false): TNode {
  return { type, attributes: {}, children: [], isInline };
}

describe('getGroupType', () => {
  it('should return "list" for list nodes', () => {
    expect(getGroupType(makeNode('list'))).toBe('list');
  });

  it('should return "table" for table nodes', () => {
    expect(getGroupType(makeNode('table'))).toBe('table');
  });

  it('should return "video" for video nodes', () => {
    expect(getGroupType(makeNode('video'))).toBe('video');
  });

  it('should return null for text nodes', () => {
    expect(getGroupType(makeNode('text'))).toBeNull();
  });

  it('should return null for inline nodes', () => {
    expect(getGroupType(makeNode('image', true))).toBeNull();
  });

  it('should return "block" for other block-level nodes', () => {
    expect(getGroupType(makeNode('paragraph'))).toBe('block');
    expect(getGroupType(makeNode('header'))).toBe('block');
    expect(getGroupType(makeNode('blockquote'))).toBe('block');
  });
});
