import { vi, beforeEach } from 'vitest';

// Mock the shared package to avoid module resolution issues
vi.mock('@qarbon/shared', () => ({
  generateFootprint: vi.fn(() => ({
    total: 100,
    breakdown: { ai: 100 },
    period: 'monthly',
  })),
}));

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset Date.now mock if it was set
  vi.useRealTimers();
});

// Global test utilities
global.createMockTimestamp = (date?: string) => {
  return date ? new Date(date).toISOString() : new Date().toISOString();
};

// Helper for testing within tolerance
global.expectWithinTolerance = (
  actual: number,
  expected: number,
  tolerance: number = 0.1
) => {
  const diff = Math.abs(actual - expected);
  const threshold = expected * tolerance;
  expect(diff).toBeLessThanOrEqual(threshold);
};

// Helper for testing factor values with ±10% tolerance as mentioned in requirements
global.expectFactorTolerance = (actual: number, published: number) => {
  const tolerance = published * 0.1; // ±10%
  expect(actual).toBeGreaterThanOrEqual(published - tolerance);
  expect(actual).toBeLessThanOrEqual(published + tolerance);
};

// Declare global types
declare global {
  var createMockTimestamp: (date?: string) => string;
  var expectWithinTolerance: (
    actual: number,
    expected: number,
    tolerance?: number
  ) => void;
  var expectFactorTolerance: (actual: number, published: number) => void;
}
