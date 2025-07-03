# Unit Tests Summary

## ✅ Task Completed: Write unit tests using Vitest

This document summarizes the comprehensive unit tests implemented for the `@qarbon/tracker-adapters`
package.

### Requirements Met

✅ **registering new adapter works**

- Test: `UniversalTrackerRegistry > registerAdapter > should register a new adapter`
- Test: `UniversalTrackerRegistry > registerAdapter > should register multiple adapters`
- Test:
  `UniversalTrackerRegistry > registerAdapter > should overwrite existing adapter with same name`

✅ **detectFormat returns correct key for JSON/CSV/XML strings**

- Test: `Real Adapters Integration > JSON Adapter > should detect JSON strings correctly`
- Test: `Real Adapters Integration > CSV Adapter > should detect CSV strings correctly`
- Test: `Real Adapters Integration > XML Adapter > should detect XML strings correctly`
- Test: `UniversalTrackerRegistry > detectFormat > should return correct key for matching adapter`

✅ **ingest returns parsed object**

- Test: `Real Adapters Integration > JSON Adapter > should parse JSON strings correctly`
- Test: `Real Adapters Integration > CSV Adapter > should parse CSV strings correctly`
- Test: `Real Adapters Integration > XML Adapter > should parse simple XML correctly`
- Test: `UniversalTrackerRegistry > ingest > should return parsed object from matching adapter`

✅ **unknown format throws or returns fallback**

- Test: `UniversalTrackerRegistry > ingest > should throw error for unknown format by default`
- Test:
  `Fallback Registry for Unknown Formats > should return fallback for unknown format instead of throwing`
- Test:
  `Fallback Registry for Unknown Formats > should demonstrate creating registry with custom fallback behavior`

✅ **Add mocks for adapters in tests**

- Test: `Adapter Mocking in Tests > should demonstrate how to mock adapters for testing`
- Test: `Adapter Mocking in Tests > should demonstrate spying on real adapter methods`
- Created `MockEmissionAdapter` class for comprehensive testing

### Test Statistics

- **Total Tests**: 35 tests
- **Test Files**: 1
- **All Tests Passing**: ✅
- **Coverage**: 72.85% overall, 100% for UniversalTrackerRegistry core functionality

### Test Structure

#### 1. Core Registry Tests (`UniversalTrackerRegistry`)

- Adapter registration and management
- Format detection logic
- Data ingestion pipeline
- Error handling for unknown formats

#### 2. Real Adapters Integration Tests

- **JSON Adapter**: String parsing, object handling, invalid JSON errors
- **CSV Adapter**: Parsing, quoted values, empty data handling
- **XML Adapter**: Basic parsing, XML declarations, malformed data

#### 3. Fallback Behavior Tests

- Default error throwing for unknown formats
- Custom fallback registry implementation
- Extensibility patterns for error handling

#### 4. Mocking and Testing Utilities

- Mock adapter implementation with configurable behavior
- Vitest spy integration for method tracking
- Best practices for testing custom adapters

### Key Testing Features

1. **Comprehensive Mock Adapter**: `MockEmissionAdapter` class with configurable detection and
   ingestion behavior
2. **Real Integration Testing**: Tests with actual JSON, CSV, and XML adapters
3. **Error Scenario Coverage**: Invalid data, unknown formats, adapter errors
4. **Extensibility Examples**: Custom fallback registries and adapter testing patterns
5. **Type Safety**: Full TypeScript coverage with proper interface implementation

### Setup Details

- **Framework**: Vitest (with Node.js environment)
- **Configuration**: `vitest.config.ts` with coverage reporting
- **Coverage Tools**: @vitest/coverage-v8
- **Dependencies**: All properly installed and configured

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Files Created/Modified

1. `test/UniversalTrackerRegistry.test.ts` - Comprehensive test suite
2. `vitest.config.ts` - Vitest configuration
3. `package.json` - Added test scripts and dependencies
4. `README.md` - Updated with testing documentation and examples

The implementation fully satisfies all requirements and provides a robust testing foundation for the
tracker adapters system.
