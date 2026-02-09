/**
 * Handle multi-line list item content by padding continuation lines.
 *
 * Matches the behavior of the existing `getContentForListItem()` function.
 */
export function padListItemContent(content: string, padding: string): string {
  const lines = content.split(/\r?\n/);

  return lines.reduce((text, line, idx) => {
    if (line.trim()) {
      text += (idx > 0 ? padding : '') + line;
    }
    return text;
  }, '');
}
