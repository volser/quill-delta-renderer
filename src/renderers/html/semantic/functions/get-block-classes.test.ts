import { describe, expect, it } from 'vitest';
import type { TNode } from '../../../../core/ast-types';
import type { ResolvedConfig } from '../types/resolved-config';
import { getBlockClasses } from './get-block-classes';

function makeNode(attrs: Record<string, unknown>): TNode {
  return { type: 'paragraph', attributes: attrs, children: [], isInline: false };
}

const baseCfg: ResolvedConfig = {
  paragraphTag: 'p',
  orderedListTag: 'ol',
  bulletListTag: 'ul',
  listItemTag: 'li',
  classPrefix: 'ql',
  inlineStyles: false,
  allowBackgroundClasses: false,
  linkTarget: '_blank',
  linkRel: undefined,
  encodeHtml: true,
  urlSanitizer: undefined,
  customTag: undefined,
  customTagAttributes: undefined,
  customCssClasses: undefined,
  customCssStyles: undefined,
};

describe('getBlockClasses', () => {
  it('should return empty when inlineStyles is active', () => {
    const cfg = { ...baseCfg, inlineStyles: {} };
    expect(getBlockClasses(makeNode({ indent: 2 }), cfg)).toEqual([]);
  });

  it('should generate indent class', () => {
    expect(getBlockClasses(makeNode({ indent: 3 }), baseCfg)).toEqual(['ql-indent-3']);
  });

  it('should skip indent 0', () => {
    expect(getBlockClasses(makeNode({ indent: 0 }), baseCfg)).toEqual([]);
  });

  it('should generate align class', () => {
    expect(getBlockClasses(makeNode({ align: 'center' }), baseCfg)).toEqual(['ql-align-center']);
  });

  it('should generate direction class', () => {
    expect(getBlockClasses(makeNode({ direction: 'rtl' }), baseCfg)).toEqual(['ql-direction-rtl']);
  });
});
