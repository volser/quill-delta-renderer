import type { TNode } from '../../core/ast-types';
import { getAlt, getHeight, getLinkHref, getWidth } from './node-attributes';

// ─── Shared Helper ──────────────────────────────────────────────────────────

/**
 * Extract the source URL string from embed `data`.
 *
 * Handles three shapes:
 * - `string` → returned directly
 * - `{ url: string }` → extracts the `url` property
 * - anything else → `''`
 */
function resolveEmbedSrc(data: TNode['data']): string {
  if (typeof data === 'string') return data;
  if (data != null && typeof data === 'object' && 'url' in data) {
    return String((data as Record<string, unknown>).url ?? '');
  }
  return String(data ?? '');
}

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
  const src = resolveEmbedSrc(node.data);
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
  const src = resolveEmbedSrc(node.data);
  return src || null;
}

// ─── Formula ────────────────────────────────────────────────────────────────

/**
 * Extract the formula text from a formula embed node.
 * Returns `''` if data is missing or not a string.
 */
export function resolveFormulaText(node: TNode): string {
  return typeof node.data === 'string' ? node.data : '';
}
