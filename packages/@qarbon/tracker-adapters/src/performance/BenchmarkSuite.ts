/**
 * Performance Benchmarking Suite
 *
 * Comprehensive benchmarking and performance measurement tools for
 * detection operations on various dataset sizes and formats.
 */

import { performance } from 'perf_hooks';
import {
  UniversalTrackerRegistry,
  FormatDetectionResult,
} from '../UniversalTrackerRegistry.js';

export interface BenchmarkMetrics {
  /** Total detection time in milliseconds */
  detectionTimeMs: number;
  /** Per-adapter detection times in milliseconds */
  adapterTimes: Record<string, number>;
  /** Memory usage before/after in MB */
  memoryUsage: {
    before: number;
    after: number;
    peak: number;
  };
  /** Data size in bytes */
  dataSizeBytes: number;
  /** Number of adapters tested */
  adapterCount: number;
  /** Whether early exit was triggered */
  earlyExitTriggered: boolean;
  /** Cache hit/miss statistics */
  cacheStats: {
    hits: number;
    misses: number;
  };
}

export interface BenchmarkResult {
  /** Benchmark configuration */
  config: {
    datasetSize: 'small' | 'medium' | 'large' | 'xlarge';
    format: string;
    description: string;
  };
  /** Performance metrics */
  metrics: BenchmarkMetrics;
  /** Detection result */
  result: FormatDetectionResult;
  /** Timestamp when benchmark was run */
  timestamp: string;
}

export interface DatasetConfig {
  name: string;
  size: 'small' | 'medium' | 'large' | 'xlarge';
  format: string;
  description: string;
  generator: () => Buffer;
}

export class BenchmarkSuite {
  private registry: UniversalTrackerRegistry;
  private benchmarkResults: BenchmarkResult[] = [];

  constructor(registry: UniversalTrackerRegistry) {
    this.registry = registry;
  }

