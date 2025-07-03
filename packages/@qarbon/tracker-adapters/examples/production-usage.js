/**
 * Production Usage Examples for Enhanced detectFormat API
 *
 * This example demonstrates real-world usage patterns for the new detectFormat API,
 * including error handling, performance optimization, and migration strategies.
 */

import { UniversalTrackerRegistry } from '../src/index.js';
import { createReadStream } from 'fs';
import { pipeline, Transform } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

// Create registry with default adapters
const registry = new UniversalTrackerRegistry();

/**
 * Example 1: Confidence-based decision making
 * Use confidence scores to make intelligent processing decisions
 */
async function intelligentProcessing(data) {
  try {
    const buffer = Buffer.from(data);
    const result = await registry.detectFormat(buffer);

    const highConfidence = result.confidenceScores[0]?.score || 0;

    if (result.bestMatch && highConfidence > 0.8) {
      console.log(
        `✅ High confidence detection (${highConfidence.toFixed(3)}): ${result.bestMatch}`
      );
      return registry.ingest(data);
    } else if (result.bestMatch && highConfidence > 0.5) {
      console.log(
        `⚠️  Medium confidence detection (${highConfidence.toFixed(3)}): ${result.bestMatch}`
      );
      console.log('💡 Consider manual verification for critical data');
      return registry.ingest(data);
    } else if (result.bestMatch) {
      console.log(
        `❌ Low confidence detection (${highConfidence.toFixed(3)}): ${result.bestMatch}`
      );
      console.log('🔍 Evidence:', result.confidenceScores[0].evidence);
      throw new Error('Data quality too low for automatic processing');
    } else {
      console.log('❌ No format detected');
      console.log('🔍 Reasons:');
      result.confidenceScores.forEach(score => {
        console.log(`   ${score.adapterName}: ${score.evidence}`);
      });
      throw new Error('Unknown data format');
    }
  } catch (error) {
    console.error('Processing failed:', error.message);
    throw error;
  }
}

/**
 * Example 2: Stream processing for large files
 * Efficiently process large data files using streams
 */
async function processLargeFile(filePath) {
  try {
    console.log(`📁 Processing file: ${filePath}`);

    // Detect format from file stream
    const detectionStream = createReadStream(filePath);
    const result = await registry.detectFormat(detectionStream);

    console.log(`📊 Detected format: ${result.bestMatch}`);
    console.log(
      `🎯 Confidence: ${result.confidenceScores[0]?.score.toFixed(3) || 0}`
    );

    if (!result.bestMatch) {
      throw new Error('Could not detect file format');
    }

    // Process the file content
    const processStream = createReadStream(filePath);
    const results = [];

    await pipelineAsync(
      processStream,
      new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          try {
            // For demo, we'll just collect chunks
            // In production, you'd process based on detected format
            results.push(chunk.toString());
            callback();
          } catch (error) {
            callback(error);
          }
        },
      })
    );

    console.log(`✅ Processed ${results.length} chunks`);
    return { format: result.bestMatch, chunks: results.length };
  } catch (error) {
    console.error(`❌ File processing failed: ${error.message}`);
    throw error;
  }
}

/**
 * Example 3: Batch processing with parallel detection
 * Process multiple data sources efficiently
 */
async function batchProcess(dataSources) {
  console.log(`🔄 Processing ${dataSources.length} data sources...`);

  // Run detection in parallel for all sources
  const detectionPromises = dataSources.map(async (data, index) => {
    try {
      const buffer = Buffer.from(JSON.stringify(data));
      const result = await registry.detectFormat(buffer);

      return {
        index,
        data,
        result,
        status: 'detected',
        confidence: result.confidenceScores[0]?.score || 0,
      };
    } catch (error) {
      return {
        index,
        data,
        status: 'error',
        error: error.message,
        confidence: 0,
      };
    }
  });

  const results = await Promise.all(detectionPromises);

  // Analyze results
  const detected = results.filter(
    r => r.status === 'detected' && r.result.bestMatch
  );
  const highConfidence = detected.filter(r => r.confidence > 0.8);
  const lowConfidence = detected.filter(r => r.confidence <= 0.5);
  const failed = results.filter(
    r => r.status === 'error' || !r.result?.bestMatch
  );

  console.log(`📈 Batch processing results:`);
  console.log(`   ✅ Detected: ${detected.length}/${dataSources.length}`);
  console.log(`   🎯 High confidence: ${highConfidence.length}`);
  console.log(`   ⚠️  Low confidence: ${lowConfidence.length}`);
  console.log(`   ❌ Failed: ${failed.length}`);

  return { detected, highConfidence, lowConfidence, failed };
}

/**
 * Example 4: Migration wrapper function
 * Maintain backward compatibility while using enhanced features
 */
