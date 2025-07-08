/**
 * Adapter core system for emissions data processing
 * Provides base adapter functionality and registry for auto-detection
 */

// Types and interfaces
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface NormalizedData {
  [key: string]: any;
}

export interface AdapterMetadata {
  name: string;
  version: string;
  description?: string;
  supportedFormats?: string[];
  confidence?: number;
}

export interface DetectionHeuristic {
  weight: number;
  test: (data: any) => boolean | number;
}

// Base adapter abstract class
export abstract class BaseAdapter<I = any> {
  protected metadata: AdapterMetadata;

  constructor(metadata: AdapterMetadata) {
    this.metadata = metadata;
  }

  /**
   * Validate input data structure and content
   */
  abstract validate(input: I): ValidationResult;

  /**
   * Normalize input data to standard format
   * Supports both sync and async implementations via overloading
   */
  abstract normalize(input: I): NormalizedData | Promise<NormalizedData>;

  /**
   * Get confidence score for handling this input type
   * @param input - Input data to evaluate
   * @returns Confidence score between 0 and 1
   */
  abstract getConfidence(input: I): number;

  /**
   * Get adapter metadata
   */
  getMetadata(): AdapterMetadata {
    return { ...this.metadata };
  }

  /**
   * Get detection heuristics for this adapter
   */
  protected abstract getDetectionHeuristics(): DetectionHeuristic[];

  /**
   * Calculate heuristic-based confidence score
   */
  protected calculateHeuristicConfidence(data: any): number {
    const heuristics = this.getDetectionHeuristics();
    let totalWeight = 0;
    let weightedScore = 0;

    for (const heuristic of heuristics) {
      const result = heuristic.test(data);
      const score = typeof result === 'boolean' ? (result ? 1 : 0) : result;

      weightedScore += score * heuristic.weight;
      totalWeight += heuristic.weight;
    }

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  }
}

// Vector similarity utilities for ML-based detection
class VectorSimilarity {
  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i]! * vectorB[i]!;
      normA += vectorA[i]! * vectorA[i]!;
      normB += vectorB[i]! * vectorB[i]!;
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Extract feature vector from data for similarity comparison
   */
  static extractFeatureVector(data: any): number[] {
    const features: number[] = [];

    // Basic structural features
    features.push(typeof data === 'object' ? 1 : 0);
    features.push(Array.isArray(data) ? 1 : 0);
    features.push(data === null ? 1 : 0);

    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      features.push(keys.length);

      // Common field presence indicators
      const commonFields = [
        'emissions',
        'carbon',
        'co2',
        'energy',
        'fuel',
        'electricity',
      ];
      for (const field of commonFields) {
        features.push(keys.some(k => k.toLowerCase().includes(field)) ? 1 : 0);
      }
    } else {
      features.push(0);
      features.push(...new Array(6).fill(0));
    }

    return features;
  }
}

// Fuzzy matching utilities
class FuzzyRules {
  /**
   * Apply fuzzy rules for adapter detection
   */
  static evaluateRules(data: any, adapterName: string): number {
    let score = 0;
    const rules = this.getRulesForAdapter(adapterName);

    for (const rule of rules) {
      if (rule.condition(data)) {
        score += rule.weight;
      }
    }

    return Math.min(score, 1); // Cap at 1.0
  }

  /**
   * Get fuzzy rules for a specific adapter
   */
  private static getRulesForAdapter(
    _adapterName: string
  ): Array<{ condition: (data: any) => boolean; weight: number }> {
    // Default fuzzy rules - can be extended per adapter
    return [
      {
        condition: data => typeof data === 'object' && data !== null,
        weight: 0.2,
      },
      {
        condition: data => {
          if (typeof data === 'object' && data !== null) {
            const keys = Object.keys(data).map(k => k.toLowerCase());
            return keys.some(
              k =>
                k.includes('emission') ||
                k.includes('carbon') ||
                k.includes('co2')
            );
          }
          return false;
        },
        weight: 0.4,
      },
      {
        condition: data => {
          if (Array.isArray(data) && data.length > 0) {
            return typeof data[0] === 'object';
          }
          return false;
        },
        weight: 0.3,
      },
    ];
  }
}

// Adapter registry
export class AdapterRegistry {
  private adapters: Map<string, BaseAdapter> = new Map();
  private adapterVectors: Map<string, number[]> = new Map();

  /**
   * Register an adapter
   */
  registerAdapter(adapter: BaseAdapter): void {
    const metadata = adapter.getMetadata();
    this.adapters.set(metadata.name, adapter);

    // Pre-calculate feature vectors for known data patterns
    // This would typically be done with training data
    this.adapterVectors.set(metadata.name, this.generateAdapterVector(adapter));
  }

  /**
   * Unregister an adapter
   */
  unregisterAdapter(adapterName: string): boolean {
    const removed = this.adapters.delete(adapterName);
    this.adapterVectors.delete(adapterName);
    return removed;
  }

  /**
   * Get all registered adapters
   */
  getAdapters(): BaseAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get adapter by name
   */
  getAdapter(name: string): BaseAdapter | undefined {
    return this.adapters.get(name);
  }

  /**
   * Auto-detect best adapter for given data
   * Uses heuristic + ML cosine similarity with fuzzy rules fallback
   */
  autoDetect(data: any): BaseAdapter | null {
    if (this.adapters.size === 0) {
      return null;
    }

    const candidates: Array<{ adapter: BaseAdapter; score: number }> = [];
    const inputVector = VectorSimilarity.extractFeatureVector(data);

    for (const [name, adapter] of Array.from(this.adapters.entries())) {
      let score = 0;

      // 1. Heuristic-based confidence from adapter
      const heuristicScore = adapter.getConfidence(data);
      score += heuristicScore * 0.4;

      // 2. ML cosine similarity
      const adapterVector = this.adapterVectors.get(name);
      if (adapterVector) {
        const similarity = VectorSimilarity.cosineSimilarity(
          inputVector,
          adapterVector
        );
        score += similarity * 0.4;
      }

      // 3. Fuzzy rules fallback
      const fuzzyScore = FuzzyRules.evaluateRules(data, name);
      score += fuzzyScore * 0.2;

      candidates.push({ adapter, score });
    }

    // Sort by score (descending) and return the best match
    candidates.sort((a, b) => b.score - a.score);

    // Return the best adapter if confidence is above threshold
    const bestCandidate = candidates[0];
    return bestCandidate && bestCandidate.score > 0.5
      ? bestCandidate.adapter
      : null;
  }

  /**
   * Generate feature vector for an adapter (simplified version)
   */
  private generateAdapterVector(adapter: BaseAdapter): number[] {
    const metadata = adapter.getMetadata();
    const vector: number[] = [];

    // Basic metadata features
    vector.push(metadata.name.length / 20); // Normalized name length
    vector.push(
      metadata.supportedFormats ? metadata.supportedFormats.length / 10 : 0
    );
    vector.push(metadata.confidence || 0.5);

    // Pad or truncate to fixed length
    const targetLength = 10;
    while (vector.length < targetLength) {
      vector.push(0);
    }

    return vector.slice(0, targetLength);
  }
}

// Singleton registry instance
export const adapterRegistry = new AdapterRegistry();

// Convenience function for third-party registration
export function registerAdapter(adapter: BaseAdapter): void {
  adapterRegistry.registerAdapter(adapter);
}

// Export types for external use
export type { BaseAdapter as BaseAdapterType };
