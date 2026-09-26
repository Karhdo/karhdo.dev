/**
 * Expressive Code plugin: a language badge in the frame header, laid out like the mockup's
 * `.code-top` (filename · lang · Copy).
 *
 * - Titled blocks: the badge sits right-aligned in the tab bar, before the copy button.
 * - Untitled blocks: a header row is still shown, holding only the badge (and the copy button).
 * - Text/plaintext blocks get no badge (and so keep EC's plain, header-less frame).
 * - The copy button is moved up into the header row for every block that has one.
 */
import { definePlugin } from 'astro-expressive-code';
import { addClassName, h, select } from 'astro-expressive-code/hast';

const NO_BADGE = new Set(['', 'text', 'txt', 'plaintext', 'plain', 'ansi']);

/** @param {import('astro-expressive-code').ExpressiveCodeBlock['language']} language */
const hasBadge = (language) => !NO_BADGE.has((language ?? '').toLowerCase());

export function pluginLanguageBadge() {
  return definePlugin({
    name: 'language-badge',
    baseStyles: ({ cssVar }) => `
      .frame {
        /* Height of the header row; the copy button is centred in it. */
        --ec-header-h: 2.5rem;
      }
      .frame.has-lang,
      .frame.has-title:not(.is-terminal) {
        --button-spacing: calc((var(--ec-header-h) - 2rem) / 2);
      }
      .frame.has-lang:not(.has-title):not(.is-terminal) {
        & .header {
          display: flex;
          align-items: center;
          min-height: var(--ec-header-h);
          box-sizing: border-box;
          border: ${cssVar('borderWidth')} solid ${cssVar('borderColor')};
          border-bottom: ${cssVar('borderWidth')} solid ${cssVar('frames.editorTabBarBorderBottomColor')};
          background: ${cssVar('frames.editorTabBarBackground')};
        }
        & pre {
          border-top: none;
          border-top-left-radius: 0;
          border-top-right-radius: 0;
        }
      }
      .frame.has-title:not(.is-terminal) .header,
      .frame.is-terminal .header {
        min-height: var(--ec-header-h);
        box-sizing: border-box;
      }
      .frame.has-title:not(.is-terminal) .title {
        display: flex;
        align-items: center;
      }
      .frame .header .ec-lang {
        margin-inline: auto 3rem;
        align-self: center;
        font-family: var(--font-mono);
        font-size: 0.6875rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--muted);
        user-select: none;
        -webkit-user-select: none;
      }
      /* Terminal frames centre their title: pin the badge to the right instead. */
      .frame.is-terminal .header .ec-lang {
        position: absolute;
        inset-inline-end: 0;
        top: 50%;
        transform: translateY(-50%);
      }
      /* The copy button lives in the header, so it stays visible (no hover-only reveal). */
      @media (hover: hover) {
        .frame.has-lang .copy button,
        .frame.has-title .copy button {
          opacity: 0.75;
        }
      }
      /* The first code line no longer needs room for the copy button. */
      .frame.has-lang :nth-child(1 of .ec-line) .code,
      .frame.has-title :nth-child(1 of .ec-line) .code {
        padding-inline-end: ${cssVar('codePaddingInline')};
      }
    `,
    hooks: {
      postprocessRenderedBlock: ({ codeBlock, renderData }) => {
        const { language } = codeBlock;
        if (!hasBadge(language) || codeBlock.props.frame === 'none') return;
        const figure = renderData.blockAst;
        const header = select('figcaption.header', figure);
        if (!header) return;
        header.children.push(h('span.ec-lang', language));
        addClassName(figure, 'has-lang');
      },
    },
  });
}
