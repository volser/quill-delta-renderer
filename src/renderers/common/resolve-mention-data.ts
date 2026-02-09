import type { TNode } from '../../core/ast-types';

export interface MentionData {
  name: string;
  href: string;
  className?: string;
  target?: string;
}

/**
 * Extract mention properties from a mention embed node.
 *
 * Resolves the `href` from the `end-point` and `slug` fields,
 * falling back to `'about:blank'` if neither is present.
 */
export function resolveMentionData(node: TNode): MentionData {
  const raw = (node.data ?? node.attributes.mention ?? {}) as Record<string, unknown>;
  const slug = raw.slug as string | undefined;
  const endpoint = raw['end-point'] as string | undefined;

  return {
    name: String(raw.name ?? ''),
    href: endpoint && slug ? `${endpoint}/${slug}` : 'about:blank',
    className: raw.class as string | undefined,
    target: raw.target as string | undefined,
  };
}
