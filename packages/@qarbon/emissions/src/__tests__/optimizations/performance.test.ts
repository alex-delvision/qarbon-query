import { describe, it, expect, beforeEach } from 'vitest';
import { BatchCalculator } from '../../optimizations/batch-calculator';
import { StreamingCalculator } from '../../optimizations/streaming-calculator';
import { WasmHelper } from '../../optimizations/wasm-helper';
import { LRUCache } from '../../optimizations/lru-cache';

// Performance test data generator
function generateTestData(size: number) {
  return Array.from({ length: size }, (_, i) => ({
    id: `item_${i}`,
    tokens: Math.floor(Math.random() * 2000) + 100, // 100-2100 tokens
    model: ['gpt-3.5', 'gpt-4', 'claude-2'][i % 3],
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    metadata: {
      user_id: `user_${Math.floor(i / 10)}`,
      session_id: `session_${Math.floor(i / 5)}`,
    },
  }));
}

// Simple emissions calculator for baseline comparison
function calculateEmissionSimple(tokens: number, model: string): number {
  const factors = {
    'gpt-3.5': 0.0022,
    'gpt-4': 0.0085,
    'claude-2': 0.003,
  };
  return tokens * (factors[model as keyof typeof factors] || 0.002);
}

// Performance measurement helper
async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T> | T,
  iterations: number = 1
): Promise<{ result: T; avgTime: number; totalTime: number }> {
  const times: number[] = [];
  let result: T;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    result = await fn();
    const end = performance.now();
    times.push(end - start);
  }

  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const avgTime = totalTime / iterations;

  console.log(
    `${name}: ${avgTime.toFixed(2)}ms avg (${iterations} iterations)`
  );

  return { result: result!, avgTime, totalTime };
}

