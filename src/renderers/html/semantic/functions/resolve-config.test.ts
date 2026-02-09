import { describe, expect, it } from 'vitest';
import { resolveConfig } from './resolve-config';

describe('resolveConfig', () => {
  it('should apply all defaults when called with no config', () => {
    const cfg = resolveConfig();
    expect(cfg.paragraphTag).toBe('p');
    expect(cfg.orderedListTag).toBe('ol');
    expect(cfg.bulletListTag).toBe('ul');
    expect(cfg.listItemTag).toBe('li');
    expect(cfg.classPrefix).toBe('ql');
    expect(cfg.inlineStyles).toBe(false);
    expect(cfg.allowBackgroundClasses).toBe(false);
    expect(cfg.linkTarget).toBe('_blank');
    expect(cfg.linkRel).toBeUndefined();
    expect(cfg.encodeHtml).toBe(true);
  });

  it('should override provided values', () => {
    const cfg = resolveConfig({ paragraphTag: 'div', classPrefix: 'cu', linkTarget: '' });
    expect(cfg.paragraphTag).toBe('div');
    expect(cfg.classPrefix).toBe('cu');
    expect(cfg.linkTarget).toBe('');
  });

  it('should resolve inlineStyles: true to empty object', () => {
    const cfg = resolveConfig({ inlineStyles: true });
    expect(cfg.inlineStyles).toEqual({});
  });

  it('should pass through inlineStyles object', () => {
    const overrides = { font: { serif: 'font-family: serif' } };
    const cfg = resolveConfig({ inlineStyles: overrides });
    expect(cfg.inlineStyles).toBe(overrides);
  });
});
