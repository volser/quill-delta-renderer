import { DEFAULT_MARK_PRIORITIES } from '../../../common/default-mark-priorities';
import type { SimpleRendererConfig } from '../../../core/simple-renderer';
import type { ResolvedMarkdownConfig } from '../types/markdown-config';
import { resolveCodeBlockLanguage } from './resolve-code-block-language';

/**
 * Build a full `SimpleRendererConfig<string>` from the resolved markdown config.
 *
 * Defines all block handlers (paragraph, header, blockquote, code-block,
 * image, video, divider, formula, table pass-throughs) and mark handlers
 * (bold, italic, strike, code, link + passthrough for unsupported marks).
 */
export function buildRendererConfig(cfg: ResolvedMarkdownConfig): SimpleRendererConfig<string> {
  return {
    markPriorities: DEFAULT_MARK_PRIORITIES,

    blocks: {
      paragraph: (_node, children) => {
        return children || '';
      },

      header: (node, children) => {
        const level = node.attributes.header as number;
        const prefix = '#'.repeat(level);
        return `${prefix} ${children}`;
      },

      blockquote: (_node, children) => {
        const content = children || '';
        return content
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n');
      },

      'code-block': (node, children) => {
        // Standalone code block (when used without codeBlockGrouper).
        // Within a code-block-container this is handled by the renderer override.
        const lang = resolveCodeBlockLanguage(node);
        return `${cfg.fenceChar}${lang}\n${children}\n${cfg.fenceChar}`;
      },

      image: (node) => {
        const data = node.data;
        const src =
          typeof data === 'string'
            ? data
            : String((data as Record<string, unknown>)?.url ?? data ?? '');
        const alt = (node.attributes.alt as string) ?? '';
        return `![${alt}](${src})`;
      },

      video: (node) => {
        const data = node.data;
        return typeof data === 'string'
          ? data
          : String((data as Record<string, unknown>)?.url ?? data ?? '');
      },

      divider: () => cfg.hrString,

      formula: (node) => {
        const data = node.data as string | Record<string, unknown>;
        return typeof data === 'string' ? data : String(data);
      },

      // Table blocks — basic passthrough rendering.
      // A full table→markdown converter can be added via withBlock().
      table: (_node, children) => children,
      'table-row': (_node, children) => children,
      'table-cell': (_node, children) => children,
    },

    marks: {
      bold: (content) => `**${content}**`,
      italic: (content) => `_${content}_`,
      strike: (content) => `~~${content}~~`,
      code: (content) => `\`${content}\``,
      link: (content, value) => `[${content}](${String(value)})`,

      // No native Markdown equivalents — pass content through
      underline: (content) => content as string,
      script: (content) => content as string,
      color: (content) => content as string,
      background: (content) => content as string,
      font: (content) => content as string,
      size: (content) => content as string,
    },
  };
}
