/**
 * Groups consecutive elements in an array that satisfy a predicate.
 *
 * Returns a new array where consecutive elements matching the predicate
 * are collected into sub-arrays, and non-matching elements are left as-is.
 *
 * Ported from quill-delta-to-html's `groupConsecutiveElementsWhile`.
 *
 * @example
 * ```ts
 * groupConsecutiveElementsWhile(
 *   [1, 'a', 'b', 2, 'c'],
 *   (curr, prev) => typeof curr === typeof prev
 * );
 * // => [1, ['a', 'b'], 2, 'c']
 * ```
 */
export function groupConsecutiveElementsWhile<T>(
  arr: T[],
  predicate: (curr: T, prev: T) => boolean,
): Array<T | T[]> {
  const groups: T[][] = [];

  for (let i = 0; i < arr.length; i++) {
    const curr = arr[i]!;

    if (i > 0 && predicate(curr, arr[i - 1]!)) {
      groups[groups.length - 1]!.push(curr);
    } else {
      groups.push([curr]);
    }
  }

  return groups.map((g) => (g.length === 1 ? g[0]! : g));
}
