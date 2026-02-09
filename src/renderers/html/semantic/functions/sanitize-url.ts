import type { ResolvedConfig } from '../types/resolved-config';

/**
 * Run the configured URL sanitizer, returning empty string for rejected URLs.
 */
export function sanitizeUrl(url: string, cfg: ResolvedConfig): string {
  if (cfg.urlSanitizer) {
    const result = cfg.urlSanitizer(url);
    return result ?? '';
  }
  return url;
}
