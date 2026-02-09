import { BaseHtmlRenderer, escapeHtml } from '../base-html-renderer';
import { buildRendererConfig } from './functions/build-renderer-config';
import { resolveConfig } from './functions/resolve-config';
import type { ResolvedConfig } from './types/resolved-config';
import type { SemanticHtmlConfig } from './types/semantic-html-config';

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

  constructor(config?: SemanticHtmlConfig) {
    const cfg = resolveConfig(config);
    super(buildRendererConfig(cfg));
    this.cfg = cfg;
  }

  // ─── Override renderText for encodeHtml=false ───────────────────────────

  protected override renderText(text: string): string {
    return this.cfg.encodeHtml ? escapeHtml(text) : text;
  }
}
