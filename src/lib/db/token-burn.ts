import { asc, sql } from 'drizzle-orm';
import type { Summary } from '~/lib/token-burn';
import type { UsageDelta } from '~/lib/token-burn-otlp';
import { getDb } from './client';
import { tokenBurnDaily } from './schema';

/** Adds usage deltas in one atomic `INSERT … ON CONFLICT (date, model) DO UPDATE SET col = col + delta`. */
export async function addTokenBurnUsage(rows: readonly UsageDelta[]): Promise<void> {
  if (rows.length === 0) return;
  await getDb()
    .insert(tokenBurnDaily)
    .values(rows.map((r) => ({ date: r.date, model: r.model, tokens: r.tokens, costUsd: r.costUsd.toFixed(6) })))
    .onConflictDoUpdate({
      target: [tokenBurnDaily.date, tokenBurnDaily.model],
      set: {
        tokens: sql`${tokenBurnDaily.tokens} + excluded.tokens`,
        costUsd: sql`${tokenBurnDaily.costUsd} + excluded.cost_usd`,
        updatedAt: sql`now()`,
      },
    });
}

/** Every stored day as the `Summary` shape `buildTokenBurn` reads. */
export async function readTokenBurnSummary(): Promise<Summary> {
  const rows = await getDb()
    .select({
      date: tokenBurnDaily.date,
      model: tokenBurnDaily.model,
      tokens: tokenBurnDaily.tokens,
      cost: tokenBurnDaily.costUsd,
    })
    .from(tokenBurnDaily)
    .orderBy(asc(tokenBurnDaily.date));
  const days = new Map<
    string,
    { date: string; tokens: number; cost: number; byModel: Record<string, { tokens: number; cost: number }> }
  >();
  const allTime = { tokens: 0, cost: 0 };
  for (const row of rows) {
    const tokens = Number(row.tokens);
    const cost = Number(row.cost);
    const day = days.get(row.date) ?? { date: row.date, tokens: 0, cost: 0, byModel: {} };
    day.tokens += tokens;
    day.cost += cost;
    day.byModel[row.model] = { tokens, cost };
    days.set(row.date, day);
    allTime.tokens += tokens;
    allTime.cost += cost;
  }
  const daily = [...days.values()];
  return { daily, allTime, lastActivity: daily.findLast((d) => d.tokens > 0)?.date ?? null };
}
