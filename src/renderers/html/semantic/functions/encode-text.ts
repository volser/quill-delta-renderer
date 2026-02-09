import { escapeHtml } from '../../base-html-renderer';
import type { ResolvedConfig } from '../types/resolved-config';

/**
 * Conditionally HTML-encode text based on config.
 */
export function encodeText(text: string, cfg: ResolvedConfig): string {
  return cfg.encodeHtml ? escapeHtml(text) : text;
}
