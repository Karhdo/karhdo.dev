# 08 — UI primitives: glass cards, buttons, tags, links, icons, Twemoji

> **Post-plan (2026-09-27):** `Container.astro` and `GrowingUnderline.astro` were removed as unused.

## Endpoint

None.

## Summary

Port and restyle the reusable v1 UI components as zero-JS Astro components (plus tiny React twins only where an island needs them), move brand SVGs into `src/assets/icons/` as Astro SVG components, and replace the 9,970-line remote Twemoji CSS with a small name→codepoint map and local SVGs.

## Files to Create/Modify/Delete

- **Create** `src/lib/utils/cn.ts` — `cn(...inputs)` = `clsx` + `tailwind-merge` (add `clsx@^2`, `tailwind-merge@^3`).
- **Create** `src/components/ui/Card.astro` — glass card: `as` prop (`div|article|a|section`), `href?`, `class?`, variants `glass | solid | outline`, hover lift (`translate-y-[-2px]`, shadow) guarded by `motion-safe:`; `data-card` for spotlight hover effect added in task 26.
- **Create** `src/components/ui/Button.astro` — variants `primary | ghost | outline`, sizes `sm | md`, renders `<a>` when `href` given; port of v1 `components/ui/Button.tsx` (cva → a plain variant map).
- **Create** `src/components/ui/Tag.astro` — `text` → link `/tags/${slug(text)}` using `github-slugger` (add `github-slugger@^2.0.0`); shows `#text`.
- **Create** `src/components/ui/Link.astro` — internal vs external (`target="_blank" rel="noopener noreferrer"` when absolute http URL or `mailto:`), passes `data-umami-event` through.
- **Create** `src/components/ui/GrowingUnderline.astro`, `PageTitle.astro`, `Container.astro`, `SectionHeader.astro` (title + description block used by Blog/Projects/About/Tags pages, replacing v1 repeated markup).
- **Create** `src/components/ui/Icon.astro` — thin wrapper over `@lucide/astro` (add `@lucide/astro@^1.48.0`) for Mail, Github, Linkedin, Facebook, Twitter/X, MapPin, Briefcase, Clock, Star, GitFork, Rss, Search, Sun, Moon, Monitor, ChevronRight, ArrowUp, MessageSquare, Check, CheckCheck, X, Circle, Menu.
- **Move** `public/static/icons/*.svg` → `src/assets/icons/*.svg` (`git mv`; 23 files incl. `tilted-grid.svg` if not already moved in 07). Normalise each to `fill="currentColor"` where it is monochrome. `src/assets/icons/**` is excluded from `lint:palette` (task 06, M-C), because vendored multi-colour brand SVGs and the MIV badge keep their own fills.
- **Create** `src/components/ui/BrandIcon.astro` — `BRAND_ICONS` map (same keys as v1 `BrandIconsMap`: React, Remix, Git, GitHub, Javascript, Typescript, Node, Bash, Liquid, Markdown, NextJS, TailwindCSS, Prisma, Umami, Vercel, Railway, Spotify, NestJS, Docker, Postgres, Mongodb) + new `Astro`, `Drizzle`, `Bun` (add SVGs from simple-icons, CC0). Export `type BrandIconName`. Renders the imported SVG component with `class` and `aria-hidden`.
- **Create** `src/lib/simple-icons.ts` + `src/components/ui/SimpleIcon.astro` (item 5; used by the Daily stack marquee in task 15 and by the project chips in task 17). Add `simple-icons@^16.32.0` (CC0). `simple-icons.ts` re-exports only the icons the site uses, as a typed map (`typescript: siTypescript, nestjs: siNestjs, react: siReact, nodedotjs: siNodedotjs, nextdotjs: siNextdotjs, astro: siAstro, postgresql: siPostgresql, bun: siBun, tailwindcss: siTailwindcss, drizzle: siDrizzle, rabbitmq: siRabbitmq, docker: siDocker, vuedotjs: siVuedotjs, redis: siRedis`, plus any chip slugs such as `mysql`, `vuedotjs`, `threedotjs`, `jquery`, `javascript`, `laravel`, `php`, `bootstrap`, `jsonwebtokens`), and exports `type SimpleIconSlug = keyof typeof ICONS`. `SimpleIcon.astro` takes the props `slug`, `size = 16` and `title?`, and renders an inline `<svg viewBox="0 0 24 24" fill="currentColor" width height role="img" aria-hidden={!title}><path d={icon.path} /></svg>` at build time, with **no client JS**. Brand colour is applied by the caller.
- **Create** `src/lib/emoji.ts` — `EMOJI_CODEPOINTS` for every name used by v1 content/components (list in 00-overview Findings; note `flag-vietnam` and `viet-nam-vietnam-flag` both → `1f1fb-1f1f3`, `eye` → `1f441`, `memo` → `1f4dd`, `page-facing-up` → `1f4c4`, `inbox-tray` → `1f4e5`, `bar-chart` → `1f4ca`, `atom-symbol` → `269b`, `man-technologist` → `1f468-200d-1f4bb`, `musical-keyboard` → `1f3b9`, `tennis` → `1f3be`, `soccer-ball` → `26bd`, `video-game` → `1f3ae`, `dog` → `1f415`, `bullseye` → `1f3af`, …). Export `emojiCodepoint(name)`.
- **Create** `public/static/twemoji/{codepoint}.svg` — download only the needed SVGs from `https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.3/assets/svg/` (**pinned** to v17.0.3, the latest tag on 2026-09-26; record the version in `src/lib/emoji.ts` as `TWEMOJI_VERSION = '17.0.3'` and in the README attribution) (the maintained fork; `twitter.github.io/twemoji` used in v1 is no longer maintained). Add attribution (CC-BY 4.0) to README in task 27.
- **Create** `src/components/ui/Twemoji.astro` — props `emoji`, `size?: 'base'|'lg'|'2x'|'3x'`, `className?` (keep v1 prop name for MDX compatibility) and `class?`; renders `<img src="/static/twemoji/{cp}.svg" alt={label} width height loading="lazy" decoding="async" class="twemoji twemoji-{size} inline-block align-[-0.1em]">`; unknown name → dev-time `console.warn` and renders nothing.
- **Create** `src/components/islands/ui/Twemoji.tsx` — React twin for islands (Reactions).
- **Create** `src/lib/emoji.test.ts` — `emojiCodepoint('clinking-beer-mugs') === '1f37b'`, both Vietnam flag aliases → `1f1fb-1f1f3`, unknown name → `undefined`; every codepoint in the map has a matching file in `public/static/twemoji/`.
- **Delete** `public/static/icons/` (after move).

