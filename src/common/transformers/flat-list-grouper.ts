import type { TNode, Transformer } from '../../core/ast-types';
import { groupConsecutiveElementsWhile } from '../utils/group-consecutive';

/**
 * Groups adjacent `list-item` nodes into a flat `list` container,
 * matching Quill's editor DOM structure.
 *
 * Unlike `listGrouper`, this transformer does NOT nest sub-lists.
 * All consecutive list items (regardless of type or indent) are placed
 * as flat siblings inside a single `<ol>`. Visual nesting is handled
 * by `ql-indent-*` CSS classes.
 *
 * This matches Quill's actual `root.innerHTML` structure:
 * ```html
 * <ol>
 *   <li data-list="bullet">Parent</li>
 *   <li class="ql-indent-1" data-list="bullet">Child</li>
 * </ol>
 * ```
 *
 * @example
 * ```ts
 * const ast = new DeltaParser(delta).use(flatListGrouper).toAST();
 * ```
 */
export const flatListGrouper: Transformer = (root: TNode): TNode => {
  return {
    ...root,
    children: groupFlatLists(root.children),
  };
};

function isListItem(node: TNode): boolean {
  return node.type === 'list-item';
}

function groupFlatLists(children: TNode[]): TNode[] {
  const grouped = groupConsecutiveElementsWhile(children, (curr, prev) => {
    return isListItem(curr) && isListItem(prev);
  });

  return grouped.map((item): TNode => {
    if (!Array.isArray(item)) {
      if (isListItem(item)) {
        return createList([item]);
      }
      return item;
    }
    return createList(item);
  });
}

function createList(items: TNode[]): TNode {
  return {
    type: 'list',
    attributes: {},
    children: items,
    isInline: false,
  };
}
