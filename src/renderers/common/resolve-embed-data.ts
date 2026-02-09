import type { TNode } from '../../core/ast-types';
import { getAlt, getHeight, getLinkHref, getWidth } from './node-attributes';

// ─── Image ──────────────────────────────────────────────────────────────────

export interface ImageData {
  src: string;
  alt: string;
  width?: string;
  height?: string;
  linkHref?: string;
}

/**
 * Extract image properties from an image embed node.
 * Returns `null` if the source URL is empty.
 */
export function resolveImageData(node: TNode): ImageData | null {
  const data = node.data;
  const src =
    typeof data === 'string' ? data : String((data as Record<string, unknown>)?.url ?? data ?? '');
  if (!src) return null;

  return {
    src,
    alt: getAlt(node),
    width: getWidth(node),
    height: getHeight(node),
    linkHref: getLinkHref(node),
  };
}

// ─── Video ──────────────────────────────────────────────────────────────────

/**
 * Extract the source URL from a video embed node.
 * Returns `null` if the source URL is empty.
 */
export function resolveVideoSrc(node: TNode): string | null {
  const data = node.data;
  const src =
    typeof data === 'string' ? data : String((data as Record<string, unknown>)?.url ?? data ?? '');
  return src || null;
}

// ─── Formula ────────────────────────────────────────────────────────────────

/**
 * Extract the formula text from a formula embed node.
 */
export function resolveFormulaText(node: TNode): string {
  const data = node.data as string | Record<string, unknown>;
  return typeof data === 'string' ? data : String(data);
}
