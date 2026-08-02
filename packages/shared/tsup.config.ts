import { defineConfig } from 'tsup';

/**
 * Dual CJS + ESM output.
 *
 * NestJS compiles to CommonJS and cannot import a workspace package that is
 * only TypeScript source; Expo's Metro bundler prefers ESM. Emitting both is
 * the only way one package serves both consumers without either side
 * special-casing it.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
