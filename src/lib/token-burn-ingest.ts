/**
 * `POST /api/otel/v1/metrics` logic (pure: storage is injected). Accepts Claude Code's OTLP/HTTP JSON
 * metrics when the bearer key matches, and stores per-day, per-model deltas. Replies with an empty
 * OTLP success body; the exporter retries on 5xx.
 */
import { timingSafeEqual } from 'node:crypto';
import { type OtlpMetricsRequest, parseClaudeCodeMetrics, type UsageDelta } from './token-burn-otlp';

export const MAX_BODY_BYTES = 1_000_000;

export type IngestRequest = { authorization: string | null; contentType: string | null; body: string };
export type IngestDeps = {
  key: string | undefined;
  save: (rows: readonly UsageDelta[]) => Promise<void>;
  now?: Date;
  log?: Pick<Console, 'error' | 'warn'>;
};
export type IngestResult = { status: number; body: Record<string, unknown> };

function keyMatches(authorization: string | null, key: string): boolean {
  const given = Buffer.from(authorization?.replace(/^Bearer\s+/i, '') ?? '');
  const expected = Buffer.from(key);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function handleOtlpIngest(req: IngestRequest, deps: IngestDeps): Promise<IngestResult> {
  const { key, save, now, log = console } = deps;
  if (!key) return { status: 503, body: { message: 'Ingest is not configured.' } };
  if (!keyMatches(req.authorization, key)) return { status: 401, body: { message: 'Unauthorized.' } };
  if (!req.contentType?.includes('json')) {
    return { status: 415, body: { message: 'Send OTLP/HTTP JSON (OTEL_EXPORTER_OTLP_PROTOCOL=http/json).' } };
  }
  if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) return { status: 413, body: { message: 'Payload too large.' } };

  let payload: OtlpMetricsRequest;
  try {
    payload = JSON.parse(req.body) as OtlpMetricsRequest;
  } catch {
    return { status: 400, body: { message: 'Invalid JSON.' } };
  }
  const { rows, skipped } = parseClaudeCodeMetrics(payload, now);
  if (skipped) log.warn(`[otel] skipped ${skipped} data point(s): not delta temporality, or out of range`);
  try {
    await save(rows);
  } catch (error) {
    log.error(`[otel] could not store usage (${error instanceof Error ? error.name : 'unknown'})`);
    return { status: 503, body: { message: 'Storage unavailable.' } };
  }
  return { status: 200, body: {} };
}
