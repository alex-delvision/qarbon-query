/**
 * LRU Cache implementation for emission factors
 * Keyed by model|region for efficient factor lookup
 */

import { CacheEntry } from './types';

/**
 * LRU Cache node
 */
class CacheNode {
  key: string;
  value: CacheEntry;
  prev: CacheNode | null = null;
  next: CacheNode | null = null;

  constructor(key: string, value: CacheEntry) {
    this.key = key;
    this.value = value;
  }
}

/**
 * LRU Cache for emission factors
 */
export class LRUCache {
  private capacity: number;
  private cache: Map<string, CacheNode>;
  private head: CacheNode;
  private tail: CacheNode;
  private hits: number = 0;
  private misses: number = 0;

  constructor(capacity: number = 1000) {
    this.capacity = capacity;
    this.cache = new Map();
    
    // Create dummy head and tail nodes
    this.head = new CacheNode('', { factor: null, timestamp: 0, ttl: 0 });
    this.tail = new CacheNode('', { factor: null, timestamp: 0, ttl: 0 });
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0,
    };
  }

  /**
   * Generate cache key from model and region
   */
  private generateKey(model: string, region: string = 'global'): string {
    return `${model}|${region}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isValidEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  /**
   * Remove node from doubly linked list
   */
  private removeNode(node: CacheNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }
  }

  /**
   * Add node to head of doubly linked list
   */
  private addToHead(node: CacheNode): void {
    node.prev = this.head;
    node.next = this.head.next;
    
    if (this.head.next) {
      this.head.next.prev = node;
    }
    this.head.next = node;
  }

  /**
   * Move node to head (mark as recently used)
   */
  private moveToHead(node: CacheNode): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  /**
   * Remove tail node (least recently used)
   */
  private removeTail(): CacheNode | null {
    const lastNode = this.tail.prev;
    if (lastNode && lastNode !== this.head) {
      this.removeNode(lastNode);
      return lastNode;
    }
    return null;
  }

  /**
   * Get emission factor from cache
   */
  get(model: string, region?: string): any | null {
    const key = this.generateKey(model, region);
    const node = this.cache.get(key);

    if (node && this.isValidEntry(node.value)) {
      // Move to head (mark as recently used)
      this.moveToHead(node);
      this.hits++;
      return node.value.factor;
    }

    // Remove expired entry
    if (node) {
      this.cache.delete(key);
      this.removeNode(node);
    }

    this.misses++;
    return null;
  }

  /**
   * Set emission factor in cache
   */
  set(model: string, factor: any, region?: string, ttl: number = 300000): void {
    const key = this.generateKey(model, region);
    const existingNode = this.cache.get(key);

    const entry: CacheEntry = {
      factor,
      timestamp: Date.now(),
      ttl,
    };

    if (existingNode) {
      // Update existing entry
      existingNode.value = entry;
      this.moveToHead(existingNode);
    } else {
      // Create new entry
      const newNode = new CacheNode(key, entry);
      
      if (this.cache.size >= this.capacity) {
        // Remove least recently used entry
        const tail = this.removeTail();
        if (tail) {
          this.cache.delete(tail.key);
        }
      }
      
      this.cache.set(key, newNode);
      this.addToHead(newNode);
    }
  }

  /**
   * Check if key exists in cache
   */
  has(model: string, region?: string): boolean {
    const key = this.generateKey(model, region);
    const node = this.cache.get(key);
    return node ? this.isValidEntry(node.value) : false;
  }

  /**
   * Remove entry from cache
   */
  delete(model: string, region?: string): boolean {
    const key = this.generateKey(model, region);
    const node = this.cache.get(key);
    
    if (node) {
      this.cache.delete(key);
      this.removeNode(node);
      return true;
    }
    
    return false;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, node] of this.cache) {
      if (!this.isValidEntry(node.value)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      const node = this.cache.get(key);
      if (node) {
        this.cache.delete(key);
        this.removeNode(node);
      }
    }

    return keysToDelete.length;
  }

  /**
   * Get cache entries for debugging
   */
  entries(): Array<{ key: string; value: CacheEntry; age: number }> {
    const now = Date.now();
    const entries: Array<{ key: string; value: CacheEntry; age: number }> = [];

    for (const [key, node] of this.cache) {
      entries.push({
        key,
        value: node.value,
        age: now - node.value.timestamp,
      });
    }

    return entries;
  }
}

// Default global cache instance
export const emissionFactorCache = new LRUCache(1000);
