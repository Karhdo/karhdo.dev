/**
 * Expressive Code plugin: a language badge in the frame header, laid out like the mockup's
 * `.code-top` (filename · lang · Copy).
 *
 * - Titled blocks: the badge sits right-aligned in the tab bar, before the copy button.
 * - Untitled blocks: a header row is still shown, holding only the badge (and the copy button).
 * - Text/plaintext blocks get no badge (and so keep EC's plain, header-less frame).
 * - The copy button is moved up into the header row for every block that has one.
 * - Accessible names: EC's own script gives a horizontally scrollable `<pre>` `role="region"`
 *   (+ `tabindex`) but no name, so two of them fail axe `landmark-unique`. Each figure gets a
 *   `data-ec-label` (filename or language), and `LABEL_JS` names every `pre[role=region]` from it,
 *   numbering repeats ("Code: app.module.ts (2)"). Only regions get `aria-label` (it is prohibited
 *   on a plain `pre`).
 */
import { definePlugin } from 'astro-expressive-code';
import { addClassName, h, select } from 'astro-expressive-code/hast';

const NO_BADGE = new Set(['', 'text', 'txt', 'plaintext', 'plain', 'ansi']);

/** @param {import('astro-expressive-code').ExpressiveCodeBlock['language']} language */
const hasBadge = (language) => !NO_BADGE.has((language ?? '').toLowerCase());

/** Runs as an external EC module script (CSP-safe), once; re-labels on every ClientRouter swap. */
const LABEL_JS = `
const label = () => {
  const seen = new Map();
  for (const pre of document.querySelectorAll('.expressive-code pre')) {
    if (pre.getAttribute('role') !== 'region') {
      pre.removeAttribute('aria-label');
      continue;
    }
    const base = pre.closest('figure')?.dataset.ecLabel || 'Code';
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const name = n > 1 ? base + ' (' + n + ')' : base;
    if (pre.getAttribute('aria-label') !== name) pre.setAttribute('aria-label', name);
  }
};
const observer = new MutationObserver(label);
const watch = () => {
  for (const pre of document.querySelectorAll('.expressive-code pre')) {
    observer.observe(pre, { attributes: true, attributeFilter: ['role'] });
  }
  label();
};
watch();
document.addEventListener('astro:page-load', watch);
`;

export function pluginLanguageBadge() {
  return definePlugin({
    name: 'language-badge',
    jsModules: [LABEL_JS],
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
        /* --muted alone is 3.8:1 on the Day code background; deepen it toward --fg (5.3:1).
           Night: a touch of --fg-soft lifts 4.5:1 to about 5.5:1. */
        color: light-dark(
          color-mix(in srgb, var(--muted) 60%, var(--fg)),
          color-mix(in srgb, var(--muted) 75%, var(--fg-soft))
        );
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
        const figure = renderData.blockAst;
        const title = codeBlock.props.title;
        figure.properties.dataEcLabel = title
          ? `Code: ${title}`
          : `${hasBadge(language) ? language.toUpperCase() : 'Plain text'} code`;
        if (!hasBadge(language) || codeBlock.props.frame === 'none') return;
        const header = select('figcaption.header', figure);
        if (!header) return;
        header.children.push(h('span.ec-lang', language));
        addClassName(figure, 'has-lang');
      },
    },
  });
}
