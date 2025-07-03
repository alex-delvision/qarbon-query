/**
 * Signature Cache System
 *
 * Implements intelligent caching of detection results to avoid redundant
 * parsing operations on identical or similar data signatures.
 */

import { createHash } from 'crypto';
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

export class SignatureCache {
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
  };
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxEntries: 1000,
      ttlMs: 5 * 60 * 1000, // 5 minutes
      maxDataSize: 1024 * 1024, // 1MB
      useContentHashing: true,
      cacheLowConfidence: false,
      minConfidenceToCache: 0.3,
      ...config,
    };
  }

  /**
   * Generate cache key for input data
   */
  private generateCacheKey(input: Buffer): string {
    if (!this.config.useContentHashing) {
      // Simple size-based key for very large data
      return `size_${input.length}_${input.slice(0, 64).toString('hex')}`;
    }

    // For smaller data, use full content hash
    if (input.length <= this.config.maxDataSize) {
      return createHash('sha256').update(input).digest('hex');
    }

    // For large data, use a combination of size, start, middle, and end chunks
    const start = input.slice(0, 256);
    const middle = input.slice(
      Math.floor(input.length / 2) - 128,
      Math.floor(input.length / 2) + 128
    );
    const end = input.slice(-256);

    const combinedHash = createHash('sha256')
      .update(start)
      .update(middle)
      .update(end)
      .update(Buffer.from(input.length.toString()))
      .digest('hex');

    return `large_${combinedHash}`;
  }

  /**
   * Check if we should cache this result
   */
  private shouldCache(
    confidence: FormatConfidence,
    dataSizeBytes: number
  ): boolean {
    // Don't cache very large data
    if (dataSizeBytes > this.config.maxDataSize) {
      return false;
    }

    // Don't cache low confidence results if disabled
    if (
      !this.config.cacheLowConfidence &&
      confidence.score < this.config.minConfidenceToCache
    ) {
      return false;
    }

    return true;
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttlMs) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
    }
  }

  /**
   * Evict least recently used entries if cache is full
   */
  private evictIfNeeded(): void {
    if (this.cache.size <= this.config.maxEntries) {
      return;
    }

    // Sort by hit count and timestamp (LRU with usage consideration)
    const entries = Array.from(this.cache.entries()).sort((a, b) => {
      const aScore = a[1].hitCount + (Date.now() - a[1].timestamp) / 1000000;
      const bScore = b[1].hitCount + (Date.now() - b[1].timestamp) / 1000000;
      return aScore - bScore;
    });

    // Remove bottom 20% of entries
    const toRemove = Math.ceil(this.config.maxEntries * 0.2);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      const entry = entries[i];
      if (entry) {
        this.cache.delete(entry[0]);
      }
    }
  }

  /**
   * Get cached result for input
   */
  get(input: Buffer): FormatConfidence | null {
    this.cleanupExpired();

    const key = this.generateCacheKey(input);
    const entry = this.cache.get(key);

    if (entry) {
      entry.hitCount++;
      entry.timestamp = Date.now(); // Update for LRU
      this.stats.hits++;
      return entry.confidence;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Store result in cache
   */
  set(input: Buffer, confidence: FormatConfidence): void {
    if (!this.shouldCache(confidence, input.length)) {
      return;
    }

    this.cleanupExpired();
    this.evictIfNeeded();

    const key = this.generateCacheKey(input);
    const entry: CacheEntry = {
      confidence: { ...confidence }, // Deep copy
      timestamp: Date.now(),
      hitCount: 0,
      dataSizeBytes: input.length,
      metadata: {
        adapterName: confidence.adapterName,
        evidenceHash: createHash('md5')
          .update(confidence.evidence)
          .digest('hex'),
      },
    };

    this.cache.set(key, entry);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate =
      totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    // Estimate memory usage
    let memoryUsageBytes = 0;
    for (const entry of this.cache.values()) {
      // Rough estimation: object overhead + strings + numbers
      memoryUsageBytes +=
        200 +
        entry.confidence.evidence.length * 2 +
        entry.confidence.adapterName.length * 2;
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      memoryUsageBytes,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get current cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Clean up if max entries was reduced
    if (this.cache.size > this.config.maxEntries) {
      this.evictIfNeeded();
    }
  }

  /**
   * Export cache contents for debugging
   */
  exportCache(): Array<{ key: string; entry: CacheEntry }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry,
    }));
  }

  /**
   * Import cache contents (useful for testing or persistence)
   */
  importCache(data: Array<{ key: string; entry: CacheEntry }>): void {
    this.cache.clear();
    for (const { key, entry } of data) {
      this.cache.set(key, entry);
    }
  }

  /**
   * Get cache entry by key (for debugging)
   */
  getEntry(key: string): CacheEntry | undefined {
    return this.cache.get(key);
  }

  /**
   * Check if cache contains key
   */
  has(input: Buffer): boolean {
    const key = this.generateCacheKey(input);
    return this.cache.has(key);
  }

  /**
   * Remove specific cache entry
   */
  delete(input: Buffer): boolean {
    const key = this.generateCacheKey(input);
    return this.cache.delete(key);
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache utilization as percentage
   */
  getUtilization(): number {
    return Math.round((this.cache.size / this.config.maxEntries) * 10000) / 100;
  }
}
