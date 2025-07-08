/**
 * Batch Processing Example
 *
 * This example demonstrates efficient batch processing of emissions calculations
 * for large datasets, including performance optimization techniques.
 */

const { EmissionsCalculator } = require('@qarbon/emissions');

// Generate sample batch data for different calculation types
function generateBatchData(size = 100) {
  const batchData = [];
  const types = ['digital', 'ai', 'transport', 'energy'];
  const models = ['gpt-4', 'gpt-3.5-turbo', 'claude-2'];
  const deviceTypes = ['mobile', 'desktop', 'tablet'];
  const transportModes = ['car', 'train', 'plane', 'bus'];
  const energySources = ['grid', 'renewable', 'fossil'];

  for (let i = 0; i < size; i++) {
    const type = types[Math.floor(Math.random() * types.length)];

    let input;
    switch (type) {
      case 'digital':
        input = {
          type: 'digital',
          dataTransfer: Math.random() * 500 + 50, // 50-550 MB
          timeSpent: Math.random() * 120 + 5, // 5-125 minutes
          deviceType:
            deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
        };
        break;

      case 'ai':
        input = {
          type: 'ai',
          tokens: Math.floor(Math.random() * 3000) + 100, // 100-3100 tokens
          model: models[Math.floor(Math.random() * models.length)],
        };
        break;

      case 'transport':
        input = {
          type: 'transport',
          distance: Math.random() * 200 + 10, // 10-210 km
          mode: transportModes[
            Math.floor(Math.random() * transportModes.length)
          ],
        };
        break;

      case 'energy':
        input = {
          type: 'energy',
          consumption: Math.random() * 100 + 5, // 5-105 kWh
          source:
            energySources[Math.floor(Math.random() * energySources.length)],
        };
        break;
    }

    batchData.push({
      id: `batch_item_${i + 1}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random time in last 24h
      ...input,
    });
  }

  return batchData;
}

async function demonstrateBatchProcessing() {
  console.log('⚡ Batch Processing Example');
  console.log('==========================\n');

  const calculator = new EmissionsCalculator({
    enableOptimizations: true,
    enableUncertainty: false, // Disable for faster batch processing
  });

  // Example 1: Small batch processing
  console.log('📦 Example 1: Small Batch (10 items)');
  console.log('------------------------------------');

  try {
    const smallBatch = generateBatchData(10);
    console.log(`Generated ${smallBatch.length} calculation inputs:`);

    // Show sample of batch data
    smallBatch.slice(0, 3).forEach((item, index) => {
      console.log(
        `  ${index + 1}. ${item.type}: ${JSON.stringify(item, null, 2).replace(/\n/g, ' ')}`
      );
    });
    console.log('  ...\n');

    const smallBatchStartTime = performance.now();
    const smallBatchResults = await calculator.calculate(smallBatch, {
      region: 'US-WEST-1',
      batchSize: 5,
    });
    const smallBatchEndTime = performance.now();

    const processingTime = smallBatchEndTime - smallBatchStartTime;
    console.log(`✅ Small batch processed in ${processingTime.toFixed(2)}ms`);
    console.log(`   Results: ${smallBatchResults.length} calculations`);
    console.log(
      `   Average time per item: ${(processingTime / smallBatch.length).toFixed(2)}ms`
    );
    console.log(
      `   Throughput: ${((smallBatch.length / processingTime) * 1000).toFixed(1)} calculations/second\n`
    );

    // Show sample results
    console.log('📊 Sample Results:');
    smallBatchResults.slice(0, 3).forEach((result, index) => {
      const item = smallBatch[index];
      console.log(
        `  ${item.id}: ${result.data.amount} ${result.data.unit} CO2 (${result.processingTime.toFixed(2)}ms)`
      );
    });
    console.log('');
  } catch (error) {
    console.error('❌ Small batch processing error:', error.message);
  }

  // Example 2: Large batch processing with optimization
  console.log('🚀 Example 2: Large Batch (500 items)');
  console.log('-------------------------------------');

  try {
    const largeBatch = generateBatchData(500);
    console.log(`Generated ${largeBatch.length} calculation inputs\n`);

    // Process with different batch sizes to show optimization
    const batchSizes = [50, 100, 200];
    const performanceResults = [];

    for (const batchSize of batchSizes) {
      console.log(`🔧 Testing with batch size: ${batchSize}`);

      const startTime = performance.now();
      const results = await calculator.calculate(largeBatch, {
        region: 'US-WEST-1',
        batchSize: batchSize,
        useOptimizations: true,
      });
      const endTime = performance.now();

      const processingTime = endTime - startTime;
      const throughput = (largeBatch.length / processingTime) * 1000;

      performanceResults.push({
        batchSize,
        processingTime,
        throughput,
        resultsCount: results.length,
      });

      console.log(`   Time: ${processingTime.toFixed(2)}ms`);
      console.log(
        `   Throughput: ${throughput.toFixed(1)} calculations/second`
      );
      console.log(`   Results: ${results.length} calculations\n`);
    }

    // Show performance comparison
    console.log('📈 Performance Comparison:');
    performanceResults.forEach(result => {
      console.log(
        `   Batch size ${result.batchSize}: ${result.throughput.toFixed(1)} calc/sec`
      );
    });

    const bestPerformance = performanceResults.reduce((best, current) =>
      current.throughput > best.throughput ? current : best
    );
    console.log(
      `   🏆 Best performance: Batch size ${bestPerformance.batchSize} (${bestPerformance.throughput.toFixed(1)} calc/sec)\n`
    );
  } catch (error) {
    console.error('❌ Large batch processing error:', error.message);
  }

  // Example 3: Mixed type batch analysis
  console.log('🔍 Example 3: Mixed Type Batch Analysis');
  console.log('--------------------------------------');

  try {
    const mixedBatch = generateBatchData(100);

    console.log('📊 Analyzing batch composition...');
    const typeDistribution = {};
    mixedBatch.forEach(item => {
      typeDistribution[item.type] = (typeDistribution[item.type] || 0) + 1;
    });

    console.log('   Type distribution:');
    Object.entries(typeDistribution).forEach(([type, count]) => {
      console.log(
        `     ${type}: ${count} items (${((count / mixedBatch.length) * 100).toFixed(1)}%)`
      );
    });
    console.log('');

    const mixedBatchStartTime = performance.now();
    const mixedResults = await calculator.calculate(mixedBatch, {
      region: 'EU-WEST-1',
      batchSize: 25,
    });
    const mixedBatchEndTime = performance.now();

    // Analyze results by type
    const resultsByType = {};
    const totalEmissionsByType = {};

    mixedResults.forEach((result, index) => {
      const item = mixedBatch[index];
      const type = item.type;

      if (!resultsByType[type]) {
        resultsByType[type] = [];
        totalEmissionsByType[type] = 0;
      }

      resultsByType[type].push(result);
      totalEmissionsByType[type] += result.data.amount;
    });

    console.log('📈 Results Analysis:');
    Object.entries(resultsByType).forEach(([type, results]) => {
      const avg = totalEmissionsByType[type] / results.length;
      const min = Math.min(...results.map(r => r.data.amount));
      const max = Math.max(...results.map(r => r.data.amount));

      console.log(`   ${type} (${results.length} items):`);
      console.log(
        `     Total: ${totalEmissionsByType[type].toFixed(3)} ${results[0].data.unit} CO2`
      );
      console.log(
        `     Average: ${avg.toFixed(3)} ${results[0].data.unit} CO2`
      );
      console.log(
        `     Range: ${min.toFixed(3)} - ${max.toFixed(3)} ${results[0].data.unit}`
      );
    });

    const totalProcessingTime = mixedBatchEndTime - mixedBatchStartTime;
    console.log(`\n⚡ Total processing: ${totalProcessingTime.toFixed(2)}ms`);
    console.log(
      `   Throughput: ${((mixedBatch.length / totalProcessingTime) * 1000).toFixed(1)} calculations/second\n`
    );
  } catch (error) {
    console.error('❌ Mixed batch analysis error:', error.message);
  }

  // Example 4: Streaming batch processing simulation
  console.log('🌊 Example 4: Streaming Batch Processing');
  console.log('---------------------------------------');

  await simulateStreamingBatchProcessing(calculator);

  // Example 5: Memory-efficient processing for very large datasets
  console.log('💾 Example 5: Memory-Efficient Large Dataset');
  console.log('--------------------------------------------');

  await demonstrateMemoryEfficientProcessing(calculator);

  console.log('\n✅ Batch processing demonstration complete!');
}

async function simulateStreamingBatchProcessing(calculator) {
  console.log('🎬 Simulating streaming batch processing...\n');

  const streamBatchSize = 20;
  const numberOfBatches = 5;

  let totalProcessed = 0;
  let totalProcessingTime = 0;
  let allResults = [];

  for (let batchIndex = 0; batchIndex < numberOfBatches; batchIndex++) {
    console.log(
      `📦 Processing stream batch ${batchIndex + 1}/${numberOfBatches}...`
    );

    // Generate streaming batch data
    const streamBatch = generateBatchData(streamBatchSize);

    const batchStartTime = performance.now();
    const batchResults = await calculator.calculate(streamBatch, {
      region: 'US-EAST-1',
      batchSize: 10,
    });
    const batchEndTime = performance.now();

    const batchProcessingTime = batchEndTime - batchStartTime;
    totalProcessingTime += batchProcessingTime;
    totalProcessed += streamBatch.length;
    allResults = allResults.concat(batchResults);

    console.log(
      `   ✅ Batch ${batchIndex + 1}: ${batchResults.length} items in ${batchProcessingTime.toFixed(2)}ms`
    );

    // Simulate network/processing delay between batches
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log(`\n📊 Streaming Processing Summary:`);
  console.log(`   Total items processed: ${totalProcessed}`);
  console.log(`   Total processing time: ${totalProcessingTime.toFixed(2)}ms`);
  console.log(
    `   Average throughput: ${((totalProcessed / totalProcessingTime) * 1000).toFixed(1)} calculations/second`
  );
  console.log(`   Total results: ${allResults.length}\n`);
}

async function demonstrateMemoryEfficientProcessing(calculator) {
  console.log(
    '🎬 Demonstrating memory-efficient processing for large datasets...\n'
  );

  const largeDatasetSize = 1000;
  const chunkSize = 100;

  console.log(
    `📊 Processing ${largeDatasetSize} items in chunks of ${chunkSize}...`
  );

  let totalProcessed = 0;
  let totalEmissions = 0;
  let totalProcessingTime = 0;

  const chunks = Math.ceil(largeDatasetSize / chunkSize);

  for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
    const startIndex = chunkIndex * chunkSize;
    const endIndex = Math.min(startIndex + chunkSize, largeDatasetSize);
    const currentChunkSize = endIndex - startIndex;

    console.log(
      `   🔄 Processing chunk ${chunkIndex + 1}/${chunks} (items ${startIndex + 1}-${endIndex})...`
    );

    // Generate chunk data
    const chunkData = generateBatchData(currentChunkSize);

    const chunkStartTime = performance.now();
    const chunkResults = await calculator.calculate(chunkData, {
      region: 'EU-CENTRAL-1',
      batchSize: 50,
      useOptimizations: true,
    });
    const chunkEndTime = performance.now();

    const chunkProcessingTime = chunkEndTime - chunkStartTime;
    totalProcessingTime += chunkProcessingTime;
    totalProcessed += currentChunkSize;

    // Aggregate emissions from chunk
    const chunkEmissions = chunkResults.reduce(
      (sum, result) => sum + result.data.amount,
      0
    );
    totalEmissions += chunkEmissions;

    console.log(
      `      ✅ ${chunkResults.length} items processed in ${chunkProcessingTime.toFixed(2)}ms`
    );
    console.log(`      📈 Chunk emissions: ${chunkEmissions.toFixed(3)}g CO2`);

    // Simulate memory cleanup (in real scenarios, you'd process and discard results)
    // This prevents memory buildup for very large datasets
    if (chunkIndex % 5 === 4) {
      // Every 5 chunks
      console.log(`      🧹 Memory cleanup simulation...`);
      // In real implementation: write results to file/database and clear memory
    }
  }

  console.log(`\n📈 Memory-Efficient Processing Summary:`);
  console.log(`   Total items processed: ${totalProcessed.toLocaleString()}`);
  console.log(`   Total processing time: ${totalProcessingTime.toFixed(2)}ms`);
  console.log(
    `   Average throughput: ${((totalProcessed / totalProcessingTime) * 1000).toFixed(1)} calculations/second`
  );
  console.log(`   Total emissions: ${totalEmissions.toFixed(3)}g CO2`);
  console.log(`   Memory efficiency: Processing in ${chunkSize}-item chunks`);
  console.log('');
}

// Utility function to benchmark different batch sizes
async function benchmarkBatchSizes(
  calculator,
  testData,
  batchSizes = [10, 25, 50, 100, 200]
) {
  console.log('🔬 Benchmarking different batch sizes...\n');

  const benchmarkResults = [];

  for (const batchSize of batchSizes) {
    console.log(`Testing batch size: ${batchSize}`);

    const iterations = 3; // Run multiple times for more accurate results
    const iterationTimes = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const results = await calculator.calculate(testData, {
        batchSize: batchSize,
        region: 'US-WEST-1',
      });
      const endTime = performance.now();

      iterationTimes.push(endTime - startTime);
    }

    const avgTime =
      iterationTimes.reduce((sum, time) => sum + time, 0) / iterations;
    const throughput = (testData.length / avgTime) * 1000;

    benchmarkResults.push({
      batchSize,
      avgTime,
      throughput,
      iterations,
    });

    console.log(`   Average time: ${avgTime.toFixed(2)}ms`);
    console.log(`   Throughput: ${throughput.toFixed(1)} calc/sec\n`);
  }

  return benchmarkResults;
}

// Utility function to generate results summary
function generateBatchSummary(results, processingTime) {
  const totalEmissions = results.reduce(
    (sum, result) => sum + result.data.amount,
    0
  );
  const avgEmissions = totalEmissions / results.length;
  const minEmissions = Math.min(...results.map(r => r.data.amount));
  const maxEmissions = Math.max(...results.map(r => r.data.amount));

  return {
    totalItems: results.length,
    processingTime: processingTime,
    throughput: (results.length / processingTime) * 1000,
    emissions: {
      total: totalEmissions,
      average: avgEmissions,
      min: minEmissions,
      max: maxEmissions,
      unit: results[0]?.data.unit || 'g',
    },
  };
}

// Example of using utility functions
async function demonstrateUtilityFunctions() {
  console.log('\n🔧 Utility Functions Demo');
  console.log('-------------------------');

  const calculator = new EmissionsCalculator();
  const testData = generateBatchData(50);

  // Benchmark different batch sizes
  const benchmarkResults = await benchmarkBatchSizes(
    calculator,
    testData,
    [10, 25, 50]
  );
  console.log('📊 Benchmark results:', benchmarkResults);

  // Generate summary for a batch
  const startTime = performance.now();
  const results = await calculator.calculate(testData.slice(0, 10));
  const endTime = performance.now();

  const summary = generateBatchSummary(results, endTime - startTime);
  console.log('📈 Batch summary:', summary);
}

// Run the example
if (require.main === module) {
  demonstrateBatchProcessing()
    .then(() => demonstrateUtilityFunctions())
    .catch(console.error);
}

module.exports = {
  demonstrateBatchProcessing,
  generateBatchData,
  simulateStreamingBatchProcessing,
  demonstrateMemoryEfficientProcessing,
  benchmarkBatchSizes,
  generateBatchSummary,
};
