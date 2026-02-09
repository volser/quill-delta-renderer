import type { TNode } from '../../../../core/ast-types';
import type { InlineStyleConverter } from '../types/semantic-html-config';

/**
 * Resolve an InlineStyleConverter to a CSS style string.
 */
export function resolveInlineStyle(
  converter: InlineStyleConverter,
  value: string,
  node: TNode,
): string | undefined {
  if (typeof converter === 'function') {
    return converter(value, node);
  }
  return converter[value];
}
