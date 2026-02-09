import { d, renderDelta } from './test-helpers';

describe('MarkdownRenderer – spacing', () => {
  it('should render simple text', () => {
    const md = renderDelta(d({ insert: 'test' }));
    expect(md).toBe('test');
  });

  it('should render empty delta as empty string', () => {
    const md = renderDelta({ ops: [] });
    expect(md).toBe('');
  });

  it('should preserve paragraph spacing (single newline)', () => {
    const md = renderDelta(
      d(
        { insert: 'This is a paragraph.' },
        { insert: '\n' },
        { insert: 'This is another paragraph.' },
        { insert: '\n' },
      ),
    );
    expect(md).toBe('This is a paragraph.\nThis is another paragraph.');
  });

  it('should handle horizontal rule spacing', () => {
    const md = renderDelta(
      d(
        { insert: 'This is a paragraph.' },
        { insert: '\n' },
        { insert: { divider: true } },
        { insert: 'This is another paragraph.' },
        { insert: '\n' },
      ),
    );
    expect(md).toBe('This is a paragraph.\n* * *\nThis is another paragraph.');
  });

  it('should handle list spacing with empty paragraph between groups', () => {
    const md = renderDelta(
      d(
        { insert: 'List 1, first item' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'List 1, second item' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: '\n' },
        { insert: 'List 2, first item' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'List 2, second item' },
        { insert: '\n', attributes: { list: 'bullet' } },
      ),
    );
    expect(md).toBe(
      [
        '*   List 1, first item',
        '*   List 1, second item',
        '',
        '*   List 2, first item',
        '*   List 2, second item',
      ].join('\n'),
    );
  });

  it('should handle headers and lists spacing', () => {
    const md = renderDelta(
      d(
        { insert: 'Key Points:' },
        { insert: '\n', attributes: { header: 3 } },
        { insert: 'This is a test document for demonstration purposes.' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'It includes headers, bullets, and bilingual content.' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'The goal is to keep it concise and clear.' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Example Bullets:' },
        { insert: '\n', attributes: { header: 4 } },
        { insert: 'Simple and easy to read.' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Organized structure.' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Useful for quick reference.' },
        { insert: '\n', attributes: { list: 'bullet' } },
      ),
    );
    expect(md).toBe(
      [
        '### Key Points:',
        '*   This is a test document for demonstration purposes.',
        '*   It includes headers, bullets, and bilingual content.',
        '*   The goal is to keep it concise and clear.',
        '#### Example Bullets:',
        '*   Simple and easy to read.',
        '*   Organized structure.',
        '*   Useful for quick reference.',
      ].join('\n'),
    );
  });
});
