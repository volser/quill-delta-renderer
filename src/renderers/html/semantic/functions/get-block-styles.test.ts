import { describe, expect, it } from 'vitest';
import type { TNode } from '../../../../core/ast-types';
import type { ResolvedConfig } from '../types/resolved-config';
import { getBlockStyles } from './get-block-styles';

function makeNode(attrs: Record<string, unknown>): TNode {
  return { type: 'paragraph', attributes: attrs, children: [], isInline: false };
}

const baseCfg: ResolvedConfig = {
  paragraphTag: 'p',
  orderedListTag: 'ol',
  bulletListTag: 'ul',
  listItemTag: 'li',
  classPrefix: 'ql',
  inlineStyles: {},
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

describe('getBlockStyles', () => {
  it('should return empty when inlineStyles is false', () => {
    const cfg = { ...baseCfg, inlineStyles: false as const };
    expect(getBlockStyles(makeNode({ indent: 2 }), cfg)).toEqual([]);
  });

  it('should generate indent style from defaults', () => {
    const styles = getBlockStyles(makeNode({ indent: 2 }), baseCfg);
    expect(styles).toEqual(['padding-left: 6em']);
  });

  it('should generate align style from defaults', () => {
    const styles = getBlockStyles(makeNode({ align: 'center' }), baseCfg);
    expect(styles).toEqual(['text-align: center']);
  });

  it('should generate rtl direction style from defaults', () => {
    const styles = getBlockStyles(makeNode({ direction: 'rtl' }), baseCfg);
    expect(styles).toEqual(['direction: rtl; text-align: inherit']);
  });

  it('should use override converter when provided', () => {
    const cfg = {
      ...baseCfg,
      inlineStyles: { indent: () => 'margin-left: 40px' },
    };
    const styles = getBlockStyles(makeNode({ indent: 1 }), cfg);
    expect(styles).toEqual(['margin-left: 40px']);
  });
});
