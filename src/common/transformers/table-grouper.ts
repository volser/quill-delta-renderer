import type { TNode, Transformer } from '../../core/ast-types';
import { groupConsecutiveElementsWhile } from '../utils/group-consecutive';

/**
 * Wraps adjacent table-cell nodes into proper table > row > cell structure.
 *
 * Ported from quill-delta-to-html's TableGrouper.
 *
 * Quill stores table cells as flat blocks with a `table` attribute
 * whose value is the row identifier (e.g. `'row-1'`).
 * This transformer:
 * 1. Detects consecutive `table-cell` nodes in root.children
 * 2. Groups cells sharing the same row id into `table-row` containers
 * 3. Wraps all rows in a `table` container node
 *
 * @example
 * ```ts
 * const ast = new DeltaParser(delta).use(tableGrouper).toAST();
 * ```
 */
export const tableGrouper: Transformer = (root: TNode): TNode => {
  return {
    ...root,
    children: groupTables(root.children),
  };
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function isTableCell(node: TNode): boolean {
  return node.type === 'table-cell';
}

function getRowId(node: TNode): unknown {
  return node.attributes.table;
}

function isSameRow(a: TNode, b: TNode): boolean {
  return isTableCell(a) && isTableCell(b) && getRowId(a) === getRowId(b);
}

// ─── Core grouping ──────────────────────────────────────────────────────────

function groupTables(children: TNode[]): TNode[] {
  // Step 1: Group consecutive table-cell nodes together
  const grouped = groupConsecutiveElementsWhile(children, (curr, prev) => {
    return isTableCell(curr) && isTableCell(prev);
  });

  // Step 2: Convert groups of table-cells into table TNodes
  return grouped.map((item): TNode => {
    if (!Array.isArray(item)) {
      // Single non-table node, or a lone table-cell → wrap in table
      if (isTableCell(item)) {
        return createTable([createRow([item])]);
      }
      return item;
    }
    // Multiple consecutive table-cells → group into rows, wrap in table
    return createTable(groupCellsIntoRows(item));
  });
}

/**
 * Groups an array of table-cell TNodes into table-row TNodes
 * based on their row identifier (`attributes.table`).
 */
function groupCellsIntoRows(cells: TNode[]): TNode[] {
  const grouped = groupConsecutiveElementsWhile(cells, (curr, prev) => {
    return isSameRow(curr, prev);
  });

  return grouped.map((item): TNode => {
    if (Array.isArray(item)) {
      return createRow(item);
    }
    return createRow([item]);
  });
}

function createRow(cells: TNode[]): TNode {
  return {
    type: 'table-row',
    attributes: {},
    children: cells,
    isInline: false,
  };
}

function createTable(rows: TNode[]): TNode {
  return {
    type: 'table',
    attributes: {},
    children: rows,
    isInline: false,
  };
}
