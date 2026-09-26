# 11 — MDX pipeline: unified processor, Expressive Code, callouts, anchors, image zoom

## Endpoint

None.

## Summary

Configure MDX rendering so the three existing posts render at least as well as in v1 and match the mockup's code blocks:

- **Markdown processor.** Astro 7's default markdown processor is Sätteri. Top-level `markdown.remarkPlugins`/`rehypePlugins` only work through a deprecated automatic conversion, and `rehypeHeadingIds` runs _after_ user rehype plugins, so autolink would find no ids. This task therefore configures an explicit **unified** processor: `markdown: { processor: unified({ … }) }`, with `rehypeHeadingIds` placed before `rehype-autolink-headings`.
- **Code blocks.** Expressive Code uses `tokyo-night` for dark and a **vendored Tokyonight Day** theme for light. Each block shows a filename title tab, a language label and a copy button, supports highlighted (`{2-3}`), inserted (`ins={4}`) and deleted (`del={5}`) lines, and shows line numbers when `showLineNumbers` is set.
- **Callouts.** A `<Callout type="tip|note|warning">` MDX component, plus GitHub-style `> [!TIP]` alerts through `remark-github-blockquote-alert`.
- **Headings.** Anchors with the v1 link icon.
- **Components.** A component map covering `Twemoji`, `a`, `img`, `table` and `Callout`.
- **Images.** Click-to-zoom.

KaTeX (`remark-math`/`rehype-katex`) and citations (`rehype-citation`) are **not** ported: no existing post uses them (checked with grep for `$$`, `$…$` and `[@`). Adding either later is a one-line plugin addition in the processor plus its CSS.

## Files to Create/Modify/Delete

- **Create** `src/plugins/remark-code-titles.mjs`. Adapted from the reference plugin, it converts ` ```ts:path/file.ts {2-3} ins={4} showLineNumbers ` into `lang = ts` and `meta = title="path/file.ts" {2-3} ins={4} showLineNumbers`. The title is prepended and the **rest of the meta string is passed through byte-for-byte**. The lang/title split happens only on the first `:`, and fences with no `:` are left unchanged.
- **Create** `src/plugins/remark-code-titles.test.ts` (`bun test`). It runs the plugin with `unified().use(remarkParse).use(remarkCodeTitles)` on these fences:
  - `ts:a/b.ts` → lang `ts`, meta `title="a/b.ts"`
  - `ts:a.ts {2-3} ins={4} showLineNumbers` → meta `title="a.ts" {2-3} ins={4} showLineNumbers`
  - `sql` → unchanged
  - `bash:.env` → lang `bash`, title `.env`
  - a title containing `"` → escaped
- **Create** `src/plugins/ec-language-badge.mjs`. A small Expressive Code plugin (`definePlugin({ name: 'language-badge', hooks: { postprocessRenderedBlock } })`) that adds `<span class="ec-lang">{lang}</span>` to the frame header, next to the title tab and before the copy button (mockup `.code-top`: filename · lang · Copy). Untitled blocks still get a header row showing only the language. Its `baseStyles` use `var(--muted)` and `var(--font-mono)`. Text/plaintext blocks get no badge.
- **Create** `src/styles/ec-tokyonight-day.json` (M-B). This must be **folke's real Tokyonight Day**, not enkia's "Tokyo Night Light".
  - **Source**: vendor `extras/sublime/tokyonight_day.tmTheme` from `folke/tokyonight.nvim` (MIT), pinned to a commit SHA (`cdc07ac78467a233fd62c493de29a17e0cf2b2b6` on 2026-09-26), and **convert it once** to VS Code theme JSON.
  - **Conversion**: a one-off script, `scripts/convert-tmtheme.ts` (committed for reproducibility, not run at build). It parses the plist and maps each `settings[].scope` + `settings.foreground` / `fontStyle` to `tokenColors[]`, and the global settings to `colors` (`editor.background` = `#e1e2e7`, `editor.foreground`, `editor.selectionBackground`, `editorLineNumber.foreground`). It sets `"type": "light"` and `"name": "Tokyonight Day (folke)"`.
  - **Verified 2026-09-26** from the source file: `keyword`/`storage.type` → `#9854f1` (Day `--purple`), `string` → `#587539` (Day `--green`), `entity.name.function`/`meta.function-call` → `#2e7de9` (Day `--blue`), background `#e1e2e7`.
  - **Header**: the JSON records the source URL, the commit SHA and the MIT licence notice (in a `"$comment"` field, which VS Code JSON tolerates).
  - **Test**: **extend `src/styles/palette.test.ts`** (task 06) to load this JSON and assert that its keyword, string and function foregrounds equal Day `--purple`/`--green`/`--blue` (`#9854f1`/`#587539`/`#2e7de9`) as parsed from `theme.css`.
  - **Credit**: the README (task 27) credits folke/tokyonight.nvim for this theme.
