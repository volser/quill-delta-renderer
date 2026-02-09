import type { TNode } from '../../core/ast-types';

/**
 * Reusable query functions for inspecting TNode type and attributes.
 * Used by transformers to avoid duplicating attribute-access logic.
 */

export function isListItem(node: TNode): boolean {
  return node.type === 'list-item';
}

export function isTableCell(node: TNode): boolean {
  return node.type === 'table-cell';
}

export function getListType(node: TNode): unknown {
  return node.attributes.list;
}

export function getIndent(node: TNode): number {
  return (Number(node.attributes.indent) || 0) as number;
}

export function getRowId(node: TNode): unknown {
  return node.attributes.table;
}

export function isSameListType(a: TNode, b: TNode): boolean {
  const aList = getListType(a);
  const bList = getListType(b);
  if (!aList || !bList) return false;

  // checked and unchecked are treated as the same list type
  const isCheckList = (v: unknown) => v === 'checked' || v === 'unchecked';
  if (isCheckList(aList) && isCheckList(bList)) return true;

  return aList === bList;
}

export function hasHigherIndent(a: TNode, b: TNode): boolean {
  return getIndent(a) > getIndent(b);
}

export function isSameRow(a: TNode, b: TNode): boolean {
  return isTableCell(a) && isTableCell(b) && getRowId(a) === getRowId(b);
}
