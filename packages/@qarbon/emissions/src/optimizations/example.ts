/**
 * Example usage of the optimizations module
 */

import {
  batchCalculator,
  StreamingCalculator,
  emissionFactorCache,
  featureFlags,
  logParsers,
  createStreamingPipeline,
  EmissionInput,
} from './index';

/**
 * Example 1: Batch calculation with different optimization levels
 */
async function exampleBatchCalculation() {
  console.log('🚀 Example 1: Batch Calculation');

  // Generate sample data
  const inputs: EmissionInput[] = [];

  // Transport emissions
  for (let i = 0; i < 500; i++) {
    inputs.push({
      id: `transport_${i}`,
      category: 'transport',
      type: 'car',
      value: Math.random() * 100, // km
      region: 'us-east-1',
    });
  }

  // AI emissions
  for (let i = 0; i < 300; i++) {
    inputs.push({
      id: `ai_${i}`,
      category: 'ai',
      type: 'inference',
      value: Math.random() * 1000, // tokens
      model: 'gpt-4',
      region: 'us-west-2',
    });
  }

  // Energy emissions
  for (let i = 0; i < 200; i++) {
    inputs.push({
      id: `energy_${i}`,
      category: 'energy',
      type: 'grid',
      value: Math.random() * 50, // kWh
      region: 'eu-west-1',
    });
  }

  console.log(`📊 Processing ${inputs.length} emission inputs...`);

  // Run batch calculation
  const startTime = performance.now();
  const { results, metrics } = await batchCalculator.calculateBatch(inputs, {
    useWasm: true,
    useSIMD: true,
    useCache: true,
  });
  const endTime = performance.now();

  console.log('✅ Batch calculation complete!');
  console.log('📈 Results:');
  console.log(`  - Total inputs: ${metrics.totalInputs}`);
  console.log(`  - Processed: ${metrics.processedInputs}`);
  console.log(`  - Failed: ${metrics.failedInputs}`);
  console.log(`  - Processing time: ${metrics.processingTime.toFixed(2)}ms`);
  console.log(`  - Total time: ${(endTime - startTime).toFixed(2)}ms`);
  console.log(
    `  - Throughput: ${(metrics.totalInputs / (metrics.processingTime / 1000)).toFixed(0)} inputs/sec`
  );
  console.log(`  - Used WASM: ${metrics.useWasm}`);
  console.log(`  - Used SIMD: ${metrics.useSIMD}`);
  console.log(`  - Cache hits: ${metrics.cacheHits}`);
  console.log(`  - Cache misses: ${metrics.cacheMisses}`);
  console.log(
    `  - Cache hit rate: ${((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(1)}%`
  );

  // Show sample results
  console.log('📋 Sample results:');
  results.slice(0, 5).forEach(result => {
    console.log(`  - ${result.category}: ${result.amount} ${result.unit} CO2e`);
  });

  return { results, metrics };
}

/**
 * Example 2: Streaming calculation pipeline
 */
async function exampleStreamingCalculation() {
  console.log('\n🌊 Example 2: Streaming Calculation');

  return new Promise<void>(resolve => {
    // Create streaming calculator
    const streamingCalculator = new StreamingCalculator({
      batchSize: 50,
      features: featureFlags.getFlags(),
    });

    let resultCount = 0;
    let totalEmissions = 0;

    // Handle results
    streamingCalculator.on('data', result => {
      resultCount++;
      totalEmissions += result.amount;

      if (resultCount <= 5) {
        console.log(
          `📝 Result ${resultCount}: ${result.category} = ${result.amount} ${result.unit}`
        );
      }

      if (resultCount === 100) {
        console.log('✅ Streaming complete!');
        console.log(`📊 Processed ${resultCount} results`);
        console.log(`🌍 Total emissions: ${totalEmissions.toFixed(2)} units`);

        const metrics = streamingCalculator.getMetrics();
        console.log(
          `⚡ Processing time: ${metrics.processingTime.toFixed(2)}ms`
        );
        console.log(
          `🎯 Throughput: ${(metrics.totalInputs / (metrics.processingTime / 1000)).toFixed(0)} inputs/sec`
        );

        resolve();
      }
    });

    streamingCalculator.on('error', error => {
      console.error('❌ Streaming error:', error);
      resolve();
    });

    // Generate and send data
    console.log('📤 Sending streaming data...');

    const generateInput = (id: number): EmissionInput => {
      const categories = ['transport', 'energy', 'ai'];
      const types = {
        transport: ['car', 'train', 'plane'],
        energy: ['grid', 'renewable', 'fossil'],
        ai: ['inference'],
      };

      const category = categories[
        Math.floor(Math.random() * categories.length)
      ] as any;
      const type =
        types[category][Math.floor(Math.random() * types[category].length)];

      return {
        id: `stream_${id}`,
        category,
        type,
        value: Math.random() * 100,
        model: category === 'ai' ? 'gpt-4' : undefined,
        region: 'global',
      };
    };

    // Send inputs over time to simulate real streaming
    let inputCount = 0;
    const interval = setInterval(() => {
      const batch = [];
      for (let i = 0; i < 10; i++) {
        batch.push(generateInput(inputCount++));
      }

      streamingCalculator.write(batch);

      if (inputCount >= 100) {
        clearInterval(interval);
        streamingCalculator.end();
      }
    }, 10);
  });
}

