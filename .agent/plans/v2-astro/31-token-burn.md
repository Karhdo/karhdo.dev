# 31 — Token burn card (Anthropic Usage & Cost Admin API)

## Endpoint

- `GET /api/token-burn`

## Summary

Fill the homepage **Token burn** bento card (mockup `.c-burn`, which replaces the earlier Local time / GMT+7 clock card) with live data from Anthropic's **Usage & Cost Admin API**. The card shows:

- tokens today plus today's cost in USD;
- a 14-day bar chart of daily tokens, with today highlighted;
- a split bar and legend for **cache / input / output**;
- an "N this month" footer;
- a flame icon that flickers only when motion is allowed.

All data is fetched on demand by a server endpoint using a new server-only secret, CDN-cached for 15 minutes, never queried at build time, and it never errors the page. The card is a vanilla `<script>`, with **no React**.

### API facts verified on 2026-09-26

Sources: platform.claude.com/docs/en/manage-claude/usage-cost-api and the endpoint reference pages `api/beta/organization/usage_report/retrieve_messages` and `…/cost_report/retrieve`.

- **Auth.** Headers are `x-api-key: <Admin API key, sk-ant-admin…>` and `anthropic-version: 2023-06-01`. Regular API keys are rejected, and Admin keys are **not available to individual accounts**: the user needs an Anthropic **organization**.
- **Usage.** `GET https://api.anthropic.com/v1/organizations/usage_report/messages`
  - Query: `starting_at` (RFC 3339, required; buckets snap to the UTC start of the day), `ending_at` (optional; buckets that end before it), `bucket_width` = `1d` | `1h` | `1m` (default `1d`), `limit` (for `1d`: default 7, **max 31**), `page` (the cursor), plus optional filters and `group_by[]`.
  - Response: `{ data: [{ starting_at, ending_at, results: [{ uncached_input_tokens, cache_creation: { ephemeral_5m_input_tokens, ephemeral_1h_input_tokens }, cache_read_input_tokens, output_tokens, server_tool_use: {…}, …grouping fields (null when not grouped) }] }], has_more, next_page }`.
  - Buckets come oldest first, one per interval **including empty ones** (`results: []`). Without `group_by` there is at most one result per bucket.
- **Cost.** `GET https://api.anthropic.com/v1/organizations/cost_report`
  - Query: `starting_at` (required), `ending_at`, `bucket_width` (**`1d` only**), `limit` (default 7, max 31), `page`, `group_by[]` (`description` | `workspace_id`).
  - Response: same envelope; each result has `amount` (a **decimal string in the lowest currency unit, i.e. cents**: `"123.45"` = $1.23), `currency` (`"USD"`), and `cost_type`, `token_type`, `model`, … (null when not grouped).
  - Priority Tier costs are **not** included.
- **Pagination.** While `has_more` is `true`, pass `next_page` as `page`.
- **Freshness and rate.** Data appears within about 5 minutes of a request completing, and polling should be at most about once per minute. The 15-minute CDN cache keeps us well under that.

### Limitations (documented here and in `00-overview.md`)

- The Admin API reports **API-key usage for the organization only**. Claude Pro/Max **subscription** usage (including Claude Code used through a subscription login) and claude.ai chat usage are **not included**, so the card is labelled "API usage" and the mockup's "· mostly Claude Code" footer text is dropped.
- Days are **UTC buckets**: `1d` buckets snap to UTC midnight. Converting to GMT+7 would need `1h` buckets (max 168 per page, so about 5 paginated calls for month-to-date), so v2 **labels days as UTC** instead ("today (UTC)", bar titles `YYYY-MM-DD UTC`) and computes "today" and "this month" in UTC consistently.
- Cost excludes Priority Tier and may lag usage slightly.
- "Today" is a partial bucket, and totals can trail real usage by up to about 5 minutes plus the 15-minute CDN cache.

## Files to Create/Modify/Delete

- **No `astro.config.mjs` edit**: `ANTHROPIC_ADMIN_API_KEY` is already pre-registered in the task-03 env schema as `envField.string({ context: 'server', access: 'secret', optional: true })` (m2).
- **Modify** `.env.example`: (already listed by 03) add the explanatory comment for `ANTHROPIC_ADMIN_API_KEY=` (an org Admin key `sk-ant-admin…`; set it in **Vercel Production only**).
- **Key handling (m4).**
  - **Where to set it**: set `ANTHROPIC_ADMIN_API_KEY` in Vercel for the **Production** environment only, **not Preview or Development**. An Admin key can manage the whole organization, so it must not be exposed to preview deployments of arbitrary branches. Previews therefore render the card's `available: false` empty state, and that is expected.
  - **Dedicated org**: recommend a **dedicated Anthropic organization** whose only purpose is the API usage this card should reflect, so a leaked key has a minimal blast radius and the numbers aren't mixed with unrelated org usage.
  - **Rotation**: the README (task 27) documents it: create the new Admin key in the Console → update the Vercel Production env → redeploy → revoke the old key → verify `/api/token-burn` returns `available: true`.
