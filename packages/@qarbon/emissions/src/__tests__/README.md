# Comprehensive Test Suite

This directory contains a comprehensive test suite for the `@qarbon/emissions` package, covering all modules with extensive validation, performance benchmarks, and uncertainty quantification tests.

## Test Structure

```
src/__tests__/
├── adapters/                       # Adapter tests with real sample files
│   ├── __fixtures__/              # Real sample data files
│   │   ├── codecarbon-sample.json # CodeCarbon output sample
│   │   ├── csv-sample.csv         # CSV emissions data sample
│   │   └── json-sample.json       # JSON emissions data sample
│   └── adapters.test.ts           # Comprehensive adapter testing
├── grid/                          # Grid manager tests
│   ├── __fixtures__/              # Grid intensity test data
│   └── grid-manager.test.ts       # Mocked API calls & fallback logic
├── optimizations/                 # Performance and optimization tests
│   ├── __fixtures__/              # Performance test data
│   └── performance.test.ts        # Batch/WASM benchmarks (≥2× speedup)
├── uncertainty/                   # Uncertainty quantification tests
│   ├── __fixtures__/              # Monte Carlo test scenarios
│   └── montecarlo-convergence.test.ts # Monte Carlo convergence validation
├── factors.test.ts                # Factor sanity checks vs published values (±10%)
└── README.md                      # This file
```

## Test Categories

### 1. Adapter Tests (`adapters/`)

**Purpose**: Validate adapter functionality with real sample files

**Coverage**:
- ✅ `validate()` method validation with real data
- ✅ `normalize()` output format consistency
- ✅ Error handling and data quality warnings
- ✅ Cross-adapter output compatibility
- ✅ Auto-detection algorithm testing
- ✅ Registry management

**Test Data**: Real sample files in `__fixtures__/` directory
- CodeCarbon JSON output
- CSV emissions data with various formats
- JSON emissions data structures

**Key Assertions**:
```typescript
// Validation
expect(result.isValid).toBe(true);
expect(result.errors).toBeUndefined();

// Normalization consistency
expect(result).toHaveProperty('timestamp');
expect(result).toHaveProperty('emissions');
expect(result).toHaveProperty('energy');
```

### 2. Factor Sanity Checks (`factors.test.ts`)

**Purpose**: Validate emission factors against published values with ±10% tolerance

**Coverage**:
- ✅ AI model factors (GPT-3.5, GPT-4, Claude-2) vs research papers
- ✅ Grid intensity factors vs EPA eGRID/EEA data
- ✅ PUE values vs cloud provider specifications
- ✅ Cross-factor consistency validation
- ✅ Unit conversion accuracy

**Key Tolerance Tests**:
```typescript
// ±10% tolerance for published values
expectFactorTolerance(actual, published); // Uses global helper

// Example factor validation
const factor = getAIFactor('gpt-3.5');
expectFactorTolerance(factor.co2PerToken, 0.0022); // Published value
```

**Data Sources**:
- OpenAI research papers
- EPA eGRID 2021 data
- European Environment Agency data
- Cloud provider sustainability reports

### 3. Grid Manager Tests (`grid/`)

**Purpose**: Test grid intensity manager with mocked API calls and fallback logic

**Coverage**:
- ✅ Waterfall fetching (ElectricityMap → WattTime → Daily → Monthly → Annual)
- ✅ API error handling and graceful degradation
- ✅ Caching mechanism with TTL validation
- ✅ Datacenter code resolution (AWS, Azure, GCP)
- ✅ PUE and REC adjustments
- ✅ Concurrent request handling

**Mock Strategy**:
```typescript
// Mock external APIs
global.fetch = vi.fn();

// Test fallback chain
(global.fetch as Mock)
  .mockRejectedValueOnce(new Error('ElectricityMap API error'))
  .mockRejectedValueOnce(new Error('WattTime API error'))
  .mockResolvedValueOnce({ /* daily average data */ });
```

### 4. Performance Benchmarks (`optimizations/`)

**Purpose**: Validate batch processing and WASM performance with ≥2× speedup requirements

**Coverage**:
- ✅ Batch vs individual calculations (≥2× speedup)
- ✅ WASM vs JavaScript calculations (≥2× speedup)
- ✅ Streaming data processing latency
- ✅ Cache performance validation
- ✅ Memory efficiency testing
- ✅ Parallel processing utilization

**Performance Assertions**:
```typescript
// Speedup validation
const speedupRatio = baselineTime / optimizedTime;
expect(speedupRatio).toBeGreaterThanOrEqual(2.0);

// Memory efficiency
const memoryPerItem = memoryIncrease / dataSize;
expect(memoryPerItem).toBeLessThan(1024); // < 1KB per item
```

**Benchmark Results Tracking**:
- Performance trends tracked in CI
- Regression detection
- Cross-platform performance validation

