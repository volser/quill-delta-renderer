import type { TNode } from '../../../../core/ast-types';
import { DEFAULT_INLINE_STYLES } from '../consts/default-inline-styles';
import type { ResolvedConfig } from '../types/resolved-config';
import type { InlineStyleConverter } from '../types/semantic-html-config';
import { resolveInlineStyle } from './resolve-inline-style';

/**
 * Get inline styles for block-level layout attributes (indent, align, direction).
 * Returns empty when inlineStyles mode is off.
 */
export function getBlockStyles(node: TNode, cfg: ResolvedConfig): string[] {
  if (cfg.inlineStyles === false) return [];

  const styles: string[] = [];
  const overrides = cfg.inlineStyles;
  const props = ['indent', 'align', 'direction'] as const;

  for (const prop of props) {
    const value = node.attributes[prop];
    if (value == null) continue;

    const converter: InlineStyleConverter | undefined =
      overrides[prop] ?? DEFAULT_INLINE_STYLES[prop];

    if (!converter) continue;

    const resolved = resolveInlineStyle(converter, String(value), node);
    if (resolved) {
      styles.push(resolved);
    }
  }

  return styles;
}
