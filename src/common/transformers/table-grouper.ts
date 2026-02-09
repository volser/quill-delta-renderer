import type { TNode, Transformer } from '../../core/ast-types';
import { groupConsecutiveElementsWhile } from '../utils/group-consecutive';
import { isSameRow, isTableCell } from '../utils/node-queries';

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

// ─── Core grouping ──────────────────────────────────────────────────────────

function groupTables(children: TNode[]): TNode[] {
  const grouped = groupConsecutiveElementsWhile(children, (curr, prev) => {
    return isTableCell(curr) && isTableCell(prev);
  });

  return grouped.map((item): TNode => {
    if (!Array.isArray(item)) {
      if (isTableCell(item)) {
        return createTable([createRow([item])]);
      }
      return item;
    }
    return createTable(groupCellsIntoRows(item));
  });
}

function groupCellsIntoRows(cells: TNode[]): TNode[] {
  const grouped = groupConsecutiveElementsWhile(cells, isSameRow);

  return grouped.map((item): TNode => {
    return createRow(Array.isArray(item) ? item : [item]);
  });
}

// ─── TNode factories ────────────────────────────────────────────────────────

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
