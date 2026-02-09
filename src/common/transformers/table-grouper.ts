import type { TNode, Transformer } from '../../core/ast-types';

/**
 * Wraps adjacent table-related nodes into proper table structure.
 *
 * Quill stores table cells as flat blocks with table attributes.
 * This transformer:
 * 1. Scans for adjacent table-cell nodes
 * 2. Groups cells into rows
 * 3. Wraps rows in a table container
 *
 * @example
 * ```ts
 * const ast = new DeltaParser(delta).use(tableGrouper).toAST();
 * ```
 */
export const tableGrouper: Transformer = (root: TNode): TNode => {
  // TODO: Implement table grouping logic
  // 1. Detect table-cell nodes in root.children
  // 2. Group cells into table-row containers
  // 3. Wrap rows in a table container node
  return {
    ...root,
    children: groupTableCells(root.children),
  };
};

/** @internal */
function groupTableCells(children: TNode[]): TNode[] {
  // TODO: Implement table grouping algorithm
  // Placeholder — returns children unchanged
  return children;
}
