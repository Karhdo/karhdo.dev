import { POSTGRES_URL } from 'astro:env/server';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Db = PostgresJsDatabase<typeof schema>;

export class DbNotConfiguredError extends Error {
  override readonly name = 'DbNotConfiguredError';
  constructor() {
    super('POSTGRES_URL is not set; database features are disabled.');
  }
}

let db: Db | undefined;

/**
 * Lazy, module-scoped client. Warm serverless instances reuse it; nothing connects at import or build time.
 * Neon is reached through its `-pooler` host (PgBouncer, transaction mode), so prepared statements must be off.
 */
/** Local Postgres (docker compose) usually runs without TLS; every remote host (Neon) requires it. */
function sslFor(url: string): 'require' | false {
  const { hostname } = new URL(url);
  return hostname === 'localhost' || hostname === '127.0.0.1' ? false : 'require';
}

export function getDb(): Db {
  if (db) return db;
  if (!POSTGRES_URL) throw new DbNotConfiguredError();
  const client = postgres(POSTGRES_URL, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    ssl: sslFor(POSTGRES_URL),
  });
  db = drizzle(client, { schema });
  return db;
}
