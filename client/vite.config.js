import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/domain/**/*.js', 'src/controller/**/*.js', 'src/services/**/*.js'],
      exclude: ['src/services/contracts.js'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
