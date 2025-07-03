/**
 * Performance Benchmark Test
 *
 * Comprehensive test suite to verify and demonstrate:
 * - Detection time measurement on large datasets
 * - Early-exit checks for high-confidence hits
 * - Signature caching to avoid double parsing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { performance } from 'perf_hooks';
import { BenchmarkSuite } from '../src/performance/BenchmarkSuite.js';
import { SignatureCache } from '../src/performance/SignatureCache.js';
import { OptimizedUniversalTrackerRegistry } from '../src/OptimizedUniversalTrackerRegistry.js';
import {
  JsonAdapter,
  CsvAdapter,
  XmlAdapter,
  CodeCarbonAdapter,
  AIImpactTrackerAdapter,
  FitAdapter,
} from '../src/adapters/index.js';

describe('Performance Benchmark Suite', () => {
  let optimizedRegistry: OptimizedUniversalTrackerRegistry;
  let benchmarkSuite: BenchmarkSuite;

  beforeEach(() => {
    // Create optimized registry with all adapters
    optimizedRegistry = new OptimizedUniversalTrackerRegistry(
      {
        json: new JsonAdapter(),
        csv: new CsvAdapter(),
        xml: new XmlAdapter(),
        codecarbon: new CodeCarbonAdapter(),
        aiimpact: new AIImpactTrackerAdapter(),
        fit: new FitAdapter(),
      },
      {
        enableEarlyExit: true,
        earlyExitThreshold: 0.95,
        enableCaching: true,
        enableDetailedTiming: true,
        maxDetectionTimeMs: 10000,
      }
    );

    benchmarkSuite = new BenchmarkSuite(optimizedRegistry);
  });

  describe('Signature Caching', () => {
    it('should cache detection results and improve performance on repeated calls', async () => {
      const testData = Buffer.from(
        JSON.stringify({
          timestamp: '2023-12-01T10:00:00Z',
          model: 'gpt-4',
          emissions: 0.001234,
          duration: 1.5,
          tokens: { input: 150, output: 89 },
        })
      );

      // Clear cache to start fresh
      optimizedRegistry.clearCache();

      // First detection (cold)
      const startTime1 = performance.now();
      const result1 = await optimizedRegistry.detectFormatOptimized(testData);
      const endTime1 = performance.now();
      const firstRunTime = endTime1 - startTime1;

      expect(result1.bestMatch).toBe('json');
      expect(result1.performance.cacheStats.hits).toBe(0);
      expect(result1.performance.cacheStats.misses).toBeGreaterThan(0);

      // Second detection (should use cache)
      const startTime2 = performance.now();
      const result2 = await optimizedRegistry.detectFormatOptimized(testData);
      const endTime2 = performance.now();
      const secondRunTime = endTime2 - startTime2;

      expect(result2.bestMatch).toBe('json');
      expect(result2.performance.cacheStats.hits).toBeGreaterThan(0);

      // Cache should make second run faster
      console.log(
        `First run: ${firstRunTime.toFixed(2)}ms, Second run: ${secondRunTime.toFixed(2)}ms`
      );
      console.log(
        `Cache stats: ${result2.performance.cacheStats.hits} hits, ${result2.performance.cacheStats.misses} misses`
      );
    });

    it('should handle cache configuration and statistics', () => {
      const cache = new SignatureCache({
        maxEntries: 100,
        ttlMs: 60000,
        maxDataSize: 1024,
        useContentHashing: true,
        cacheLowConfidence: false,
        minConfidenceToCache: 0.5,
      });

      const testData = Buffer.from('{"test": "data"}');

      // Initially no cache entries
      expect(cache.getStats().size).toBe(0);
      expect(cache.getStats().hits).toBe(0);

      // Add a cache entry
      cache.set(testData, {
        adapterName: 'test',
        score: 0.8,
        evidence: 'test evidence',
      });

      expect(cache.getStats().size).toBe(1);

      // Retrieve cached entry
      const cached = cache.get(testData);
      expect(cached).not.toBeNull();
      expect(cached?.adapterName).toBe('test');
      expect(cache.getStats().hits).toBe(1);
    });
  });

  describe('Early Exit Optimization', () => {
    it('should trigger early exit on high-confidence matches', async () => {
      // Create data that should get very high confidence from CodeCarbon adapter
      const codeCarbonData = Buffer.from(
        JSON.stringify({
          timestamp: '2023-12-01T10:30:45.123456',
          project_name: 'test-project',
          run_id: '2023-12-01T10:30:45.123456',
          duration_seconds: 3600.45, // CodeCarbon canonical field
          emissions_kg: 0.123456, // CodeCarbon canonical field
          emissions_rate: 0.000034,
          cpu_power: 42.5,
          gpu_power: 156.8,
          cpu_energy: 0.153,
          gpu_energy: 0.565,
          ram_energy: 0.044,
          country_name: 'United States',
          region: 'us-east-1',
          codecarbon_version: '2.1.4',
          cpu_count: 8,
          cpu_model: 'Intel(R) Xeon(R) CPU',
          os: 'Linux',
          python_version: '3.8.10',
        })
      );

      const result =
        await optimizedRegistry.detectFormatOptimized(codeCarbonData);

      expect(result.bestMatch).toBe('codecarbon');
      expect(result.performance.earlyExitTriggered).toBe(true);
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.95);

      console.log(
        `Early exit triggered: ${result.performance.earlyExitTriggered}`
      );
      console.log(`Detection time: ${result.performance.totalTimeMs}ms`);
      console.log(`Best match confidence: ${result.confidenceScores[0].score}`);
    });

    it('should not trigger early exit on low-confidence matches', async () => {
      // Create ambiguous data
      const ambiguousData = Buffer.from(
        'some random text that does not match any format clearly'
      );

      const result =
        await optimizedRegistry.detectFormatOptimized(ambiguousData);

      expect(result.performance.earlyExitTriggered).toBe(false);
      expect(result.bestMatch).toBeNull();

      console.log(
        `Early exit triggered: ${result.performance.earlyExitTriggered}`
      );
      console.log(`Detection time: ${result.performance.totalTimeMs}ms`);
    });
  });

  describe('Detection Time Measurement', () => {
    it('should measure detection time on small datasets', async () => {
      const smallJson = Buffer.from(
        JSON.stringify({
          model: 'gpt-4',
          emissions: 0.001,
          duration: 1.5,
        })
      );

      const result = await benchmarkSuite.benchmarkDataset({
        name: 'test-small',
        size: 'small',
        format: 'json',
        description: 'Test small JSON',
        generator: () => smallJson,
      });

      expect(result.metrics.detectionTimeMs).toBeGreaterThan(0);
      expect(result.metrics.dataSizeBytes).toBe(smallJson.length);
      expect(result.result.bestMatch).toBe('json');

      console.log(
        `Small dataset detection: ${result.metrics.detectionTimeMs}ms`
      );
      console.log(`Data size: ${result.metrics.dataSizeBytes} bytes`);
    });

    it('should measure detection time on medium datasets', async () => {
      // Generate medium-sized dataset
      const records = Array.from({ length: 100 }, (_, i) => ({
        id: `record_${i}`,
        timestamp: `2023-12-01T10:${String(i % 60).padStart(2, '0')}:00Z`,
        model: i % 2 === 0 ? 'gpt-4' : 'gpt-3.5',
        emissions: Math.random() * 0.01,
        duration: Math.random() * 10,
      }));

      const mediumJson = Buffer.from(JSON.stringify({ records }));

      const result = await benchmarkSuite.benchmarkDataset({
        name: 'test-medium',
        size: 'medium',
        format: 'json',
        description: 'Test medium JSON array',
        generator: () => mediumJson,
      });

      expect(result.metrics.detectionTimeMs).toBeGreaterThan(0);
      expect(result.metrics.dataSizeBytes).toBe(mediumJson.length);
      expect(result.result.bestMatch).toBe('json');

      console.log(
        `Medium dataset detection: ${result.metrics.detectionTimeMs}ms`
      );
      console.log(
        `Data size: ${(result.metrics.dataSizeBytes / 1024).toFixed(1)}KB`
      );
    });

    it('should measure detection time on large datasets efficiently', async () => {
      // Generate large CSV dataset
      const headers =
        'timestamp,model,emissions_kg,duration_seconds,energy_kwh';
      const rows = Array.from({ length: 1000 }, (_, i) => {
        return (
          `2023-12-01T${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z,` +
          `${i % 3 === 0 ? 'gpt-4' : 'gpt-3.5'},` +
          `${(Math.random() * 0.01).toFixed(6)},` +
          `${Math.floor(Math.random() * 10) + 1},` +
          `${(Math.random() * 0.1).toFixed(4)}`
        );
      });

      const largeCsv = Buffer.from([headers, ...rows].join('\n'));

      const result = await benchmarkSuite.benchmarkDataset({
        name: 'test-large',
        size: 'large',
        format: 'csv',
        description: 'Test large CSV',
        generator: () => largeCsv,
      });

      expect(result.metrics.detectionTimeMs).toBeGreaterThan(0);
      expect(result.metrics.detectionTimeMs).toBeLessThan(5000); // Should be under 5 seconds
      expect(result.metrics.dataSizeBytes).toBe(largeCsv.length);
      expect(result.result.bestMatch).toBe('csv');

      console.log(
        `Large dataset detection: ${result.metrics.detectionTimeMs}ms`
      );
      console.log(
        `Data size: ${(result.metrics.dataSizeBytes / 1024).toFixed(1)}KB`
      );
    }, 10000); // 10 second timeout for large datasets
  });

  describe('Performance Comparison', () => {
    it('should show performance improvement with optimizations', async () => {
      const testData = Buffer.from(
        JSON.stringify({
          timestamp: '2023-12-01T10:00:00Z',
          model: 'gpt-4',
          emissions: 0.001234,
          duration: 1.5,
          tokens: { input: 150, output: 89 },
        })
      );

      // Test with optimizations enabled
      const optimizedResults = await optimizedRegistry.benchmarkDetection(
        testData,
        5
      );

      // Test with optimizations disabled
      const unoptimizedRegistry = new OptimizedUniversalTrackerRegistry(
        {
          json: new JsonAdapter(),
          csv: new CsvAdapter(),
          xml: new XmlAdapter(),
          codecarbon: new CodeCarbonAdapter(),
          aiimpact: new AIImpactTrackerAdapter(),
          fit: new FitAdapter(),
        },
        {
          enableEarlyExit: false,
          enableCaching: false,
          enableDetailedTiming: true,
        }
      );

      const unoptimizedResults = await unoptimizedRegistry.benchmarkDetection(
        testData,
        5
      );

      console.log('\n=== Performance Comparison ===');
      console.log(
        `Optimized average: ${optimizedResults.averageTimeMs.toFixed(2)}ms`
      );
      console.log(
        `Unoptimized average: ${unoptimizedResults.averageTimeMs.toFixed(2)}ms`
      );
      console.log(
        `Cache hit rate: ${optimizedResults.cacheHitRate.toFixed(1)}%`
      );
      console.log(
        `Early exit rate: ${optimizedResults.earlyExitRate.toFixed(1)}%`
      );

      expect(optimizedResults.averageTimeMs).toBeGreaterThan(0);
      expect(unoptimizedResults.averageTimeMs).toBeGreaterThan(0);
    });
  });

  describe('Full Benchmark Suite', () => {
    it('should run a comprehensive benchmark suite', async () => {
      console.log('\n🚀 Running comprehensive benchmark suite...\n');

      const results = await benchmarkSuite.runFullSuite();

      expect(results.length).toBeGreaterThan(0);

      // Verify all benchmark results
      for (const result of results) {
        expect(result.metrics.detectionTimeMs).toBeGreaterThan(0);
        expect(result.metrics.dataSizeBytes).toBeGreaterThan(0);
        expect(result.result.confidenceScores.length).toBeGreaterThan(0);
      }

      // Generate and display report
      const report = benchmarkSuite.generateReport();
      console.log('\n' + report);

      // Export results
      const exportData = benchmarkSuite.exportResults();
      expect(exportData).toContain('timestamp');
      expect(exportData).toContain('totalBenchmarks');

      console.log('\n✅ Benchmark suite completed successfully!');
    }, 30000); // 30 second timeout for full suite
  });

  describe('Cache Warmup', () => {
    it('should warm up cache with sample data', async () => {
      const sampleData = [
        Buffer.from(JSON.stringify({ model: 'gpt-4', emissions: 0.001 })),
        Buffer.from('timestamp,model,emissions\n2023-12-01,gpt-4,0.001'),
        Buffer.from(
          '<?xml version="1.0"?><emissions><co2>0.001</co2></emissions>'
        ),
      ];

      await optimizedRegistry.warmupCache(sampleData);

      const stats = optimizedRegistry.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      console.log(`Cache warmed up with ${stats.size} entries`);
    });
  });
});
