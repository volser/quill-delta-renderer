import { d, renderDelta } from './test-helpers';

describe('MarkdownRenderer – lists', () => {
  it('should render bullet list', () => {
    const md = renderDelta(
      d(
        { insert: 'Item one' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Item two' },
        { insert: '\n', attributes: { list: 'bullet' } },
      ),
    );
    expect(md).toBe('*   Item one\n*   Item two');
  });

  it('should render ordered list', () => {
    const md = renderDelta(
      d(
        { insert: 'First' },
        { insert: '\n', attributes: { list: 'ordered' } },
        { insert: 'Second' },
        { insert: '\n', attributes: { list: 'ordered' } },
      ),
    );
    expect(md).toBe('1. First\n2. Second');
  });

  it('should render checklist', () => {
    const md = renderDelta(
      d(
        { insert: 'Done' },
        { insert: '\n', attributes: { list: 'checked' } },
        { insert: 'Not done' },
        { insert: '\n', attributes: { list: 'unchecked' } },
      ),
    );
    expect(md).toBe('- [x] Done\n- [ ] Not done');
  });

  it('should render nested bullet lists', () => {
    const md = renderDelta(
      d(
        { insert: 'root bullet list' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'inner bullet list' },
        { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
        { insert: 'inner bullet list' },
        { insert: '\n', attributes: { list: 'bullet', indent: 2 } },
      ),
    );
    expect(md).toBe(
      '*   root bullet list\n    *   inner bullet list\n        *   inner bullet list',
    );
  });

  it('should render nested ordered lists', () => {
    const md = renderDelta(
      d(
        { insert: 'root ordered list' },
        { insert: '\n', attributes: { list: 'ordered' } },
        { insert: 'inner ordered list 1' },
        { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
        { insert: 'inner ordered list 2' },
        { insert: '\n', attributes: { list: 'ordered', indent: 2 } },
      ),
    );
    expect(md).toBe(
      '1. root ordered list\n    1. inner ordered list 1\n        1. inner ordered list 2',
    );
  });

  it('should render mixed lists', () => {
    const md = renderDelta(
      d(
        { insert: 'root ordered list' },
        { insert: '\n', attributes: { list: 'ordered' } },
        { insert: 'inner bullet list' },
        { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
        { insert: 'inner ordered list' },
        { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
        { insert: 'inner bullet list' },
        { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
        { insert: 'inner ordered list' },
        { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
      ),
    );
    expect(md).toBe(
      [
        '1. root ordered list',
        '    *   inner bullet list',
        '    1. inner ordered list',
        '    *   inner bullet list',
        '    2. inner ordered list',
      ].join('\n'),
    );
  });

  it('should handle adjacent different-type lists', () => {
    const md = renderDelta(
      d(
        { insert: 'Bullet item one' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Bullet item two' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Ordered item one' },
        { insert: '\n', attributes: { list: 'ordered' } },
        { insert: 'Ordered item two' },
        { insert: '\n', attributes: { list: 'ordered' } },
      ),
    );
    expect(md).toBe(
      [
        '*   Bullet item one',
        '*   Bullet item two',
        '1. Ordered item one',
        '2. Ordered item two',
      ].join('\n'),
    );
  });
});
