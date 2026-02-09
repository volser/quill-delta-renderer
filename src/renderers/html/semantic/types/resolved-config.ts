import type { TNode } from '../../../../core/ast-types';
import type { InlineStyleOverrides } from './semantic-html-config';

/**
 * Internal resolved config — all defaults applied, ready for use
 * by helper functions and the renderer config builder.
 */
export interface ResolvedConfig {
  paragraphTag: string;
  orderedListTag: string;
  bulletListTag: string;
  listItemTag: string;
  classPrefix: string;
  inlineStyles: false | InlineStyleOverrides;
  allowBackgroundClasses: boolean;
  linkTarget: string;
  linkRel: string | undefined;
  encodeHtml: boolean;
  urlSanitizer: ((url: string) => string | undefined) | undefined;
  customTag: ((format: string, node: TNode) => string | undefined) | undefined;
  customTagAttributes: ((node: TNode) => Record<string, string> | undefined) | undefined;
  customCssClasses: ((node: TNode) => string | string[] | undefined) | undefined;
  customCssStyles: ((node: TNode) => string | string[] | undefined) | undefined;
}
