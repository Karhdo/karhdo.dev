/** Pure layout logic for /career: graph rows, year ruler, stack diff and durations. */
import type { Experience, StackTool } from '~/config/experiences';
import { formatUptime, parseMonthYear } from '~/lib/utils/month-year';

type Entry = Pick<Experience, 'start' | 'end' | 'kind'>;

/** `end` as a date: `Present` (or anything unparsable) is `now`. */
export function endDate(entry: Pick<Experience, 'end'>, now: Date): Date {
  return parseMonthYear(entry.end) ?? now;
}

function startDate(entry: Pick<Experience, 'start'>): Date {
  const date = parseMonthYear(entry.start);
  if (!date) throw new Error(`Unparsable experience start: ${entry.start}`);
  return date;
}

const nextMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 1);

/** Inclusive role length, LinkedIn-style: `Jan 2021 – Dec 2022` is `2y`. */
export function roleDuration(entry: Pick<Experience, 'start' | 'end'>, now: Date): string {
  return formatUptime(startDate(entry), nextMonth(endDate(entry, now)));
}

/** Stable 7-hex "commit hash" for a seed (FNV-1a), decoration only. */
export function commitHash(seed: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

export type DiffLine = StackTool & { added: boolean };

/** Each role's stack; `added` when the tool first appears in that role (oldest role first). */
export function stackDiff<T extends Pick<Experience, 'start' | 'stack'>>(entries: readonly T[]): DiffLine[][] {
  const order = entries.map((entry, index) => ({ entry, index }));
  order.sort((a, b) => startDate(a.entry).getTime() - startDate(b.entry).getTime());
  const seen = new Set<string>();
  const result: DiffLine[][] = entries.map(() => []);
  for (const { entry, index } of order) {
    result[index] = entry.stack.map((tool) => {
      const added = !seen.has(tool.name);
      seen.add(tool.name);
      return { ...tool, added };
    });
  }
  return result;
}

export type RulerBar<T> = { entry: T; track: number; left: number; width: number };

/** Bars as percentages of the year span; overlapping roles get separate tracks. */
export function rulerBars<T extends Pick<Experience, 'start' | 'end'>>(
  entries: readonly T[],
  now: Date
): { years: number[]; bars: RulerBar<T>[]; tracks: number } {
  const sorted = [...entries].sort((a, b) => startDate(a).getTime() - startDate(b).getTime());
  const first = sorted[0];
  if (!first) return { years: [], bars: [], tracks: 0 };
  const fromYear = startDate(first).getFullYear();
  const toYear = now.getFullYear();
  const from = new Date(fromYear, 0, 1).getTime();
  const span = new Date(toYear + 1, 0, 1).getTime() - from;
  const trackEnds: number[] = [];
  const bars = sorted.map((entry) => {
    const start = startDate(entry).getTime();
    const end = nextMonth(endDate(entry, now)).getTime();
    let track = trackEnds.findIndex((trackEnd) => trackEnd <= start);
    if (track === -1) track = trackEnds.length;
    trackEnds[track] = end;
    return { entry, track, left: ((start - from) / span) * 100, width: ((end - start) / span) * 100 };
  });
  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i);
  return { years, bars, tracks: trackEnds.length };
}

/** A lane in one graph row: line above / below the dot, and the dot itself. */
export type LaneCell = { up: boolean; down: boolean; dot: boolean };

export type GraphRow<T> = {
  type: 'commit' | 'merge';
  entry: T;
  date: Date;
  lane: number;
  lanes: [LaneCell, LaneCell];
};

/** Graph rows, newest first: a commit per role start plus a merge where education ends. */
export function graphRows<T extends Entry>(entries: readonly T[]): GraphRow<T>[] {
  const laneOf = (entry: T) => (entry.kind === 'education' ? 1 : 0);
  const rows: Omit<GraphRow<T>, 'lanes'>[] = [];
  for (const entry of entries) {
    rows.push({ type: 'commit', entry, date: startDate(entry), lane: laneOf(entry) });
    const end = parseMonthYear(entry.end);
    if (entry.kind === 'education' && end) rows.push({ type: 'merge', entry, date: end, lane: 1 });
  }
  rows.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Line segments per lane: main runs from the first job to HEAD; each education branch runs from
  // its start to its merge, or stays open past the top while it is ongoing.
  const segments: { lane: number; from: number; to: number }[] = [];
  const work = rows.filter((row) => row.lane === 0).map((row) => row.date.getTime());
  if (work.length) segments.push({ lane: 0, from: Math.min(...work), to: Math.max(...work) });
  for (const entry of entries) {
    if (entry.kind !== 'education') continue;
    const end = parseMonthYear(entry.end);
    segments.push({ lane: 1, from: startDate(entry).getTime(), to: end ? end.getTime() : Number.POSITIVE_INFINITY });
  }

  return rows.map((row) => {
    const t = row.date.getTime();
    const cell = (lane: number): LaneCell => {
      const own = segments.filter((s) => s.lane === lane);
      return {
        up: own.some((s) => s.from <= t && t < s.to),
        down: own.some((s) => s.from < t && t <= s.to),
        dot: row.lane === lane,
      };
    };
    return { ...row, lanes: [cell(0), cell(1)] };
  });
}