## Implementation Steps

1. `git show main:components/ui/<file>.tsx` for Button, Card, Tag, Link, GrowingUnderline, PageTitle, BrandIcon, Twemoji; reimplement in Astro with the new tokens.
2. `git mv` icons; fix any SVG with hard-coded fills that should inherit colour.
3. Write `emoji.ts`; script-download SVGs (one-off `bun` script in scratch, not committed) and commit only the SVG outputs.
4. Create the dev-only `src/dev-pages/components.astro` (served at `/dev/components` in `bun dev` only, via the task-06 integration) rendering every primitive, every brand icon and every emoji in light + dark.

## Acceptance Criteria

- [ ] `bun run build` succeeds.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `bun test` passes (emoji tests).
- [ ] `/dev/components` renders all mapped `SimpleIcon`s; the client bundle contains no `simple-icons` code.
- [ ] `/dev/components` renders all 24 brand icons and all mapped emoji with no broken images (Network tab: 0 × 404).
- [ ] No request to `twitter.github.io` anywhere (`grep -r "twitter.github.io" src public` → empty).
- [ ] `public/static/icons/` no longer exists; nothing references it.
- [ ] Primitive components ship zero client JS (`.vercel/output/static/_astro/*.js` does not grow from this task).

## Dependencies

- v2-astro-design-tokens

## Patterns to Follow

- v1 `components/ui/*` (`git show main:components/ui/…`).
- Reference `src/components/mdx/Twemoji.astro`, `src/lib/emoji.ts`, `src/lib/brand-icons.ts` (hta218/leohuynh.dev).
- Astro docs: "SVG components" (`import Logo from '~/assets/icons/react.svg'`).


> **Note from task 03 review:** `BrandIconName` is declared once in `src/config/popular-tags.ts`. `BrandIcon.astro` must `import type { BrandIconName } from "~/config/popular-tags"` and re-export it (`export type { BrandIconName }`), typing `BRAND_ICONS` as `Record<BrandIconName, …>`; do not redeclare the union.
