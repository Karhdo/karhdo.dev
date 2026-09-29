/**
 * One-off import of the ccusage history (the old `Karhdo/token-burn` repo's `public/summary.json`) into
 * `token_burn_daily`, per day and model. Dry run by default; `--apply` inserts with
 * `ON CONFLICT DO NOTHING`, so days already recorded by the OpenTelemetry export are never touched.
 *
 *   bun scripts/import-token-burn-history.ts <path/to/summary.json> [--apply]
 */
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

type Day = { date: string; byModel?: Record<string, { tokens?: number; cost?: number }> };

const [file, ...flags] = process.argv.slice(2);
if (!file) throw new Error('Usage: bun scripts/import-token-burn-history.ts <summary.json> [--apply]');
const apply = flags.includes('--apply');
const dbUrl = process.env.POSTGRES_URL_DIRECT || process.env.POSTGRES_URL;
if (!dbUrl) throw new Error('Set POSTGRES_URL_DIRECT (or POSTGRES_URL).');

const { daily = [] } = JSON.parse(readFileSync(file, 'utf8')) as { daily?: Day[] };
const rows = daily.flatMap((d) =>
  Object.entries(d.byModel ?? {})
    .filter(([, t]) => (t.tokens ?? 0) > 0)
    .map(([model, t]) => ({
      date: d.date,
      model: model.slice(0, 100),
      tokens: Math.round(t.tokens ?? 0),
      cost_usd: (t.cost ?? 0).toFixed(6),
    }))
);
const total = rows.reduce((sum, r) => sum + r.tokens, 0);
console.log(
  `${apply ? 'APPLY' : 'DRY RUN'}: ${rows.length} rows, ${daily.length} days (${daily[0]?.date} → ${daily.at(-1)?.date}), ${total.toLocaleString('en-US')} tokens`
);

const local = /localhost|127\.0\.0\.1/.test(dbUrl);
const sql = postgres(dbUrl, { max: 1, prepare: false, ssl: local ? false : 'require' });
try {
  if (apply && rows.length) {
    const result = await sql`INSERT INTO token_burn_daily ${sql(rows)} ON CONFLICT (date, model) DO NOTHING`;
    console.log(`inserted ${result.count} rows (existing days left untouched)`);
  } else if (!apply) {
    console.log('Nothing written. Re-run with --apply to insert.');
  }
} finally {
  await sql.end();
}
