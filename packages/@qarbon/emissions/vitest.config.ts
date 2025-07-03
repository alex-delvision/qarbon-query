import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/example.ts',
        'src/**/test-example.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 30000,
    hookTimeout: 10000,
    maxConcurrency: 4,
    browser: {
      enabled: process.env.BROWSER_TEST === 'true',
      name: 'chromium',
      provider: 'playwright',
      headless: true
    }
  },
  esbuild: {
    target: 'node18'
  }
});
