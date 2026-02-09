import type { BlockDescriptor, TNode } from '../../core/ast-types';
import { BaseRenderer } from '../../core/base-renderer';
import type { ResolvedAttrs } from './common/resolved-attrs';
import {
  EMPTY_RESOLVED_ATTRS,
  hasResolvedAttrs,
  mergeResolvedAttrs,
} from './common/resolved-attrs';

/** Lookup table for HTML character escaping. */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escape HTML special characters to prevent XSS.
 * Uses a single-pass regex replacement for performance.
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]!);
}

/**
 * Serialize a {@link ResolvedAttrs} object into an HTML attribute string.
 *
 * Returns a leading space if non-empty, or an empty string.
 *
 * @example
 * ```ts
 * serializeResolvedAttrs({ style: { color: 'red' }, classes: ['bold'] })
 * // ' class="bold" style="color:red"'
 * ```
 */
export function serializeResolvedAttrs(resolved: ResolvedAttrs | undefined): string {
  if (!resolved || !hasResolvedAttrs(resolved)) return '';

  const parts: string[] = [];

  if (resolved.classes && resolved.classes.length > 0) {
    parts.push(`class="${resolved.classes.map(escapeHtml).join(' ')}"`);
  }

  if (resolved.style && Object.keys(resolved.style).length > 0) {
    const styleStr = Object.entries(resolved.style)
      .map(([k, v]) => `${escapeHtml(k)}:${escapeHtml(v)}`)
      .join(';');
    parts.push(`style="${styleStr}"`);
  }

  if (resolved.attrs) {
    for (const [key, value] of Object.entries(resolved.attrs)) {
      if (value !== '') {
        parts.push(`${escapeHtml(key)}="${escapeHtml(value)}"`);
      }
    }
  }

  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
}

/**
 * Shared base for all HTML string renderers.
 *
 * Handles HTML-specific concerns:
 * - Text escaping
 * - String concatenation of children
 * - Serialization of {@link ResolvedAttrs} to HTML attribute strings
 * - Rendering of declarative block/mark descriptors
 *
 * Subclasses provide their own `RendererConfig<string, ResolvedAttrs>` to control
 * how blocks and marks are rendered.
 */
export abstract class BaseHtmlRenderer extends BaseRenderer<string, ResolvedAttrs> {
  // ─── Attrs operations (HTML-specific) ──────────────────────────────────

  protected emptyAttrs(): ResolvedAttrs {
    return EMPTY_RESOLVED_ATTRS;
  }

  protected mergeAttrs(target: ResolvedAttrs, source: ResolvedAttrs): ResolvedAttrs {
    return mergeResolvedAttrs(target, source);
  }

  protected hasAttrs(attrs: ResolvedAttrs): boolean {
    return hasResolvedAttrs(attrs);
  }

  // ─── Output operations ────────────────────────────────────────────────

  protected joinChildren(children: string[]): string {
    return children.join('');
  }

  protected renderText(text: string): string {
    return escapeHtml(text);
  }

  /**
   * Wrap content in a `<span>` with the given collected attributor attrs.
   * Used when a text node has attributor marks but no element marks.
   */
  protected wrapWithAttrs(content: string, attrs: ResolvedAttrs): string {
    const attrStr = serializeResolvedAttrs(attrs);
    return `<span${attrStr}>${content}</span>`;
  }

  /**
   * Render a simple tag mark: `<tag [collected-attrs]>content</tag>`.
   */
  protected renderSimpleTag(tag: string, content: string, collectedAttrs?: ResolvedAttrs): string {
    const attrStr = serializeResolvedAttrs(collectedAttrs);
    return `<${tag}${attrStr}>${content}</${tag}>`;
  }

  /**
   * Render a declarative block descriptor:
   * `<tag [resolvedAttrs]>{children || '<br/>'}</tag>`.
   */
  protected renderBlockFromDescriptor(
    descriptor: BlockDescriptor,
    node: TNode,
    childrenOutput: string,
    resolvedAttrs: ResolvedAttrs,
  ): string {
    const tag = typeof descriptor.tag === 'function' ? descriptor.tag(node) : descriptor.tag;

    const attrStr = serializeResolvedAttrs(resolvedAttrs);

    if (descriptor.selfClosing) {
      return `<${tag}${attrStr}>`;
    }

    const content = childrenOutput || '<br/>';
    return `<${tag}${attrStr}>${content}</${tag}>`;
  }
}
