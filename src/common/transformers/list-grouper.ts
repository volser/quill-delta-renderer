import type { TNode, Transformer } from '../../core/ast-types';
import { groupConsecutiveElementsWhile } from '../utils/group-consecutive';
import {
  getIndent,
  getListType,
  hasHigherIndent,
  isListItem,
  isSameListType,
} from '../utils/node-queries';

/**
 * Groups adjacent `list-item` nodes into `list` container nodes
 * and nests them correctly based on indentation levels.
 *
 * Ported from quill-delta-to-html's ListNester.
 *
 * Quill stores list items as flat blocks with `list` and optional `indent` attributes.
 * This transformer:
 * 1. Groups consecutive same-type, same-indent list items into flat list containers
 * 2. Merges consecutive list groups into sections
 * 3. Nests higher-indent groups under their parent items
 * 4. Merges consecutive root-level lists of the same type
 *
 * @example
 * ```ts
 * const ast = new DeltaParser(delta).use(listGrouper).toAST();
 * ```
 */
export const listGrouper: Transformer = (root: TNode): TNode => {
  return {
    ...root,
    children: nestLists(root.children),
  };
};

// ─── Internal nesting structures ────────────────────────────────────────────
// These intermediate types exist only during the nesting algorithm.
// They are converted back to TNodes before the transformer returns.

/** A list-item TNode paired with an optional nested sub-list. */
interface NestingItem {
  node: TNode;
  innerList: NestingGroup | null;
}

/** A group of NestingItems that will become a single `list` TNode. */
interface NestingGroup {
  items: NestingItem[];
}

function isNestingGroup(item: unknown): item is NestingGroup {
  return typeof item === 'object' && item !== null && 'items' in item;
}

// ─── Pipeline ───────────────────────────────────────────────────────────────

function nestLists(children: TNode[]): TNode[] {
  const withGroups = convertListItemsToNestingGroups(children);
  const sections = groupConsecutiveNestingGroups(withGroups);

  const nested = sections.flatMap((section) => {
    if (!Array.isArray(section)) return [section];
    return nestSection(section as NestingGroup[]);
  });

  const merged = mergeConsecutiveSameTypeLists(nested);

  return merged.map((item) => (isNestingGroup(item) ? toListTNode(item) : item));
}

// ─── Step 1: Flat grouping ──────────────────────────────────────────────────

function convertListItemsToNestingGroups(children: TNode[]): Array<TNode | NestingGroup> {
  const grouped = groupConsecutiveElementsWhile(children, (curr, prev) => {
    return (
      isListItem(curr) &&
      isListItem(prev) &&
      isSameListType(curr, prev) &&
      getIndent(curr) === getIndent(prev)
    );
  });

  return grouped.map((item): TNode | NestingGroup => {
    if (!Array.isArray(item)) {
      if (isListItem(item)) {
        return { items: [{ node: item, innerList: null }] };
      }
      return item;
    }
    return { items: item.map((n) => ({ node: n, innerList: null })) };
  });
}

// ─── Step 2: Section grouping ───────────────────────────────────────────────

function groupConsecutiveNestingGroups(
  items: Array<TNode | NestingGroup>,
): Array<TNode | NestingGroup | Array<TNode | NestingGroup>> {
  return groupConsecutiveElementsWhile(items, (curr, prev) => {
    return isNestingGroup(curr) && isNestingGroup(prev);
  });
}

// ─── Step 3: Indent-based nesting ───────────────────────────────────────────

function nestSection(sectionItems: NestingGroup[]): NestingGroup[] {
  const byIndent = groupByIndent(sectionItems);

  Object.keys(byIndent)
    .map(Number)
    .sort()
    .reverse()
    .forEach((indent) => {
      byIndent[indent]!.forEach((group) => {
        const idx = sectionItems.indexOf(group);
        if (placeUnderParent(group, sectionItems.slice(0, idx))) {
          sectionItems.splice(idx, 1);
        }
      });
    });

  return sectionItems;
}

function groupByIndent(items: NestingGroup[]): Record<number, NestingGroup[]> {
  return items.reduce<Record<number, NestingGroup[]>>((acc, group) => {
    const indent = getIndent(group.items[0]!.node);
    if (indent > 0) {
      acc[indent] = acc[indent] || [];
      acc[indent]!.push(group);
    }
    return acc;
  }, {});
}

function placeUnderParent(target: NestingGroup, candidates: NestingGroup[]): boolean {
  for (let i = candidates.length - 1; i >= 0; i--) {
    const candidate = candidates[i]!;
    if (hasHigherIndent(target.items[0]!.node, candidate.items[0]!.node)) {
      const parent = candidate.items[candidate.items.length - 1]!;
      if (parent.innerList) {
        parent.innerList.items = parent.innerList.items.concat(target.items);
      } else {
        parent.innerList = target;
      }
      return true;
    }
  }
  return false;
}

// ─── Step 4: Merge same-type root lists ─────────────────────────────────────

function mergeConsecutiveSameTypeLists(
  items: Array<TNode | NestingGroup>,
): Array<TNode | NestingGroup> {
  const grouped = groupConsecutiveElementsWhile(items, (curr, prev) => {
    if (!isNestingGroup(curr) || !isNestingGroup(prev)) return false;
    return isSameListType(curr.items[0]!.node, prev.items[0]!.node);
  });

  return grouped.map((v): TNode | NestingGroup => {
    if (!Array.isArray(v)) return v;
    const allItems = (v as NestingGroup[]).flatMap((g) => g.items);
    return { items: allItems };
  });
}

// ─── TNode conversion ───────────────────────────────────────────────────────

function toListTNode(group: NestingGroup): TNode {
  return {
    type: 'list',
    attributes: { list: getListType(group.items[0]!.node) },
    children: group.items.map(toListItemTNode),
    isInline: false,
  };
}

function toListItemTNode(item: NestingItem): TNode {
  const children = [...item.node.children];
  if (item.innerList) {
    children.push(toListTNode(item.innerList));
  }
  return { ...item.node, children };
}
