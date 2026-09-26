# 15 — Bento-grid homepage (matches the mockup)

> **User decision (implementation start):** the Daily stack must show the **exact official logo** of each tool (the `simple-icons` path for that tool), never letter monograms or placeholders like the mockup's "TS"/"Ne" boxes. Logos are tinted with their Tokyonight `tone` token (not brand colours).

## Endpoint

None. This task pre-creates **stub components** for every live card and for the snowfall canvas, and wires them into `src/pages/index.astro` once. The p5 tasks each fill **only their own stub file** and never edit `index.astro`, so they can run in parallel without merge conflicts (reviewer 29-e):

- 19 fills `SpotifyCard.astro` (reads `GET /api/spotify`);
- 31 fills `TokenBurnCard.astro` (reads `GET /api/token-burn`);
- 20 fills `GithubActivityCard.astro` (reads `GET /api/github/activity`);
- 30 fills `BlogStatsCard.astro` (reads `GET /api/stats/summary`);
- 29 fills `Snowfall.astro`.

## Summary

Replace the placeholder `/` with the prerendered bento grid from the mockup (`#view-home`). Cards in mockup order:

- **Intro**: avatar, "Hello, folks! 👋", "Do Trong Khanh · Software Engineer at Spartan", h1 "I'm _Trong Khanh_, aka Karhdo.", lead text, typed bios, and the CTA row "Read the blog →", "GitHub", "LinkedIn".
- **Now playing**: stub for task 19.
- **Token burn**: stub for task 31 (replaces the earlier Local time / GMT+7 clock card; the HCMC clock moved into the footer statusline, task 09).
- **Latest post**
- **Daily stack**: tech chips.
- **GitHub · @Karhdo**: stub for task 20.
- **Blog stats**: posts, views and reactions; stub for task 30.

Below the grid:

- a **"Selected projects"** block: a full-width featured EcomHeat card plus two browser-framed cards, reusing `ProjectCard` from task 17;
- a "Recent posts" list (v1 parity, `PostList` from task 13);
- popular tags.

All static content is pure Astro, and the typed bios are a small script. The snowfall canvas is a stub filled by task 29.

## Files to Create/Modify/Delete

- **Rewrite** `src/pages/index.astro`: `PageLayout` with `<section class="bento grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-6">`. The spans are copied from the mockup CSS (6 columns on desktop, 2 on tablet, 1 on mobile):
  - `IntroCard`: `lg:col-span-4 lg:row-span-2`, `md:col-span-2`
  - `SpotifyCard` (stub): `lg:col-span-2`, `md:col-span-1`
  - `TokenBurnCard` (stub): `lg:col-span-2`, `md:col-span-1` (mockup `.c-burn`)
  - `LatestPostCard`: `lg:col-span-4`, `md:col-span-2` (a link card with arrow, mockup `.c-latest`)
  - `DailyStackCard`: `lg:col-span-2`, `md:col-span-2`
  - `GithubActivityCard` (stub): `lg:col-span-4`, `md:col-span-2`
  - `BlogStatsCard` (stub): `lg:col-span-2`, `md:col-span-2` (mockup `.c-stats`)
  - then the **Selected projects** block (spec below);
  - then "Recent posts" (`PostList` of up to 5, v1 `MAX_DISPLAY = 5`) + "All posts →" when there are more than 5, and `PopularTags` (task 14 component).
  - Each bento card gets `data-card`, `data-tilt` and `style="--i: n"`, plus the `.rise` class from task 06: a staggered rise with a soft scale on load (`riseIn`: `translate: 0 14px` + `scale: .985` → none, using the **individual `translate`/`scale` properties, not `transform`**, so the task-26 tilt transform still applies after the animation ends (M-A); `--ease-out`, delay `n × 50 ms`), motion-safe only and never starting hidden. Tilt and spotlight are wired in task 26.
