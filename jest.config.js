/** @type {import('jest').Config} */
module.exports = {
  // Root configuration for the monorepo
  testEnvironment: 'node',
  roots: ['<rootDir>'],

  // Project-specific configurations
  projects: [
    // Apps
    {
      displayName: 'web',
      testMatch: ['<rootDir>/apps/web/**/*.{test,spec}.{js,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/apps/web/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/apps/web/src/$1',
        '^@qarbon/(.*)$': '<rootDir>/packages/$1/src',
      },
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/apps/web/tsconfig.json',
          },
        ],
      },
    },
    {
      displayName: 'docs',
      testMatch: ['<rootDir>/apps/docs/**/*.{test,spec}.{js,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/apps/docs/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/apps/docs/src/$1',
        '^@qarbon/(.*)$': '<rootDir>/packages/$1/src',
      },
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/apps/docs/tsconfig.json',
          },
        ],
      },
    },
    // Packages
    {
      displayName: 'ui',
      testMatch: ['<rootDir>/packages/ui/**/*.{test,spec}.{js,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/packages/ui/jest.setup.js'],
      moduleNameMapper: {
        '^@qarbon/(.*)$': '<rootDir>/packages/$1/src',
      },
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/packages/ui/tsconfig.json',
          },
        ],
      },
    },
    {
      displayName: 'tracker-adapters',
      testMatch: [
        '<rootDir>/packages/@qarbon/tracker-adapters/**/*.{test,spec}.{js,ts}',
      ],
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@qarbon/(.*)$': '<rootDir>/packages/$1/src',
      },
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            tsconfig:
              '<rootDir>/packages/@qarbon/tracker-adapters/tsconfig.json',
          },
        ],
      },
    },
    // Services (when created)
    {
      displayName: 'services',
      testMatch: ['<rootDir>/services/**/*.{test,spec}.{js,ts}'],
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@qarbon/(.*)$': '<rootDir>/packages/$1/src',
        '^@services/(.*)$': '<rootDir>/services/$1/src',
      },
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/services/*/tsconfig.json',
          },
        ],
      },
    },
  ],

  // Global settings
  collectCoverageFrom: [
    'apps/**/*.{ts,tsx}',
    'packages/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.config.{js,ts}',
    '!**/*.stories.{js,ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],

  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],

  // Test settings
  testTimeout: 10000,
  verbose: true,
  bail: false,
  maxWorkers: '50%',

  // Setup files
  setupFiles: ['<rootDir>/jest.setup.global.js'],

  // Transform settings
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/dist/',
    '/build/',
    '/coverage/',
    '\\.e2e\\.',
  ],

  // Watch settings
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/.next/',
    '/coverage/',
  ],

  // Error handling
  errorOnDeprecated: true,

  // Reporter settings
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/coverage',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],
};
