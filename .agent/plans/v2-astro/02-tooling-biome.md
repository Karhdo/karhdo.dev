# 02 — Biome, lefthook, CI, test runner and project scripts

## Endpoint

None.

## Summary

Add Biome as the single linter/formatter (replacing ESLint + Prettier + prettier-plugin-tailwindcss), lefthook as the pre-commit hook (replacing Husky + lint-staged), `bun test` as the unit-test runner, and a GitHub Actions CI workflow. Tighten TypeScript and define the standard scripts every later task uses for verification.

**Testing convention (applies to all later tasks):** `bun test` cannot resolve Astro virtual modules (`astro:content`, `astro:env/*`, `astro:transitions`). Any logic that needs unit tests lives in pure modules under `src/lib/**` that take their inputs as arguments (e.g. `countTags(posts)`, `statsPostSchema`, `handleStatsPost(body, deps)`); thin wrappers that touch virtual modules stay untested. Tests live next to the code as `*.test.ts`.

## Files to Create/Modify/Delete

- **Create** `biome.json` — based on the reference repo's `biome.json`, adapted to v1 `.prettierrc` style: `formatter.indentStyle: "space"`, `indentWidth: 2`, `lineWidth: 120`; `javascript.formatter.quoteStyle: "single"`, `jsxQuoteStyle: "double"`, `semicolons: "always"`, `trailingCommas: "es5"`, `arrowParentheses: "always"`; `css.parser.tailwindDirectives: true`; `vcs.useIgnoreFile: true`; `files.includes: ["**", "!**/.astro", "!**/.vercel", "!**/dist", "!**/node_modules", "!**/bun.lock", "!.agent/**", "!.agents/**"]`; linter `recommended` + `nursery.useSortedClasses: { level: "warn", options: { functions: ["cn", "clsx"] } }`; overrides for `**/*.astro` turning off `useImportType`, `noUnusedVariables`, `noUnusedImports` (Astro frontmatter false positives); `assist.actions.source.organizeImports: "on"`.
- **Modify** `package.json` — add devDependencies `@biomejs/biome@^2.5.14`, `lefthook` (latest 1.x/2.x — verify with `npm view lefthook version`), `@types/bun`; scripts: `lint: biome lint .`, `format: biome format --write .`, `check: astro check && biome check .`, `check:fix: biome check --write .`, `typecheck: astro check`, `test: bun test`, `prepare: lefthook install || true` (no-op on Vercel where there is no `.git`).
- **Create** `lefthook.yml` — `pre-commit: { commands: { biome: { glob: "*.{js,ts,tsx,mjs,astro,json,jsonc,css}", run: "bunx biome check --staged --no-errors-on-unmatched --files-ignore-unknown=true --write", stage_fixed: true } } }`.
- **Create** `.github/workflows/ci.yml` — on `push` to `v2`/`main` and `pull_request`: `actions/checkout@v4`, `oven-sh/setup-bun@v2` with `bun-version: 1.3.14`, then `bun install --frozen-lockfile`, `bunx biome ci .`, `bunx astro check`, `bun test`, `bun run build`. No secrets needed (all env vars are optional). Task 06 adds a `bun run lint:palette` step (the Tokyonight-only colour check, M-C) right after `biome ci`.
- **Create** `src/lib/utils/sanity.test.ts` — one trivial test so `bun test` has something to run until feature tests land (delete once the first real test exists).
- **Modify** `tsconfig.json` — keep `paths: { "~/*": ["./src/*"] }` without `baseUrl` (TS 6 TS5101); add `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`, `"verbatimModuleSyntax": true` (compatible with Astro strict).
- **Modify** `.vscode/settings.json` — `"editor.defaultFormatter": "biomejs.biome"`, `"editor.codeActionsOnSave": { "source.organizeImports.biome": "explicit", "quickfix.biome": "explicit" }`, `[astro]` formatter `astro-build.astro-vscode`; keep the tsdk settings.
- **Create** `.vscode/extensions.json` — recommend `biomejs.biome`, `astro-build.astro-vscode`, `bradlc.vscode-tailwindcss`.

## Implementation Steps

1. `bun add -d @biomejs/biome@^2.5.14` and write `biome.json` (confirm the `$schema` URL matches the installed version: `https://biomejs.dev/schemas/2.5.14/schema.json`).
2. Update `tsconfig.json` and scripts.
3. Run `bunx biome check --write .` once to normalise the scaffold from task 01.
4. Update VS Code settings.
5. `bun run prepare` → confirm `.git/hooks/pre-commit` is managed by lefthook; stage a mis-formatted file and commit → hook reformats it (then reset the test commit).
6. Push the branch and confirm the CI workflow runs green.

## Acceptance Criteria

- [ ] `bun run build` succeeds.
- [ ] `bunx biome check` passes with 0 errors and 0 warnings.
- [ ] `bunx astro check` passes.
- [ ] `bunx biome format .` on an intentionally mis-formatted `.ts` file rewrites it to single quotes + semicolons + 120-col width (then revert the test file).
- [ ] `bunx biome check` ignores `.astro/`, `.vercel/`, `.agent/`.
- [ ] `bun test` passes.
- [ ] lefthook pre-commit hook runs `biome check --staged` on commit.
- [ ] `.github/workflows/ci.yml` runs green on the pushed branch (install --frozen-lockfile, biome ci, astro check, bun test, build).
- [ ] `tsconfig.json` still has no `baseUrl`.

## Dependencies

- v2-astro-scaffold-astro

## Patterns to Follow

- Reference `biome.json` (hta218/leohuynh.dev) — Astro overrides and `tailwindDirectives`.
- v1 `.prettierrc` (`git show main:.prettierrc`) for style parity.
