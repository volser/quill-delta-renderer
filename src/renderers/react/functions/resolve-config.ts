import type { ReactRendererConfig, ResolvedReactConfig } from '../types/react-config';

/**
 * Resolves a partial `ReactRendererConfig` into a fully-populated
 * `ResolvedReactConfig` by applying defaults for all missing values.
 */
export function resolveConfig(config?: ReactRendererConfig): ResolvedReactConfig {
  const c = config ?? {};

  return {
    classPrefix: c.classPrefix ?? 'ql',
    linkTarget: c.linkTarget ?? '_blank',
    linkRel: c.linkRel,
    components: c.components ?? {},
    customTag: c.customTag,
    urlSanitizer: c.urlSanitizer,
  };
}
