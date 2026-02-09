import type { TNode } from '../../core/ast-types';
import { asString } from './node-attributes';

export interface MentionData {
  name: string;
  href: string;
  className?: string;
  target?: string;
}

/**
 * Safely narrow a value to a `Record<string, unknown>`.
 * Returns an empty object if the value is not an object.
 */
function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Extract mention properties from a mention embed node.
 *
 * Resolves the `href` from the `end-point` and `slug` fields,
 * falling back to `'about:blank'` if neither is present.
 */
export function resolveMentionData(node: TNode): MentionData {
  const raw = asRecord(node.data) ?? asRecord(node.attributes.mention);
  const slug = asString(raw.slug);
  const endpoint = asString(raw['end-point']);

  return {
    name: String(raw.name ?? ''),
    href: endpoint && slug ? `${endpoint}/${slug}` : 'about:blank',
    className: asString(raw.class),
    target: asString(raw.target),
  };
}
