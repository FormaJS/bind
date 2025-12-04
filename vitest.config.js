import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Usa fontes locais para evitar build prévio
      '@formajs/formajs': path.resolve(__dirname, '../forma/src/index.js'),
      '@formajs/mold': path.resolve(__dirname, '../mold/src/index.js')
    }
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**'],
      thresholds: { lines: 80, branches: 68 }
    }
  }
});
