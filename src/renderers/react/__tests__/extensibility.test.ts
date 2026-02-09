import { createElement } from 'react';
import type { TNode } from '../../../core/ast-types';
import { ReactRenderer } from '../react-renderer';
import { d, renderDeltaWith } from './test-helpers';

describe('ReactRenderer – extensibility', () => {
  it('should support custom block handlers via withBlock()', () => {
    const renderer = new ReactRenderer().withBlock('user_mention', (node) => {
      const data = node.data as Record<string, unknown>;
      return createElement('a', { href: `#user_mention#${data.id}` }, `@${data.name}`);
    });

    const html = renderDeltaWith(
      d(
        {
          insert: {
            user_mention: { id: '123', name: 'TestUser', email: 'testUser@test.com' },
          },
        },
        { insert: '\n' },
      ),
      renderer,
    );
    expect(html).toBe('<div><p><a href="#user_mention#123">@TestUser</a></p></div>');
  });

  it('should support custom mark handlers via withMark()', () => {
    const renderer = new ReactRenderer().withMark('highlight', (content) => {
      return createElement('mark', null, content);
    });

    const html = renderDeltaWith(
      d({ insert: 'important', attributes: { highlight: true } }, { insert: '\n' }),
      renderer,
    );
    expect(html).toBe('<div><p><mark>important</mark></p></div>');
  });

  it('should support component overrides via config', () => {
    const CustomParagraph = ({ children }: { children?: React.ReactNode; node: TNode }) =>
      createElement('div', { className: 'custom-p' }, children);

    const html = renderDeltaWith(
      d({ insert: 'Hello world\n' }),
      new ReactRenderer({
        components: { paragraph: CustomParagraph },
      }),
    );
    expect(html).toBe('<div><div class="custom-p">Hello world</div></div>');
  });

  it('should support customTag callback', () => {
    const html = renderDeltaWith(
      d({ insert: 'Hello world\n' }),
      new ReactRenderer({
        customTag: (format) => (format === 'paragraph' ? 'section' : undefined),
      }),
    );
    expect(html).toBe('<div><section>Hello world</section></div>');
  });
});
