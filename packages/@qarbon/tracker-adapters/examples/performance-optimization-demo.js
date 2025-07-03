/**
 * Performance Optimization Demo
 *
 * Demonstrates the key optimization features:
 * 1. Detection time measurement on various dataset sizes
 * 2. Early-exit checks for high-confidence hits
 * 3. Signature caching to avoid double parsing
 */

import {
  OptimizedUniversalTrackerRegistry,
  BenchmarkSuite,
  JsonAdapter,
  CsvAdapter,
  XmlAdapter,
  CodeCarbonAdapter,
  AIImpactTrackerAdapter,
  FitAdapter,
} from '../src/index.js';

console.log('🚀 Performance Optimization Demo\n');

// Create optimized registry with all performance features enabled
const optimizedRegistry = new OptimizedUniversalTrackerRegistry(
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

// Demo 1: Early Exit Optimization
console.log('=== Demo 1: Early Exit Optimization ===');

const highConfidenceData = Buffer.from(
  JSON.stringify({
    duration_seconds: 3600.45,
    emissions_kg: 0.123456,
    project_name: 'demo-project',
    codecarbon_version: '2.1.4',
    cpu_energy: 0.153,
    gpu_energy: 0.565,
    country_name: 'United States',
  })
);

try {
  const result =
    await optimizedRegistry.detectFormatOptimized(highConfidenceData);

  console.log(`✅ Best match: ${result.bestMatch}`);
  console.log(
    `⚡ Early exit triggered: ${result.performance.earlyExitTriggered}`
  );
  console.log(`⏱️  Detection time: ${result.performance.totalTimeMs}ms`);
  console.log(
    `🎯 Confidence score: ${result.confidenceScores[0].score.toFixed(3)}`
  );
  console.log();
} catch (error) {
  console.error('❌ Error in Demo 1:', error.message);
}

// Demo 2: Caching Benefit
console.log('=== Demo 2: Caching Benefit ===');

const sampleData = Buffer.from(
  JSON.stringify({
    model: 'gpt-4',
    emissions: 0.001234,
    duration: 1.5,
    tokens: { input: 150, output: 89 },
  })
);

try {
  // Clear cache and measure first run (cold)
  optimizedRegistry.clearCache();
  const start1 = performance.now();
  const result1 = await optimizedRegistry.detectFormatOptimized(sampleData);
  const end1 = performance.now();
  const coldTime = end1 - start1;

  // Second run should benefit from cache (warm)
  const start2 = performance.now();
  const result2 = await optimizedRegistry.detectFormatOptimized(sampleData);
  const end2 = performance.now();
  const warmTime = end2 - start2;

  console.log(
    `❄️  Cold run: ${coldTime.toFixed(2)}ms (cache misses: ${result1.performance.cacheStats.misses})`
  );
  console.log(
    `🔥 Warm run: ${warmTime.toFixed(2)}ms (cache hits: ${result2.performance.cacheStats.hits})`
  );
  console.log(
    `🚀 Speed improvement: ${(((coldTime - warmTime) / coldTime) * 100).toFixed(1)}%`
  );
  console.log();
} catch (error) {
  console.error('❌ Error in Demo 2:', error.message);
}

// Demo 3: Benchmark Suite
console.log('=== Demo 3: Performance Benchmarking ===');

const benchmarkSuite = new BenchmarkSuite(optimizedRegistry);

try {
  // Run a quick subset of benchmarks
  const smallJson = {
    name: 'demo-small-json',
    size: 'small',
    format: 'json',
    description: 'Small JSON demo',
    generator: () =>
      Buffer.from(
        JSON.stringify({
          timestamp: '2023-12-01T10:00:00Z',
          model: 'gpt-4',
          emissions: 0.001,
          duration: 1.5,
        })
      ),
  };

  const mediumCsv = {
    name: 'demo-medium-csv',
    size: 'medium',
    format: 'csv',
    description: 'Medium CSV demo',
    generator: () => {
      const headers = 'timestamp,model,emissions_kg,duration_seconds';
      const rows = Array.from(
        { length: 50 },
        (_, i) =>
          `2023-12-01T10:${String(i).padStart(2, '0')}:00Z,gpt-4,${(Math.random() * 0.01).toFixed(6)},${i * 2}`
      );
      return Buffer.from([headers, ...rows].join('\n'));
    },
  };

  // Benchmark individual datasets
  console.log('📊 Running individual benchmarks...');

  const result1 = await benchmarkSuite.benchmarkDataset(smallJson);
  console.log(
    `  ${result1.config.description}: ${result1.metrics.detectionTimeMs}ms (${result1.result.bestMatch})`
  );

  const result2 = await benchmarkSuite.benchmarkDataset(mediumCsv);
  console.log(
    `  ${result2.config.description}: ${result2.metrics.detectionTimeMs}ms (${result2.result.bestMatch})`
  );

  console.log();
} catch (error) {
  console.error('❌ Error in Demo 3:', error.message);
}

// Demo 4: Performance Comparison
console.log('=== Demo 4: Optimized vs Unoptimized Performance ===');

try {
  const testData = Buffer.from(
    JSON.stringify({
      duration_seconds: 1800,
      emissions_kg: 0.0456,
      project_name: 'benchmark-test',
    })
  );

  // Test optimized version
  const optimizedResults = await optimizedRegistry.benchmarkDetection(
    testData,
    3
  );

  // Test unoptimized version
  const unoptimizedRegistry = new OptimizedUniversalTrackerRegistry(
    {
      json: new JsonAdapter(),
      csv: new CsvAdapter(),
      codecarbon: new CodeCarbonAdapter(),
    },
    {
      enableEarlyExit: false,
      enableCaching: false,
      enableDetailedTiming: false,
    }
  );

  const unoptimizedResults = await unoptimizedRegistry.benchmarkDetection(
    testData,
    3
  );

  console.log(
    `🚀 Optimized average: ${optimizedResults.averageTimeMs.toFixed(2)}ms`
  );
  console.log(
    `🐌 Unoptimized average: ${unoptimizedResults.averageTimeMs.toFixed(2)}ms`
  );
  console.log(
    `📈 Performance gain: ${(((unoptimizedResults.averageTimeMs - optimizedResults.averageTimeMs) / unoptimizedResults.averageTimeMs) * 100).toFixed(1)}%`
  );
  console.log(
    `⚡ Early exit rate: ${optimizedResults.earlyExitRate.toFixed(1)}%`
  );
  console.log(
    `🗄️  Cache hit rate: ${optimizedResults.cacheHitRate.toFixed(1)}%`
  );
} catch (error) {
  console.error('❌ Error in Demo 4:', error.message);
}

console.log('\n✨ Demo completed! The optimizations include:');
console.log('  • Early exit when confidence threshold (95%) is reached');
console.log('  • Signature caching to avoid redundant parsing');
console.log('  • Detailed performance metrics and timing');
console.log('  • Comprehensive benchmarking tools');
