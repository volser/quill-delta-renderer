import type { TNode } from '../../../core/ast-types';

/**
 * Extract the programming language from a code-block node's attributes.
 *
 * Handles both string values (`'javascript'`) and nested objects
 * (`{ 'code-block': 'javascript' }`).
 *
 * Returns `''` for generic / `'plain'` / `true` code blocks.
 */
export function resolveCodeBlockLanguage(node: TNode): string {
  const lang = node.attributes['code-block'];

  if (typeof lang === 'string' && lang !== 'true' && lang !== 'plain') {
    return lang;
  }

  if (typeof lang === 'object' && lang !== null) {
    const inner = (lang as Record<string, unknown>)['code-block'];
    if (typeof inner === 'string' && inner !== 'true' && inner !== 'plain') {
      return inner;
    }
  }

  return '';
}
