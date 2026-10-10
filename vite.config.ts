import { configDefaults, defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  plugins: [preact(), viteSingleFile()],
  build: { outDir: 'dist', assetsInlineLimit: 100_000_000 },
  // tests/e2e 는 Playwright 전용(vitest 가 *.spec.ts 를 줍지 않게)
  test: { exclude: [...configDefaults.exclude, 'tests/e2e/**'] },
});