- **Create** `ec.config.mjs`:
  ```js
  import { defineEcConfig, ExpressiveCodeTheme } from 'astro-expressive-code';
  import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
  import fs from 'node:fs';
  import { pluginLanguageBadge } from './src/plugins/ec-language-badge.mjs';
  const tokyoDay = ExpressiveCodeTheme.fromJSONString(
    fs.readFileSync(new URL('./src/styles/ec-tokyonight-day.json', import.meta.url), 'utf8')
  );
  export default defineEcConfig({
    themes: ['tokyo-night', tokyoDay],
    themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
    useDarkModeMediaQuery: true, // JS-off fallback (m8); the attribute wins when set
    plugins: [pluginLineNumbers(), pluginLanguageBadge()],
    defaultProps: { showLineNumbers: false, wrap: false },
    frames: { showCopyToClipboardButton: true },
    styleOverrides: {
      borderRadius: '14px',
      borderColor: 'var(--line)',
      codeFontFamily: 'var(--font-mono)',
      codeFontSize: '0.875rem',
      frames: { shadowColor: 'transparent' },
      textMarkers: {
        /* mark/ins/del tints from --blue/--green/--red at low alpha */
      },
    },
  });
  ```
  Per-theme overrides take their colour values from `src/styles/palette.ts` (task 06's TS mirror of the Tokyonight tokens), never inline hex values. They go through each theme's `styleOverrides` (`tokyoDay.styleOverrides` / a `tokyo-night` override object): dark `codeBackground: '#1a1b26'`, `frames.editorBackground: '#1a1b26'`; light `codeBackground: '#e9e9ed'`, `frames.editorBackground: '#e9e9ed'`, `frames.editorActiveTabBackground: '#e1e2e7'`. **Light mode must never show a dark code frame.**
- **Modify** `astro.config.mjs`:
  ```js
  import { unified, rehypeHeadingIds } from '@astrojs/markdown-remark';
  // integrations: [expressiveCode(), mdx(), react(), …]
  markdown: {
    processor: unified({
      remarkPlugins: [remarkCodeTitles, remarkAlert],          // remark-github-blockquote-alert
      rehypePlugins: [rehypeHeadingIds, [rehypeAutolinkHeadings, { behavior: 'prepend', headingProperties: { className: ['content-header'] }, content: linkIconHast }]],
    }),
  },
  ```
  GFM stays enabled (the unified processor default). `linkIconHast` is built with `hastscript` from the v1 heroicon path in `contentlayer.config.ts`, wrapped in `span.content-header-link` with `aria-hidden`. `@astrojs/mdx` inherits this processor. Do **not** set top-level `markdown.remarkPlugins`/`rehypePlugins`.
- **Modify** `package.json`: add `astro-expressive-code@^0.44.2`, `@expressive-code/plugin-line-numbers@^0.44.2`, `rehype-autolink-headings@^7.1.0`, `remark-github-blockquote-alert@^2.1.0`, `hastscript`, `unist-util-visit@^5`, `medium-zoom@^1.1.0`, and dev deps `unified`, `remark-parse` (for the plugin test).
- **Create** `src/components/mdx/Callout.astro`. Props are `type: 'tip' | 'note' | 'warning'` (default `note`) and `title?` (defaults to the capitalised type). It renders `<aside class="callout callout-{type}" role="note">` with a heading row (lucide icon: Lightbulb / Info / TriangleAlert) and a `<slot />` body. Styling follows the mockup `.callout`: the tint comes from `--teal` for tip, `--blue` for note and `--orange` for warning, with a `--line-strong` border and `border-radius: var(--r)`.
- **Create** `src/styles/callouts.css` (imported from `global.css`). It styles both `.callout-*` and the `remark-github-blockquote-alert` output (`.markdown-alert-tip/note/important/warning/caution`, mapped onto the same three tints; `important` uses `--purple` and `caution` uses `--red`), so `> [!TIP]` and `<Callout type="tip">` look identical. The plugin's own `alert.css` is not imported.
- **Create** `src/components/mdx/index.ts`: `export const mdxComponents = { Twemoji, Callout, a: MdxLink, img: MdxImage, table: TableWrapper }`.
- **Create** `src/components/mdx/MdxLink.astro` (wraps `ui/Link`), `MdxImage.astro` (`<img loading="lazy" decoding="async" data-zoomable class="rounded-xl mx-auto">` with `alt` required; a `<figure>` + `<figcaption>` when `title` is present), and `TableWrapper.astro` (horizontal scroll wrapper, v1 `TableWrapper.tsx`).
- **Create** `src/components/mdx/ImageZoom.astro`. Its script does `import mediumZoom from 'medium-zoom'`, attaches to `[data-zoomable]` on `astro:page-load` with `background: var(--bg)`, and detaches on `astro:before-swap`.
- **Create** `src/dev-pages/fixtures/code-blocks.mdx` and `src/dev-pages/mdx.astro` (served at `/dev/mdx` in `bun dev` only, via the task-06 integration). The fixture contains:
  1. ` ```ts:src/app.ts {2-3} ins={4} del={5} showLineNumbers `
  2. ` ```sql ` (untitled)
  3. ` ```bash:.env `
  4. a plain ` ``` ` block
  5. `> [!TIP]`, `> [!NOTE]` and `> [!WARNING]` alerts
  6. `<Callout type="tip">`, `<Callout type="note">` and `<Callout type="warning" title="Careful">`
  7. `<Twemoji emoji="clinking-beer-mugs" />`
  8. an `## h2` and a `### h3`
  9. a markdown image
  10. a table

  The page renders the fixture inside `.prose` and also renders any real post via `?post=<id>`.

## Implementation Steps

1. Add the packages; write the remark plugin and its test, the EC language-badge plugin, the vendored theme JSON and `ec.config.mjs`.
2. Wire `astro.config.mjs` with the explicit `unified()` processor.
3. Write Callout, the callout CSS, the MDX components and image zoom.
4. Write the fixture and dev page, then check `/dev/mdx` in both themes (toggle `data-theme` and also test the OS scheme with JS disabled).
5. Check `/dev/mdx?post=exploring-module-in-nestjs`: every titled block shows its filename tab, language badge, copy button and line numbers; the SQL blocks in the overbooking post highlight correctly.
6. Check anchors: hovering an `h2` shows the link icon, and clicking it updates the hash.

## Acceptance Criteria

- [ ] `bun run build` succeeds with **no** Shiki "language not found" warnings and **no markdown-processor deprecation warning** (e.g. about top-level `remarkPlugins`/`rehypePlugins` being auto-coerced); `grep -i deprecat` on the build log returns nothing from Astro markdown.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `bun test` passes (all `remark-code-titles` cases, including meta passthrough).
- [ ] Fixture block 1 renders the title tab `src/app.ts`, the `ts` language badge, a copy button, line numbers, lines 2–3 highlighted (`mark`), line 4 as inserted and line 5 as deleted; copying puts the code without line numbers on the clipboard.
- [ ] Fixture block 2 (untitled `sql`) shows a header with only the `sql` badge and the copy button; the plain block has no badge.
- [ ] `> [!TIP]`/`[!NOTE]`/`[!WARNING]` and `<Callout>` of the same type render with identical styling.
- [ ] In `exploring-module-in-nestjs`, the 10 `lang:filename` blocks render a filename title tab, and all 11 `showLineNumbers` blocks show line numbers; the SQL blocks in the overbooking post render without titles or line numbers.
- [ ] `ec-tokyonight-day.json` is converted from folke's `tokyonight_day.tmTheme` (the source URL and SHA are recorded in the file); `bun test` passes the `palette.test.ts` check that keyword/string/function colours equal Day `--purple`/`--green`/`--blue`.
- [ ] In light mode (`data-theme="light"`, and a light OS with JS off) every code frame uses the Tokyonight Day palette (`#e9e9ed` background), with no dark frames; in dark mode, `tokyo-night` on `#1a1b26`.
- [ ] Headings have ids **and** anchor links (autolink runs after `rehypeHeadingIds`); the TOC data (`headings` from `render()`) lists h2/h3.
- [ ] `<Twemoji emoji="clinking-beer-mugs" />` renders a local SVG in all three posts.
- [ ] The three markdown images in the NestJS post open in a zoom overlay; Esc closes it.

## Dependencies

- v2-astro-content-collections
- v2-astro-ui-primitives

## Patterns to Follow

- v1: `contentlayer.config.ts` (plugin list, autolink icon), `components/ui/MDXComponents.tsx`, `components/ui/Image.tsx`, `components/ui/Zoom.tsx`, `components/ui/TableWrapper.tsx`.
- Mockup: `.code`, `.code-top` (filename · lang · Copy), `.ln.hl` (highlighted line) and `.callout` styles.
- Reference `astro.config.mjs` (`processor: unified({ remarkPlugins: [remarkCodeTitles] })`, expressiveCode before mdx) and `src/plugins/remark-code-titles.mjs` (hta218/leohuynh.dev).
- Expressive Code docs: "Themes → loading a custom theme (`ExpressiveCodeTheme.fromJSONString`)", "themeCssSelector", "Text & line markers", "Plugin API → hooks", "plugin-line-numbers".
