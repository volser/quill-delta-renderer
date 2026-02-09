/**
 * Typed attribute accessors for well-known TNode attributes.
 *
 * These eliminate `as` casts scattered across renderers by centralizing
 * the attribute-name-to-type mapping in one place.
 */
import type { TNode } from '../../core/ast-types';

// ─── Block-level attributes ─────────────────────────────────────────────────

/** Get the header level (1–6) from a header node. */
export function getHeaderLevel(node: TNode): number {
  return node.attributes.header as number;
}

/** Get the list type string (`'ordered'`, `'bullet'`, `'checked'`, `'unchecked'`). */
export function getListType(node: TNode): string {
  return node.attributes.list as string;
}

/** Get the table row identifier, if present. */
export function getTableRow(node: TNode): string | undefined {
  return node.attributes.table as string | undefined;
}

/** Get the text direction (`'rtl'`), if set. */
export function getDirection(node: TNode): string | undefined {
  return node.attributes.direction as string | undefined;
}

/** Get the text alignment (`'center'`, `'right'`, `'justify'`), if set. */
export function getAlign(node: TNode): string | undefined {
  return node.attributes.align as string | undefined;
}

/** Get the indent level, if set. */
export function getIndent(node: TNode): number | undefined {
  return node.attributes.indent as number | undefined;
}

// ─── Inline / embed attributes ──────────────────────────────────────────────

/** Get the alt text from an image node. */
export function getAlt(node: TNode): string {
  return (node.attributes.alt as string) ?? '';
}

/** Get the link URL from a node's `link` attribute. */
export function getLinkHref(node: TNode): string | undefined {
  return node.attributes.link as string | undefined;
}

/** Get the width attribute. */
export function getWidth(node: TNode): string | undefined {
  return node.attributes.width as string | undefined;
}

/** Get the height attribute. */
export function getHeight(node: TNode): string | undefined {
  return node.attributes.height as string | undefined;
}
