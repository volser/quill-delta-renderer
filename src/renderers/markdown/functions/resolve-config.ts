import type { MarkdownConfig, ResolvedMarkdownConfig } from '../types/markdown-config';

/**
 * Apply defaults to produce a fully resolved config.
 * @internal
 */
export function resolveConfig(config?: MarkdownConfig): ResolvedMarkdownConfig {
  return {
    bulletChar: config?.bulletChar ?? '*',
    bulletPadding: config?.bulletPadding ?? '   ',
    indentString: config?.indentString ?? '    ',
    hrString: config?.hrString ?? '* * *',
    fenceChar: config?.fenceChar ?? '```',
  };
}
