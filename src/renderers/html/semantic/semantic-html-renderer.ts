import type { TNode } from '../../../core/ast-types';
import { BaseHtmlRenderer, escapeHtml } from '../base-html-renderer';
import { buildRendererConfig } from './functions/build-renderer-config';
import { resolveConfig } from './functions/resolve-config';
import type {
  AfterRenderCallback,
  BeforeRenderCallback,
  CustomBlotRenderer,
  RenderGroupType,
  SemanticHtmlConfig,
} from './semantic-html-config';
import type { ResolvedConfig } from './types/resolved-config';

/**
 * Renders an AST into clean, configurable HTML.
 *
 * Produces markup compatible with quill-delta-to-html output by default,
 * using `ql-*` CSS classes for formatting. All aspects are configurable:
 * class prefix, tag names, inline styles mode, link behavior, and more.
 *
 * Suitable for CMS output, email, read-only display, or any context
 * where clean, configurable HTML matters.
 *
 * @example
 * ```ts
 * // Default: quill-delta-to-html compatible output
 * const renderer = new SemanticHtmlRenderer();
 * const html = renderer.render(ast);
 * ```
 *
 * @example
 * ```ts
 * // Customized output
 * const renderer = new SemanticHtmlRenderer({
 *   classPrefix: 'article',
 *   paragraphTag: 'div',
 *   linkTarget: '',
 *   inlineStyles: true,
 * });
 * ```
 */
export class SemanticHtmlRenderer extends BaseHtmlRenderer {
  private readonly cfg: ResolvedConfig;
  private beforeRenderCb: BeforeRenderCallback | undefined;
  private afterRenderCb: AfterRenderCallback | undefined;
  private customBlotRenderer: CustomBlotRenderer | undefined;

  constructor(config?: SemanticHtmlConfig) {
    const cfg = resolveConfig(config);
    super(buildRendererConfig(cfg));
    this.cfg = cfg;
  }

  // ─── Hooks ──────────────────────────────────────────────────────────────

  /**
   * Register a callback called before rendering each block-level group.
   * If the callback returns a non-empty string, it replaces the default output.
   */
  beforeRender(cb: BeforeRenderCallback): void {
    this.beforeRenderCb = cb;
  }

  /**
   * Register a callback called after rendering each block-level group.
   * The callback receives the generated HTML and can modify it.
   */
  afterRender(cb: AfterRenderCallback): void {
    this.afterRenderCb = cb;
  }

  /**
   * Register a callback for rendering custom embed types (blots).
   * Called for embed nodes that have no built-in block handler.
   */
  renderCustomWith(cb: CustomBlotRenderer): void {
    this.customBlotRenderer = cb;
  }

  // ─── Override renderNode for hooks and custom blots ─────────────────────

  protected override renderNode(node: TNode): string {
    if (node.type === 'root') {
      return this.renderChildren(node);
    }

    if (node.type === 'text') {
      return this.renderTextNode(node);
    }

    // Try custom blot renderer for unknown types
    if (!this.blocks[node.type] && this.customBlotRenderer) {
      return this.customBlotRenderer(node, null);
    }

    const groupType = this.getGroupType(node);

    // Before-render hook
    if (this.beforeRenderCb && groupType) {
      const replaced = this.beforeRenderCb(groupType, node);
      if (replaced) {
        if (this.afterRenderCb) {
          return this.afterRenderCb(groupType, replaced);
        }
        return replaced;
      }
    }

    // Standard rendering
    const blockHandler = this.blocks[node.type];
    let html: string;
    if (blockHandler) {
      const childrenOutput = this.renderChildren(node);
      html = blockHandler(node, childrenOutput);
    } else {
      html = this.renderChildren(node);
    }

    // After-render hook
    if (this.afterRenderCb && groupType) {
      html = this.afterRenderCb(groupType, html);
    }

    return html;
  }

  // ─── Override renderText for encodeHtml=false ───────────────────────────

  protected override renderText(text: string): string {
    return this.cfg.encodeHtml ? escapeHtml(text) : text;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private getGroupType(node: TNode): RenderGroupType | null {
    switch (node.type) {
      case 'list':
        return 'list';
      case 'table':
        return 'table';
      case 'video':
        return 'video';
      case 'text':
        return null;
      default:
        if (node.isInline) return null;
        return 'block';
    }
  }
}
