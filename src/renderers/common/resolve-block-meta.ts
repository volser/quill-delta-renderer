import type { TNode } from '../../core/ast-types';

// ─── Code Block ─────────────────────────────────────────────────────────────

export interface CodeBlockMeta {
  /** Full class name, e.g. `'ql-syntax language-javascript'` or `'ql-syntax'`. */
  className: string;
  /** The language string if present and meaningful, or `undefined`. */
  language?: string;
}

/**
 * Resolve the CSS class name and language from a code-block node's attributes.
 *
 * @param node - The code-block AST node
 * @param classPrefix - The configured class prefix (e.g. `'ql'`)
 */
export function resolveCodeBlockMeta(node: TNode, classPrefix: string): CodeBlockMeta {
  const lang = node.attributes['code-block'];
  const syntaxClass = `${classPrefix}-syntax`;

  if (typeof lang === 'string' && lang !== 'true') {
    return {
      className: `${syntaxClass} language-${lang}`,
      language: lang,
    };
  }

  return { className: syntaxClass };
}

// ─── List Item ──────────────────────────────────────────────────────────────

/**
 * Resolve the `data-checked` value for a list-item node.
 * Returns `'true'` for checked, `'false'` for unchecked, or `undefined`
 * for non-checklist items.
 */
export function resolveCheckedState(node: TNode): 'true' | 'false' | undefined {
  const listType = node.attributes.list as string;
  if (listType === 'checked') return 'true';
  if (listType === 'unchecked') return 'false';
  return undefined;
}

// ─── Link ───────────────────────────────────────────────────────────────────

export interface LinkMeta {
  target?: string;
  rel?: string;
}

/**
 * Resolve link `target` and `rel` attributes from a node, with fallback
 * to the renderer's global config values.
 *
 * Per-op attributes on the node override the global config.
 */
export function resolveLinkMeta(node: TNode, defaultTarget: string, defaultRel?: string): LinkMeta {
  const target =
    typeof node.attributes.target === 'string' ? node.attributes.target : defaultTarget;
  const rel = typeof node.attributes.rel === 'string' ? node.attributes.rel : defaultRel;

  return {
    target: target || undefined,
    rel: rel || undefined,
  };
}
