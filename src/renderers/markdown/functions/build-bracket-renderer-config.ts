import type { SimpleRendererConfig } from '../../../core/simple-renderer';
import type { ResolvedMarkdownConfig } from '../types/markdown-config';
import { buildRendererConfig } from './build-renderer-config';

/** Build opening [STYLE attr=value ...] tag. Values are stringified; avoid ] in values. */
function styleTag(attrs: Record<string, string | boolean>): string {
  const parts = Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== '' && v !== false)
    .map(([k, v]) => `${k}=${v === true ? 'true' : String(v)}`);
  return parts.length ? `[STYLE ${parts.join(' ')}]` : '';
}

/**
 * Build config for bracket markdown ([STYLE] and other [TAG]...[/TAG] formats).
 * Same as standard but underline, script, color, background, font and size are
 * rendered as [STYLE attr=value ...]content[/STYLE]. Additional tag types can
 * be added by extending this config.
 */
export function buildBracketRendererConfig(
  _cfg: ResolvedMarkdownConfig,
): SimpleRendererConfig<string> {
  const base = buildRendererConfig(_cfg);
  return {
    ...base,
    marks: {
      ...base.marks,
      underline: (content) => {
        const open = styleTag({ underline: true });
        return open ? `${open}${content}[/STYLE]` : content;
      },
      script: (content, value) => {
        const attrs = value === 'super' ? { sup: true } : { sub: true };
        const open = styleTag(attrs);
        return open ? `${open}${content}[/STYLE]` : content;
      },
      color: (content, value) => {
        if (value == null || value === '') return content;
        const open = styleTag({ color: String(value) });
        return `${open}${content}[/STYLE]`;
      },
      background: (content, value) => {
        if (value == null || value === '') return content;
        const open = styleTag({ bg: String(value) });
        return `${open}${content}[/STYLE]`;
      },
      font: (content, value) => {
        if (value == null || value === '') return content;
        const open = styleTag({ font: String(value) });
        return `${open}${content}[/STYLE]`;
      },
      size: (content, value) => {
        if (value == null || value === '') return content;
        const open = styleTag({ size: String(value) });
        return `${open}${content}[/STYLE]`;
      },
    },
  };
}
