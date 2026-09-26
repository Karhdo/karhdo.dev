/**
 * Buttondown subscriber client (task 22). Pure: the API key, `fetch` and the base URL are injected,
 * so `bun test` covers it against a fake and `src/lib/services/buttondown.ts` wires the secret.
 *
 * Current API (checked against https://api.buttondown.com/v1/openapi.json, 2026-09):
 * `POST https://api.buttondown.com/v1/subscribers`, header `Authorization: Token <key>`, JSON body
 * `{ email_address, ip_address? }` → `201` with the subscriber (its `type` is `unactivated` while the
 * double opt-in confirmation is pending, `regular` when the newsletter has no confirmation step).
 * Errors are `{ code, detail, metadata }`; `400` codes include `email_already_exists`,
 * `subscriber_already_exists`, `email_invalid`, `email_empty`, `email_blocked`, `subscriber_blocked`,
 * `subscriber_suppressed`, `ip_address_spammy`, `rate_limited` and
 * `newsletter_not_accepting_subscribers`; `422` is a body validation error; `429` is rate limiting.
 * pliny used the older `api.buttondown.email` host with `{ email }`.
 *
 * `type` is deliberately NOT sent: the newsletter's own confirmation setting applies (double opt-in
 * by default), so nobody can subscribe someone else's address without that person confirming.
 */

import { isIP } from 'node:net';

export const BUTTONDOWN_API_BASE = 'https://api.buttondown.com/v1';

export type SubscribeOutcome =
  /** Created. `pending` = a confirmation email was sent (double opt-in). */
  | { kind: 'subscribed'; pending: boolean }
  | { kind: 'already' }
  | { kind: 'invalid' }
  /** Blocked, suppressed (e.g. previously unsubscribed or bounced) or flagged as spam. */
  | { kind: 'rejected' }
  | { kind: 'rate_limited' }
  | { kind: 'closed' }
  /** Auth failure, 5xx, network error, timeout or an unexpected response. */
  | { kind: 'upstream_error'; status?: number; code?: string };

export type SubscribeOptions = { ipAddress?: string };

export type ButtondownClientConfig = {
  apiKey: string | undefined;
  fetch?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
  log?: Pick<Console, 'warn'>;
};

export type ButtondownClient = { subscribe: (email: string, options?: SubscribeOptions) => Promise<SubscribeOutcome> };

const ALREADY = new Set(['email_already_exists', 'subscriber_already_exists']);
const INVALID = new Set(['email_invalid', 'email_empty', 'invalid_input']);
const REJECTED = new Set(['email_blocked', 'subscriber_blocked', 'subscriber_suppressed', 'ip_address_spammy']);

/**
 * Strict IPv4/IPv6 check (Node built-in `isIP`), minus IPv6 zone ids (`fe80::1%en0`), which `isIP`
 * accepts but a public-IP validator won't: Buttondown validates `ip_address` and answers 422 on junk.
 */
export function isValidIp(value: string): boolean {
  return !value.includes('%') && isIP(value) !== 0;
}

async function readCode(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { code?: unknown };
    return typeof body?.code === 'string' ? body.code : undefined;
  } catch {
    return undefined;
  }
}

async function readPending(response: Response): Promise<boolean> {
  try {
    const body = (await response.json()) as { type?: unknown };
    return body?.type !== 'regular';
  } catch {
    return true; // unknown shape: "check your inbox" is the safe message
  }
}

/** Pure mapping of an error response (status + Buttondown `code`) to an outcome. */
export function mapError(status: number, code: string | undefined): SubscribeOutcome {
  if (status === 429 || code === 'rate_limited') return { kind: 'rate_limited' };
  if (status === 409 || (code && ALREADY.has(code))) return { kind: 'already' };
  if (status === 422 || (code && INVALID.has(code))) return { kind: 'invalid' };
  if (code && REJECTED.has(code)) return { kind: 'rejected' };
  if (code === 'newsletter_not_accepting_subscribers') return { kind: 'closed' };
  return { kind: 'upstream_error', status, code };
}

/** `null` when no API key is configured. */
export function createButtondownClient(config: ButtondownClientConfig): ButtondownClient | null {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) return null;
  const doFetch = config.fetch ?? fetch;
  const url = `${(config.baseUrl ?? BUTTONDOWN_API_BASE).replace(/\/+$/, '')}/subscribers`;
  const timeoutMs = config.timeoutMs ?? 8000;

  return {
    async subscribe(email, options = {}) {
      const ip = options.ipAddress?.trim();
      const send = async (withIp: boolean): Promise<Response | undefined> => {
        const body: Record<string, string> = { email_address: email };
        if (withIp && ip) body.ip_address = ip;
        try {
          return await doFetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Token ${apiKey}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(timeoutMs),
          });
        } catch (error) {
          // Name/message only: never the request, which carries the key.
          config.log?.warn('[buttondown]', error instanceof Error ? `${error.name}: ${error.message}` : 'fetch failed');
          return undefined;
        }
      };

      const withIp = Boolean(ip && isValidIp(ip));
      let response = await send(withIp);
      // A 422 while an IP was sent may be Buttondown rejecting the IP: retry once without it.
      if (response?.status === 422 && withIp) response = await send(false);
      if (!response) return { kind: 'upstream_error' };

      if (response.status === 201 || response.status === 200) {
        return { kind: 'subscribed', pending: await readPending(response) };
      }
      const outcome = mapError(response.status, await readCode(response));
      if (outcome.kind === 'upstream_error') {
        config.log?.warn(
          `[buttondown] unexpected response ${response.status}${outcome.code ? ` (${outcome.code})` : ''}`
        );
      }
      return outcome;
    },
  };
}
