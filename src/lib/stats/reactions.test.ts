import { describe, expect, test } from 'bun:test';
import {
  applyDeltas,
  displayCount,
  EMPTY_REACTIONS,
  parseStoredReactions,
  pendingDeltas,
  react,
  reactionStorageKey,
  serializeReactions,
} from './reactions';

describe('v1 localStorage compatibility', () => {
  test('key is type/slug (v1)', () => {
    expect(reactionStorageKey('blog', 'exploring-module-in-nestjs')).toBe('blog/exploring-module-in-nestjs');
  });

  test('parses a v1 value and serialises back to the same shape', () => {
    const raw = '{"loves":2,"ideas":0,"applauses":1,"bullseye":0}';
    const state = parseStoredReactions(raw);
    expect(state).toEqual({ loves: 2, ideas: 0, applauses: 1, bullseye: 0 });
    expect(serializeReactions(state)).toBe(raw);
  });

  test('malformed or out-of-range values are sanitised', () => {
    expect(parseStoredReactions(null)).toEqual(EMPTY_REACTIONS);
    expect(parseStoredReactions('not json')).toEqual(EMPTY_REACTIONS);
    expect(parseStoredReactions('null')).toEqual(EMPTY_REACTIONS);
    expect(parseStoredReactions('{"loves":99,"ideas":-3,"applauses":"2"}')).toEqual({
      loves: 5,
      ideas: 0,
      applauses: 0,
      bullseye: 0,
    });
  });
});

describe('react', () => {
  test('caps at 5 per emoji', () => {
    let state = { ...EMPTY_REACTIONS };
    for (let i = 0; i < 7; i++) state = react(state, 'loves').state;
    expect(state.loves).toBe(5);
    expect(react(state, 'loves').atMax).toBe(true);
    expect(react(state, 'ideas')).toEqual({ state: { ...state, ideas: 1 }, atMax: false });
  });
});

describe('pendingDeltas / applyDeltas', () => {
  test('sends only unsent clicks, as deltas', () => {
    const sent = { loves: 2, ideas: 0, applauses: 1, bullseye: 0 };
    const reactions = { loves: 5, ideas: 1, applauses: 1, bullseye: 0 };
    const deltas = pendingDeltas(reactions, sent);
    expect(deltas).toEqual({ loves: 3, ideas: 1 });
    expect(applyDeltas(sent, deltas ?? {})).toEqual(reactions);
    expect(applyDeltas(reactions, deltas ?? {}, -1)).toEqual(sent);
    expect(pendingDeltas(reactions, reactions)).toBeUndefined();
  });
});

describe('displayCount', () => {
  test('server total + clicks not yet counted by the server', () => {
    const server = { loves: 42, applauses: 18, ideas: 11, bullseye: 7 };
    const counted = { loves: 2, ideas: 0, applauses: 1, bullseye: 0 };
    expect(displayCount(server, 'loves', { ...counted, loves: 4 }, counted)).toBe(44);
    expect(displayCount(server, 'applauses', counted, counted)).toBe(18);
  });
});
