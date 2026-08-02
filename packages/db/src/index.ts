import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export * from './schema';
export { schema };

export type Database = ReturnType<typeof createDatabase>;

/**
 * Creates the Drizzle client.
 *
 * `prepare: false` is required for connection-pooled Postgres (Neon's pooler,
 * PgBouncer in transaction mode): prepared statements are per-session, and a
 * pooler hands you a different session each time.
 */
export function createDatabase(connectionString: string, options?: { max?: number }) {
  const client = postgres(connectionString, {
    max: options?.max ?? 10,
    prepare: false,
  });

  return drizzle(client, { schema });
}
