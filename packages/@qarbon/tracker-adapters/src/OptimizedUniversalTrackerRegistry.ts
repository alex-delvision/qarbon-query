/**
 * Optimized Universal Tracker Registry
 *
 * Enhanced version with performance optimizations:
 * - Early-exit checks for high-confidence hits
 * - Signature caching to avoid double parsing
 * - Detailed performance metrics
 */

import { performance } from 'perf_hooks';
import {
  UniversalTrackerRegistry,
  EmissionAdapter,
  FormatConfidence,
  FormatDetectionResult,
} from './UniversalTrackerRegistry.js';
import { SignatureCache, CacheStats } from './performance/SignatureCache.js';

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

export class OptimizedUniversalTrackerRegistry extends UniversalTrackerRegistry {
  private signatureCache: SignatureCache;
  private config: OptimizationConfig;
  private lastEarlyExit = false;

  constructor(
    initial: Record<string, EmissionAdapter> = {},
    optimizationConfig: Partial<OptimizationConfig> = {}
  ) {
    super(initial);

    this.config = {
      enableEarlyExit: true,
      earlyExitThreshold: 0.95,
      enableCaching: true,
      enableDetailedTiming: true,
      maxDetectionTimeMs: 10000, // 10 seconds max
      ...optimizationConfig,
    };

    this.signatureCache = new SignatureCache({
      maxEntries: 1000,
      ttlMs: 5 * 60 * 1000, // 5 minutes
      maxDataSize: 1024 * 1024, // 1MB
      cacheLowConfidence: false,
      minConfidenceToCache: 0.3,
    });
  }

