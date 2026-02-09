import { d, renderDelta } from './test-helpers';

describe('MarkdownRenderer – config options', () => {
  it('should support custom bullet character', () => {
    const md = renderDelta(
      d({ insert: 'Item' }, { insert: '\n', attributes: { list: 'bullet' } }),
      { bulletChar: '-', bulletPadding: ' ' },
    );
    expect(md).toBe('- Item');
  });

  it('should support custom horizontal rule', () => {
    const md = renderDelta(
      d(
        { insert: 'Before' },
        { insert: '\n' },
        { insert: { divider: true } },
        { insert: 'After' },
        { insert: '\n' },
      ),
      { hrString: '---' },
    );
    expect(md).toBe('Before\n---\nAfter');
  });

  it('should support custom fence characters', () => {
    const md = renderDelta(
      d({ insert: 'code' }, { insert: '\n', attributes: { 'code-block': true } }),
      { fenceChar: '~~~' },
    );
    expect(md).toBe('~~~\ncode\n~~~');
  });

  it('should support custom indent string', () => {
    const md = renderDelta(
      d(
        { insert: 'root' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'nested' },
        { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
      ),
      { indentString: '  ' },
    );
    expect(md).toBe('*   root\n  *   nested');
  });
});