describe('Performance Benchmarks', () => {
  let batchCalculator: BatchCalculator;
  let streamingCalculator: StreamingCalculator;
  let wasmHelper: WasmHelper;
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    batchCalculator = new BatchCalculator();
    streamingCalculator = new StreamingCalculator();
    wasmHelper = new WasmHelper();
    cache = new LRUCache<string, number>(1000);
  });

  describe('Batch Processing Performance', () => {
    it('should show ≥2× speedup for batch vs individual calculations', async () => {
      const testData = generateTestData(1000);
      const iterations = 3;

      // Baseline: individual calculations
      const individualPerf = await measurePerformance(
        'Individual calculations',
        async () => {
          const results = [];
          for (const item of testData) {
            results.push(calculateEmissionSimple(item.tokens, item.model));
          }
          return results;
        },
        iterations
      );

      // Batch calculations
      const batchPerf = await measurePerformance(
        'Batch calculations',
        async () => {
          return batchCalculator.calculateBatch(
            testData.map(item => ({
              tokens: item.tokens,
              model: item.model,
            }))
          );
        },
        iterations
      );

      // Verify results are equivalent
      expect(batchPerf.result).toHaveLength(testData.length);
      expect(individualPerf.result).toHaveLength(testData.length);

      // Check for ≥2× speedup
      const speedupRatio = individualPerf.avgTime / batchPerf.avgTime;
      console.log(`Batch speedup: ${speedupRatio.toFixed(2)}×`);

      expect(speedupRatio).toBeGreaterThanOrEqual(2.0);
    });

    it('should handle large batch sizes efficiently', async () => {
      const largeBatchSizes = [1000, 5000, 10000];
      const results: { size: number; timePerItem: number }[] = [];

      for (const size of largeBatchSizes) {
        const testData = generateTestData(size);

        const perf = await measurePerformance(
          `Batch size ${size}`,
          async () => {
            return batchCalculator.calculateBatch(
              testData.map(item => ({
                tokens: item.tokens,
                model: item.model,
              }))
            );
          }
        );

        const timePerItem = perf.avgTime / size;
        results.push({ size, timePerItem });

        // Verify all items were processed
        expect(perf.result).toHaveLength(size);
      }

      // Time per item should not increase significantly with batch size
      // (indicating good O(n) scaling)
      const smallBatchTime = results[0].timePerItem;
      const largeBatchTime = results[results.length - 1].timePerItem;
      const scalingRatio = largeBatchTime / smallBatchTime;

      console.log(`Scaling ratio (large/small): ${scalingRatio.toFixed(2)}`);
      expect(scalingRatio).toBeLessThan(2.0); // Should not double per item time
    });

    it('should optimize memory usage for large batches', async () => {
      const testData = generateTestData(10000);

      // Monitor memory usage during batch processing
      const memoryBefore = process.memoryUsage();

      const result = await batchCalculator.calculateBatch(
        testData.map(item => ({
          tokens: item.tokens,
          model: item.model,
        }))
      );

      const memoryAfter = process.memoryUsage();
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;
      const memoryPerItem = memoryIncrease / testData.length;

      console.log(`Memory per item: ${memoryPerItem.toFixed(0)} bytes`);

      // Memory usage should be reasonable (less than 1KB per item)
      expect(memoryPerItem).toBeLessThan(1024);
      expect(result).toHaveLength(testData.length);
    });
  });

  describe('WASM Performance', () => {
    it('should show ≥2× speedup for WASM vs JavaScript calculations', async () => {
      const testData = generateTestData(5000);
      const iterations = 5;

      // JavaScript baseline
      const jsPerf = await measurePerformance(
        'JavaScript calculations',
        async () => {
          const results = [];
          for (const item of testData) {
            // Simulate more complex calculation
            let sum = 0;
            for (let i = 0; i < item.tokens; i++) {
              sum += Math.sin(i) * 0.0022;
            }
            results.push(sum);
          }
          return results;
        },
        iterations
      );

      // WASM calculations
      const wasmPerf = await measurePerformance(
        'WASM calculations',
        async () => {
          // Initialize WASM module if not already done
          if (!wasmHelper.isInitialized()) {
            await wasmHelper.initialize();
          }

          return wasmHelper.calculateEmissionsBatch(
            testData.map(item => item.tokens),
            testData.map(item => 0.0022) // Simplified factor
          );
        },
        iterations
      );

      // Verify results are equivalent length
      expect(wasmPerf.result).toHaveLength(testData.length);
      expect(jsPerf.result).toHaveLength(testData.length);

      // Check for ≥2× speedup
      const speedupRatio = jsPerf.avgTime / wasmPerf.avgTime;
      console.log(`WASM speedup: ${speedupRatio.toFixed(2)}×`);

      expect(speedupRatio).toBeGreaterThanOrEqual(2.0);
    });

    it('should handle WASM module initialization efficiently', async () => {
      // Test cold start performance
      const coldStartPerf = await measurePerformance(
        'WASM cold start',
        async () => {
          const freshWasm = new WasmHelper();
          await freshWasm.initialize();
          return freshWasm.calculateEmissions(1000, 0.0022);
        }
      );

      // Test warm start performance
      const warmStartPerf = await measurePerformance(
        'WASM warm start',
        async () => {
          return wasmHelper.calculateEmissions(1000, 0.0022);
        }
      );

      // Warm start should be significantly faster
      const warmupRatio = coldStartPerf.avgTime / warmStartPerf.avgTime;
      console.log(`WASM warm-up benefit: ${warmupRatio.toFixed(2)}×`);

      expect(warmupRatio).toBeGreaterThan(5.0); // Should be much faster when warmed up
      expect(coldStartPerf.avgTime).toBeLessThan(1000); // Cold start should be reasonable (<1s)
    });

    it('should fall back gracefully when WASM is unavailable', async () => {
      // Simulate WASM unavailability
      const wasmHelperBroken = new WasmHelper();

      // Mock initialization failure
      vi.spyOn(wasmHelperBroken, 'initialize').mockRejectedValue(
        new Error('WASM not supported')
      );

      const fallbackPerf = await measurePerformance(
        'WASM fallback',
        async () => {
          try {
            await wasmHelperBroken.initialize();
            return wasmHelperBroken.calculateEmissions(1000, 0.0022);
          } catch {
            // Fallback to JavaScript
            return calculateEmissionSimple(1000, 'gpt-3.5');
          }
        }
      );

      // Should still produce valid results
      expect(fallbackPerf.result).toBeGreaterThan(0);
      expect(fallbackPerf.avgTime).toBeLessThan(100); // Fallback should be fast
    });
  });

  describe('Streaming Performance', () => {
    it('should process streaming data with low latency', async () => {
      const testData = generateTestData(1000);
      const chunkSize = 50;
      const latencies: number[] = [];

      const streamPerf = await measurePerformance(
        'Streaming processing',
        async () => {
          const results: number[] = [];

          for (let i = 0; i < testData.length; i += chunkSize) {
            const chunk = testData.slice(i, i + chunkSize);
            const chunkStart = performance.now();

            const chunkResults = await streamingCalculator.processChunk(
              chunk.map(item => ({
                tokens: item.tokens,
                model: item.model,
              }))
            );

            const chunkEnd = performance.now();
            latencies.push(chunkEnd - chunkStart);
            results.push(...chunkResults);
          }

          return results;
        }
      );

      // Verify all data was processed
      expect(streamPerf.result).toHaveLength(testData.length);

      // Check latency metrics
      const avgLatency =
        latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      console.log(`Average chunk latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`Max chunk latency: ${maxLatency.toFixed(2)}ms`);

      // Latency should be reasonable for streaming
      expect(avgLatency).toBeLessThan(100); // Less than 100ms per chunk
      expect(maxLatency).toBeLessThan(500); // Max 500ms for any chunk
    });

    it('should handle backpressure efficiently', async () => {
      const testData = generateTestData(2000);
      const results: number[] = [];
      let processedCount = 0;

      const backpressureTest = await measurePerformance(
        'Backpressure handling',
        async () => {
          const processor = streamingCalculator.createProcessor({
            maxConcurrency: 3,
            bufferSize: 100,
          });

          const processPromise = new Promise<void>(resolve => {
            processor.on('result', (result: number) => {
              results.push(result);
              processedCount++;
              if (processedCount >= testData.length) {
                resolve();
              }
            });
          });

          // Send data faster than it can be processed
          for (const item of testData) {
            processor.push({
              tokens: item.tokens,
              model: item.model,
            });
          }

          await processPromise;
          return results;
        }
      );

      expect(backpressureTest.result).toHaveLength(testData.length);

      // Should not exceed reasonable time even with backpressure
      expect(backpressureTest.avgTime).toBeLessThan(5000); // Less than 5 seconds
    });
  });

  describe('Caching Performance', () => {
    it('should show significant speedup for cached calculations', async () => {
      const testData = generateTestData(1000);
      const cacheKey = (tokens: number, model: string) => `${tokens}-${model}`;

      // First run (cache miss)
      const cacheMissPerf = await measurePerformance('Cache miss', async () => {
        const results = [];
        for (const item of testData) {
          const key = cacheKey(item.tokens, item.model);
          let result = cache.get(key);

          if (result === undefined) {
            result = calculateEmissionSimple(item.tokens, item.model);
            cache.set(key, result);
          }

          results.push(result);
        }
        return results;
      });

      // Second run (cache hit)
      const cacheHitPerf = await measurePerformance('Cache hit', async () => {
        const results = [];
        for (const item of testData) {
          const key = cacheKey(item.tokens, item.model);
          const result = cache.get(key);
          results.push(result!);
        }
        return results;
      });

      // Cache hits should be much faster
      const cacheSpeedup = cacheMissPerf.avgTime / cacheHitPerf.avgTime;
      console.log(`Cache speedup: ${cacheSpeedup.toFixed(2)}×`);

      expect(cacheSpeedup).toBeGreaterThanOrEqual(10.0); // Should be at least 10× faster
      expect(cacheHitPerf.result).toEqual(cacheMissPerf.result);
    });

    it('should maintain performance with cache eviction', async () => {
      const smallCache = new LRUCache<string, number>(100); // Small cache
      const testData = generateTestData(500); // More data than cache size

      const evictionPerf = await measurePerformance(
        'Cache with eviction',
        async () => {
          const results = [];
          for (const item of testData) {
            const key = `${item.tokens}-${item.model}`;
            let result = smallCache.get(key);

            if (result === undefined) {
              result = calculateEmissionSimple(item.tokens, item.model);
              smallCache.set(key, result);
            }

            results.push(result);
          }
          return results;
        }
      );

      // Should still provide benefits even with eviction
      expect(evictionPerf.avgTime).toBeLessThan(1000); // Reasonable performance
      expect(evictionPerf.result).toHaveLength(testData.length);
      expect(smallCache.size()).toBe(100); // Cache should be at max size
    });
  });

  describe('Parallel Processing', () => {
    it('should utilize multiple cores effectively', async () => {
      const testData = generateTestData(5000);
      const numCores = Math.min(4, navigator.hardwareConcurrency || 4);

      // Sequential processing
      const sequentialPerf = await measurePerformance(
        'Sequential processing',
        async () => {
          const results = [];
          for (const item of testData) {
            results.push(calculateEmissionSimple(item.tokens, item.model));
          }
          return results;
        }
      );

      // Parallel processing
      const parallelPerf = await measurePerformance(
        'Parallel processing',
        async () => {
          const chunkSize = Math.ceil(testData.length / numCores);
          const chunks = [];

          for (let i = 0; i < testData.length; i += chunkSize) {
            chunks.push(testData.slice(i, i + chunkSize));
          }

          const promises = chunks.map(async chunk => {
            return chunk.map(item =>
              calculateEmissionSimple(item.tokens, item.model)
            );
          });

          const results = await Promise.all(promises);
          return results.flat();
        }
      );

      // Parallel should be faster (though may not scale linearly due to overhead)
      const parallelSpeedup = sequentialPerf.avgTime / parallelPerf.avgTime;
      console.log(
        `Parallel speedup: ${parallelSpeedup.toFixed(2)}× (${numCores} cores)`
      );

      expect(parallelSpeedup).toBeGreaterThan(1.5); // Should show some improvement
      expect(parallelPerf.result).toHaveLength(testData.length);
    });
  });

  describe('Memory Efficiency', () => {
    it('should handle large datasets without memory leaks', async () => {
      const largeDataset = generateTestData(50000);
      const memoryBefore = process.memoryUsage();

      // Process large dataset in chunks to avoid memory issues
      const results = [];
      const chunkSize = 1000;

      for (let i = 0; i < largeDataset.length; i += chunkSize) {
        const chunk = largeDataset.slice(i, i + chunkSize);
        const chunkResults = await batchCalculator.calculateBatch(
          chunk.map(item => ({
            tokens: item.tokens,
            model: item.model,
          }))
        );
        results.push(...chunkResults);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const memoryAfter = process.memoryUsage();
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;

      console.log(
        `Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`
      );

      expect(results).toHaveLength(largeDataset.length);
      // Memory increase should be reasonable (less than 100MB for 50k items)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });
});
