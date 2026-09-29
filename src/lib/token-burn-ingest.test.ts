import { describe, expect, test } from 'bun:test';
import { handleOtlpIngest, type IngestDeps } from './token-burn-ingest';
import type { UsageDelta } from './token-burn-otlp';

const now = new Date('2026-09-29T03:00:00Z');
const silent = { error: () => {}, warn: () => {} };
const body = JSON.stringify({
  resourceMetrics: [
    {
      scopeMetrics: [
        {
          metrics: [
            {
              name: 'claude_code.token.usage',
              sum: {
                aggregationTemporality: 1,
                dataPoints: [
                  {
                    attributes: [{ key: 'model', value: { stringValue: 'claude-opus-5-5' } }],
                    timeUnixNano: String(Date.parse('2026-09-29T02:59:00Z') * 1e6),
                    asInt: '42',
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
});

function setup(overrides: Partial<IngestDeps> = {}) {
  const saved: UsageDelta[][] = [];
  const deps: IngestDeps = {
    key: 'secret-key',
    save: async (rows) => void saved.push([...rows]),
    now,
    log: silent,
    ...overrides,
  };
  return { deps, saved };
}
const req = (authorization: string | null, contentType = 'application/json', b = body) => ({
  authorization,
  contentType,
  body: b,
});

describe('handleOtlpIngest', () => {
  test('stores parsed deltas with the right key', async () => {
    const { deps, saved } = setup();
    const res = await handleOtlpIngest(req('Bearer secret-key'), deps);
    expect(res).toEqual({ status: 200, body: {} });
    expect(saved).toEqual([[{ date: '2026-09-29', model: 'claude-opus-5-5', tokens: 42, costUsd: 0 }]]);
  });

  test('rejects a missing or wrong key without storing', async () => {
    const { deps, saved } = setup();
    expect((await handleOtlpIngest(req(null), deps)).status).toBe(401);
    expect((await handleOtlpIngest(req('Bearer nope'), deps)).status).toBe(401);
    expect((await handleOtlpIngest(req('Bearer secret-keyX'), deps)).status).toBe(401);
    expect(saved).toEqual([]);
  });

  test('503 when no key is configured', async () => {
    const { deps } = setup({ key: undefined });
    expect((await handleOtlpIngest(req('Bearer secret-key'), deps)).status).toBe(503);
  });

  test('415 for protobuf, 400 for bad JSON, 413 for huge bodies', async () => {
    const { deps } = setup();
    expect((await handleOtlpIngest(req('Bearer secret-key', 'application/x-protobuf'), deps)).status).toBe(415);
    expect((await handleOtlpIngest(req('Bearer secret-key', 'application/json', '{nope'), deps)).status).toBe(400);
    expect(
      (await handleOtlpIngest(req('Bearer secret-key', 'application/json', 'x'.repeat(1_000_001)), deps)).status
    ).toBe(413);
  });

  test('503 when storage fails, so the exporter retries', async () => {
    const { deps } = setup({
      save: async () => {
        throw new Error('db down');
      },
    });
    expect((await handleOtlpIngest(req('Bearer secret-key'), deps)).status).toBe(503);
  });
});