- **Create** `src/lib/anthropic-usage.ts`. It is pure apart from the injected `fetch`, and it never imports `astro:*`.
  - `usageWindow(now: Date)` → `{ startingAt, endingAt, todayKey, monthKey }`. Here `startingAt = min(startOfUtcMonth(now), startOfUtcDay(now) − 13 days)` and `endingAt = startOfUtcDay(now) + 1 day`. That is at most 31 daily buckets, which fits `limit=31`.
  - `fetchAllPages(url, params, { apiKey, fetch, signal })`: builds the query (`bucket_width=1d`, `limit=31`), sets the `x-api-key` and `anthropic-version: 2023-06-01` headers, follows `has_more` / `next_page` (capped at 5 pages as a safety stop), and throws a typed `UsageApiError` on non-2xx responses.
  - `aggregateUsage(buckets)` → `Map<dateKey, { cache, input, output, total }>`, where `input = uncached_input_tokens`, `cache = cache_creation.ephemeral_5m_input_tokens + cache_creation.ephemeral_1h_input_tokens + cache_read_input_tokens`, and `output = output_tokens`. Missing fields count as 0, and multiple results in one bucket are summed.
  - `aggregateCost(buckets)` → `Map<dateKey, usd>`, summing `Number(amount) / 100` over results where `currency === 'USD'`.
  - `buildTokenBurn({ usage, cost, now })` → the response payload:
    - `days` are the last 14 UTC dates ending today, with zeros filled in;
    - `today` is the `todayKey` entry;
    - `month` sums the entries with `dateKey >= monthKey`;
    - `split` is the **month-to-date** share of cache / input / output as integer percentages that sum to exactly 100 (largest-remainder method; all 0 when the month total is 0).
  - `formatTokens(n)` and `formatUsd(n)` live in **`src/lib/anthropic-usage-format.ts`** and are re-exported here. `formatTokens(n)` → `2.84M` / `48.6M` / `912k` / `0` (`Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: n < 1e7 ? 2 : 1 })`, with a lower-case `k`), and `formatUsd(n)` → `$4.12`.
  - `getTokenBurn({ apiKey, now, fetch })`: fetches usage and cost in parallel, each with `AbortSignal.timeout(6000)`, and returns the payload.
- **Create** `src/lib/__fixtures__/usage-report.page1.json`, `usage-report.page2.json` (with `has_more`/`next_page`, including empty buckets and a month boundary) and `cost-report.json`. They are hand-written in the documented shapes, and no real org data is committed.
- **Create** `src/lib/anthropic-usage.test.ts` (bun test). The cases:
  - the window on the 1st, the 15th and the 31st of a month (≤ 31 buckets, `startingAt` correct);
  - pagination merges both pages and stops at the cap;
  - token math: the cache sum includes both ephemeral fields plus reads;
  - cost cents → USD (`"412.00"` → 4.12);
  - 14 days with gaps are zero-filled, and today is last;
  - `month` excludes days from the previous month;
  - the split percentages sum to 100, including the all-zero case;
  - `formatTokens` examples;
  - `fetch` rejecting or returning 401/500 → `getTokenBurn` throws `UsageApiError`, which the endpoint maps to `available: false`.
- **Create** `src/pages/api/token-burn.ts`: `export const prerender = false;` and `GET` only (other methods → 405).
  - If there is no `ANTHROPIC_ADMIN_API_KEY` → `200 { available: false, reason: 'not-configured' }`.
  - On success → `200 { available: true, timezone: 'UTC', generatedAt, today: { date, tokens, costUsd }, days: [{ date, tokens }] /* 14 */, month: { tokens, costUsd }, split: { cache, input, output } }`.
  - On any upstream error, timeout or parse error → `200 { available: false, reason: 'upstream' }`, with the error logged server-side and **no key or upstream body echoed back**.
  - Every response carries `Cache-Control: public, s-maxage=900, stale-while-revalidate=3600`. The `available: false` responses use a shorter `s-maxage=120`, so a fixed key shows up quickly.
