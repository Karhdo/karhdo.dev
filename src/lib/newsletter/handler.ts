/**
 * `POST /api/newsletter` logic (task 22). Pure: the Buttondown client is injected, so
 * `src/pages/api/newsletter.ts` stays a thin adapter and `bun test` covers every branch.
 *
 * The same result drives both transports: JSON for the enhanced form (`fetch`), and a `303` redirect
 * to `/newsletter?status=…` for the plain no-JS form post.
 */
import { z } from 'zod';
import type { ButtondownClient, SubscribeOutcome } from './buttondown-client';

export type NewsletterStatus =
  | 'subscribed'
  | 'pending'
  | 'already'
  | 'invalid'
  | 'rejected'
  | 'rate_limited'
  | 'unavailable'
  | 'error';

export const NEWSLETTER_STATUSES: readonly NewsletterStatus[] = [
  'subscribed',
  'pending',
  'already',
  'invalid',
  'rejected',
  'rate_limited',
  'unavailable',
  'error',
];

/** User-facing copy, shared by the endpoint, the enhanced form and the no-JS result page. */
export const NEWSLETTER_MESSAGES: Record<NewsletterStatus, string> = {
  subscribed: 'Successfully subscribed! 🎉',
  pending: 'Almost there! Check your inbox to confirm your subscription.',
  already: "You're already on the list. Thanks for reading!",
  invalid: 'Please enter a valid email address.',
  rejected: "This address can't be subscribed. Please try a different email.",
  rate_limited: 'Too many sign-ups right now. Please try again in a few minutes.',
  unavailable: "The newsletter isn't taking sign-ups right now. Please try again later.",
  error: 'Something went wrong on our side. Please try again later.',
};

const HTTP_STATUS: Record<NewsletterStatus, number> = {
  subscribed: 201,
  pending: 201,
  already: 200,
  invalid: 400,
  rejected: 400,
  rate_limited: 429,
  unavailable: 503,
  error: 502,
};

export const OK_STATUSES = new Set<NewsletterStatus>(['subscribed', 'pending', 'already']);

export const newsletterInputSchema = z.object({
  email: z.string().trim().max(254).pipe(z.email()),
  /** Honeypot: humans never see it, so anything in it means a bot. */
  hp_url: z.string().optional(),
});

export type NewsletterDeps = {
  /** `null` when `BUTTONDOWN_API_KEY` is not configured. */
  client: ButtondownClient | null;
  ipAddress?: string;
};

export type NewsletterResult = {
  status: NewsletterStatus;
  http: number;
  body: { status: NewsletterStatus; message: string } | { status: NewsletterStatus; error: string };
};

export function toResult(status: NewsletterStatus): NewsletterResult {
  const text = NEWSLETTER_MESSAGES[status];
  return {
    status,
    http: HTTP_STATUS[status],
    body: OK_STATUSES.has(status) ? { status, message: text } : { status, error: text },
  };
}

function fromOutcome(outcome: SubscribeOutcome): NewsletterStatus {
  switch (outcome.kind) {
    case 'subscribed':
      return outcome.pending ? 'pending' : 'subscribed';
    case 'already':
    case 'invalid':
    case 'rejected':
    case 'rate_limited':
      return outcome.kind;
    case 'closed':
      return 'unavailable';
    default:
      return 'error';
  }
}

export async function handleNewsletterPost(input: unknown, deps: NewsletterDeps): Promise<NewsletterResult> {
  const record = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  // Honeypot first, before validation: a bot gets the same answer as a person and nothing is sent.
  if (typeof record.hp_url === 'string' && record.hp_url.trim() !== '') {
    return { ...toResult('subscribed'), http: 200 };
  }
  const parsed = newsletterInputSchema.safeParse(record);
  if (!parsed.success) return toResult('invalid');
  if (!deps.client) return toResult('unavailable');

  try {
    return toResult(fromOutcome(await deps.client.subscribe(parsed.data.email, { ipAddress: deps.ipAddress })));
  } catch {
    return toResult('error');
  }
}

/**
 * Only same-site absolute paths (no `//host`, no scheme, no backslashes); anything else → `/`.
 * Percent-encoded `/` and `\` (`%2f`, `%5c`, any case) are rejected too, so no decoding step
 * downstream can turn `/%2F%2Fevil.com` into `//evil.com`.
 */
export function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string') return '/';
  const path = value.trim();
  if (path.length > 512 || !/^\/(?![/\\])[A-Za-z0-9\-._~/%]*$/.test(path)) return '/';
  if (/%(?:2f|5c)/i.test(path)) return '/';
  return path;
}

/** Target of the `303` after a plain form post: the on-demand `/newsletter` result page. */
export function redirectLocation(status: NewsletterStatus, from: unknown): string {
  const params = new URLSearchParams({ status });
  const back = safeReturnPath(from);
  if (back !== '/') params.set('from', back);
  return `/newsletter?${params}`;
}

export function parseStatus(value: string | null): NewsletterStatus | undefined {
  return NEWSLETTER_STATUSES.find((status) => status === value);
}