function createMigrationWrapper(registry) {
  return {
    // Legacy method (unchanged behavior)
    detectFormat: data => registry.detectFormat(data),

    // Enhanced method with confidence
    detectFormatWithConfidence: async data => {
      const buffer = Buffer.isBuffer(data)
        ? data
        : Buffer.from(JSON.stringify(data));
      const result = await registry.detectFormat(buffer);

      return {
        format: result.bestMatch,
        confidence: result.confidenceScores[0]?.score || 0,
        evidence:
          result.confidenceScores[0]?.evidence || 'No evidence available',
        allScores: result.confidenceScores,
      };
    },

    // Safe processing with confidence threshold
    safeIngest: async (data, minConfidence = 0.6) => {
      const enhanced = await exports.detectFormatWithConfidence(data);

      if (!enhanced.format) {
        throw new Error(`No format detected. Evidence: ${enhanced.evidence}`);
      }

      if (enhanced.confidence < minConfidence) {
        throw new Error(
          `Confidence too low: ${enhanced.confidence.toFixed(3)} < ${minConfidence}`
        );
      }

      return registry.ingest(Buffer.isBuffer(data) ? data.toString() : data);
    },
  };
}

/**
 * Example 5: Performance monitoring
 * Monitor detection performance and optimize accordingly
 */
async function performanceMonitor(testData, iterations = 100) {
  console.log(`⏱️  Running performance test with ${iterations} iterations...`);

  const results = {
    legacy: { times: [], errors: 0 },
    enhanced: { times: [], errors: 0 },
  };

  // Test legacy API
  for (let i = 0; i < iterations; i++) {
    try {
      const start = performance.now();
      registry.detectFormat(testData);
      const end = performance.now();
      results.legacy.times.push(end - start);
    } catch (error) {
      results.legacy.errors++;
    }
  }

  // Test enhanced API
  const buffer = Buffer.from(JSON.stringify(testData));
  for (let i = 0; i < iterations; i++) {
    try {
      const start = performance.now();
      await registry.detectFormat(buffer);
      const end = performance.now();
      results.enhanced.times.push(end - start);
    } catch (error) {
      results.enhanced.errors++;
    }
  }

  // Calculate statistics
  const legacyAvg =
    results.legacy.times.reduce((a, b) => a + b, 0) /
    results.legacy.times.length;
  const enhancedAvg =
    results.enhanced.times.reduce((a, b) => a + b, 0) /
    results.enhanced.times.length;

  console.log(`📊 Performance Results:`);
  console.log(
    `   Legacy API: ${legacyAvg.toFixed(3)}ms avg, ${results.legacy.errors} errors`
  );
  console.log(
    `   Enhanced API: ${enhancedAvg.toFixed(3)}ms avg, ${results.enhanced.errors} errors`
  );
  console.log(
    `   Overhead: ${(((enhancedAvg - legacyAvg) / legacyAvg) * 100).toFixed(1)}%`
  );

  return results;
}

// Demo execution
async function runProductionExamples() {
  console.log('🚀 Production Usage Examples for Enhanced detectFormat API\n');

  // Example 1: Intelligent processing
  console.log('1. Confidence-based decision making:');
  const testData = {
    timestamp: '2023-12-07T10:00:00Z',
    emissions: 0.5,
    model: 'gpt-4',
  };
  try {
    await intelligentProcessing(JSON.stringify(testData));
  } catch (error) {
    console.log('Expected error for demo:', error.message);
  }
  console.log();

  // Example 2: Batch processing
  console.log('2. Batch processing:');
  const batchData = [
    { emissions: 0.5, duration: 3600 },
    { co2: 0.3, time: 1800 },
    { invalid: 'data' },
    'timestamp,emissions\n2023-01-01,0.4',
  ];
  await batchProcess(batchData);
  console.log();

  // Example 3: Migration wrapper
  console.log('3. Migration wrapper demo:');
  const wrapper = createMigrationWrapper(registry);

  const legacyResult = wrapper.detectFormat('{"test": true}');
  console.log('Legacy result:', legacyResult);

  const enhancedResult = await wrapper.detectFormatWithConfidence({
    emissions: 0.5,
  });
  console.log('Enhanced result:', {
    format: enhancedResult.format,
    confidence: enhancedResult.confidence.toFixed(3),
  });
  console.log();

  // Example 4: Performance monitoring
  console.log('4. Performance monitoring:');
  await performanceMonitor(testData, 50);
  console.log();

  console.log('✅ All production examples completed');
}

// Export functions for use in other modules
export {
  intelligentProcessing,
  processLargeFile,
  batchProcess,
  createMigrationWrapper,
  performanceMonitor,
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runProductionExamples().catch(console.error);
}