- **Modify** `src/components/home/TokenBurnCard.astro` (the stub from task 15; **do not edit `src/pages/index.astro`**). Markup follows the mockup `.c-burn`:
  - Eyebrow: flame icon (`class="flame"`) + "Token burn", with a small "API usage · UTC" hint.
  - `.burn-top`: `<span data-burn-today>` (e.g. `2.84M`) + `<small>tokens today</small>`, and a `.burn-cost` pill.
  - `.burn-bars`: `role="img"`, with an `aria-label` filled in by the script ("Tokens per day over the last 14 days, UTC; today 2.84M"). It holds 14 `<i>` elements, each with `style="--h:…; --i:n"` and a `title` of `date UTC: N tokens`, and the last one has `class="today"`.
  - `.burn-split` (three spans sized by `--w`, coloured `--blue` / `--purple` / `--orange`), `.burn-legend` (`cache N%`, `input N%`, `output N%`), and `.burn-foot` (`{month} this month`).
  - All dimensions are fixed (bars 46 px high, number line height, and so on), so the server-rendered skeleton, the filled state and the empty state have the same height: **no CLS**.
  - Styling uses design tokens only. The bars are `linear-gradient(to top, color-mix(in srgb, var(--orange) 55%, transparent), var(--red))`, and today's bar is at full opacity with a glow. **Motion only under `prefers-reduced-motion: no-preference`**: the flame `flick`, the bars `barUp` stagger and the split `splitIn` are the mockup keyframes, added to `animations.css`.
- **Create** `src/components/home/token-burn.ts`: the bundled vanilla script for the card.
  - On `astro:page-load` it finds `[data-token-burn]`. An `IntersectionObserver` fetches `/api/token-burn` **once** when the card becomes visible (the result is cached in a module variable across view transitions for 5 minutes).
  - It animates "tokens today" and the month total with the shared `countUp` helper (task 15, one-shot, motion-safe). It renders numbers with `formatTokens`/`formatUsd`, imported from `src/lib/anthropic-usage-format.ts`. That is a separate pure module, re-exported by `anthropic-usage.ts`, so the client chunk never includes the fetch or aggregation code.
  - When `available: false`, it shows a quiet empty state: "No API usage data" in `--muted`, flat bars, and the legend hidden.
  - It disconnects the observer on `astro:before-swap`.

## Implementation Steps

1. Re-check the two reference pages for any schema change since 2026-09-26 (field names, limits, cents semantics) and update the fixtures to match.
2. Implement `anthropic-usage.ts` and its tests with fixtures, using no network.
3. Implement the endpoint. Test locally: with no key → `available: false`; with a real org Admin key → numbers that match the Console Usage and Cost pages for the same UTC days (±5 min lag); with an invalid key → `available: false` in under 6 s.
4. Implement the card and script. Check the skeleton → data transition for layout shift, the empty state, both themes, and reduced motion (flame, bars and split static).
5. Security check: `bun run build`, then `grep -r "ANTHROPIC_ADMIN_API_KEY\|sk-ant-admin" .vercel/output/static` returns nothing, and the key is only referenced in the server function bundle.

## Acceptance Criteria

- [ ] `bun run build` succeeds with `ANTHROPIC_ADMIN_API_KEY` unset; no Admin API call happens at build (`index.html` stays prerendered).
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `bun test` passes (all `anthropic-usage` cases above).
- [ ] `GET /api/token-burn` without a key → `200 {"available":false,…}`; with an invalid key or upstream timeout → `200 {"available":false,…}` within about 6 s; a 5xx is never returned; headers include `Cache-Control: public, s-maxage=900, stale-while-revalidate=3600` on success.
- [ ] With a valid Admin key, `today.tokens`, `month.tokens` and `month.costUsd` match the Console's Usage and Cost pages for the same UTC range; `days` has exactly 14 entries ending with today (UTC); the `split` percentages sum to 100.
- [ ] `ANTHROPIC_ADMIN_API_KEY` exists in Vercel **Production only**; a Preview deployment returns `{"available":false,"reason":"not-configured"}`.
- [ ] The Admin key never reaches the client (the grep in step 5 is empty; the network tab shows only `/api/token-burn`).
- [ ] The card matches the mockup `.c-burn` (tokens today + cost pill, 14 bars with today highlighted, split bar + legend, "N this month"); days are labelled UTC; the "API usage" hint is present.
- [ ] No CLS: the skeleton, filled and empty states have the same card height (Performance panel).
- [ ] With reduced motion, the flame doesn't flicker and the bars and split don't animate.
- [ ] No React is shipped by this card.

## Dependencies

- v2-astro-site-config-env
- v2-astro-homepage-bento

## Patterns to Follow

- Mockup `.c-burn`, `.burn-*`, the `flick`/`barUp`/`splitIn` keyframes and the "token burn" sample-data script (structure only).
- Anthropic docs: "Usage and Cost API" and the `usage_report/retrieve_messages` and `cost_report/retrieve` reference pages (raw HTTP; these endpoints aren't in the SDKs).
- Reference `src/pages/api/token-burn.json.ts` and `src/components/studio/runtime-rail/TokenBurnCard.astro` + `client/token-burn.ts` (hta218/leohuynh.dev), for the card/client split only.
- Task 30 (endpoint adapter + pure helpers + fixtures-driven tests).
