import { describe, expect, it } from 'vitest';
import type { TNode } from '../../../../core/ast-types';
import type { ResolvedConfig } from '../types/resolved-config';
import { buildBlockAttrs } from './build-block-attrs';

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

describe('buildBlockAttrs', () => {
  it('should return empty string for plain node', () => {
    expect(buildBlockAttrs(makeNode({}), baseCfg)).toBe('');
  });

  it('should combine block classes with extra classes', () => {
    const result = buildBlockAttrs(makeNode({ indent: 1 }), baseCfg, ['custom']);
    expect(result).toContain('custom');
    expect(result).toContain('ql-indent-1');
  });

  it('should apply customCssClasses callback', () => {
    const cfg = { ...baseCfg, customCssClasses: () => 'injected' };
    expect(buildBlockAttrs(makeNode({}), cfg)).toBe(' class="injected"');
  });

  it('should apply customCssStyles callback', () => {
    const cfg = { ...baseCfg, customCssStyles: () => 'font-weight:bold' };
    expect(buildBlockAttrs(makeNode({}), cfg)).toBe(' style="font-weight:bold"');
  });

  it('should apply customTagAttributes callback', () => {
    const cfg = { ...baseCfg, customTagAttributes: () => ({ role: 'article' }) };
    expect(buildBlockAttrs(makeNode({}), cfg)).toBe(' role="article"');
  });
});