### 5. Uncertainty Convergence Tests (`uncertainty/`)

**Purpose**: Verify Monte Carlo simulation convergence and statistical validity

**Coverage**:
- ✅ Sample size convergence to theoretical values
- ✅ Distribution convergence (uniform, normal)
- ✅ Confidence interval stability
- ✅ Statistical validation (Kolmogorov-Smirnov test)
- ✅ Central Limit Theorem demonstration
- ✅ Emissions-specific convergence scenarios

**Convergence Validation**:
```typescript
// Mean convergence
const error = Math.abs(result.mean - theoreticalMean);
expect(error).toBeLessThan(tolerance[sampleSize]);

// Statistical tests
const ksStatistic = calculateKolmogorovSmirnovStatistic(sample1, sample2);
expect(ksStatistic).toBeLessThan(criticalValue);
```

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    browser: {
      enabled: process.env.BROWSER_TEST === 'true',
      name: 'chromium'
    }
  }
});
```

### Global Test Utilities (`vitest.setup.ts`)

```typescript
// Factor tolerance testing (±10%)
global.expectFactorTolerance = (actual: number, published: number) => {
  const tolerance = published * 0.1;
  expect(actual).toBeGreaterThanOrEqual(published - tolerance);
  expect(actual).toBeLessThanOrEqual(published + tolerance);
};

// General tolerance testing
global.expectWithinTolerance = (actual: number, expected: number, tolerance: number = 0.1) => {
  const diff = Math.abs(actual - expected);
  const threshold = expected * tolerance;
  expect(diff).toBeLessThanOrEqual(threshold);
};
```

## Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run browser tests
npm run test:browser

# Run specific test suites
npm test -- adapters
npm test -- factors.test.ts
npm test -- grid/
npm test -- optimizations/
npm test -- uncertainty/
```

### CI/CD Pipeline

The CI pipeline runs on Node.js 18 and 20 with the following jobs:

1. **test-node**: Core test suite on both Node versions
2. **test-browser**: Browser compatibility testing
3. **performance-benchmarks**: Performance regression detection
4. **adapter-integration**: Adapter-specific validation
5. **uncertainty-validation**: Monte Carlo convergence tests
6. **grid-manager-tests**: Grid API fallback validation
7. **check-coverage**: 80% coverage threshold enforcement

## Coverage Requirements

All modules must maintain ≥80% coverage across:
- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

Coverage reports are generated in multiple formats:
- Terminal output for quick feedback
- HTML reports for detailed analysis
- LCOV format for CI integration

## Test Data Management

### Fixtures Strategy

Real sample files are used to ensure adapter compatibility:
- **CodeCarbon**: Actual ML training output
- **CSV**: Multiple format variations
- **JSON**: Various schema structures

### Data Sources

Factor validation uses authoritative sources:
- **AI Factors**: OpenAI research, Anthropic studies
- **Grid Intensity**: EPA eGRID, EEA official data
- **PUE Values**: Cloud provider sustainability reports

## Performance Standards

### Required Speedups

All optimizations must demonstrate measurable performance improvements:
- **Batch Processing**: ≥2× faster than individual calculations
- **WASM**: ≥2× faster than JavaScript equivalents
- **Caching**: ≥10× faster for cache hits
- **Streaming**: <100ms average chunk latency

### Memory Efficiency

- Large datasets: <100MB memory increase for 50k items
- Per-item memory: <1KB overhead
- No memory leaks in long-running scenarios

## Statistical Validation

### Monte Carlo Requirements

- **Convergence**: Error decreases with sample size
- **Distribution**: Samples follow expected distributions
- **Confidence Intervals**: 95% nominal coverage
- **Stability**: <5% coefficient of variation across runs

### Tolerance Standards

- **Factor Validation**: ±10% of published values
- **Performance**: ≥2× speedup requirements
- **Statistical**: <5% deviation from theoretical values

## Contributing to Tests

### Adding New Tests

1. Follow existing patterns in each test category
2. Use real sample data in `__fixtures__/` directories
3. Include both positive and negative test cases
4. Add performance benchmarks for new optimizations
5. Validate against published/theoretical values

### Test Naming Conventions

```typescript
describe('Module Name', () => {
  describe('Feature Category', () => {
    it('should do specific thing under specific conditions', () => {
      // Test implementation
    });
  });
});
```

### Performance Test Guidelines

```typescript
// Use consistent measurement patterns
const result = await measurePerformance(
  'Test description',
  async () => {
    // Performance test code
  },
  iterations
);

// Validate speedup requirements
expect(baselineTime / optimizedTime).toBeGreaterThanOrEqual(2.0);
```

This comprehensive test suite ensures reliability, performance, and accuracy across all emissions calculation modules while maintaining compatibility with real-world data sources and meeting stringent performance requirements.
