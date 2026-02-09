import { d, renderDelta } from './test-helpers';

describe('MarkdownRenderer – blocks', () => {
  describe('headers', () => {
    it('should render h1', () => {
      const md = renderDelta(d({ insert: 'Title' }, { insert: '\n', attributes: { header: 1 } }));
      expect(md).toBe('# Title');
    });

    it('should render h2', () => {
      const md = renderDelta(
        d({ insert: 'Subtitle' }, { insert: '\n', attributes: { header: 2 } }),
      );
      expect(md).toBe('## Subtitle');
    });

    it('should render h3 through h6', () => {
      for (let level = 3; level <= 6; level++) {
        const md = renderDelta(
          d({ insert: `Heading ${level}` }, { insert: '\n', attributes: { header: level } }),
        );
        expect(md).toBe(`${'#'.repeat(level)} Heading ${level}`);
      }
    });
  });

  describe('blockquotes', () => {
    it('should render a blockquote', () => {
      const md = renderDelta(
        d({ insert: 'A quote' }, { insert: '\n', attributes: { blockquote: true } }),
      );
      expect(md).toBe('> A quote');
    });

    it('should separate blockquotes with empty paragraph between them', () => {
      const md = renderDelta(
        d(
          { insert: 'This is a quote!' },
          { insert: '\n', attributes: { blockquote: true } },
          { insert: '\n' },
          { insert: 'This is another quote!' },
          { insert: '\n', attributes: { blockquote: true } },
        ),
      );
      expect(md).toBe('> This is a quote!\n\n> This is another quote!');
    });
  });

  describe('code blocks', () => {
    it('should render a single-line code block', () => {
      const md = renderDelta(
        d({ insert: 'const x = 1;' }, { insert: '\n', attributes: { 'code-block': true } }),
      );
      expect(md).toBe('```\nconst x = 1;\n```');
    });

    it('should render a multi-line code block', () => {
      const md = renderDelta(
        d(
          { insert: 'const x = 1;' },
          { insert: '\n', attributes: { 'code-block': true } },
          { insert: 'const y = 2;' },
          { insert: '\n', attributes: { 'code-block': true } },
        ),
      );
      expect(md).toBe('```\nconst x = 1;\nconst y = 2;\n```');
    });

    it('should render a code block with language', () => {
      const md = renderDelta(
        d({ insert: 'const x = 1;' }, { insert: '\n', attributes: { 'code-block': 'javascript' } }),
      );
      expect(md).toBe('```javascript\nconst x = 1;\n```');
    });

    it('should render plain code block without language tag', () => {
      const md = renderDelta(
        d({ insert: 'plain text' }, { insert: '\n', attributes: { 'code-block': 'plain' } }),
      );
      expect(md).toBe('```\nplain text\n```');
    });
  });
});
