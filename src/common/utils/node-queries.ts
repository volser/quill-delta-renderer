import type { TNode } from '../../core/ast-types';
import {
  getIndent as getIndentAttr,
  getListType as getListTypeAttr,
  getTableRow,
} from '../../renderers/common/node-attributes';

/**
 * Reusable query functions for inspecting TNode type and attributes.
 * Used by transformers to avoid duplicating attribute-access logic.
 *
 * Primitive attribute accessors delegate to the type-safe guards
 * in `renderers/common/node-attributes.ts`.
 */

export function isListItem(node: TNode): boolean {
  return node.type === 'list-item';
}

export function isTableCell(node: TNode): boolean {
  return node.type === 'table-cell';
}

export function getListType(node: TNode): string {
  return getListTypeAttr(node);
}

export function getIndent(node: TNode): number {
  return getIndentAttr(node) ?? 0;
}

export function getRowId(node: TNode): string | undefined {
  return getTableRow(node);
}

export function isSameListType(a: TNode, b: TNode): boolean {
  const aList = getListType(a);
  const bList = getListType(b);
  if (!aList || !bList) return false;

  // checked and unchecked are treated as the same list type
  const isCheckList = (v: string) => v === 'checked' || v === 'unchecked';
  if (isCheckList(aList) && isCheckList(bList)) return true;

  return aList === bList;
}

export function hasHigherIndent(a: TNode, b: TNode): boolean {
  return getIndent(a) > getIndent(b);
}

export function isSameRow(a: TNode, b: TNode): boolean {
  return isTableCell(a) && isTableCell(b) && getRowId(a) === getRowId(b);
}
