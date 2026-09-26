// INTROSPECTION ONLY. Never run drizzle-kit push/migrate/generate against this database: the stats table is owned by the v1 Prisma migrations and holds production data.
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './.drizzle-introspect', // git-ignored; written only by `drizzle-kit pull`
  dbCredentials: {
    // POSTGRES_URL_DIRECT: local-only Neon direct host (pooler hostname without `-pooler`); introspection needs a session connection.
    // biome-ignore lint/style/noNonNullAssertion: tooling-only config, fails loudly when unset
    url: process.env.POSTGRES_URL_DIRECT ?? process.env.POSTGRES_URL!,
    ssl: /\/\/[^/@]*@?(localhost|127\.0\.0\.1)[:/]/.test(
      process.env.POSTGRES_URL_DIRECT ?? process.env.POSTGRES_URL ?? ''
    )
      ? false
      : 'require',
  },
  tablesFilter: ['stats', 'stats_daily'],
  strict: true,
  verbose: true,
});
