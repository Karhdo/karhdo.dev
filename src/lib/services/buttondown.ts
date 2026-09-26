/**
 * Buttondown service (task 22): the pure client from `src/lib/newsletter/buttondown-client.ts` wired
 * to the `BUTTONDOWN_API_KEY` server secret. `subscribe()` resolves to `null` when the key is missing.
 *
 * Dev only: `BUTTONDOWN_API_BASE_URL` points the client at a local mock (never read in production,
 * so a stray env var can't redirect the key to another host).
 */
import { BUTTONDOWN_API_KEY } from 'astro:env/server';
import {
  createButtondownClient,
  type SubscribeOptions,
  type SubscribeOutcome,
} from '~/lib/newsletter/buttondown-client';

const devBaseUrl = import.meta.env.DEV ? process.env.BUTTONDOWN_API_BASE_URL : undefined;

export const buttondown = createButtondownClient({ apiKey: BUTTONDOWN_API_KEY, baseUrl: devBaseUrl, log: console });

export async function subscribe(email: string, options?: SubscribeOptions): Promise<SubscribeOutcome | null> {
  return buttondown ? buttondown.subscribe(email, options) : null;
}
