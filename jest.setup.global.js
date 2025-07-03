// Global Jest setup for all projects in the monorepo

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.TZ = 'UTC';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Add any global test utilities here
  createMockUser: () => ({
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  }),

  createMockEmission: () => ({
    id: '1',
    amount: 100,
    unit: 'kg',
    source: 'test',
    timestamp: new Date(),
  }),
};

// Setup for async tests
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks();
});
