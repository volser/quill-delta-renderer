/**
 * Type-safe attribute accessors for well-known TNode attributes.
 *
 * Each accessor validates the runtime value with `typeof` checks instead
 * of blindly casting with `as`. If the attribute is missing or has the
 * wrong type, the accessor returns the documented fallback (typically
 * `undefined` or a sensible default like `''` / `0`).
 */
import type { TNode } from '../../core/ast-types';

// ─── Primitive guards ───────────────────────────────────────────────────────

/** Narrow `unknown` to `string` at runtime. Returns `undefined` if the value is not a string. */
export function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Narrow `unknown` to `number` at runtime. Returns `undefined` if the value is not a number. */
export function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

// ─── Block-level attributes ─────────────────────────────────────────────────

/** Get the header level (1–6) from a header node. Returns `0` if missing/invalid. */
export function getHeaderLevel(node: TNode): number {
  return asNumber(node.attributes.header) ?? 0;
}

/** Get the list type string (`'ordered'`, `'bullet'`, `'checked'`, `'unchecked'`). Returns `''` if missing. */
export function getListType(node: TNode): string {
  return asString(node.attributes.list) ?? '';
}

/** Get the table row identifier, if present. */
export function getTableRow(node: TNode): string | undefined {
  return asString(node.attributes.table);
}

/** Get the text direction (`'rtl'`), if set. */
export function getDirection(node: TNode): string | undefined {
  return asString(node.attributes.direction);
}

/** Get the text alignment (`'center'`, `'right'`, `'justify'`), if set. */
export function getAlign(node: TNode): string | undefined {
  return asString(node.attributes.align);
}

/** Get the indent level, if set. */
export function getIndent(node: TNode): number | undefined {
  return asNumber(node.attributes.indent);
}

// ─── Inline / embed attributes ──────────────────────────────────────────────

/** Get the alt text from an image node. Returns `''` if missing. */
export function getAlt(node: TNode): string {
  return asString(node.attributes.alt) ?? '';
}

/** Get the link URL from a node's `link` attribute. */
export function getLinkHref(node: TNode): string | undefined {
  return asString(node.attributes.link);
}

/** Get the width attribute. */
export function getWidth(node: TNode): string | undefined {
  return asString(node.attributes.width);
}

/** Get the height attribute. */
export function getHeight(node: TNode): string | undefined {
  return asString(node.attributes.height);
}