  /**
   * Generate test datasets of various sizes and formats
   */
  private generateDatasets(): DatasetConfig[] {
    return [
      // Small datasets (< 1KB)
      {
        name: 'small-json',
        size: 'small',
        format: 'json',
        description: 'Small JSON emission record',
        generator: () =>
          Buffer.from(
            JSON.stringify({
              timestamp: '2023-12-01T10:00:00Z',
              model: 'gpt-4',
              emissions: 0.001234,
              duration: 1.5,
              tokens: { input: 150, output: 89 },
            })
          ),
      },
      {
        name: 'small-csv',
        size: 'small',
        format: 'csv',
        description: 'Small CSV emission log',
        generator: () =>
          Buffer.from(
            'timestamp,model,emissions_kg,duration_seconds\n' +
              '2023-12-01T10:00:00Z,gpt-4,0.001234,1.5\n' +
              '2023-12-01T10:01:00Z,gpt-3.5,0.000987,1.2'
          ),
      },
      {
        name: 'small-codecarbon',
        size: 'small',
        format: 'codecarbon',
        description: 'Small CodeCarbon output',
        generator: () =>
          Buffer.from(
            JSON.stringify({
              duration_seconds: 1800.5,
              emissions_kg: 0.0456,
              project_name: 'test-project',
              country_name: 'United States',
              region: 'us-east-1',
            })
          ),
      },

      // Medium datasets (1KB - 100KB)
      {
        name: 'medium-json-array',
        size: 'medium',
        format: 'json',
        description: 'Medium JSON array with 100 emission records',
        generator: () => {
          const records = Array.from({ length: 100 }, (_, i) => ({
            timestamp: `2023-12-01T${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z`,
            model: i % 3 === 0 ? 'gpt-4' : i % 3 === 1 ? 'gpt-3.5' : 'claude-3',
            emissions: Math.random() * 0.01,
            duration: Math.random() * 10,
            tokens: {
              input: Math.floor(Math.random() * 500) + 50,
              output: Math.floor(Math.random() * 300) + 30,
            },
          }));
          return Buffer.from(
            JSON.stringify({ records, metadata: { count: records.length } })
          );
        },
      },
      {
        name: 'medium-csv',
        size: 'medium',
        format: 'csv',
        description: 'Medium CSV with 500 emission records',
        generator: () => {
          const headers =
            'timestamp,model,emissions_kg,duration_seconds,energy_kwh,tokens_input,tokens_output';
          const rows = Array.from({ length: 500 }, (_, i) => {
            const hour = Math.floor(i / 60);
            const minute = i % 60;
            return (
              `2023-12-01T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z,` +
              `${i % 3 === 0 ? 'gpt-4' : 'gpt-3.5'},` +
              `${(Math.random() * 0.01).toFixed(6)},` +
              `${Math.floor(Math.random() * 10) + 1},` +
              `${(Math.random() * 0.1).toFixed(4)},` +
              `${Math.floor(Math.random() * 500) + 50},` +
              `${Math.floor(Math.random() * 300) + 30}`
            );
          });
          return Buffer.from([headers, ...rows].join('\n'));
        },
      },

      // Large datasets (100KB - 10MB)
      {
        name: 'large-json',
        size: 'large',
        format: 'json',
        description: 'Large JSON with 5000 detailed emission records',
        generator: () => {
          const records = Array.from({ length: 5000 }, (_, i) => ({
            id: `record_${i}`,
            timestamp: `2023-12-01T${String(Math.floor(i / 3600)).padStart(2, '0')}:${String(Math.floor((i % 3600) / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}Z`,
            model:
              i % 4 === 0
                ? 'gpt-4'
                : i % 4 === 1
                  ? 'gpt-3.5'
                  : i % 4 === 2
                    ? 'claude-3-sonnet'
                    : 'llama-2-70b',
            emissions: {
              co2_kg: Math.random() * 0.01,
              scope1: Math.random() * 0.003,
              scope2: Math.random() * 0.005,
              scope3: Math.random() * 0.002,
            },
            compute: {
              duration_seconds: Math.random() * 30,
              cpu_hours: Math.random() * 0.01,
              gpu_hours: Math.random() * 0.008,
              memory_gb_hours: Math.random() * 0.5,
            },
            tokens: {
              input: Math.floor(Math.random() * 2000) + 100,
              output: Math.floor(Math.random() * 1000) + 50,
              total: function () {
                return this.input + this.output;
              },
            },
            metadata: {
              region:
                i % 5 === 0
                  ? 'us-east-1'
                  : i % 5 === 1
                    ? 'us-west-2'
                    : i % 5 === 2
                      ? 'eu-central-1'
                      : i % 5 === 3
                        ? 'ap-southeast-1'
                        : 'ca-central-1',
              provider: i % 3 === 0 ? 'aws' : i % 3 === 1 ? 'gcp' : 'azure',
              instance_type:
                i % 4 === 0
                  ? 'p3.2xlarge'
                  : i % 4 === 1
                    ? 'n1-highmem-4'
                    : i % 4 === 2
                      ? 'Standard_NC6s_v3'
                      : 'g4dn.xlarge',
            },
          }));
          return Buffer.from(
            JSON.stringify({
              metadata: {
                experiment: 'large-scale-inference',
                total_records: records.length,
                start_time: '2023-12-01T00:00:00Z',
                end_time: '2023-12-01T23:59:59Z',
              },
              records,
            })
          );
        },
      },
      {
        name: 'large-csv',
        size: 'large',
        format: 'csv',
        description: 'Large CSV with 10000 emission records',
        generator: () => {
          const headers =
            'id,timestamp,model,emissions_kg,duration_seconds,energy_kwh,tokens_input,tokens_output,region,provider,instance_type,cost_usd';
          const rows = Array.from({ length: 10000 }, (_, i) => {
            const day = Math.floor(i / 1440);
            const hour = Math.floor((i % 1440) / 60);
            const minute = i % 60;
            return (
              `record_${i},` +
              `2023-12-${String(day + 1).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z,` +
              `${i % 4 === 0 ? 'gpt-4' : i % 4 === 1 ? 'gpt-3.5' : i % 4 === 2 ? 'claude-3' : 'llama-2'},` +
              `${(Math.random() * 0.01).toFixed(6)},` +
              `${(Math.random() * 30).toFixed(2)},` +
              `${(Math.random() * 0.1).toFixed(4)},` +
              `${Math.floor(Math.random() * 2000) + 100},` +
              `${Math.floor(Math.random() * 1000) + 50},` +
              `${i % 5 === 0 ? 'us-east-1' : i % 5 === 1 ? 'us-west-2' : i % 5 === 2 ? 'eu-central-1' : i % 5 === 3 ? 'ap-southeast-1' : 'ca-central-1'},` +
              `${i % 3 === 0 ? 'aws' : i % 3 === 1 ? 'gcp' : 'azure'},` +
              `${i % 4 === 0 ? 'p3.2xlarge' : i % 4 === 1 ? 'n1-highmem-4' : i % 4 === 2 ? 'Standard_NC6s_v3' : 'g4dn.xlarge'},` +
              `${(Math.random() * 5).toFixed(3)}`
            );
          });
          return Buffer.from([headers, ...rows].join('\n'));
        },
      },
    ];
  }

