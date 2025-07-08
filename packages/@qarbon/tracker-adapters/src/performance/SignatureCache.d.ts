/**
 * Signature Cache System
 *
 * Implements intelligent caching of detection results to avoid redundant
 * parsing operations on identical or similar data signatures.
 */
import { FormatConfidence } from '../UniversalTrackerRegistry.js';
export interface CacheEntry {
  /** Cached detection result */
  confidence: FormatConfidence;
  /** Timestamp when entry was created */
  timestamp: number;
  /** Number of times this entry has been accessed */
  hitCount: number;
  /** Size of original data in bytes */
  dataSizeBytes: number;
  /** Optional metadata about the cached result */
  metadata?: {
    adapterName: string;
    evidenceHash: string;
  };
}
export interface CacheStats {
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Current cache size (number of entries) */
  size: number;
  /** Total memory usage estimate in bytes */
  memoryUsageBytes: number;
  /** Hit rate as percentage */
  hitRate: number;
}
export interface CacheConfig {
  /** Maximum number of entries to keep in cache */
  maxEntries: number;
  /** TTL for cache entries in milliseconds */
  ttlMs: number;
  /** Maximum data size to cache (in bytes) */
  maxDataSize: number;
  /** Whether to use content-based hashing */
  useContentHashing: boolean;
  /** Whether to cache low-confidence results */
  cacheLowConfidence: boolean;
  /** Minimum confidence score to cache */
  minConfidenceToCache: number;
}
export declare class SignatureCache {
  private cache;
  private stats;
  private config;
  constructor(config?: Partial<CacheConfig>);
  /**
   * Generate cache key for input data
   */
  private generateCacheKey;
  /**
   * Check if we should cache this result
   */
  private shouldCache;
  /**
   * Clean up expired entries
   */
  private cleanupExpired;
  /**
   * Evict least recently used entries if cache is full
   */
  private evictIfNeeded;
  /**
   * Get cached result for input
   */
  get(input: Buffer): FormatConfidence | null;
  /**
   * Store result in cache
   */
  set(input: Buffer, confidence: FormatConfidence): void;
  /**
   * Get cache statistics
   */
  getStats(): CacheStats;
  /**
   * Clear all cached entries
   */
  clear(): void;
  /**
   * Get current cache configuration
   */
  getConfig(): CacheConfig;
  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void;
  /**
   * Export cache contents for debugging
   */
  exportCache(): Array<{
    key: string;
    entry: CacheEntry;
  }>;
  /**
   * Import cache contents (useful for testing or persistence)
   */
  importCache(
    data: Array<{
      key: string;
      entry: CacheEntry;
    }>
  ): void;
  /**
   * Get cache entry by key (for debugging)
   */
  getEntry(key: string): CacheEntry | undefined;
  /**
   * Check if cache contains key
   */
  has(input: Buffer): boolean;
  /**
   * Remove specific cache entry
   */
  delete(input: Buffer): boolean;
  /**
   * Get all cache keys
   */
  keys(): string[];
  /**
   * Get cache utilization as percentage
   */
  getUtilization(): number;
}
//# sourceMappingURL=SignatureCache.d.ts.map
