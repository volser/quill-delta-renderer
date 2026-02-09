import { escapeHtml } from '../base-html-renderer';

/**
 * Build an HTML attribute string from a key-value record.
 * Empty values are skipped. Keys and values are HTML-escaped to prevent XSS.
 * Returns a leading space if non-empty.
 */
export function buildAttrString(attrs: Record<string, string>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== '') {
      parts.push(`${escapeHtml(key)}="${escapeHtml(value)}"`);
    }
  }
  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
}

/**
 * Build an HTML class attribute string from an array of class names.
 * Falsy/empty values are filtered. Values are HTML-escaped to prevent XSS.
 * Returns a leading space if non-empty.
 */
export function buildClassAttr(classes: string[]): string {
  const filtered = classes.filter(Boolean);
  return filtered.length > 0 ? ` class="${filtered.map(escapeHtml).join(' ')}"` : '';
}
