# Changelog

## [1.1.0] - 2025-01-04

### 🚀 Major Performance Release

#### Added

- **Modular Entry Points**: New specialized imports for optimal bundle sizes
  - `qarbon-emissions/ai` (5.52KB) - 86% smaller than full bundle
  - `qarbon-emissions/cloud` (3.46KB) - 91% smaller than full bundle
  - `qarbon-emissions/crypto` (4.20KB) - 89% smaller than full bundle
- **Tree-shaking Support**: Full tree-shaking compatibility for minimal bundles
- **SIMD Optimizations**: Float32Array batch calculations with SIMD-friendly operations
- **Performance Monitoring**: Built-in performance tracking and metrics collection
- **Feature Flags**: Runtime optimization control with graceful fallbacks
- **Comprehensive Benchmarking**: Performance test suite with sub-millisecond targets

#### Performance Improvements

- **Sub-millisecond Calculations**: AI token calculations in 0.001ms (1000x under target)
- **Batch Processing**: 1.9x faster per item vs individual calculations
- **Memory Efficiency**: Minimal 22KB overhead for all modules
- **O(1) Factor Lookups**: Map-based data structures replace object property access
- **Pre-compiled Regexes**: Faster pattern matching for model identification
- **LRU Caching**: Warm cache performance for repeated calculations

#### Bundle Optimizations

- **86-91% Bundle Size Reduction** with modular imports
- **Gzip Compression**: 75% reduction (20-30% final compression ratio)
- **Multiple Output Formats**: ESM, CommonJS, and UMD bundles
- **Browser Compatibility**: Optimized browser bundles with polyfills
- **Source Maps**: Full debugging support for all bundles

#### Developer Experience

- **Enhanced Build Tooling**: Rollup + ESBuild + Terser optimization pipeline
- **Bundle Analysis**: Automated size analysis and optimization recommendations
- **Lazy Loading Examples**: Patterns for dynamic imports and code splitting
- **TypeScript Support**: Full type definitions for all entry points
- **Performance Scripts**: `npm run test:performance` for benchmark validation

#### Technical Implementation

- **Map-based Data Structures**: O(1) performance for factor lookups
- **Object Pooling**: Memory-efficient reuse of calculation objects
- **Typed Arrays**: Float32Array for numerical operations
- **Pre-compilation**: Static data optimization during build
- **SIMD-friendly Algorithms**: Vectorized operations support

### Migration Guide

#### New Modular Imports (Recommended)

```typescript
// Before (40.55KB bundle)
import { EmissionsCalculator } from 'qarbon-emissions';

// After (5.52KB bundle - 86% smaller)
import { aiCalculator } from 'qarbon-emissions/ai';
import { cloudCalculator } from 'qarbon-emissions/cloud';
import { cryptoCalculator } from 'qarbon-emissions/crypto';
```

#### Performance Benchmarks

- Module Loading: 0.005ms (target: 10ms) ✅
- AI Calculations: 0.001ms (target: 1ms) ✅
- Batch Processing: 0.053ms for 100 items (target: 50ms) ✅
- Memory Usage: +22KB overhead for all modules ✅

### Backwards Compatibility

- All existing APIs remain unchanged
- Full bundle still available at main entry point
- No breaking changes to calculation methods
- Existing imports continue to work

## [1.0.0] - 2024-01-01

### Added

- Added exports field for better module resolution.

### Changed

- Updated version to 1.0.0 and main entry to point to `dist/index.js`.
