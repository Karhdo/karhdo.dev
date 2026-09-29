import { describe, expect, test } from 'bun:test';
import { COST_METRIC, type OtlpMetricsRequest, parseClaudeCodeMetrics, TOKEN_METRIC } from './token-burn-otlp';

// 2026-09-29 10:00 in Ho Chi Minh (03:00 UTC).
const now = new Date('2026-09-29T03:00:00Z');
const nano = (iso: string) => String(Date.parse(iso) * 1e6);
const s = (key: string, stringValue: string) => ({ key, value: { stringValue } });

function payload(temporality: number | string = 1): OtlpMetricsRequest {
  return {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics: [
              {
                name: TOKEN_METRIC,
                sum: {
                  aggregationTemporality: temporality,
                  dataPoints: [
                    {
                      attributes: [s('type', 'input'), s('model', 'claude-opus-5-5'), s('session.id', 'x')],
                      timeUnixNano: nano('2026-09-29T02:59:00Z'),
                      asInt: '120',
                    },
                    {
                      attributes: [s('type', 'cacheRead'), s('model', 'claude-opus-5-5')],
                      timeUnixNano: nano('2026-09-29T02:59:00Z'),
                      asDouble: 5000,
                    },
                    {
                      attributes: [s('type', 'output'), s('model', 'claude-haiku-4-5')],
                      timeUnixNano: nano('2026-09-29T02:59:00Z'),
                      asInt: 30,
                    },
                    // 23:30 UTC on the 28th is already the 29th in Ho Chi Minh (UTC+7)
                    {
                      attributes: [s('type', 'output'), s('model', 'claude-opus-5-5')],
                      timeUnixNano: nano('2026-09-28T23:30:00Z'),
                      asInt: 7,
                    },
                    // 16:30 UTC on the 28th is still the 28th in Ho Chi Minh
                    {
                      attributes: [s('type', 'output'), s('model', 'claude-opus-5-5')],
                      timeUnixNano: nano('2026-09-28T16:30:00Z'),
                      asInt: 3,
                    },
                  ],
                },
              },
              {
                name: COST_METRIC,
                sum: {
                  aggregationTemporality: temporality,
                  dataPoints: [
                    {
                      attributes: [s('model', 'claude-opus-5-5')],
                      timeUnixNano: nano('2026-09-29T02:59:00Z'),
                      asDouble: 0.25,
                    },
                  ],
                },
              },
              {
                name: 'claude_code.session.count',
                sum: {
                  aggregationTemporality: 1,
                  dataPoints: [{ asInt: 1, timeUnixNano: nano('2026-09-29T02:59:00Z') }],
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

describe('parseClaudeCodeMetrics', () => {
  test('sums all token types and cost per Ho Chi Minh day and model', () => {
    const { rows, points, skipped } = parseClaudeCodeMetrics(payload(), now);
    const byKey = Object.fromEntries(rows.map((r) => [`${r.date}|${r.model}`, r]));
    expect(byKey['2026-09-29|claude-opus-5-5']).toEqual({
      date: '2026-09-29',
      model: 'claude-opus-5-5',
      tokens: 5127,
      costUsd: 0.25,
    });
    expect(byKey['2026-09-29|claude-haiku-4-5']?.tokens).toBe(30);
    expect(byKey['2026-09-28|claude-opus-5-5']?.tokens).toBe(3);
    expect(points).toBe(6);
    expect(skipped).toBe(0);
  });

  test('ignores other metrics and never keeps session or user attributes', () => {
    const { rows } = parseClaudeCodeMetrics(payload(), now);
    expect(rows.every((r) => Object.keys(r).sort().join() === 'costUsd,date,model,tokens')).toBe(true);
  });

  test('accepts the string enum for delta temporality', () => {
    expect(parseClaudeCodeMetrics(payload('AGGREGATION_TEMPORALITY_DELTA'), now).rows.length).toBe(3);
  });

  test('skips cumulative points (they would double-count)', () => {
    const { rows, skipped } = parseClaudeCodeMetrics(payload(2), now);
    expect(rows).toEqual([]);
    expect(skipped).toBe(6);
  });

  test('drops points far in the past or future', () => {
    const old = payload();
    const point = old.resourceMetrics?.[0]?.scopeMetrics?.[0]?.metrics?.[0]?.sum?.dataPoints?.[0];
    if (point) point.timeUnixNano = nano('2026-08-01T00:00:00Z');
    expect(parseClaudeCodeMetrics(old, now).skipped).toBe(1);
  });

  test('an empty or unrelated body yields nothing', () => {
    expect(parseClaudeCodeMetrics({}, now)).toEqual({ rows: [], points: 0, skipped: 0 });
  });
});