- **Create** `src/components/home/IntroCard.astro`. Copy follows the mockup; v1 content is kept where the mockup is silent.
  - Avatar: `astro:assets` `<Image>` from `src/assets/images/avatar.jpg` (copied from `public/static/images/avatar.jpg`, which stays for OG/SEO), alt "Portrait of Do Trong Khanh".
  - Greeting with waving hand (`animate-wave`, motion-safe).
  - **h1 "I'm Trong Khanh, aka Karhdo."**, with a word-by-word lift-in (item 5) and the mockup's name colour treatment (`.intro h1 .grad`, `.grad.alt`, `.dotp`, `nameFlow`, `dotPulse`). This replaces the earlier "gradient drifts 8 s alternate" design.
    - **Markup**, with the words split at build time in the Astro frontmatter: `<h1 aria-label="I'm Trong Khanh, aka Karhdo."><span aria-hidden="true"><span class="w" style="--i:0">I'm</span> <span class="w" style="--i:1"><span class="grad">Trong Khanh</span>,</span><br><span class="w" style="--i:2">aka</span> <span class="w" style="--i:3"><span class="grad alt">Karhdo</span><span class="dotp">.</span></span></span></h1>`. **"Trong Khanh" is one `.w` word unit with a single `.grad` span**, so the gradient runs continuously across both words. The aria-label is unchanged, and screen readers read it once.
    - **Name colours, "Ocean" (final user choice)**: **both** "Trong Khanh" (`.grad`) and "Karhdo" (`.grad.alt`) use the same gradient, `linear-gradient(100deg, var(--blue) 0%, var(--cyan) 50%, var(--blue) 100%)` with `background-size: 200% 100%` and `background-position: 0% 50%`. At rest it reads exactly like `.dev`: blue → cyan (Day #2e7de9 → #007197, Night #7aa2f7 → #7dcfff, tokens only). Because it starts and ends on `--blue`, it loops seamlessly while flowing. It is clipped to text (`background-clip: text; color: transparent`), and both names get the glow `filter: drop-shadow(0 0 22px color-mix(in srgb, var(--blue) 32%, transparent))`. This replaces the earlier blue → purple → red and cyan → teal → green gradients.
    - **The full stop** (`.dotp`) is `color: var(--blue)`, the same as `.dev` in the header wordmark. `.grad.alt` differs from `.grad` only by its animation offset.
    - **h1 base**: `font-size: clamp(34px, 5.4vw, 58px)`, `line-height: 1.02`, `letter-spacing: -.035em`, weight 700, `text-wrap: balance`.
    - **Motion**, only under `prefers-reduced-motion: no-preference`:
      - `wordIn` for each `.w` (translateY .35em + 2° + blur 6px → none, .7 s `--ease-out`, delay `.12s + i × .07s`).
      - Each `.grad` gets a **second background layer on top**: a shine band `linear-gradient(110deg, transparent 42%, var(--shine) 50%, transparent 58%)`, using the Tokyonight `--shine` token, never white, with `background-size: 250% 100%, 200% 100%` (the shine layer at 250 %, the colour layer at 200 %), also clipped to text.
      - `nameFlow` 9 s ease-in-out infinite: `0% {160% / 0%}`, `18% {−60% / 35%}`, `60% {−60% / 100%}`, `100% {−60% / 0%}`. So the shine sweeps across during the first 18 %, and the colour layer flows 0 → 100 % → 0. `.alt` is offset with `animation-delay: .6s`.
      - `.dotp` becomes `display: inline-block` with `dotPulse` 2.4 s infinite (translateY −3 px + scale 1.15 at 50 %).
      - The `.grad` spans and `.dotp` are `.loop-anim` (paused off-screen, task 26).
    - **Reduced motion**: static gradients and glow, no shine layer, no dot bob. Everything animates only `background-position` and `transform`, so there's no layout shift. The glow is a `filter`, which doesn't affect layout.
    - **Contrast** (recomputed for Ocean): light on #e1e2e7: `--blue` #2e7de9 **3.11:1** (the lowest) and `--cyan` #007197 **4.26:1**. Dark on #16161e: `--blue` #7aa2f7 **7.14:1** and `--cyan` #7dcfff **10.48:1**. The blue full stop has the same values. All are ≥ 3:1 for large text. The shine band briefly lightens the letters; it's decorative, and absent under reduced motion.
  - Lead paragraph (mockup text).
  - Typed bios: `<ul id="bios" hidden>` with the 11 v1 bios verbatim + `<span data-typed>`.
  - CTA buttons: `Button` primary to `/blog`, plus GitHub and LinkedIn with `data-umami-event`.
- **Create** `src/components/home/TypedBios.astro`. A vanilla typewriter script with no `typed.js` dependency:
  - cycles `#bios li` innerHTML (supports `<b>` and Twemoji `<img>`);
  - 40 ms type, 10 ms back, 1 s pause;
  - pauses while the tab is hidden;
  - under reduced motion, shows one random bio statically;
  - re-inits on `astro:page-load` and clears timers on `astro:before-swap`.
- **Create** `src/components/home/LatestPostCard.astro`: eyebrow "Latest post", newest post title (`transition:name`), summary, `<time>` `MMM D, YYYY` · `x min read` · first tag, and an arrow icon; the whole card is one link.
- **Create** `src/components/home/DailyStackCard.astro`: the mockup "Daily stack: marquee", built at **build time with no JS**.
  - **Eyebrow**: "Daily stack" plus a right-aligned `.stack-count` reading "{SITE.stack.length} tools" (14).
  - **Marquee**: `<div class="marquee" role="group" aria-label="Technologies I use: TypeScript, NestJS, …">` with masked edges (`mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent)`). It has two `.mq-row`s: the first 7 tools, and the last 7 in `.mq-row.rev`.
  - **Tracks**: each row's `.mq-track` contains a `<ul>` of `.tt` items (a brand badge `<b style="--b:{color}">` holding a `SimpleIcon` from task 08, plus the name) followed by a **duplicate `<ul aria-hidden="true">`**, so the loop is seamless and screen readers read the list once.
  - **Motion**: `mq` 38 s linear infinite, with the reverse row at 44 s `animation-direction: reverse`. It pauses on `:hover` and `:focus-within`, and the tracks are `.loop-anim`.
  - **Reduced motion**: the duplicate list is `display: none`, and each row is a single static list that scrolls horizontally (`overflow-x: auto`, scrollbar hidden, keyboard-focusable with `tabindex="0"` and an `aria-label`).
  - **Footer**: `.learning` has a pulsing green dot (`pulse`, motion-safe, `.loop-anim`) and the text "Now learning **Astro** & **Bun** by rebuilding this site", built from `SITE.nowLearning`.
- **Modify** `src/config/site.ts`: add the typed `stack` and `nowLearning` (`satisfies` keeps the literal types):
  ```ts
  export type StackItem = { name: string; icon: SimpleIconSlug; tone: PaletteToken };  // PaletteToken = 'blue' | 'red' | 'cyan' | 'green' | 'fg' | 'orange' | 'blue1' | 'yellow' | 'teal' | …
  stack: [
    { name: 'TypeScript', icon: 'typescript', tone: 'blue' }, { name: 'NestJS', icon: 'nestjs', tone: 'red' },
    { name: 'React', icon: 'react', tone: 'cyan' }, { name: 'Node.js', icon: 'nodedotjs', tone: 'green' },
    { name: 'Next.js', icon: 'nextdotjs', tone: 'fg' }, { name: 'Astro', icon: 'astro', tone: 'orange' },
    { name: 'PostgreSQL', icon: 'postgresql', tone: 'blue1' },
    { name: 'Bun', icon: 'bun', tone: 'yellow' }, { name: 'Tailwind', icon: 'tailwindcss', tone: 'cyan' },
    { name: 'Drizzle', icon: 'drizzle', tone: 'green' }, { name: 'RabbitMQ', icon: 'rabbitmq', tone: 'orange' },
    { name: 'Docker', icon: 'docker', tone: 'blue' }, { name: 'Vue', icon: 'vuedotjs', tone: 'teal' }, { name: 'Redis', icon: 'redis', tone: 'red' },
  ] satisfies StackItem[],
  nowLearning: { items: ['Astro', 'Bun'], text: 'by rebuilding this site' },
  ```
  **Tokyonight-only**: each badge is `<b style="--b: var(--{tone})">`, whose colour, 16 % tint background and border all derive from the token. The icon **shapes** still come from `simple-icons`, rendered with `fill="currentColor"` so they take the mapped token. No brand hex values and no dark-mode overrides are needed: the tokens already switch between Day and Night.
- **Create the stub components** `src/components/home/SpotifyCard.astro`, `TokenBurnCard.astro`, `GithubActivityCard.astro` and `BlogStatsCard.astro`. Each is a glass `Card` with its final eyebrow ("Now playing", "Token burn" with a flame icon, "GitHub · @Karhdo", "Blog stats"), `data-card`, and a `CardSkeleton` body sized to the mockup card (fixed height, so filling them later causes no CLS). A comment `<!-- filled by task NN -->` marks each one. The owning task replaces only the stub's body.
- **Create** `src/components/home/SectionHeading.astro`: mockup `.section-h` (h2 + right-aligned link).
- **Create** `src/components/home/CardSkeleton.astro`: a fixed-height shimmer placeholder used by the island slots (`motion-safe:animate-shimmer`), sized to match the final card to avoid layout shift.
- **Selected projects** (item 5): below the grid, `SectionHeading` "Selected projects" with "All {PROJECTS.length} projects →" (`/projects`, `.reveal`), then `.proj-grid` (2 columns, 1 column ≤ 600 px) containing `<ProjectCard variant="featured" project={EcomHeat} />` (full width) and `<ProjectCard variant="framed" />` for **karhdo.dev** (★ stars from the build-time `BUILD_INFO.stars` of task 09, hidden when null) and **Simulate Basic Geometry**. The data, variants, browser frame and screenshots come from task 17 (`featured`, `type`, `org`, `facts`, `url`, `repo`, `image`, `frameLabel` in `src/config/projects.ts`).
- **Create** `src/lib/motion/count-up.ts` (pure core + tiny DOM helper, shared by tasks 19, 20, 30 and 31, and by every `[data-count]` in static markup):
  - `easeOutCubic(t)`;
  - `countFrames(to, { decimals, duration = 1100 })`, a pure frame-value generator for the tests;
  - `countUp(el, to, { decimals, suffix })`, which animates `el.textContent` from 0 to the final value **once**, using `requestAnimationFrame` over about 1.1 s with ease-out cubic.
    The final value is **already server-rendered** in the element's text. The helper only runs when `prefers-reduced-motion: no-preference` and the element intersects the viewport (a shared `IntersectionObserver`, one-shot, then `unobserve`), so no-JS and reduced-motion users always see the real number. `src/components/motion/CountUp.astro` is a bundled script, mounted once in `BaseLayout`, that wires `[data-count]` elements on `astro:page-load`; islands call `countUp` directly after their data arrives.
- **Create** `src/lib/motion/count-up.test.ts`: the easing endpoints (0 → 0, 1 → 1); the frames are monotonic and end exactly at `to`; decimals are respected (`12.4` stays 1 dp).
- **Snowfall stub**: create `src/components/Snowfall.astro` rendering nothing (`<!-- filled by task 29 -->`). `index.astro` renders `<Snowfall />` unconditionally, directly inside `PageLayout` before the grid. Task 29 owns the `SITE.snowfall` gating **inside** the component, so it never edits `index.astro`. v1 `react-snowfall` is not installed.

## Implementation Steps

1. Read the mockup `#view-home` markup and CSS (`.bento`, `.c-*`, `.intro`, `.c-burn`, `.c-stats`, `.chips`, `.gh-stats`, `.c-proj`, `.section-h`), and `git show main:components/homepage/*.tsx` for v1 copy (bios, links).
2. Build the grid mobile-first; check it at 375, 768, 1024 and 1440 px against the mockup.
3. Implement the typed-bios script. No React is shipped on `/` by this task.
4. Run Lighthouse on `/` locally (`bun run build && bun run preview`); target performance ≥ 95 before the islands land.

## Acceptance Criteria

- [ ] `bun run build` succeeds; `index.html` is prerendered at `.vercel/output/static/index.html`.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] The card order, titles and spans match the mockup: Intro, Now playing, **Token burn**, Latest post, **Daily stack**, GitHub, Blog stats; then "Selected projects" (EcomHeat featured, karhdo.dev and Simulate Basic Geometry framed), Recent posts and Popular tags.
- [ ] The grid has no overlapping or overflowing cards at 375, 768, 1024 and 1440 px.
- [ ] Typed bios cycle through all 11 v1 bios; with reduced motion a single static bio is shown.
- [ ] The Latest post card links to the newest post (`how-to-prevent-overbooking-in-sql-with-multiple-methods`).
- [ ] `index.astro` imports `SpotifyCard`, `TokenBurnCard`, `GithubActivityCard`, `BlogStatsCard` and `Snowfall` from their final paths; no later task needs to edit it.
- [ ] Skeleton slots have the same height as the final cards (no CLS once tasks 19, 20, 30 and 31 fill them).
- [ ] Hero headline: screen readers read "I'm Trong Khanh, aka Karhdo." once (the split spans are `aria-hidden`). Both names show the Ocean gradient (blue → cyan, matching `.dev`) with a blue glow, and the full stop is blue. With motion allowed: words lift in, the `--shine` band sweeps each name about every 9 s (Karhdo offset by .6 s), the colours flow seamlessly (no visible seam at the loop point), and the dot bobs. With reduced motion: static gradient and glow, no shine. Contrast: blue 3.11 / cyan 4.26 in light and 7.14 / 10.48 in dark, all ≥ 3:1; no layout shift.
- [ ] Daily stack: 14 brand icons (`simple-icons`, inline SVG, zero JS), two rows moving in opposite directions, paused on hover, masked edges, "14 tools" header and the "Now learning Astro & Bun" footer; the duplicate track is `aria-hidden`; with reduced motion each row is static and horizontally scrollable.
- [ ] Selected projects: the featured EcomHeat card spans the full width, with karhdo.dev (★ N) and Simulate Basic Geometry below; one column on mobile.
- [ ] `[data-count]` numbers count up once when scrolled into view (motion allowed) and show the final value immediately otherwise; `bun test` passes (`count-up`).
- [ ] The avatar is served as optimised WebP/AVIF with explicit width/height.

## Dependencies

- v2-astro-header-footer
- v2-astro-content-collections
- v2-astro-projects-page

## Patterns to Follow

- Mockup `karhdo-v2.src.html` `#view-home` (structure, copy, card names).
- v1: `components/homepage/*`.
- Reference `src/components/studio/runtime-rail/*Card.astro` (hta218/leohuynh.dev) for the card + client hydrate split.


> **Note from task 03:** `StackItem` exists in `src/config/site.ts` loosely typed (`icon: string; tone: string`); narrow it here to the simple-icons slug and palette-token unions. `nowLearning` is typed `{ items: readonly string[]; text: string }`.
