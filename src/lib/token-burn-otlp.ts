/**
 * Claude Code's OpenTelemetry metrics (OTLP/HTTP JSON) → per-day, per-model usage deltas for
 * `token_burn_daily`. Only `claude_code.token.usage` (all four token types) and
 * `claude_code.cost.usage` are read; every other metric and attribute (session, user, …) is ignored.
 * Only DELTA temporality is summed: cumulative points would double-count, so they are skipped.
 */
import { todayIn } from '~/lib/github-activity';

export const TOKEN_METRIC = 'claude_code.token.usage';
export const COST_METRIC = 'claude_code.cost.usage';
const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const DAY_MS = 86_400_000;
/** Points outside [now - 7 days, now + 1 day] are dropped as clock noise or replays. */
const MAX_AGE_MS = 7 * DAY_MS;

type AnyValue = { stringValue?: string; intValue?: string | number; doubleValue?: number };
type Attribute = { key?: string; value?: AnyValue };
type DataPoint = {
  attributes?: Attribute[];
  timeUnixNano?: string | number;
  asInt?: string | number;
  asDouble?: number;
};
type Metric = { name?: string; sum?: { dataPoints?: DataPoint[]; aggregationTemporality?: number | string } };
export type OtlpMetricsRequest = { resourceMetrics?: { scopeMetrics?: { metrics?: Metric[] }[] }[] };

export type UsageDelta = { date: string; model: string; tokens: number; costUsd: number };
export type ParseResult = { rows: UsageDelta[]; points: number; skipped: number };

const isDelta = (t: number | string | undefined) => t === 1 || t === 'AGGREGATION_TEMPORALITY_DELTA';

function attr(point: DataPoint, key: string): string | undefined {
  return point.attributes?.find((a) => a.key === key)?.value?.stringValue;
}

function value(point: DataPoint): number {
  const v = point.asDouble ?? Number(point.asInt ?? Number.NaN);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

export function parseClaudeCodeMetrics(body: OtlpMetricsRequest, now: Date = new Date()): ParseResult {
  const totals = new Map<string, UsageDelta>();
  let points = 0;
  let skipped = 0;
  for (const resource of body.resourceMetrics ?? []) {
    for (const scope of resource.scopeMetrics ?? []) {
      for (const metric of scope.metrics ?? []) {
        if (metric.name !== TOKEN_METRIC && metric.name !== COST_METRIC) continue;
        const sum = metric.sum;
        for (const point of sum?.dataPoints ?? []) {
          const ms = Number(point.timeUnixNano ?? 0) / 1e6;
          const model = (attr(point, 'model') ?? 'unknown').slice(0, 100);
          const v = value(point);
          if (
            !isDelta(sum?.aggregationTemporality) ||
            !ms ||
            ms < now.getTime() - MAX_AGE_MS ||
            ms > now.getTime() + DAY_MS
          ) {
            skipped++;
            continue;
          }
          points++;
          if (!v) continue;
          const date = todayIn(TIME_ZONE, new Date(ms));
          const key = `${date}|${model}`;
          const row = totals.get(key) ?? { date, model, tokens: 0, costUsd: 0 };
          if (metric.name === TOKEN_METRIC) row.tokens += Math.round(v);
          else row.costUsd += v;
          totals.set(key, row);
        }
      }
    }
  }
  return { rows: [...totals.values()], points, skipped };
}
