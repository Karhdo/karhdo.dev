# 26 — Motion system: orchestration, tilt/spotlight, view transitions, audit

## Endpoint

None.

## Summary

This task completes and audits the mockup's **motion system** (the "Motion system" CSS section and the matching JS). Its pieces are spread across other tasks:

| Piece                                                                                 | Task |
| ------------------------------------------------------------------------------------- | ---- |
| tokens, keyframes, `.rise`, `.reveal`                                                 | 06   |
| circular theme reveal, nav pill, wordmark decode + hover wave + hover/focus underline | 09   |
| post h2/code/callout reveals                                                          | 12   |
| row underline, chip pop                                                               | 13   |
| hero words, name `nameFlow` shine/flow + `dotPulse`, card stagger, count-up, marquee  | 15   |
| screenshot zoom/pan                                                                   | 17   |
| reactions burst                                                                       | 18   |
| heatmap ripple                                                                        | 20   |
| area-chart draw                                                                       | 30   |
| token bars and split                                                                  | 31   |
| snowfall                                                                              | 29   |

This task adds the shared pieces:

- one pointer listener for **spotlight + 3D tilt**;
- the **primary-button sheen**;
- **page** view transitions;
- `.reveal` on section headers, project cards and the footer;
- pausing infinite animations while they're off-screen;
- a full audit.

Rules for everything:

- **CSS-first.** Every effect runs only under `prefers-reduced-motion: no-preference`.
- **Complete at rest.** Nothing starts at `opacity: 0` waiting for JS.
- **Transform, opacity, filter or clip-path only.** No layout shift.
- **No loops off-screen.** No animation loop keeps running when it isn't visible.

## Files to Create/Modify/Delete

