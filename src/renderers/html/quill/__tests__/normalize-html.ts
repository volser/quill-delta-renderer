/// <reference lib="dom" />

/**
 * HTML normalization utilities for comparing Quill's `root.innerHTML`
 * with our renderer output.
 *
 * Adapted from Quill's own `toEqualHTML` matcher:
 * https://github.com/slab/quill/blob/main/packages/quill/test/unit/__helpers__/expect.ts
 *
 * Handles:
 * - Removing `.ql-ui` editor-only elements
 * - Removing `contenteditable` attributes
 * - Normalizing `.ql-formula` elements (strips KaTeX rendering, keeps data-value)
 * - Normalizing inline styles (color format, trailing semicolons)
 * - Sorting HTML attributes alphabetically for consistent comparison
 * - Sorting class names alphabetically
 * - Stripping insignificant whitespace
 * - Normalizing self-closing tags (`<img ... />` → `<img ...>`)
 */

/**
 * Convert `rgb(r, g, b)` color values to `#rrggbb` hex format.
 * jsdom serializes inline styles with rgb() notation, while our renderer
 * uses hex notation. Normalizing to hex makes them comparable.
 */
function rgbToHex(rgb: string): string {
  return rgb.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g, (_match, r, g, b) => {
    const toHex = (n: string) => Number.parseInt(n, 10).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  });
}

/**
 * Normalize an inline style string for comparison:
 * - Convert rgb() to hex
 * - Remove trailing semicolons
 * - Normalize spacing
 */
function normalizeStyleValue(style: string): string {
  let normalized = rgbToHex(style);
  // Remove trailing semicolons and extra spaces
  normalized = normalized.replace(/;\s*$/, '');
  // Normalize spaces around colons and semicolons
  normalized = normalized.replace(/\s*:\s*/g, ': ').replace(/\s*;\s*/g, '; ');
  return normalized.trim();
}

/**
 * Sort all attributes on an element (and its descendants) alphabetically.
 * Also normalizes class names and style values.
 */
function normalizeAttributes(element: Element): void {
  // Normalize style attribute values
  const style = element.getAttribute('style');
  if (style) {
    element.setAttribute('style', normalizeStyleValue(style));
  }

  // Sort class names alphabetically
  const classAttr = element.getAttribute('class');
  if (classAttr) {
    const sorted = classAttr.split(/\s+/).filter(Boolean).sort().join(' ');
    element.setAttribute('class', sorted);
  }

  // Sort attributes alphabetically
  const attributes = Array.from(element.attributes);
  const sorted = attributes.sort((a, b) => a.name.localeCompare(b.name));

  while (element.attributes.length > 0) {
    element.removeAttribute(element.attributes[0]!.name);
  }

  for (const attr of sorted) {
    element.setAttribute(attr.name, attr.value);
  }

  for (const child of Array.from(element.children)) {
    normalizeAttributes(child);
  }
}

/**
 * Normalize an HTML string for comparison.
 *
 * 1. Strips newlines and leading whitespace (multiline formatting)
 * 2. Removes all `.ql-ui` elements (editor UI markers)
 * 3. Removes `contenteditable` attributes
 * 4. Normalizes `.ql-formula` elements: replaces inner HTML with `data-value` text
 * 5. Normalizes style values (rgb→hex, trailing semicolons)
 * 6. Sorts class names and attributes alphabetically on every element
 * 7. Normalizes self-closing tags
 */
export function normalizeHtml(html: string): string {
  // Strip insignificant whitespace (newlines + leading spaces)
  let cleaned = html.replace(/\n\s*/g, '');

  // Normalize self-closing tags: `<img ... />` → `<img ...>`
  cleaned = cleaned.replace(/\s*\/>/g, '>');

  const container = document.createElement('div');
  container.innerHTML = cleaned;

  // Remove .ql-ui editor marker elements
  for (const el of Array.from(container.querySelectorAll('.ql-ui'))) {
    el.remove();
  }

  // Remove contenteditable attributes
  for (const el of Array.from(container.querySelectorAll('[contenteditable]'))) {
    el.removeAttribute('contenteditable');
  }

  // Normalize formula: replace KaTeX inner HTML with plain data-value text
  for (const el of Array.from(container.querySelectorAll('.ql-formula'))) {
    const dataValue = el.getAttribute('data-value') ?? '';
    el.textContent = dataValue;
  }

  // Sort attributes alphabetically and normalize values
  normalizeAttributes(container);

  return container.innerHTML;
}
