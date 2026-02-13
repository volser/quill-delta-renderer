import type { SimpleRendererConfig } from '../../../core/simple-renderer';
import type { ResolvedMarkdownConfig } from '../types/markdown-config';
import { buildRendererConfig } from './build-renderer-config';

/**
 * Build config for extended Markdown: same as standard but underline and script
 * are rendered as HTML (`<u>`, `<sub>`, `<sup>`).
 */
export function buildExtendedRendererConfig(
  cfg: ResolvedMarkdownConfig,
): SimpleRendererConfig<string> {
  const base = buildRendererConfig(cfg);
  return {
    ...base,
    marks: {
      ...base.marks,
      underline: (content) => `<u>${content}</u>`,
      script: (content, value) =>
        value === 'super' ? `<sup>${content}</sup>` : `<sub>${content}</sub>`,
    },
  };
}
