# 22 — Buttondown newsletter

## Endpoint

- `POST /api/newsletter`

## Summary

Replace pliny's `NewsletterAPI` (Buttondown provider) with a small Astro endpoint calling the Buttondown API directly, and add a newsletter form island (post footer + `BlogNewsletterForm` MDX component for parity with v1's MDX component map).

## Files to Create/Modify/Delete

- **Create** `src/lib/services/buttondown.ts` — `subscribe(email)` → `POST https://api.buttondown.com/v1/subscribers` with `Authorization: Token ${BUTTONDOWN_API_KEY}`, body `{ email_address: email, type: 'regular' }` (confirm field names against current Buttondown API docs; pliny used `{ email }` on the older `api.buttondown.email/v1/subscribers` — use whichever the current docs specify and note it in the PR). Map "already subscribed" (400/409 with that message) to a friendly success-like response.
- **Create** `src/pages/api/newsletter.ts` — `prerender = false`; accepts JSON `{ email }` or form data; zod `z.string().email()`; honeypot field `website` must be empty; `assertAllowedOrigin` from `src/lib/security/origin.ts` (task 18); responses `201 { message: 'Successfully subscribed! 🎉' }`, `400 { error }`, `503` when the API key is missing, `502` on upstream error. v1 exported GET too, but a GET subscribe makes no sense and pliny's handler only handled POST — GET returns 405.
- **Create** `src/components/islands/NewsletterForm.tsx` — email input + button, states idle/loading/success/error, `aria-live="polite"` message, `data-umami-event="newsletter-subscribe"`; progressive enhancement: wrap in a `<form method="post" action="/api/newsletter">` so it works without JS (endpoint redirects back with `?subscribed=1` when request is a form post).
- **Create** `src/components/blog/NewsletterCard.astro` — glass card copy "Subscribe to the newsletter" + `<NewsletterForm client:visible />`.
- **Modify** only `src/components/blog/PostNewsletter.astro` (the stub from task 12, m2) to render `<NewsletterCard />`. **Do not edit `PostLayout.astro`.**
- **Modify** `src/components/mdx/index.ts` — add `BlogNewsletterForm: NewsletterCard` (v1 MDX component name).

## Implementation Steps

1. Read v1 `app/api/newsletter/route.ts` and pliny's Buttondown implementation (`node_modules/pliny/newsletter/buttondown` in v1 or the pliny repo) to match behaviour.
2. Implement endpoint; test with a real key using a `+test` address, then delete the test subscriber in Buttondown.
3. Implement island and card.

## Acceptance Criteria

- [ ] `bun run build` succeeds without `BUTTONDOWN_API_KEY`.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `curl -X POST /api/newsletter -d '{"email":"bad"}'` → 400; valid email with key → 201 and subscriber visible in Buttondown; without key → 503.
- [ ] Form works with JS disabled (form post + redirect) and with JS (inline status).
- [ ] Honeypot-filled submissions are rejected silently (200 without subscribing).

## Dependencies

- v2-astro-site-config-env
- v2-astro-blog-post-page
- v2-astro-stats-views-reactions

## Patterns to Follow

- v1 `app/api/newsletter/route.ts`, `components/ui/MDXComponents.tsx` (`BlogNewsletterForm`).
- Buttondown API docs (subscribers endpoint).
