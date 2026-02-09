/**
 * Default mark nesting priorities.
 * Higher value = wraps outer (applied first in nesting order).
 *
 * Example with priorities: link(100) > color(40) > bold(10)
 * Result: `<a><span style="color:red"><b>text</b></span></a>`
 */
export const DEFAULT_MARK_PRIORITIES: Record<string, number> = {
  link: 100,
  background: 50,
  color: 40,
  bold: 10,
  italic: 10,
  underline: 10,
  strike: 10,
  script: 5,
};
