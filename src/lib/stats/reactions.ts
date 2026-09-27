/**
 * Reactions state (pure, client-safe). Kept backward compatible with v1:
 * localStorage key `${type}/${slug}` → JSON `{ loves, ideas, applauses, bullseye }` = how many times this
 * visitor reacted with each emoji (max 5 each), so returning readers keep their counts.
 */
import type { ReactionKey, Stats, StatsType } from '~/types/stats';

export const MAX_REACTIONS = 5;

export type ReactionState = Record<ReactionKey, number>;

/** Display order (mockup: ❤️ 👏 💡 🎯) with the vendored Twemoji name and the button label. */
export const REACTIONS: ReadonlyArray<{ key: ReactionKey; emoji: string; label: string }> = [
  { key: 'loves', emoji: 'sparkling-heart', label: 'Love this post' },
  { key: 'applauses', emoji: 'clapping-hands', label: 'Applaud this post' },
  { key: 'ideas', emoji: 'light-bulb', label: 'This post gave me an idea' },
  { key: 'bullseye', emoji: 'bullseye', label: 'This post is on target' },
];

const KEYS: ReactionKey[] = ['loves', 'applauses', 'ideas', 'bullseye'];

export const EMPTY_REACTIONS: ReactionState = { loves: 0, ideas: 0, applauses: 0, bullseye: 0 };

/** v1 key format. */
export function reactionStorageKey(type: StatsType, slug: string): string {
  return `${type}/${slug}`;
}

function clamp(value: unknown): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : 0;
  return Math.min(MAX_REACTIONS, Math.max(0, n));
}

/** Parses a stored v1/v2 value; anything malformed becomes zeros, values are clamped to 0–5. */
export function parseStoredReactions(raw: string | null): ReactionState {
  if (!raw) return { ...EMPTY_REACTIONS };
  try {
    const data = JSON.parse(raw) as Partial<Record<ReactionKey, unknown>> | null;
    if (!data || typeof data !== 'object') return { ...EMPTY_REACTIONS };
    return {
      loves: clamp(data.loves),
      ideas: clamp(data.ideas),
      applauses: clamp(data.applauses),
      bullseye: clamp(data.bullseye),
    };
  } catch {
    return { ...EMPTY_REACTIONS };
  }
}

/** Same JSON shape and key order as v1 writes. */
export function serializeReactions(state: ReactionState): string {
  return JSON.stringify({
    loves: state.loves,
    ideas: state.ideas,
    applauses: state.applauses,
    bullseye: state.bullseye,
  });
}

/** One click: +1 up to the cap. `atMax` means the click changed nothing. */
export function react(state: ReactionState, key: ReactionKey): { state: ReactionState; atMax: boolean } {
  if (state[key] >= MAX_REACTIONS) return { state, atMax: true };
  return { state: { ...state, [key]: state[key] + 1 }, atMax: false };
}

/** Deltas not yet sent (`reactions − sent`), only positive ones; `undefined` when nothing is pending. */
export function pendingDeltas(reactions: ReactionState, sent: ReactionState): Partial<ReactionState> | undefined {
  const deltas: Partial<ReactionState> = {};
  for (const key of KEYS) {
    const delta = reactions[key] - sent[key];
    if (delta > 0) deltas[key] = Math.min(delta, MAX_REACTIONS);
  }
  return Object.keys(deltas).length > 0 ? deltas : undefined;
}

export function applyDeltas(state: ReactionState, deltas: Partial<ReactionState>, sign: 1 | -1 = 1): ReactionState {
  const next = { ...state };
  for (const key of KEYS) next[key] = clamp(next[key] + sign * (deltas[key] ?? 0));
  return next;
}

/** Count shown on a button: the server total plus this visitor's clicks the server hasn't counted yet. */
export function displayCount(
  server: Pick<Stats, ReactionKey>,
  key: ReactionKey,
  reactions: ReactionState,
  counted: ReactionState
): number {
  return server[key] + Math.max(0, reactions[key] - counted[key]);
}
