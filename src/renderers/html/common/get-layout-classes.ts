import type { TNode } from '../../../core/ast-types';

/**
 * Get CSS classes for block-level layout attributes (indent, align, direction)
 * using the given class prefix.
 *
 * This is the shared core logic used by both QuillHtmlRenderer (with `'ql'` prefix)
 * and SemanticHtmlRenderer (with a configurable prefix).
 */
export function getLayoutClasses(node: TNode, prefix: string): string[] {
  const classes: string[] = [];

  // Order matches Quill's Parchment attributor application order:
  // direction → align → indent
  const direction = node.attributes.direction as string | undefined;
  if (direction) {
    classes.push(`${prefix}-direction-${direction}`);
  }

  const align = node.attributes.align as string | undefined;
  if (align) {
    classes.push(`${prefix}-align-${align}`);
  }

  const indent = node.attributes.indent as number | undefined;
  if (indent != null && indent > 0) {
    classes.push(`${prefix}-indent-${indent}`);
  }

  return classes;
}
