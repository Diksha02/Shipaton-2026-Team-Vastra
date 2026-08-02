import { defineConfig } from 'tsup';

export default defineConfig({
  // `schema` is a separate entry so drizzle-kit and the worker can import the
  // table definitions without pulling in the postgres client.
  entry: ['src/index.ts', 'src/schema.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['postgres', 'drizzle-orm'],
});
