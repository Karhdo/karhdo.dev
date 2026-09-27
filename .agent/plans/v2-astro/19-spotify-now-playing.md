# 19 — Spotify now playing (API + bento card island)

## Endpoint

- `GET /api/spotify`

## Summary

Port the Spotify refresh-token flow and the now-playing endpoint, then render a Spotify bento card island on the homepage (album art, title, artist, animated equaliser bars from v1 `MusicBar`, "Not playing" state with a link to the profile).

## Files to Create/Modify/Delete

- **Create** `src/lib/services/spotify.ts` — port v1 `lib/services/spotify.ts` + `constants/index.ts` URLs; secrets from `astro:env/server`; `btoa` instead of `Buffer`; cache the access token in module scope until `expires_in - 60 s`; `fetch` with `AbortSignal.timeout(5000)`; returns `null` when env is missing.
- **Create** `src/pages/api/spotify.ts` — `prerender = false`; port of v1 route: 204 or ≥ 400 → `{ isPlaying: false }`; episode → `{ isPlaying: is_playing !== false, title, songUrl }`; track → `SpotifyNowPlayingData` extended with **`progressMs`** (`data.progress_ms`) and **`durationMs`** (`data.item.duration_ms`) for the mockup progress bar (`albumImageUrl` = smallest image ≥ 64 px rather than `images[0]`, to cut bytes). Update `src/types/spotify.ts` accordingly (both optional numbers; episodes also include them when present). Headers `Cache-Control: public, max-age=0, must-revalidate` + `Vercel-CDN-Cache-Control: max-age=30, stale-while-revalidate=30` (CDN absorbs polling from many visitors; see the 00-overview cache-header rule).
- **Create** `src/components/islands/SpotifyNowPlaying.tsx` — fetch on mount then every 30 s **only while `document.visibilityState === 'visible'`**; renders the mockup `.c-spotify` card: eyebrow "Now playing" with equaliser bars, album art (`<img width=64 height=64 loading="lazy">`, CSP `img-src *` already allows `i.scdn.co`), title link (`data-umami-event="spotify-now-playing"`), `artist · album`, a **progress bar** + `m:ss / m:ss` times (mockup `.progress`, `.ptime`) interpolated client-side every second from `progressMs` + elapsed time since fetch (the interval runs only while the card intersects the viewport **and** the tab is visible, per the task-26 no-off-screen-loops rule) (clamped to `durationMs`, frozen when `isPlaying` is false; interpolation stops under reduced motion and just updates on each poll), equaliser bars (v1 `music-bar-1..4` keyframes, `motion-safe` only) and the progress bar, both in `var(--spotify)` (= Tokyonight `--green`, not the brand #1db954); when there is no album art, the cover placeholder is the mockup `.cover`: `conic-gradient(from 200deg, var(--orange), var(--red), var(--purple), var(--blue), var(--orange))`, using tokens only; skeleton while loading; "Not playing — offline" state with Spotify icon.
- **Modify** `src/components/home/SpotifyCard.astro` (stub from task 15) — replace the skeleton body with `<SpotifyNowPlaying client:visible transition:persist="spotify" />` and a static skeleton fallback. **Do not edit `src/pages/index.astro`.**

## Implementation Steps

1. `git show main:lib/services/spotify.ts main:app/api/spotify/route.ts main:components/homepage/SpotifyNowPlaying.tsx main:components/homepage/MusicBar.tsx main:hooks/use-now-playing.ts`.
2. Implement service + endpoint; test with real credentials locally (`bun dev`, `curl localhost:4321/api/spotify`) while playing and while paused.
3. Implement island; confirm polling stops when the tab is hidden (DevTools Network).

## Acceptance Criteria

- [ ] `bun run build` succeeds (no env needed); `api/spotify` is a function.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `/api/spotify` returns `{ isPlaying: false }` with no credentials, and a full track payload including `progressMs` and `durationMs` while playing (manual check).
- [ ] The progress bar advances in step with Spotify (±2 s) and times display as `m:ss`.
- [ ] Card updates within 30 s of a track change; no requests while the tab is hidden.
- [ ] Equaliser bars do not animate with reduced motion.
- [ ] The island JS for this card is < 5 kB gzipped (excluding the shared React runtime).

## Dependencies

- v2-astro-site-config-env
- v2-astro-homepage-bento

## Patterns to Follow

- v1 `lib/services/spotify.ts`, `app/api/spotify/route.ts`, `components/homepage/SpotifyNowPlaying.tsx`, `components/homepage/MusicBar.tsx`.
- Reference `src/pages/api/spotify.json.ts`, `src/components/studio/runtime-rail/SpotifyCard.astro` (hta218/leohuynh.dev).


> **Implementation note (task 19):** the Spotify card is a vanilla module script (no React island). Polling stops when the tab is hidden, the card is off-screen or you navigate away, and album art uses Spotify's own 64/300/640 srcset (not the Vercel image service, to save the image quota).
