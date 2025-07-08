/**
 * Optimized Universal Tracker Registry
 *
 * Enhanced version with performance optimizations:
 * - Early-exit checks for high-confidence hits
 * - Signature caching to avoid double parsing
 * - Detailed performance metrics
 */
import {
  UniversalTrackerRegistry,
  EmissionAdapter,
  FormatDetectionResult,
} from './UniversalTrackerRegistry.js';
import { CacheStats } from './performance/SignatureCache.js';
export interface OptimizationConfig {
  /** Enable early exit when confidence threshold is reached */
  enableEarlyExit: boolean;
  /** Confidence threshold for early exit (0.0 - 1.0) */
  earlyExitThreshold: number;
  /** Enable signature caching */
  enableCaching: boolean;
  /** Enable detailed timing metrics per adapter */
  enableDetailedTiming: boolean;
  /** Maximum time to spend on detection (ms) */
  maxDetectionTimeMs: number;
}
export interface AdapterTiming {
  adapterName: string;
  timeMs: number;
  cached: boolean;
  confidenceScore: number;
}
export interface OptimizedDetectionResult extends FormatDetectionResult {
  /** Performance metrics for this detection */
  performance: {
    totalTimeMs: number;
    earlyExitTriggered: boolean;
    adapterTimings: AdapterTiming[];
    cacheStats: CacheStats;
  };
}
export declare class OptimizedUniversalTrackerRegistry extends UniversalTrackerRegistry {
  private signatureCache;
  private config;
  private lastEarlyExit;
  constructor(
    initial?: Record<string, EmissionAdapter>,
    optimizationConfig?: Partial<OptimizationConfig>
  );
  /**
   * Enhanced format detection with optimizations
   */
  detectFormatOptimized(
    input: Buffer | NodeJS.ReadableStream
  ): Promise<OptimizedDetectionResult>;
  /**
   * Override the parent detectFormatWithConfidence to use optimizations
   */
  detectFormatWithConfidence(
    input: Buffer | NodeJS.ReadableStream
  ): Promise<FormatDetectionResult>;
  /**
   * Get cached results for buffer
   */
  private getCachedResults;
  /**
   * Convert ReadableStream to Buffer
   */
  private streamToBuffer;
  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats;
  /**
   * Get whether last detection triggered early exit
   */
  getLastEarlyExit(): boolean;
  /**
   * Clear the signature cache
   */
  clearCache(): void;
  /**
   * Update optimization configuration
   */
  updateOptimizationConfig(newConfig: Partial<OptimizationConfig>): void;
  /**
   * Get current optimization configuration
   */
  getOptimizationConfig(): OptimizationConfig;
  /**
   * Export performance metrics
   */
  exportPerformanceMetrics(): {
    config: OptimizationConfig;
    cacheStats: CacheStats;
    lastEarlyExit: boolean;
  };
  /**
   * Run a performance benchmark on a specific dataset
   */
  benchmarkDetection(
    data: Buffer,
    iterations?: number
  ): Promise<{
    averageTimeMs: number;
    minTimeMs: number;
    maxTimeMs: number;
    cacheHitRate: number;
    earlyExitRate: number;
    results: OptimizedDetectionResult[];
  }>;
  /**
   * Warm up the cache with common data patterns
   */
  warmupCache(sampleData: Buffer[]): Promise<void>;
}
//# sourceMappingURL=OptimizedUniversalTrackerRegistry.d.ts.map
