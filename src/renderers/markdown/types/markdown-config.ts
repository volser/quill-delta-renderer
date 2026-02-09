/**
 * Configuration options for the {@link MarkdownRenderer}.
 *
 * All options are optional and have sensible defaults matching
 * the output of the existing `convertDeltaToMarkdown()` function.
 */
export interface MarkdownConfig {
  /**
   * Use single `\n` between paragraphs instead of `\n\n`.
   * @default false
   */
  singleLineBreakForPTag?: boolean;

  /**
   * Character used for unordered (bullet) list items.
   * @default '*'
   */
  bulletChar?: string;

  /**
   * Padding after the bullet character.
   * @default '   ' (3 spaces — matches existing output)
   */
  bulletPadding?: string;

  /**
   * Indentation string for nested list levels.
   * @default '    ' (4 spaces)
   */
  indentString?: string;

  /**
   * String used for horizontal rules (thematic breaks).
   * @default '* * *'
   */
  hrString?: string;

  /**
   * Characters used for fenced code blocks.
   * @default '```'
   */
  fenceChar?: string;
}

/**
 * Fully resolved configuration with all defaults applied.
 * @internal
 */
export interface ResolvedMarkdownConfig {
  singleLineBreakForPTag: boolean;
  bulletChar: string;
  bulletPadding: string;
  indentString: string;
  hrString: string;
  fenceChar: string;
}

/**
 * Apply defaults to produce a fully resolved config.
 * @internal
 */
export function resolveMarkdownConfig(config?: MarkdownConfig): ResolvedMarkdownConfig {
  return {
    singleLineBreakForPTag: config?.singleLineBreakForPTag ?? false,
    bulletChar: config?.bulletChar ?? '*',
    bulletPadding: config?.bulletPadding ?? '   ',
    indentString: config?.indentString ?? '    ',
    hrString: config?.hrString ?? '* * *',
    fenceChar: config?.fenceChar ?? '```',
  };
}
