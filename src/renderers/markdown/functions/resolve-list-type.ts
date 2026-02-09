import type { TNode } from '../../../core/ast-types';

/**
 * Resolve the list type from a list-item node's attributes.
 *
 * Supports both simple (`'bullet'`) and nested (`{ list: 'bullet' }`) formats.
 */
export function resolveListType(node: TNode): string {
  const listAttr = node.attributes.list;
  if (typeof listAttr === 'string') return listAttr;

  if (typeof listAttr === 'object' && listAttr !== null) {
    const inner = (listAttr as Record<string, unknown>).list;
    if (typeof inner === 'string') return inner;
  }

  return 'bullet';
}
