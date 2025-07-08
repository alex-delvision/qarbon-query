/**
 * Signature Cache System
 *
 * Implements intelligent caching of detection results to avoid redundant
 * parsing operations on identical or similar data signatures.
 */
import { createHash } from 'crypto';
export class SignatureCache {
  cache = new Map();
  stats = {
    hits: 0,
    misses: 0,
  };
  config;
  constructor(config = {}) {
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
  generateCacheKey(input) {
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
  shouldCache(confidence, dataSizeBytes) {
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
  cleanupExpired() {
    const now = Date.now();
    const expiredKeys = [];
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
  evictIfNeeded() {
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
  get(input) {
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
  set(input, confidence) {
    if (!this.shouldCache(confidence, input.length)) {
      return;
    }
    this.cleanupExpired();
    this.evictIfNeeded();
    const key = this.generateCacheKey(input);
    const entry = {
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
  getStats() {
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
  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }
  /**
   * Get current cache configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Update cache configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    // Clean up if max entries was reduced
    if (this.cache.size > this.config.maxEntries) {
      this.evictIfNeeded();
    }
  }
  /**
   * Export cache contents for debugging
   */
  exportCache() {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry,
    }));
  }
  /**
   * Import cache contents (useful for testing or persistence)
   */
  importCache(data) {
    this.cache.clear();
    for (const { key, entry } of data) {
      this.cache.set(key, entry);
    }
  }
  /**
   * Get cache entry by key (for debugging)
   */
  getEntry(key) {
    return this.cache.get(key);
  }
  /**
   * Check if cache contains key
   */
  has(input) {
    const key = this.generateCacheKey(input);
    return this.cache.has(key);
  }
  /**
   * Remove specific cache entry
   */
  delete(input) {
    const key = this.generateCacheKey(input);
    return this.cache.delete(key);
  }
  /**
   * Get all cache keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }
  /**
   * Get cache utilization as percentage
   */
  getUtilization() {
    return Math.round((this.cache.size / this.config.maxEntries) * 10000) / 100;
  }
}
//# sourceMappingURL=SignatureCache.js.map
