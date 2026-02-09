import { describe, expect, it } from 'vitest';
import type { TNode } from '../../../core/ast-types';
import { getLayoutClasses } from './get-layout-classes';

function makeNode(attrs: Record<string, unknown>): TNode {
  return { type: 'paragraph', attributes: attrs, children: [], isInline: false };
}

describe('getLayoutClasses', () => {
  it('should return empty array for node without layout attributes', () => {
    expect(getLayoutClasses(makeNode({}), 'ql')).toEqual([]);
  });

  it('should generate indent class with given prefix', () => {
    expect(getLayoutClasses(makeNode({ indent: 3 }), 'ql')).toEqual(['ql-indent-3']);
    expect(getLayoutClasses(makeNode({ indent: 2 }), 'noz')).toEqual(['noz-indent-2']);
  });

  it('should skip indent 0', () => {
    expect(getLayoutClasses(makeNode({ indent: 0 }), 'ql')).toEqual([]);
  });

  it('should generate align class', () => {
    expect(getLayoutClasses(makeNode({ align: 'center' }), 'ql')).toEqual(['ql-align-center']);
  });

  it('should generate direction class', () => {
    expect(getLayoutClasses(makeNode({ direction: 'rtl' }), 'ql')).toEqual(['ql-direction-rtl']);
  });

  it('should combine all layout classes in Quill order (direction, align, indent)', () => {
    const node = makeNode({ indent: 1, align: 'right', direction: 'rtl' });
    expect(getLayoutClasses(node, 'ql')).toEqual([
      'ql-direction-rtl',
      'ql-align-right',
      'ql-indent-1',
    ]);
  });
});