/**
 * Example 3: Cache performance demonstration
 */
async function exampleCachePerformance() {
  console.log('\n💾 Example 3: Cache Performance');

  // Clear cache for clean test
  emissionFactorCache.clear();

  const testInputs: EmissionInput[] = [];
  const models = ['gpt-4', 'gpt-3.5', 'claude-2', 'gemini-pro'];
  const regions = ['us-east-1', 'us-west-2', 'eu-west-1'];

  // Create inputs with repeated model/region combinations
  for (let i = 0; i < 1000; i++) {
    testInputs.push({
      id: `cache_test_${i}`,
      category: 'ai',
      type: 'inference',
      value: Math.random() * 1000,
      model: models[i % models.length],
      region: regions[i % regions.length],
    });
  }

  console.log('🔍 Testing cache performance...');

  // First run - cache misses
  console.log('📊 First run (cold cache):');
  const { metrics: coldMetrics } =
    await batchCalculator.calculateBatch(testInputs);
  console.log(`  - Cache hits: ${coldMetrics.cacheHits}`);
  console.log(`  - Cache misses: ${coldMetrics.cacheMisses}`);
  console.log(
    `  - Processing time: ${coldMetrics.processingTime.toFixed(2)}ms`
  );

  // Reset metrics but keep cache
  batchCalculator.resetMetrics();

  // Second run - cache hits
  console.log('📊 Second run (warm cache):');
  const { metrics: warmMetrics } =
    await batchCalculator.calculateBatch(testInputs);
  console.log(`  - Cache hits: ${warmMetrics.cacheHits}`);
  console.log(`  - Cache misses: ${warmMetrics.cacheMisses}`);
  console.log(
    `  - Processing time: ${warmMetrics.processingTime.toFixed(2)}ms`
  );

  const speedup = coldMetrics.processingTime / warmMetrics.processingTime;
  console.log(`🚀 Cache speedup: ${speedup.toFixed(2)}x`);

  // Cache statistics
  const cacheStats = emissionFactorCache.getStats();
  console.log('📈 Cache statistics:');
  console.log(`  - Size: ${cacheStats.size}/${cacheStats.capacity}`);
  console.log(`  - Hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
}

/**
 * Example 4: Feature flags configuration
 */
function exampleFeatureFlags() {
  console.log('\n🏁 Example 4: Feature Flags Configuration');

  // Show current flags
  const currentFlags = featureFlags.getFlags();
  console.log('📋 Current feature flags:');
  Object.entries(currentFlags).forEach(([key, value]) => {
    console.log(`  - ${key}: ${value}`);
  });

  // Create scoped configuration
  const testScope = featureFlags.createScope({
    enableWasmCalculations: false,
    wasmBatchThreshold: 2000,
  });

  console.log('🔧 Test scope flags:');
  const scopedFlags = testScope.getFlags();
  console.log(
    `  - enableWasmCalculations: ${scopedFlags.enableWasmCalculations}`
  );
  console.log(`  - wasmBatchThreshold: ${scopedFlags.wasmBatchThreshold}`);

  // Test feature checks
  console.log('✅ Feature checks:');
  console.log(
    `  - WASM enabled: ${featureFlags.isEnabled('enableWasmCalculations')}`
  );
  console.log(
    `  - SIMD enabled: ${featureFlags.isEnabled('enableSIMDOperations')}`
  );
  console.log(`  - Cache enabled: ${featureFlags.isEnabled('enableCache')}`);
  console.log(
    `  - WASM threshold: ${featureFlags.getValue('wasmBatchThreshold')}`
  );
}

/**
 * Example 5: Log parsing demonstration
 */
function exampleLogParsing() {
  console.log('\n📄 Example 5: Log Parsing');

  const sampleLogs = [
    '{"category":"ai","type":"inference","value":1500,"model":"gpt-4","region":"us-east-1"}',
    'transport,car,50.5,km,,us-west-2',
    '2024-01-01T12:00:00Z [AI] model=claude-2 tokens=2000 region=eu-west-1',
    'energy,grid,25.3,kWh,,global',
  ];

  const parsers = [
    { name: 'JSON', parser: logParsers.json },
    { name: 'CSV', parser: logParsers.csv },
    { name: 'AI Usage', parser: logParsers.aiUsage },
    { name: 'CSV', parser: logParsers.csv },
  ];

  console.log('🔍 Parsing sample logs:');
  sampleLogs.forEach((log, index) => {
    const parser = parsers[index];
    const result = parser.parser(log);

    console.log(`  ${parser.name}: "${log}"`);
    if (result) {
      console.log(
        `    → ${result.category}/${result.type}: ${result.value} (${result.model || 'N/A'})`
      );
    } else {
      console.log(`    → Failed to parse`);
    }
  });
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🎯 Qarbon Emissions Optimizations Examples\n');

  try {
    await exampleBatchCalculation();
    await exampleStreamingCalculation();
    await exampleCachePerformance();
    exampleFeatureFlags();
    exampleLogParsing();

    console.log('\n🎉 All examples completed successfully!');
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  exampleBatchCalculation,
  exampleStreamingCalculation,
  exampleCachePerformance,
  exampleFeatureFlags,
  exampleLogParsing,
  runAllExamples,
};