  /**
   * Get memory usage in MB
   */
  private getMemoryUsageMB(): number {
    const usage = process.memoryUsage();
    return Math.round((usage.heapUsed / 1024 / 1024) * 100) / 100;
  }

  /**
   * Force garbage collection if available (requires --expose-gc flag)
   */
  private forceGC(): void {
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Run benchmark for a single dataset
   */
  async benchmarkDataset(dataset: DatasetConfig): Promise<BenchmarkResult> {
    this.forceGC();

    const data = dataset.generator();
    const memoryBefore = this.getMemoryUsageMB();

    const startTime = performance.now();

    // Run detection (this will include our optimizations)
    const result = await this.registry.detectFormat(data);

    const endTime = performance.now();
    const memoryAfter = this.getMemoryUsageMB();

    // Get cache stats if available (will be implemented later)
    const cacheStats = (this.registry as any).getCacheStats?.() || {
      hits: 0,
      misses: 0,
    };

    // Get early exit stats if available (will be implemented later)
    const earlyExitTriggered =
      (this.registry as any).getLastEarlyExit?.() || false;

    this.forceGC();
    const memoryPeak = this.getMemoryUsageMB();

    // Handle both legacy and enhanced detection results
    const detectionResult: FormatDetectionResult =
      typeof result === 'string'
        ? { bestMatch: result, confidenceScores: [] }
        : result === null
          ? { bestMatch: null, confidenceScores: [] }
          : (result as FormatDetectionResult);

    const metrics: BenchmarkMetrics = {
      detectionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      adapterTimes: {}, // Will be populated when we add detailed timing
      memoryUsage: {
        before: memoryBefore,
        after: memoryAfter,
        peak: memoryPeak,
      },
      dataSizeBytes: data.length,
      adapterCount: detectionResult.confidenceScores?.length || 0,
      earlyExitTriggered,
      cacheStats,
    };

    const benchmarkResult: BenchmarkResult = {
      config: {
        datasetSize: dataset.size,
        format: dataset.format,
        description: dataset.description,
      },
      metrics,
      result: detectionResult,
      timestamp: new Date().toISOString(),
    };

    this.benchmarkResults.push(benchmarkResult);
    return benchmarkResult;
  }

  /**
   * Run full benchmark suite
   */
  async runFullSuite(): Promise<BenchmarkResult[]> {
    console.log('🚀 Starting Performance Benchmark Suite...\n');

    const datasets = this.generateDatasets();
    const results: BenchmarkResult[] = [];

    for (const dataset of datasets) {
      console.log(`📊 Benchmarking: ${dataset.name} (${dataset.description})`);

      try {
        const result = await this.benchmarkDataset(dataset);
        results.push(result);

        console.log(
          `   ✅ Detection time: ${result.metrics.detectionTimeMs}ms`
        );
        console.log(
          `   📏 Data size: ${(result.metrics.dataSizeBytes / 1024).toFixed(1)}KB`
        );
        console.log(`   🎯 Best match: ${result.result.bestMatch || 'none'}`);
        console.log(
          `   💾 Memory: ${result.metrics.memoryUsage.before}MB → ${result.metrics.memoryUsage.after}MB`
        );
        console.log(
          `   ⚡ Early exit: ${result.metrics.earlyExitTriggered ? 'Yes' : 'No'}`
        );
        console.log(
          `   🗄️  Cache hits: ${result.metrics.cacheStats.hits}, misses: ${result.metrics.cacheStats.misses}\n`
        );
      } catch (error) {
        console.error(
          `   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`
        );
      }
    }

    return results;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    if (this.benchmarkResults.length === 0) {
      return 'No benchmark results available. Run benchmarks first.';
    }

    let report = '# Performance Benchmark Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total benchmarks: ${this.benchmarkResults.length}\n\n`;

    // Summary statistics
    const avgTime =
      this.benchmarkResults.reduce(
        (sum, r) => sum + r.metrics.detectionTimeMs,
        0
      ) / this.benchmarkResults.length;
    const maxTime = Math.max(
      ...this.benchmarkResults.map(r => r.metrics.detectionTimeMs)
    );
    const minTime = Math.min(
      ...this.benchmarkResults.map(r => r.metrics.detectionTimeMs)
    );

    report += '## Summary Statistics\n\n';
    report += `- Average detection time: ${avgTime.toFixed(2)}ms\n`;
    report += `- Fastest detection: ${minTime.toFixed(2)}ms\n`;
    report += `- Slowest detection: ${maxTime.toFixed(2)}ms\n`;
    report += `- Total early exits: ${this.benchmarkResults.filter(r => r.metrics.earlyExitTriggered).length}\n`;
    report += `- Total cache hits: ${this.benchmarkResults.reduce((sum, r) => sum + r.metrics.cacheStats.hits, 0)}\n\n`;

    // Detailed results
    report += '## Detailed Results\n\n';
    report +=
      '| Dataset | Size | Format | Time (ms) | Data Size (KB) | Best Match | Early Exit | Cache H/M |\n';
    report +=
      '|---------|------|--------|-----------|----------------|------------|------------|-----------|\n';

    for (const result of this.benchmarkResults) {
      report += `| ${result.config.description} | ${result.config.datasetSize} | ${result.config.format} | `;
      report += `${result.metrics.detectionTimeMs} | ${(result.metrics.dataSizeBytes / 1024).toFixed(1)} | `;
      report += `${result.result.bestMatch || 'none'} | ${result.metrics.earlyExitTriggered ? '✅' : '❌'} | `;
      report += `${result.metrics.cacheStats.hits}/${result.metrics.cacheStats.misses} |\n`;
    }

    // Performance by dataset size
    report += '\n## Performance by Dataset Size\n\n';
    const sizeGroups = this.benchmarkResults.reduce(
      (groups, result) => {
        const size = result.config.datasetSize;
        if (!groups[size]) groups[size] = [];
        groups[size].push(result);
        return groups;
      },
      {} as Record<string, BenchmarkResult[]>
    );

    for (const [size, results] of Object.entries(sizeGroups)) {
      const avgTime =
        results.reduce((sum, r) => sum + r.metrics.detectionTimeMs, 0) /
        results.length;
      const avgSize =
        results.reduce((sum, r) => sum + r.metrics.dataSizeBytes, 0) /
        results.length /
        1024;
      report += `- **${size}**: ${avgTime.toFixed(2)}ms avg (${avgSize.toFixed(1)}KB avg)\n`;
    }

    return report;
  }

  /**
   * Export results to JSON
   */
  exportResults(): string {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: {
          totalBenchmarks: this.benchmarkResults.length,
          averageTime:
            this.benchmarkResults.reduce(
              (sum, r) => sum + r.metrics.detectionTimeMs,
              0
            ) / this.benchmarkResults.length,
          totalEarlyExits: this.benchmarkResults.filter(
            r => r.metrics.earlyExitTriggered
          ).length,
          totalCacheHits: this.benchmarkResults.reduce(
            (sum, r) => sum + r.metrics.cacheStats.hits,
            0
          ),
        },
        results: this.benchmarkResults,
      },
      null,
      2
    );
  }

  /**
   * Get all benchmark results
   */
  getResults(): BenchmarkResult[] {
    return [...this.benchmarkResults];
  }

  /**
   * Clear benchmark results
   */
  clearResults(): void {
    this.benchmarkResults = [];
  }
}
