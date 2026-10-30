import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `--mode single` inlines every asset into one index.html for publishing as an artifact.
// Relative base: the build works from any sub-path, e.g. GitHub Pages at /<repo>/.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: mode === 'single'
    ? { outDir: 'dist-single', assetsInlineLimit: 100_000_000, cssCodeSplit: false }
    : { outDir: 'dist' },
}));
