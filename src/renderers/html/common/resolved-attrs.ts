/**
 * HTML-specific collected attributes.
 *
 * Used by both the inline attributor system (marks that contribute
 * styles/classes to the parent element) and block attribute resolvers
 * (centralized block attribute computation) in HTML renderers.
 */
export interface ResolvedAttrs {
  /** CSS style properties, e.g. `{ color: 'red', 'background-color': '#ff0' }` */
  style?: Record<string, string>;
  /** CSS class names to add */
  classes?: string[];
  /** Arbitrary HTML attributes, e.g. `{ id: 'my-block', 'data-custom': '1' }` */
  attrs?: Record<string, string>;
}

/**
 * An empty `ResolvedAttrs` constant — avoids allocating a new object
 * every time a resolver has nothing to contribute.
 */
export const EMPTY_RESOLVED_ATTRS: ResolvedAttrs = Object.freeze({});

/**
 * Merge two `ResolvedAttrs` objects. Styles and attrs are shallow-merged
 * (source overwrites target on key conflict). Classes are concatenated.
 *
 * Returns a new object — inputs are not mutated.
 */
export function mergeResolvedAttrs(target: ResolvedAttrs, source: ResolvedAttrs): ResolvedAttrs {
  const style = target.style || source.style ? { ...target.style, ...source.style } : undefined;

  const classes =
    target.classes || source.classes
      ? [...(target.classes ?? []), ...(source.classes ?? [])]
      : undefined;

  const attrs = target.attrs || source.attrs ? { ...target.attrs, ...source.attrs } : undefined;

  return { style, classes, attrs };
}

/**
 * Check whether a `ResolvedAttrs` object has any content.
 */
export function hasResolvedAttrs(resolved: ResolvedAttrs): boolean {
  if (resolved.style && Object.keys(resolved.style).length > 0) return true;
  if (resolved.classes && resolved.classes.length > 0) return true;
  if (resolved.attrs && Object.keys(resolved.attrs).length > 0) return true;
  return false;
}
