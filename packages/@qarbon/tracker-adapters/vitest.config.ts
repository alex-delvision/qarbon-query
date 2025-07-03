import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/', '**/*.config.*', 'dist/'],
    },
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
});
