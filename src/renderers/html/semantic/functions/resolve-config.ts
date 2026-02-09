import type { InlineStyleOverrides, SemanticHtmlConfig } from '../semantic-html-config';
import type { ResolvedConfig } from '../types/resolved-config';

/**
 * Resolves a partial `SemanticHtmlConfig` into a fully-populated `ResolvedConfig`
 * by applying defaults for all missing values.
 */
export function resolveConfig(config?: SemanticHtmlConfig): ResolvedConfig {
  const c = config ?? {};
  let inlineStyles: false | InlineStyleOverrides = false;
  if (c.inlineStyles === true) {
    inlineStyles = {};
  } else if (typeof c.inlineStyles === 'object') {
    inlineStyles = c.inlineStyles;
  }

  return {
    paragraphTag: c.paragraphTag ?? 'p',
    orderedListTag: c.orderedListTag ?? 'ol',
    bulletListTag: c.bulletListTag ?? 'ul',
    listItemTag: c.listItemTag ?? 'li',
    classPrefix: c.classPrefix ?? 'ql',
    inlineStyles,
    allowBackgroundClasses: c.allowBackgroundClasses ?? false,
    linkTarget: c.linkTarget ?? '_blank',
    linkRel: c.linkRel,
    encodeHtml: c.encodeHtml ?? true,
    urlSanitizer: c.urlSanitizer,
    customTag: c.customTag,
    customTagAttributes: c.customTagAttributes,
    customCssClasses: c.customCssClasses,
    customCssStyles: c.customCssStyles,
  };
}