- **Create** `src/components/motion/PointerFx.astro`, mounted **once in `src/layouts/BaseLayout.astro`** (end of `<body>`). It replaces the earlier standalone Spotlight component. Its bundled script uses **one** delegated, passive, rAF-throttled `pointermove` listener on `document`, registered once (module scripts run once under `<ClientRouter />`), which drives two effects:
  - **Spotlight**: sets `--mx`/`--my` on the closest `[data-card]` (the CSS radial glow, only when `html[data-fx=on]`).
  - **3D tilt** (works together with `.rise`/`.reveal` only because task 06's keyframes use `translate`/`scale`, not `transform`; M-A): on the closest `[data-tilt]`, sets `--rx`/`--ry` and adds `.tilting`. The max is **4°** for cards ≤ 500 px wide and **2°** for wider ones (mockup `k`). Leaving the card, or moving to another card, resets the previous one. The CSS is `[data-tilt]{transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)); transition:transform .35s var(--ease-out)}` and `.tilting{transition-duration:.08s}`.
  - **Enable/disable**: `html[data-fx]` is `on` only when `(hover: hover) and (pointer: fine)` **and** `prefers-reduced-motion: no-preference`.
  - **Re-init**: an `astro:page-load` handler re-evaluates the media queries, sets `data-fx`, and clears any stale `--rx/--ry/--mx/--my` after swaps. A `change` listener on both media queries updates `data-fx` mid-session.
  - Tilt uses `transform` only, so there's no layout shift. The mockup's sample `translateY(var(--ty))` is omitted.
- **Create** `src/components/motion/PauseOffscreen.astro`, also mounted once in `BaseLayout`. One `IntersectionObserver` (`rootMargin: '100px'`) watches every `.loop-anim` element: the marquee tracks, the hero name `nameFlow` and `dotPulse`, the "Now learning" pulse, the Token burn flame, Spotify music bars, and the shimmer skeletons. It toggles `data-paused`, and CSS applies `[data-paused]{animation-play-state:paused}`. It also sets `data-paused` on all of them while `document.hidden`. It re-observes on `astro:page-load` and disconnects on `astro:before-swap`.
  - The rAF-driven loops handle this themselves: snowfall (29) pauses when hidden; count-up is one-shot; the Spotify progress interpolation (19) must also stop on `visibilitychange` and when off-screen (add `IntersectionObserver` gating in 19's island).
- **Modify** `src/styles/animations.css`, all within the `no-preference` media query:
  - **Primary-button sheen**: `.btn-primary{position:relative;overflow:hidden}` plus a `::after` 110° gradient `transparent 30% → var(--shine) 50% → transparent 70%` (the Tokyonight `--shine` token, not white) that sweeps `translateX(-120% → 120%)` over .7 s `--ease-out` on `:hover` / `:focus-visible`. It is applied to `Button variant="primary"` (task 08).
  - **Page view transitions**: `main{view-transition-name:page}` (outside the media query, so the name exists; the animations are inside it), plus `::view-transition-old(page){animation:.22s var(--ease-out) both pageOut}` and `::view-transition-new(page){animation:.34s var(--ease-out) both pageIn}`.
  - **Morphs**: the `post-title-*` named morph (list → post) at 250 ms `--ease-out`, and the `nav-pill` group from 09.
- **Modify** `src/layouts/BaseLayout.astro`:
  - render `<PointerFx />`, `<PauseOffscreen />` and `<CountUp />` (from 15);
  - keep `<ClientRouter />`, whose default fallback plays no animation where view transitions aren't supported and respects reduced motion;
  - put `transition:animate="none"` on the persisted header and the palette root, so only `page`, `nav-pill` and the title morphs animate.
  - Check with Chrome's Animations panel that Astro's own default `fade` on `main` is replaced (`transition:animate="initial"` is removed in favour of the named `page` group). Verify ClientRouter + `view-transition-name` coexist: exactly one element named `page` per document.
- **Modify** the components that should reveal on scroll, adding `.reveal`: homepage `SectionHeading`s, `ProjectCard` (both variants, from 17), the `Footer` top row and statusline (09), the about page timeline items (16), and the tag-page heads (14).
- **Supersedes** the spotlight-only `src/components/ui/Spotlight.astro` from this plan's previous revision; don't create it. `PointerFx` covers the spotlight.

## Implementation Steps

1. Implement `PointerFx`, `PauseOffscreen`, the sheen and the page view-transition CSS; add `.reveal` where listed.
2. **Motion inventory**: walk every route (`/`, `/blog`, a post, `/tags`, `/tags/nestjs`, `/projects`, `/about`, `404`) in light and dark at 375, 768 and 1280 px, and record in the PR which effects appear where, against the mockup.
3. **Reduced motion**: emulate `prefers-reduced-motion: reduce` (DevTools Rendering) and walk every route again. Nothing moves except user scrolling: no marquee (it becomes static, scrollable rows), no tilt/spotlight, no count-up (final numbers shown), no snowfall, no reveals, no view-transition animations, and the theme switch is instant.
4. **At-rest check**: disable JS, and separately set the DevTools Animations playback to 0%. Every element is visible, in its final position, with its final numbers.
5. **Off-screen loops**: with the Performance panel recording, scroll the homepage bento out of view for 5 s. There are no rAF callbacks, and the CSS animations on `.loop-anim` elements are paused (Animations panel shows them paused). Switch tabs: snowfall, Spotify and the clocks all pause.
6. **CLS**: Lighthouse (mobile) CLS < 0.05 on `/blog`, a post, `/projects` and `/about`. `/` is measured with all live cards in task 28. The Performance panel shows no layout shifts attributed to animations.
7. **Contrast**: glass cards over the snowfall and glow backgrounds pass AA in both themes.

## Acceptance Criteria

- [ ] `bun run build` succeeds.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] Every item-5 effect is present and matches the mockup when motion is allowed: word-by-word hero, name shine + colour flow (`nameFlow`, Karhdo offset .6 s) and full-stop `dotPulse`, staggered bento rise, scroll-driven reveals (section heads, project cards, footer, post h2/code/callouts), heatmap ripple, token bars growing with a spring, split bars wiping in, count-up numbers, card tilt (max 2–4°, hover-capable devices only), spotlight, button sheen, chip pop, post-row underline, reactions burst + "+1", wordmark decode (once per session) + hover letter wave + hover/focus-only underline (hidden at rest), page slide/fade, nav-pill glide, and the circular theme reveal.
- [ ] Under reduced motion, **all** of the above are off (step 3), including mid-session toggles.
- [ ] At rest, with no JS or with animations paused, all content is complete and readable (step 4); nothing depends on JS to become visible.
- [ ] No layout shift from any animation; Lighthouse CLS < 0.05 on the pages in step 6.
- [ ] No animation loop runs off-screen or in a hidden tab (step 5).
- [ ] **Tilt works after load (M-A)**: in Chrome, after the page has loaded and the `.rise`/`.reveal` animations have finished, hovering a bento card and a project card **visibly tilts it**. That confirms `riseIn`/`revealIn` animate the individual `translate`/`scale`/`opacity` properties and not `transform`, so their `both` fill doesn't override the tilt transform.
- [ ] Exactly one `pointermove` listener for the tilt and spotlight effects (checked with `getEventListeners(document)` in DevTools), which survives view-transition navigation without duplicating.
- [ ] ClientRouter navigation shows the `page` slide/fade and the nav-pill glide in Chrome, and falls back to instant swaps elsewhere, without console errors.

## Dependencies

- v2-astro-blog-post-page
- v2-astro-blog-list-pagination
- v2-astro-tags-pages
- v2-astro-homepage-bento
- v2-astro-about-and-404
- v2-astro-projects-page
- v2-astro-snowfall
- v2-astro-token-burn
- v2-astro-stats-views-reactions
- v2-astro-github-integration
- v2-astro-blog-stats-summary
- v2-astro-spotify-now-playing

## Patterns to Follow

- Mockup "Motion system" CSS section and the `motion: card tilt`, `count-up` and theme-reveal JS.
- Astro docs "View transitions" (named transitions, `transition:animate`, ClientRouter lifecycle events `astro:before-preparation` / `astro:after-swap`).
- web.dev "prefers-reduced-motion"; MDN "animation-timeline: view()", "View Transition API".
- Reference `src/styles/animations.css` (hta218/leohuynh.dev).


> **Notes from task 15 review:** the Latest post card has no `transition:name`, because Recent posts already uses `post-title-${id}` for the same post (duplicate names break view transitions). When running axe, scroll to the bottom first so `.reveal` elements reach opacity 1; mid-reveal cards at .35 opacity cause false contrast errors. Tasks 19/20/30/31: `formatCount` groups digits with `toLocaleString("en-US")`; give counted numbers `tabular-nums` and a min-width so the count-up does not shift inline text. `.rise` uses fill-mode `backwards`, not `both`, so hover transforms still apply after the entrance.
