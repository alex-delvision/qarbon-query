/**
 * Optimized Universal Tracker Registry
 *
 * Enhanced version with performance optimizations:
 * - Early-exit checks for high-confidence hits
 * - Signature caching to avoid double parsing
 * - Detailed performance metrics
 */
import { performance } from 'perf_hooks';
import { UniversalTrackerRegistry } from './UniversalTrackerRegistry.js';
import { SignatureCache } from './performance/SignatureCache.js';
export class OptimizedUniversalTrackerRegistry extends UniversalTrackerRegistry {
  signatureCache;
  config;
  lastEarlyExit = false;
  constructor(initial = {}, optimizationConfig = {}) {
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
  async detectFormatOptimized(input) {
    const startTime = performance.now();
    this.lastEarlyExit = false;
    // Convert ReadableStream to Buffer if needed
    const buffer =
      input instanceof Buffer ? input : await this.streamToBuffer(input);
    const adapterTimings = [];
    const confidenceResults = [];
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
    const adaptersMap = this.adapters;
    const adaptersToCheck = [];
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
        };
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
  async detectFormatWithConfidence(input) {
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
  async getCachedResults(buffer) {
    if (!this.config.enableCaching) {
      return [];
    }
    const results = [];
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
  async streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
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
  getCacheStats() {
    return this.signatureCache.getStats();
  }
  /**
   * Get whether last detection triggered early exit
   */
  getLastEarlyExit() {
    return this.lastEarlyExit;
  }
  /**
   * Clear the signature cache
   */
  clearCache() {
    this.signatureCache.clear();
  }
  /**
   * Update optimization configuration
   */
  updateOptimizationConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  /**
   * Get current optimization configuration
   */
  getOptimizationConfig() {
    return { ...this.config };
  }
  /**
   * Export performance metrics
   */
  exportPerformanceMetrics() {
    return {
      config: this.getOptimizationConfig(),
      cacheStats: this.getCacheStats(),
      lastEarlyExit: this.lastEarlyExit,
    };
  }
  /**
   * Run a performance benchmark on a specific dataset
   */
  async benchmarkDetection(data, iterations = 10) {
    const results = [];
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
  async warmupCache(sampleData) {
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
//# sourceMappingURL=OptimizedUniversalTrackerRegistry.js.map
