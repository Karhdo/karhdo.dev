# 03 — Typed site config and `astro:env` schema

## Endpoint

None.

## Summary

Port the v1 data files (`data/siteMetadata.js`, `data/navigation.ts`, `data/projectsData.ts`, `data/popularTags.ts`) into typed modules under `src/config/`, and declare every environment variable through `astro:env` so server secrets and public client values are validated and typed.

## Files to Create/Modify/Delete

- **Create** `src/config/site.ts` — `export const SITE = { title, author, fullName, headerTitle, description, language: 'en-us', locale: 'en-US', siteUrl: 'https://karhdo.dev', siteRepo, analyticsURL, siteLogo, image, socialBanner, email, github, facebook, linkedin, twitter, socialAccounts, timezone: 'Asia/Ho_Chi_Minh', location: 'Ho Chi Minh City, Viet Nam', postsPerPage: 5 } as const;` plus `GISCUS` defaults (`mapping: 'title'`, `reactions: '1'`, `metadata: '0'`, `theme: 'light'`, `darkTheme: 'transparent_dark'`, `lang: 'en'`, `inputPosition: 'bottom'`) — ids come from env. Values copied verbatim from `data/siteMetadata.js` (fix: the Facebook profile link in v1 `ProfileInfo` wrongly used `linkedin`; use `facebook`).
- **Create** `src/config/navigation.ts` — `HEADER_NAV_LINKS`, `FOOTER_NAV_LINKS`, `FOOTER_PERSONAL_STUFF` as in `data/navigation.ts` (import `SITE`).
- **Create** `src/config/projects.ts` — `Project` type (from `types/data.ts`) + `PROJECTS` data verbatim; update the "Personal website" `builtWith` to `['Astro', 'Tailwind', 'Typescript', 'Drizzle', 'Umami']`.
- **Create** `src/config/popular-tags.ts` — data verbatim; `iconType` typed as `BrandIconName` (string union declared here, consumed in task 08).
- **Create** `src/types/github.ts`, `src/types/spotify.ts`, `src/types/stats.ts` — port `GithubRepository`, `GithubRepositoryCommit`, `CommitState` (types/data.ts), `SpotifyNowPlayingData` (types/server.ts), `StatsType = 'blog' | 'snippet'`, `Stats`.
- **Modify** `astro.config.mjs` — add `env: { schema: { … }, validateSecrets: false }` with `envField`:
  - `context: 'server', access: 'secret'`, `optional: true`: `POSTGRES_URL` (string, url), `GITHUB_API_TOKEN`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `BUTTONDOWN_API_KEY`, and **`ANTHROPIC_ADMIN_API_KEY`** (pre-registered here for task 31 so that no p5 task edits the env schema; m2).
  - `context: 'server', access: 'public'`, `optional: true` — **v1 names kept, no renames** (decision m5, so the Vercel project needs no env changes): `NEXT_PUBLIC_GISCUS_REPO`, `NEXT_PUBLIC_GISCUS_REPOSITORY_ID`, `NEXT_PUBLIC_GISCUS_CATEGORY`, `NEXT_PUBLIC_GISCUS_CATEGORY_ID`, `UMAMI_WEBSITE_ID`. They are read only in server-rendered/prerendered Astro components (`Analytics.astro`, `PostLayout.astro`) and passed to islands as props, so no `context: 'client'` variables are needed. `UMAMI_SHARE_URL` is dropped (unused in v1 code; `SITE.analyticsURL` already holds the share link).
- **Rewrite** `.env.example` — the 12 variables above, grouped and commented; drop v1 leftovers (`UTTERANCES_REPO`, `DISQUS_SHORTNAME`, `NEXT_PUBLIC_*SHARE*`, `NEXT_PUBLIC_CREATE_DISCUS_*`).
- **Delete** `data/siteMetadata.js`, `data/navigation.ts`, `data/projectsData.ts`, `data/popularTags.ts`, `data/references-data.bib` (unused — no post cites it). `data/blog/` and `data/authors/` stay for task 10.

## Implementation Steps

1. `git show main:data/siteMetadata.js` etc.; transcribe into the new typed modules with `as const` / `satisfies`.
2. Add the `env.schema` block; run `bunx astro sync` to generate `astro:env` types.
3. Add a throwaway usage (`import { POSTGRES_URL } from 'astro:env/server'` in a scratch endpoint) to confirm typing, then remove it.
4. Write `.env.example` with the v1 variable names unchanged (Vercel env needs no renames).

## Acceptance Criteria

- [ ] `bun run build` succeeds with **no** env vars set (all optional).
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes; `astro:env/server` imports (secret and public) are typed.
- [ ] Every key in v1 `siteMetadata.js` used by v1 UI has an equivalent in `SITE` (checklist in PR description).
- [ ] `.env.example` lists exactly the 12 variables in the schema, all with their v1 names.
- [ ] `data/` contains only `blog/` and `authors/`.

## Dependencies

- v2-astro-scaffold-astro

## Patterns to Follow

- v1: `data/siteMetadata.js`, `data/navigation.ts`, `data/projectsData.ts`, `data/popularTags.ts`, `types/data.ts`, `types/server.ts`, `types/prisma.ts`.
- Astro docs "Type-safe environment variables" (`envField.string({ context: 'server', access: 'secret' | 'public', optional: true })`).
