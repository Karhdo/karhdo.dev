# 04 — Vercel config: security headers, rewrites, redirects, Bun build

## Endpoint

None.

## Summary

Move the security headers from v1 `next.config.mjs` into `vercel.json`, keep the Umami `/stats/*` rewrite, add the redirects needed for URL parity (`/sitemap.xml`, `/blog/page/1`), and make Vercel build with Bun while Functions run on Node.

## Files to Create/Modify/Delete

- **Rewrite** `vercel.json`:
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "framework": "astro",
    "installCommand": "bun install --frozen-lockfile",
    "buildCommand": "bun run build",
    "rewrites": [{ "source": "/stats/:match*", "destination": "https://analytics.karhdo.dev/:match*" }],
    "redirects": [
      { "source": "/sitemap.xml", "destination": "/sitemap-index.xml", "permanent": true },
      { "source": "/blog/page/1", "destination": "/blog", "permanent": true }
    ],
    "headers": [{ "source": "/(.*)", "headers": [ …7 headers… ] }]
  }
  ```
  Headers, copied from v1 `securityHeaders`: `Content-Security-Policy`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-DNS-Prefetch-Control: on`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
  CSP (v1 value, single line, extended only where v2 needs it):
  `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' giscus.app analytics.umami.is analytics.karhdo.dev; style-src 'self' 'unsafe-inline'; img-src * blob: data:; media-src *.s3.amazonaws.com; connect-src *; font-src 'self'; frame-src giscus.app *.github.io`
  (`'wasm-unsafe-eval'` for Pagefind WASM; `analytics.karhdo.dev` in case the Umami script is loaded directly.)
- **Do not** add `bunVersion` (that would switch Functions to the Bun runtime; the decision is Node).
- **Note for task 28**: Vercel project settings → Node.js Version 24.x; Framework Preset "Astro"; remove any `NEXT_*` overrides of Build/Output settings.

## Implementation Steps

1. Read v1 headers with `git show main:next.config.mjs` and v1 `vercel.json`.
2. Write the new `vercel.json`; validate JSON (`bun -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))"`).
3. `bun run build`, then confirm `.vercel/output/config.json` contains the headers/rewrites/redirects routes (the adapter merges `vercel.json`).
4. Optional local check: `bunx vercel build` + `bunx vercel dev` or deploy a preview (done fully in task 28) and `curl -I` a page.

## Acceptance Criteria

- [ ] `bun run build` succeeds; `.vercel/output/config.json` `routes` include the 7 security headers, the `/stats/(.*)` rewrite and both redirects.
- [ ] `bunx biome check` passes (vercel.json formatted).
- [ ] `bunx astro check` passes.
- [ ] CSP string is identical to v1 except the three documented additions (diff shown in PR).
- [ ] No `bunVersion` key present.

## Dependencies

- v2-astro-scaffold-astro

## Patterns to Follow

- v1 `next.config.mjs` (`securityHeaders`), v1 `vercel.json` (rewrite).
- Reference `vercel.json` (hta218/leohuynh.dev) — same header layout and `/sitemap.xml` redirect.


> **Note from task 04 review:** `@astrojs/vercel` does not merge `vercel.json` into `.vercel/output/config.json`; the Vercel platform merges it at deploy time (`vercel build` / Git deploys; user routes first). Verify headers, the `/stats` rewrite and redirects with `curl -I` on the preview. **Never deploy with `astro build` + `vercel deploy --prebuilt` without `vercel build`**; that skips the merge and drops the security headers and redirects. The CSP has two documented additions (`'wasm-unsafe-eval'`, `analytics.karhdo.dev`), not three.
