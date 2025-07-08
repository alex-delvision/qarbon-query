# Optimizations Module

High-performance calculation optimizations for large-scale emissions processing.

## Features

### Batch API with Vectorized Operations

The `calculateBatch` function provides optimized batch processing using:

- **Float64Array** for efficient memory usage
- **SIMD operations** when available (via WebAssembly or native support)
- **Automatic fallback** to regular calculations when optimizations fail

```typescript
import { batchCalculator, EmissionInput } from '@qarbon/emissions/optimizations';

const inputs: EmissionInput[] = [
  { id: '1', category: 'transport', type: 'car', value: 100 },
  { id: '2', category: 'energy', type: 'grid', value: 500 },
  // ... many more inputs
];

const { results, metrics } = await batchCalculator.calculateBatch(inputs, {
  useWasm: true,
  useSIMD: true,
  useCache: true,
});

console.log(`Processed ${metrics.processedInputs} inputs in ${metrics.processingTime}ms`);
```

### WebAssembly Path for Large Arrays

For large datasets (>1000 inputs by default), the module automatically uses WebAssembly:

- **Rust-based calculations** compiled to WASM for maximum performance
- **Vectorized arithmetic** operations
- **Memory-efficient** processing with manual memory management
- **Graceful fallback** when WASM is not available

```typescript
// Automatic WASM usage for large batches
const largeInputs = generateInputs(5000); // 5000 inputs
const { results } = await batchCalculator.calculateBatch(largeInputs, {
  wasmThreshold: 1000, // Use WASM for batches > 1000
});
```

### LRU Cache

Efficient caching system keyed by `model|region`:

```typescript
import { emissionFactorCache } from '@qarbon/emissions/optimizations';

// Cache is automatically used, but can be controlled manually
emissionFactorCache.set('gpt-4', factor, 'us-east-1', 300000); // 5min TTL
const cachedFactor = emissionFactorCache.get('gpt-4', 'us-east-1');

// Cache statistics
const stats = emissionFactorCache.getStats();
console.log(`Cache hit rate: ${stats.hitRate * 100}%`);
```

### Streaming Calculator

Real-time processing using Node.js Transform streams:

```typescript
import { StreamingCalculator, LogProcessor, logParsers } from '@qarbon/emissions/optimizations';
import fs from 'fs';

// Create streaming pipeline
const logProcessor = new LogProcessor(logParsers.json);
const streamingCalculator = new StreamingCalculator({ batchSize: 100 });

// Process log file in real-time
fs.createReadStream('emissions.log')
  .pipe(logProcessor)
  .pipe(streamingCalculator)
  .on('data', result => {
    console.log('Emission calculated:', result);
  });
```

### Feature Flags

Toggle optimizations with feature flags:

```typescript
import { featureFlags } from '@qarbon/emissions/optimizations';

// Update feature flags
featureFlags.updateFlags({
  enableWasmCalculations: false, // Disable WASM
  enableSIMDOperations: true, // Enable SIMD
  wasmBatchThreshold: 2000, // Higher threshold
});

// Environment variable support
// Set QARBON_ENABLEWASMCALCULATIONS=false to disable WASM
```

## Performance Characteristics

| Method  | Batch Size | Performance  | Memory Usage | Fallback     |
| ------- | ---------- | ------------ | ------------ | ------------ |
| Regular | < 100      | Baseline     | Low          | N/A          |
| SIMD    | 100-1000   | 2-4x faster  | Medium       | Regular      |
| WASM    | > 1000     | 5-10x faster | High         | SIMD/Regular |

## Build Requirements

For WebAssembly compilation:

```bash
# Install Rust and wasm-pack
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install wasm-pack

# Build WASM module
cd src/optimizations/wasm
wasm-pack build --target web --out-dir pkg
```

## API Reference

### BatchCalculator

```typescript
class BatchCalculator {
  async calculateBatch(
    inputs: EmissionInput[],
    options?: BatchCalculationOptions
  ): Promise<{ results: EmissionOutput[]; metrics: BatchMetrics }>;

  getMetrics(): BatchMetrics;
  resetMetrics(): void;
}
```

### StreamingCalculator

```typescript
class StreamingCalculator extends Transform {
  constructor(options?: StreamingCalculationOptions);
  getMetrics(): BatchMetrics;
  resetMetrics(): void;
  flushBuffer(): Promise<void>;
}
```

### LRUCache

```typescript
class LRUCache {
  get(model: string, region?: string): any | null;
  set(model: string, factor: any, region?: string, ttl?: number): void;
  has(model: string, region?: string): boolean;
  delete(model: string, region?: string): boolean;
  clear(): void;
  getStats(): CacheStats;
}
```

### FeatureFlagsManager

```typescript
class FeatureFlagsManager {
  getFlags(): FeatureFlags;
  updateFlags(updates: Partial<FeatureFlags>): void;
  isEnabled(feature: keyof FeatureFlags): boolean;
  getValue(feature: keyof FeatureFlags): number;
  loadFromEnv(): void;
}
```

## Configuration

### Environment Variables

- `QARBON_ENABLEBATCHOPTIMIZATIONS` - Enable/disable batch optimizations
- `QARBON_ENABLEWASMCALCULATIONS` - Enable/disable WebAssembly
- `QARBON_ENABLESIMDOPERATIONS` - Enable/disable SIMD
- `QARBON_ENABLESTREAMING` - Enable/disable streaming
- `QARBON_ENABLECACHE` - Enable/disable caching
- `QARBON_WASMBATCHTHRESHOLD` - Threshold for WASM usage
- `QARBON_CACHETTL` - Cache TTL in milliseconds
- `QARBON_MAXCACHESIZE` - Maximum cache size

### Default Configuration

```typescript
const DEFAULT_FEATURES = {
  enableBatchOptimizations: true,
  enableWasmCalculations: true,
  enableSIMDOperations: true,
  enableStreaming: true,
  enableCache: true,
  enableFallback: true,
  wasmBatchThreshold: 1000,
  cacheTTL: 300000, // 5 minutes
  maxCacheSize: 1000,
};
```

## Error Handling

All optimizations include graceful fallback mechanisms:

1. **WASM failure** → Falls back to SIMD
2. **SIMD failure** → Falls back to regular calculation
3. **Cache miss** → Calculates and caches result
4. **Streaming error** → Emits error event but continues processing

## Performance Monitoring

Built-in metrics collection:

```typescript
const { metrics } = await batchCalculator.calculateBatch(inputs);

console.log({
  totalInputs: metrics.totalInputs,
  processingTime: metrics.processingTime,
  throughput: metrics.totalInputs / (metrics.processingTime / 1000), // inputs/sec
  cacheHitRate: metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses),
  optimizationsUsed: {
    wasm: metrics.useWasm,
    simd: metrics.useSIMD,
  },
});
```
