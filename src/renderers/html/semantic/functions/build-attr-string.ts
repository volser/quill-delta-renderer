/**
 * Build an HTML attribute string from a key-value record.
 * Empty values are skipped. Returns a leading space if non-empty.
 */
export function buildAttrString(attrs: Record<string, string>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== '') {
      parts.push(`${key}="${value}"`);
    }
  }
  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
}
