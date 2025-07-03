/**
 * Performance Benchmarking Suite
 *
 * Comprehensive benchmarking and performance measurement tools for
 * detection operations on various dataset sizes and formats.
 */
import { UniversalTrackerRegistry, FormatDetectionResult } from '../UniversalTrackerRegistry.js';
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
export declare class BenchmarkSuite {
    private registry;
    private benchmarkResults;
    constructor(registry: UniversalTrackerRegistry);
    /**
     * Generate test datasets of various sizes and formats
     */
    private generateDatasets;
    /**
     * Get memory usage in MB
     */
    private getMemoryUsageMB;
    /**
     * Force garbage collection if available (requires --expose-gc flag)
     */
    private forceGC;
    /**
     * Run benchmark for a single dataset
     */
    benchmarkDataset(dataset: DatasetConfig): Promise<BenchmarkResult>;
    /**
     * Run full benchmark suite
     */
    runFullSuite(): Promise<BenchmarkResult[]>;
    /**
     * Generate performance report
     */
    generateReport(): string;
    /**
     * Export results to JSON
     */
    exportResults(): string;
    /**
     * Get all benchmark results
     */
    getResults(): BenchmarkResult[];
    /**
     * Clear benchmark results
     */
    clearResults(): void;
}
//# sourceMappingURL=BenchmarkSuite.d.ts.map