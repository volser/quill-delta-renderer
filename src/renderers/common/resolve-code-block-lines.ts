import type { TNode } from '../../core/ast-types';

/**
 * Resolved code block content from a `code-block-container` node.
 */
export interface CodeBlockLines {
  /** The programming language if present and meaningful, or `undefined`. */
  language: string | undefined;
  /** The text content of each code line. */
  lines: string[];
}

/**
 * Extract the language and raw text lines from a `code-block-container` node.
 *
 * Shared by the React and Markdown renderers to avoid duplicating
 * the child-iteration logic for code blocks.
 *
 * @param containerNode - A `code-block-container` AST node produced by `codeBlockGrouper`
 */
export function resolveCodeBlockLines(containerNode: TNode): CodeBlockLines {
  const firstChild = containerNode.children[0];
  const rawLang = firstChild?.attributes['code-block'];
  const language = typeof rawLang === 'string' && rawLang !== 'true' ? rawLang : undefined;

  const lines = containerNode.children.map((child) =>
    child.children.map((c) => String(c.data ?? '')).join(''),
  );

  return { language, lines };
}
