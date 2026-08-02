import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit spawns its own process and does not read the workspace `.env`,
// so load the repo-root file explicitly rather than relying on the shell.
loadEnv({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const url = process.env['DATABASE_URL'];

if (!url) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and run `pnpm env:up`.');
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
