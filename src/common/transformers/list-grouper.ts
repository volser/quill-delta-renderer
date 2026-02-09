import type { TNode, Transformer } from '../../core/ast-types';
import { groupConsecutiveElementsWhile } from '../utils/group-consecutive';

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

// ─── List type helpers ──────────────────────────────────────────────────────

function isListItem(node: TNode): boolean {
  return node.type === 'list-item';
}

function getListType(node: TNode): unknown {
  return node.attributes.list;
}

function getIndent(node: TNode): number {
  return (Number(node.attributes.indent) || 0) as number;
}

function isSameListType(a: TNode, b: TNode): boolean {
  const aList = getListType(a);
  const bList = getListType(b);
  if (!aList || !bList) return false;

  // checked and unchecked are treated as the same list type
  const isCheckList = (v: unknown) => v === 'checked' || v === 'unchecked';
  if (isCheckList(aList) && isCheckList(bList)) return true;

  return aList === bList;
}

function hasHigherIndent(a: TNode, b: TNode): boolean {
  return getIndent(a) > getIndent(b);
}

// ─── Core nesting algorithm ─────────────────────────────────────────────────

/**
 * Internal "list group" — a temporary container used during nesting.
 * Maps to a `list` TNode in the final output.
 */
interface ListItem {
  node: TNode; // the list-item TNode
  innerList: ListGroup | null;
}

interface ListGroup {
  items: ListItem[];
}

function nestLists(children: TNode[]): TNode[] {
  // Step 1: Convert list-item TNodes into ListGroups (flat, same-type + same-indent)
  const withListGroups = convertListItemsToListGroups(children);

  // Step 2: Group consecutive ListGroups into sections for nesting
  const sections = groupConsecutiveListGroups(withListGroups);

  // Step 3: Nest each section (handle indentation)
  const nested = sections.flatMap((section) => {
    if (!Array.isArray(section)) return [section];
    return nestListSection(section as ListGroup[]);
  });

  // Step 4: Merge consecutive root-level lists of the same type
  const merged = mergeConsecutiveSameTypeLists(nested);

  // Step 5: Convert internal ListGroup structures back to TNodes
  return merged.map((item) => (isListGroup(item) ? listGroupToTNode(item as ListGroup) : item));
}

/**
 * Step 1: Group consecutive same-type, same-indent list-items into ListGroups.
 * Non-list-item nodes pass through unchanged.
 */
function convertListItemsToListGroups(children: TNode[]): Array<TNode | ListGroup> {
  const grouped = groupConsecutiveElementsWhile(children, (curr, prev) => {
    return (
      isListItem(curr) &&
      isListItem(prev) &&
      isSameListType(curr, prev) &&
      getIndent(curr) === getIndent(prev)
    );
  });

  return grouped.map((item): TNode | ListGroup => {
    if (!Array.isArray(item)) {
      if (isListItem(item)) {
        return { items: [{ node: item, innerList: null }] };
      }
      return item;
    }
    return { items: item.map((n) => ({ node: n, innerList: null })) };
  });
}

/**
 * Step 2: Group consecutive ListGroups together for section-based nesting.
 */
function groupConsecutiveListGroups(
  items: Array<TNode | ListGroup>,
): Array<TNode | ListGroup | Array<TNode | ListGroup>> {
  return groupConsecutiveElementsWhile(items, (curr, prev) => {
    return isListGroup(curr) && isListGroup(prev);
  });
}

/**
 * Step 3: Within a section of consecutive ListGroups, nest higher-indent
 * groups under their closest lower-indent parent.
 */
function nestListSection(sectionItems: ListGroup[]): ListGroup[] {
  const indentGroups = groupByIndent(sectionItems);

  Object.keys(indentGroups)
    .map(Number)
    .sort()
    .reverse()
    .forEach((indent) => {
      indentGroups[indent]!.forEach((lg) => {
        const idx = sectionItems.indexOf(lg);
        if (placeUnderParent(lg, sectionItems.slice(0, idx))) {
          sectionItems.splice(idx, 1);
        }
      });
    });

  return sectionItems;
}

function groupByIndent(items: ListGroup[]): Record<number, ListGroup[]> {
  return items.reduce<Record<number, ListGroup[]>>((acc, lg) => {
    const indent = getIndent(lg.items[0]!.node);
    if (indent > 0) {
      acc[indent] = acc[indent] || [];
      acc[indent]!.push(lg);
    }
    return acc;
  }, {});
}

function placeUnderParent(target: ListGroup, candidates: ListGroup[]): boolean {
  for (let i = candidates.length - 1; i >= 0; i--) {
    const candidate = candidates[i]!;
    const targetNode = target.items[0]!.node;
    const candidateNode = candidate.items[0]!.node;

    if (hasHigherIndent(targetNode, candidateNode)) {
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

/**
 * Step 4: Merge consecutive root-level ListGroups of the same list type.
 */
function mergeConsecutiveSameTypeLists(items: Array<TNode | ListGroup>): Array<TNode | ListGroup> {
  const grouped = groupConsecutiveElementsWhile(items, (curr, prev) => {
    if (!isListGroup(curr) || !isListGroup(prev)) return false;
    const currGroup = curr as ListGroup;
    const prevGroup = prev as ListGroup;
    return isSameListType(currGroup.items[0]!.node, prevGroup.items[0]!.node);
  });

  return grouped.map((v): TNode | ListGroup => {
    if (!Array.isArray(v)) return v;
    const allItems = (v as ListGroup[]).flatMap((g) => g.items);
    return { items: allItems };
  });
}

// ─── Conversion helpers ─────────────────────────────────────────────────────

function isListGroup(item: unknown): item is ListGroup {
  return typeof item === 'object' && item !== null && 'items' in item;
}

/**
 * Convert the internal ListGroup structure back into TNode tree.
 */
function listGroupToTNode(group: ListGroup): TNode {
  const listType = getListType(group.items[0]!.node);

  return {
    type: 'list',
    attributes: { list: listType },
    children: group.items.map((item) => listItemToTNode(item)),
    isInline: false,
  };
}

function listItemToTNode(item: ListItem): TNode {
  const children = [...item.node.children];

  // If this item has a nested inner list, append it as a child
  if (item.innerList) {
    children.push(listGroupToTNode(item.innerList));
  }

  return {
    ...item.node,
    children,
  };
}
