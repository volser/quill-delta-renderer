import type { TNode } from '../../../../core/ast-types';
import type { ResolvedConfig } from '../types/resolved-config';

/**
 * Get CSS classes for block-level layout attributes (indent, align, direction).
 * Returns empty when inlineStyles mode is active.
 */
export function getBlockClasses(node: TNode, cfg: ResolvedConfig): string[] {
  if (cfg.inlineStyles !== false) return [];

  const classes: string[] = [];
  const indent = node.attributes.indent as number | undefined;
  if (indent != null && indent > 0) {
    classes.push(`${cfg.classPrefix}-indent-${indent}`);
  }

  const align = node.attributes.align as string | undefined;
  if (align) {
    classes.push(`${cfg.classPrefix}-align-${align}`);
  }

  const direction = node.attributes.direction as string | undefined;
  if (direction) {
    classes.push(`${cfg.classPrefix}-direction-${direction}`);
  }

  return classes;
}
