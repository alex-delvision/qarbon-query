/**
 * Performance Benchmarking Suite for qarbon-emissions
 * Tests performance across all key areas with targets
 */

import { performance } from 'perf_hooks';
import { EmissionsCalculator } from '../src/calculator';
import { adapterRegistry } from '../src/adapters';
import { getAIFactor, getEmissionFactor } from '../src/factors';

// Performance targets
const TARGETS = {
  SINGLE_CALCULATION: 1, // ms
  BATCH_THROUGHPUT: 10000, // calculations/sec
  ADAPTER_DETECTION: 5, // ms
  CACHE_HIT_RATE: 0.9, // 90%
  MEMORY_LIMIT: 100 * 1024 * 1024, // 100MB
} as const;

interface BenchmarkResult {
  name: string;
  duration: number;
  throughput?: number;
  memoryUsage?: number;
  cacheHitRate?: number;
  target: number;
  passed: boolean;
  details?: Record<string, any>;
}

interface MemorySnapshot {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];
  private calculator: EmissionsCalculator;
  
  constructor() {
    this.calculator = new EmissionsCalculator({
      enableOptimizations: true,
      enableUncertainty: false
    });
  }

  /**
   * Take memory snapshot
   */
  private getMemorySnapshot(): MemorySnapshot {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers
    };
  }

  /**
   * Force garbage collection if available
   */
  private forceGC(): void {
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Benchmark 1: Single Calculation Speed
   * Target: <1ms per calculation
   */
  async benchmarkSingleCalculation(): Promise<BenchmarkResult> {
    console.log('🚀 Benchmarking single calculation speed...');
    
    const iterations = 1000;
    const calculations = [
      () => this.calculator.calculateDigitalEmissions(100, 30, 'desktop'),
      () => this.calculator.calculateTransportEmissions(50, 'car'),
      () => this.calculator.calculateEnergyEmissions(10, 'grid'),
      () => this.calculator.calculateAIEmissions(1000, 'gpt-4')
    ];

    this.forceGC();
    const startMemory = this.getMemorySnapshot();
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      const calc = calculations[i % calculations.length];
      await calc();
    }

    const end = performance.now();
    const endMemory = this.getMemorySnapshot();
    
    const duration = (end - start) / iterations;
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    
    const result: BenchmarkResult = {
      name: 'Single Calculation Speed',
      duration,
      memoryUsage: memoryDelta,
      target: TARGETS.SINGLE_CALCULATION,
      passed: duration < TARGETS.SINGLE_CALCULATION,
      details: {
        iterations,
        avgDuration: duration,
        memoryPerCalc: memoryDelta / iterations,
        calculationTypes: calculations.length
      }
    };

    this.results.push(result);
    return result;
  }

  /**
   * Benchmark 2: Batch Calculation Throughput
   * Target: 10,000 calculations/sec
   */
  async benchmarkBatchThroughput(): Promise<BenchmarkResult> {
    console.log('🚀 Benchmarking batch calculation throughput...');
    
    const batchSize = 5000;
    const inputs = Array.from({ length: batchSize }, (_, i) => ({
      type: ['digital', 'transport', 'energy', 'ai'][i % 4] as any,
      dataTransfer: 100 + (i % 100),
      timeSpent: 30 + (i % 60),
      deviceType: 'desktop' as const,
      distance: 50 + (i % 50),
      mode: 'car' as const,
      consumption: 10 + (i % 20),
      source: 'grid' as const,
      tokens: 1000 + (i % 1000),
      model: ['gpt-3.5', 'gpt-4', 'claude-3'][i % 3]
    }));

    this.forceGC();
    const startMemory = this.getMemorySnapshot();
    const start = performance.now();

    await this.calculator.calculate(inputs);

    const end = performance.now();
    const endMemory = this.getMemorySnapshot();
    
    const duration = end - start;
    const throughput = (batchSize / duration) * 1000; // calculations per second
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

    const result: BenchmarkResult = {
      name: 'Batch Calculation Throughput',
      duration,
      throughput,
      memoryUsage: memoryDelta,
      target: TARGETS.BATCH_THROUGHPUT,
      passed: throughput > TARGETS.BATCH_THROUGHPUT,
      details: {
        batchSize,
        throughputPerSec: Math.round(throughput),
        memoryPerCalc: memoryDelta / batchSize,
        avgTimePerCalc: duration / batchSize
      }
    };

    this.results.push(result);
    return result;
  }

  /**
   * Benchmark 3: Memory Usage Under Load
   * Target: <100MB peak memory
   */
  async benchmarkMemoryUsage(): Promise<BenchmarkResult> {
    console.log('🚀 Benchmarking memory usage under load...');
    
    this.forceGC();
    const startMemory = this.getMemorySnapshot();
    let peakMemory = startMemory.heapUsed;
    
    const start = performance.now();

    // Create multiple calculator instances and run concurrent operations
    const calculators = Array.from({ length: 10 }, () => new EmissionsCalculator());
    const promises = [];

    for (let batch = 0; batch < 5; batch++) {
      const batchInputs = Array.from({ length: 1000 }, (_, i) => ({
        type: 'ai' as const,
        tokens: 1000,
        model: 'gpt-4'
      }));

      promises.push(
        ...calculators.map(calc => calc.calculate(batchInputs))
      );

      // Check memory usage
      const currentMemory = this.getMemorySnapshot();
      peakMemory = Math.max(peakMemory, currentMemory.heapUsed);
    }

    await Promise.all(promises);
    
    const end = performance.now();
    const endMemory = this.getMemorySnapshot();
    
    const duration = end - start;
    const memoryDelta = peakMemory - startMemory.heapUsed;

    const result: BenchmarkResult = {
      name: 'Memory Usage Under Load',
      duration,
      memoryUsage: memoryDelta,
      target: TARGETS.MEMORY_LIMIT,
      passed: peakMemory < TARGETS.MEMORY_LIMIT,
      details: {
        startMemoryMB: Math.round(startMemory.heapUsed / 1024 / 1024),
        peakMemoryMB: Math.round(peakMemory / 1024 / 1024),
        endMemoryMB: Math.round(endMemory.heapUsed / 1024 / 1024),
        calculatorInstances: calculators.length,
        totalCalculations: 50000
      }
    };

    this.results.push(result);
    return result;
  }

  /**
   * Benchmark 4: Adapter Detection Speed
   * Target: <5ms per detection
   */
  async benchmarkAdapterDetection(): Promise<BenchmarkResult> {
    console.log('🚀 Benchmarking adapter detection speed...');
    
    const testData = [
      // CSV data
      'timestamp,emissions,energy,model\n2024-01-01,1.23,0.5,gpt-4\n2024-01-02,2.34,0.8,claude-3',
      // JSON data
      JSON.stringify([{ timestamp: '2024-01-01', emissions: 1.23, model: 'gpt-4' }]),
      // CodeCarbon JSON
      JSON.stringify({ timestamp: '2024-01-01T12:00:00', emissions: { total: 1.23 } }),
      // MLCO2 format
      JSON.stringify({ experiment: { emissions: 1.23, energy: 0.5 } }),
      // Eco2AI format
      JSON.stringify({ emission: 1.23, energy_consumption: 0.5 }),
      // Plain text
      'some random text that should not match any adapter',
      // XML-like
      '<data><emission>1.23</emission></data>',
      // Webhook stream
      'data: {"emission": 1.23}\n\n'
    ];

    const iterations = 1000;
    this.forceGC();
    const start = performance.now();

    let detections = 0;
    for (let i = 0; i < iterations; i++) {
      const data = testData[i % testData.length];
      const adapter = adapterRegistry.autoDetect(data);
      if (adapter) detections++;
    }

    const end = performance.now();
    const duration = (end - start) / iterations;

    const result: BenchmarkResult = {
      name: 'Adapter Detection Speed',
      duration,
      target: TARGETS.ADAPTER_DETECTION,
      passed: duration < TARGETS.ADAPTER_DETECTION,
      details: {
        iterations,
        avgDurationMs: duration,
        successfulDetections: detections,
        detectionRate: detections / iterations,
        testDataTypes: testData.length
      }
    };

    this.results.push(result);
    return result;
  }

  /**
   * Benchmark 5: Cache Hit Rates
   * Target: >90% cache hit rate
   */
  async benchmarkCacheHitRates(): Promise<BenchmarkResult> {
    console.log('🚀 Benchmarking cache hit rates...');
    
    const models = ['gpt-3.5', 'gpt-4', 'claude-3', 'gemini-pro'];
    const categories = ['digital', 'transport', 'energy'];
    const types = [
      ['mobile', 'desktop', 'tablet'],
      ['car', 'train', 'plane'],
      ['grid', 'renewable', 'fossil']
    ];

    const iterations = 10000;
    let aiHits = 0;
    let factorHits = 0;

    this.forceGC();
    const start = performance.now();

    // Test AI factor caching
    for (let i = 0; i < iterations / 2; i++) {
      const model = models[i % models.length];
      const factor1 = getAIFactor(model);
      const factor2 = getAIFactor(model); // Should hit cache
      if (factor1 && factor2 && factor1 === factor2) {
        aiHits++;
      }
    }

    // Test emission factor caching
    for (let i = 0; i < iterations / 2; i++) {
      const categoryIndex = i % categories.length;
      const category = categories[categoryIndex];
      const type = types[categoryIndex][i % types[categoryIndex].length];
      
      const factor1 = getEmissionFactor(category, type);
      const factor2 = getEmissionFactor(category, type); // Should hit cache
      if (factor1 && factor2 && factor1 === factor2) {
        factorHits++;
      }
    }

    const end = performance.now();
    const duration = end - start;
    const overallHitRate = (aiHits + factorHits) / iterations;

    const result: BenchmarkResult = {
      name: 'Cache Hit Rates',
      duration,
      cacheHitRate: overallHitRate,
      target: TARGETS.CACHE_HIT_RATE,
      passed: overallHitRate > TARGETS.CACHE_HIT_RATE,
      details: {
        iterations,
        aiCacheHits: aiHits,
        factorCacheHits: factorHits,
        overallHitRate: Math.round(overallHitRate * 100) / 100,
        avgLookupTime: duration / iterations
      }
    };

    this.results.push(result);
    return result;
  }

  /**
   * Run all benchmarks
   */
  async runAll(): Promise<BenchmarkResult[]> {
    console.log('🎯 Starting Performance Benchmark Suite');
    console.log('=' .repeat(50));

    const benchmarks = [
      () => this.benchmarkSingleCalculation(),
      () => this.benchmarkBatchThroughput(),
      () => this.benchmarkMemoryUsage(),
      () => this.benchmarkAdapterDetection(),
      () => this.benchmarkCacheHitRates()
    ];

    for (const benchmark of benchmarks) {
      try {
        await benchmark();
        // Small delay between benchmarks to allow GC
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Benchmark failed:', error);
      }
    }

    this.printResults();
    return this.results;
  }

  /**
   * Print formatted results
   */
  printResults(): void {
    console.log('\n📊 Performance Benchmark Results');
    console.log('=' .repeat(80));

    let passed = 0;
    let total = this.results.length;

    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const emoji = result.passed ? '🚀' : '🐌';
      
      console.log(`\n${emoji} ${result.name}: ${status}`);
      console.log(`   Duration: ${result.duration.toFixed(2)}ms (target: ${result.target}${result.target === TARGETS.CACHE_HIT_RATE ? '' : 'ms'})`);
      
      if (result.throughput) {
        console.log(`   Throughput: ${Math.round(result.throughput).toLocaleString()}/sec`);
      }
      
      if (result.memoryUsage) {
        console.log(`   Memory: ${Math.round(result.memoryUsage / 1024 / 1024)}MB`);
      }
      
      if (result.cacheHitRate) {
        console.log(`   Cache Hit Rate: ${(result.cacheHitRate * 100).toFixed(1)}%`);
      }

      if (result.details) {
        console.log(`   Details:`, result.details);
      }

      if (result.passed) passed++;
    });

    console.log('\n' + '=' .repeat(80));
    console.log(`📈 Overall Score: ${passed}/${total} benchmarks passed (${Math.round((passed/total) * 100)}%)`);
    
    if (passed === total) {
      console.log('🎉 All performance targets met! Package is optimized.');
    } else {
      console.log('⚠️  Some performance targets missed. Consider optimization.');
    }
  }

  /**
   * Export results for CI/analysis
   */
  exportResults(): Record<string, any> {
    return {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      targets: TARGETS,
      results: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
        passRate: this.results.filter(r => r.passed).length / this.results.length
      }
    };
  }
}

// CLI runner
async function main() {
  if (require.main === module) {
    const benchmark = new PerformanceBenchmark();
    
    try {
      await benchmark.runAll();
      
      // Export results to file
      const results = benchmark.exportResults();
      const fs = require('fs');
      const path = require('path');
      
      const outputFile = path.join(__dirname, 'benchmark-results.json');
      fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
      console.log(`\n💾 Results saved to: ${outputFile}`);
      
      // Exit with non-zero code if any benchmarks failed
      const failed = results.summary.failed;
      process.exit(failed > 0 ? 1 : 0);
      
    } catch (error) {
      console.error('Benchmark suite failed:', error);
      process.exit(1);
    }
  }
}

export { PerformanceBenchmark, BenchmarkResult, TARGETS };

// Auto-run if called directly
main().catch(console.error);
