import { neon } from '@neondatabase/serverless';

/**
 * Minimal query interface that all repositories depend on.
 * Mirrors the `{ rows }` shape the old `pg.Pool` returned so repositories
 * need only swap `pool` for an injected `db`.
 */
export type DbClient = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
};

/**
 * Return a raw Neon SQL tagged-template/function client.
 */
export function getDb(databaseUrl: string) {
  return neon(databaseUrl);
}

/**
 * Wrap the Neon client in a `pg`-compatible `{ query() }` adapter.
 * The Neon HTTP driver accepts `(text, params)` and resolves to an array of
 * rows, which we wrap as `{ rows }`.
 */
export function createDbClient(databaseUrl: string): DbClient {
  const sql = neon(databaseUrl);
  return {
    query: async (text: string, params?: any[]) => {
      const rows = await sql(text, params ?? []);
      return { rows: rows as any[] };
    },
  };
}
