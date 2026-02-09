import type { TNode } from '../../../../core/ast-types';
import type { ResolvedConfig } from '../types/resolved-config';
import { buildAttrString } from './build-attr-string';
import { getBlockClasses } from './get-block-classes';
import { getBlockStyles } from './get-block-styles';

function getCustomClasses(node: TNode, cfg: ResolvedConfig): string[] {
  if (!cfg.customCssClasses) return [];
  const result = cfg.customCssClasses(node);
  if (!result) return [];
  return Array.isArray(result) ? result : [result];
}

function getCustomStyles(node: TNode, cfg: ResolvedConfig): string[] {
  if (!cfg.customCssStyles) return [];
  const result = cfg.customCssStyles(node);
  if (!result) return [];
  return Array.isArray(result) ? result : [result];
}

function getCustomTagAttributes(node: TNode, cfg: ResolvedConfig): Record<string, string> {
  if (!cfg.customTagAttributes) return {};
  return cfg.customTagAttributes(node) ?? {};
}

/**
 * Build the full HTML attribute string for a block node, combining
 * custom classes/styles/attrs, extra classes/styles/attrs, and
 * config-driven block classes/styles.
 */
export function buildBlockAttrs(
  node: TNode,
  cfg: ResolvedConfig,
  extraClasses?: string[],
  extraStyles?: string[],
  extraAttrs?: Record<string, string>,
): string {
  const classes = [
    ...getCustomClasses(node, cfg),
    ...(extraClasses ?? []),
    ...getBlockClasses(node, cfg),
  ].filter(Boolean);

  const styles = [
    ...getCustomStyles(node, cfg),
    ...(extraStyles ?? []),
    ...getBlockStyles(node, cfg),
  ].filter(Boolean);

  const attrs: Record<string, string> = {
    ...getCustomTagAttributes(node, cfg),
    ...(extraAttrs ?? {}),
  };

  if (classes.length > 0) {
    attrs.class = classes.join(' ');
  }
  if (styles.length > 0) {
    attrs.style = styles.join(';');
  }

  return buildAttrString(attrs);
}
