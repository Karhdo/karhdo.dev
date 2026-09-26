# 27 — Docs, repo hygiene and dependency automation

## Endpoint

None.

## Summary

Update the documentation and repository metadata for the Astro stack: `CLAUDE.md`, `README.MD`, `.github/dependabot.yml`, PR template, and remove unused assets. The dev-only `/dev/*` pages are kept (they are never built).

## Files to Create/Modify/Delete

- **Rewrite** `CLAUDE.md` — Astro/Bun commands (`bun dev`, `bun run build`, `bun run preview`, `bun run check`, `bun test`, `bunx biome check --write`, `bun run db:pull`), architecture (unified markdown processor, content collections, islands policy + lazy palette, `astro:env` (v1 env names kept), Drizzle mapping + "never push/migrate" rule and Neon pooler/direct hosts, API endpoints table, Pagefind/OG at build, dev-only `/dev/*` pages via `src/integrations/dev-pages.ts`, `data-theme` theming), testing convention (pure modules + `bun test`), build-time footer info (`scripts/build-info.mjs`), Token burn data source and its limitations (API-key usage only, UTC days, `ANTHROPIC_ADMIN_API_KEY` in Vercel Production only, a dedicated org recommended, and the key-rotation procedure: new key → update Production env → redeploy → revoke old → verify), conventions (Biome, lefthook pre-commit, CI workflow, Conventional Commits).
- **Rewrite** `README.MD` — stack, features, local setup with Bun and docker-compose Postgres, env vars (including a **"Rotating the Anthropic Admin key"** section, m4: Production-only, a dedicated org, and the rotation steps), deploy notes, credits (Leo Huynh reference repo; Tokyonight palette (folke/tokyonight.nvim, Apache-2.0) and the Tokyonight Day Expressive Code theme converted from folke/tokyonight.nvim `extras/sublime/tokyonight_day.tmTheme` (MIT, pinned commit); Twemoji v17.0.3 by jdecked, CC-BY 4.0 attribution).
- **Modify** `.github/dependabot.yml` — `package-ecosystem: "bun"` (supported by Dependabot since 2025; if not accepted, keep `npm` which also reads `package.json`), group `astro` + `@astrojs/*`, group `react*`, keep the major-version ignore.
- **Modify** `.github/pull_request_template.md` — replace any `pnpm lint` checklist items with `bun run check` / `bunx biome check`.
- **Modify** `.claude/skills/commit/SKILL.md`, `.claude/skills/pull-request/SKILL.md` — only if they reference pnpm/ESLint/Next commands.
- **Keep** `src/dev-pages/**` and `src/integrations/dev-pages.ts`: they are injected only under `astro dev` (task 06) and never built, so they remain as living style/fixture pages. Verify no `/dev/` path exists in `.vercel/output/static` or the sitemap.
- **Delete** unused public assets found by `rg` (e.g. `public/static/images/avatar_backup.jpg` if unreferenced; `public/static/favicons` references to missing `apple-touch-icon.png`/`safari-pinned-tab.svg` are removed from `Seo.astro` or the files are generated from `tennis-racquet.png`).

## Implementation Steps

1. Write docs from the final state of the repo (run the commands you document).
2. `rg -l "pnpm|next |prisma|contentlayer|husky|eslint|prettier" --glob '!.agent/**' --glob '!.agents/**'` → fix or justify each hit. `NEXT_PUBLIC_GISCUS_*` are expected hits (v1 env names kept on purpose, decision m5).
3. Check every file under `public/` is referenced (script in scratch) and delete orphans after confirming with git history.

## Acceptance Criteria

- [ ] `bun run build` succeeds.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `bun test` passes and the CI workflow (task 02) is green on the branch.
- [ ] The rg search in step 2 returns no stale references outside `.agent/`, `.agents/`, and git history.
- [ ] Following README setup from a fresh clone (`bun install && bun dev`) works.
- [ ] Dependabot config validates (GitHub "Insights → Dependency graph → Dependabot" shows no config error after push).

## Dependencies

- v2-astro-snowfall
- v2-astro-blog-stats-summary
- v2-astro-token-burn
- v2-astro-tooling-biome
- v2-astro-db-drizzle
- v2-astro-search-command-palette
- v2-astro-og-images
- v2-astro-feeds-sitemap-robots

## Patterns to Follow

- Current `CLAUDE.md` structure (sections Project Overview / Commands / Architecture / Important Patterns / Conventions).
- Reference `README.md` (hta218/leohuynh.dev).


> **Note from task 11:** folke/tokyonight.nvim (the source of `src/styles/ec-tokyonight-day.json`) is **Apache-2.0**, not MIT. Add a `THIRD_PARTY_NOTICES.md` at the repo root listing: tokyonight.nvim (Apache-2.0, with the full licence text or a link to it at the pinned SHA, and a note that the JSON is a converted derivative), Lucide brand glyphs (ISC, full notice), Twemoji graphics (CC-BY 4.0, jdecked/twemoji v17.0.3) and simple-icons (CC0). The README credits section points to it.
