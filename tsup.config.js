import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli.ts',
  ],
  format: ['esm'],
  target: 'node22',
  minify: true,
  sourcemap: true,
  clean: true,
  dts: false,
  splitting: false,
  bundle: true,
  skipNodeModulesBundle: true
});