  /**
   * Enhanced format detection with optimizations
   */
  async detectFormatOptimized(
    input: Buffer | NodeJS.ReadableStream
  ): Promise<OptimizedDetectionResult> {
    const startTime = performance.now();
    this.lastEarlyExit = false;

    // Convert ReadableStream to Buffer if needed
    const buffer =
      input instanceof Buffer
        ? input
        : await this.streamToBuffer(input as NodeJS.ReadableStream);

    const adapterTimings: AdapterTiming[] = [];
    const confidenceResults: FormatConfidence[] = [];

    // Check cache first if enabled
    if (this.config.enableCaching) {
      const cachedResults = await this.getCachedResults(buffer);
      for (const cached of cachedResults) {
        confidenceResults.push(cached.confidence);
        adapterTimings.push({
          adapterName: cached.confidence.adapterName,
          timeMs: 0, // Cache hit
          cached: true,
          confidenceScore: cached.confidence.score,
        });
      }
    }

    // Get list of adapters that need to be checked (not cached)
    const adaptersMap = (this as any).adapters as Map<string, EmissionAdapter>;
    const adaptersToCheck: Array<[string, EmissionAdapter]> = [];

    for (const [registryKey, adapter] of adaptersMap.entries()) {
      if (
        !confidenceResults.some(result => result.adapterName === registryKey)
      ) {
        adaptersToCheck.push([registryKey, adapter]);
      }
    }

    // Run detection on non-cached adapters
    for (const [registryKey, adapter] of adaptersToCheck) {
      const adapterStartTime = performance.now();

      try {
        const confidence = adapter.detectConfidence(buffer);
        const adapterEndTime = performance.now();

        // Override the adapterName with the registry key for consistency
        const normalizedConfidence = {
          ...confidence,
          adapterName: registryKey,
        };

        confidenceResults.push(normalizedConfidence);

        if (this.config.enableDetailedTiming) {
          adapterTimings.push({
            adapterName: registryKey,
            timeMs: Math.round((adapterEndTime - adapterStartTime) * 100) / 100,
            cached: false,
            confidenceScore: normalizedConfidence.score,
          });
        }

        // Cache the result if caching is enabled
        if (this.config.enableCaching) {
          this.signatureCache.set(buffer, normalizedConfidence);
        }

        // Early exit check
        if (
          this.config.enableEarlyExit &&
          normalizedConfidence.score >= this.config.earlyExitThreshold
        ) {
          this.lastEarlyExit = true;
          break;
        }

        // Timeout check
        if (performance.now() - startTime > this.config.maxDetectionTimeMs) {
          break;
        }
      } catch (error) {
        const adapterEndTime = performance.now();

        // Create error result
        const errorResult = {
          adapterName: registryKey,
          score: 0.0,
          evidence: `Error during detection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        } as FormatConfidence;

        confidenceResults.push(errorResult);

        if (this.config.enableDetailedTiming) {
          adapterTimings.push({
            adapterName: registryKey,
            timeMs: Math.round((adapterEndTime - adapterStartTime) * 100) / 100,
            cached: false,
            confidenceScore: 0.0,
          });
        }
      }
    }

    const endTime = performance.now();

    // Sort by score in descending order (highest confidence first)
    const sortedResults = confidenceResults.sort((a, b) => b.score - a.score);

    // Determine best match (highest scoring adapter with score > 0)
    const bestMatch =
      sortedResults.length > 0 && sortedResults[0] && sortedResults[0].score > 0
        ? sortedResults[0].adapterName
        : null;

    return {
      bestMatch,
      confidenceScores: sortedResults,
      performance: {
        totalTimeMs: Math.round((endTime - startTime) * 100) / 100,
        earlyExitTriggered: this.lastEarlyExit,
        adapterTimings: adapterTimings.sort(
          (a, b) => b.confidenceScore - a.confidenceScore
        ),
        cacheStats: this.signatureCache.getStats(),
      },
    };
  }

  /**
   * Override the parent detectFormatWithConfidence to use optimizations
   */
  async detectFormatWithConfidence(
    input: Buffer | NodeJS.ReadableStream
  ): Promise<FormatDetectionResult> {
    const optimizedResult = await this.detectFormatOptimized(input);

    // Return basic FormatDetectionResult for compatibility
    return {
      bestMatch: optimizedResult.bestMatch,
      confidenceScores: optimizedResult.confidenceScores,
    };
  }

  /**
   * Get cached results for buffer
   */
  private async getCachedResults(
    buffer: Buffer
  ): Promise<Array<{ confidence: FormatConfidence }>> {
    if (!this.config.enableCaching) {
      return [];
    }

    const results: Array<{ confidence: FormatConfidence }> = [];

    // Check if we have a cached result for this exact buffer
    const cachedResult = this.signatureCache.get(buffer);
    if (cachedResult) {
      results.push({ confidence: cachedResult });
    }

    return results;
  }

  /**
   * Convert ReadableStream to Buffer
   */
  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      stream.on('data', chunk => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on('error', error => {
        reject(error);
      });
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return this.signatureCache.getStats();
  }

  /**
   * Get whether last detection triggered early exit
   */
  getLastEarlyExit(): boolean {
    return this.lastEarlyExit;
  }

  /**
   * Clear the signature cache
   */
  clearCache(): void {
    this.signatureCache.clear();
  }

  /**
   * Update optimization configuration
   */
  updateOptimizationConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current optimization configuration
   */
  getOptimizationConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * Export performance metrics
   */
  exportPerformanceMetrics(): {
    config: OptimizationConfig;
    cacheStats: CacheStats;
    lastEarlyExit: boolean;
  } {
    return {
      config: this.getOptimizationConfig(),
      cacheStats: this.getCacheStats(),
      lastEarlyExit: this.lastEarlyExit,
    };
  }

  /**
   * Run a performance benchmark on a specific dataset
   */
  async benchmarkDetection(
    data: Buffer,
    iterations: number = 10
  ): Promise<{
    averageTimeMs: number;
    minTimeMs: number;
    maxTimeMs: number;
    cacheHitRate: number;
    earlyExitRate: number;
    results: OptimizedDetectionResult[];
  }> {
    const results: OptimizedDetectionResult[] = [];
    let earlyExits = 0;

    // Clear cache to get accurate first-run timing
    const initialCacheStats = this.getCacheStats();

    for (let i = 0; i < iterations; i++) {
      // Clear cache every few iterations to test cold performance
      if (i % 3 === 0) {
        this.clearCache();
      }

      const result = await this.detectFormatOptimized(data);
      results.push(result);

      if (result.performance.earlyExitTriggered) {
        earlyExits++;
      }
    }

    const times = results.map(r => r.performance.totalTimeMs);
    const finalCacheStats = this.getCacheStats();

    return {
      averageTimeMs: times.reduce((sum, time) => sum + time, 0) / times.length,
      minTimeMs: Math.min(...times),
      maxTimeMs: Math.max(...times),
      cacheHitRate: finalCacheStats.hitRate,
      earlyExitRate: (earlyExits / iterations) * 100,
      results,
    };
  }

  /**
   * Warm up the cache with common data patterns
   */
  async warmupCache(sampleData: Buffer[]): Promise<void> {
    console.log(`🔥 Warming up cache with ${sampleData.length} samples...`);

    for (const data of sampleData) {
      await this.detectFormatOptimized(data);
    }

    const stats = this.getCacheStats();
    console.log(
      `✅ Cache warmed up: ${stats.size} entries, ${stats.memoryUsageBytes} bytes`
    );
  }
}
