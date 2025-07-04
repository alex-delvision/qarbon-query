/**
 * AI-only entry point for tree-shaking
 * Minimal bundle focused on AI emissions calculations
 */

import { getOptimizedAIFactor, calculateBatchAI, getRegionMultiplier } from './optimized/factors';
import { featureFlags } from './optimized/feature-flags';
import { performanceTracker, measurePerformance } from './optimized/performance';

import { getAIFactor, AI_FACTORS } from './factors';

// Local types for minimal bundle
interface AIEmissionData {
  id: string;
  timestamp: string;
  source: string;
  amount: number;
  unit: 'g' | 'kg';
  category: 'ai';
  confidence?: { low: number; high: number };
  model?: string;
}

interface AICalculationOptions {
  region?: string;
  timestamp?: Date;
  includeUncertainty?: boolean;
}

/**
 * Lightweight AI emissions calculator
 * Optimized for minimal bundle size and maximum performance
 */
export class AIEmissionsCalculator {
  private factorCache = new Map<string, any>();

  /**
   * Calculate AI emissions for token-based usage
   */
  calculateTokenEmissions(
    tokens: number,
    model: string,
    options: AICalculationOptions = {}
  ): AIEmissionData {
    const factor = this.getCachedFactor(model);
    if (!factor) {
      throw new Error(`Unknown AI model: ${model}`);
    }

    const amount = tokens > 0 
      ? tokens * factor.co2PerToken
      : factor.co2PerQuery || 0;

    return {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: options.timestamp?.toISOString() || new Date().toISOString(),
      source: `${model}_inference`,
      amount: Math.round(amount * 1000) / 1000, // 3 decimal precision
      unit: 'g',
      category: 'ai',
      confidence: factor.confidence,
      model
    };
  }

  /**
   * Calculate AI emissions for query-based usage
   */
  calculateQueryEmissions(
    queries: number,
    model: string,
    options: AICalculationOptions = {}
  ): AIEmissionData {
    const factor = this.getCachedFactor(model);
    if (!factor) {
      throw new Error(`Unknown AI model: ${model}`);
    }

    const amount = queries * (factor.co2PerQuery || factor.co2PerToken * 1000);

    return {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: options.timestamp?.toISOString() || new Date().toISOString(),
      source: `${model}_queries`,
      amount: Math.round(amount * 1000) / 1000,
      unit: 'g',
      category: 'ai',
      confidence: factor.confidence,
      model
    };
  }

  /**
   * Batch calculate emissions for multiple models/inputs
   */
  calculateBatch(inputs: Array<{
    tokens?: number;
    queries?: number;
    model: string;
    options?: AICalculationOptions;
  }>): AIEmissionData[] {
    return inputs.map(input => {
      if (input.tokens !== undefined) {
        return this.calculateTokenEmissions(input.tokens, input.model, input.options);
      } else if (input.queries !== undefined) {
        return this.calculateQueryEmissions(input.queries, input.model, input.options);
      } else {
        throw new Error('Must specify either tokens or queries');
      }
    });
  }

  /**
   * Get cached factor with performance optimization
   */
  private getCachedFactor(model: string) {
    if (this.factorCache.has(model)) {
      return this.factorCache.get(model);
    }

    const factor = getAIFactor(model);
    if (factor) {
      this.factorCache.set(model, factor);
    }

    return factor;
  }

  /**
   * Get all supported models
   */
  getSupportedModels(): string[] {
    return Object.keys(AI_FACTORS);
  }

  /**
   * Check if model is supported
   */
  isModelSupported(model: string): boolean {
    return this.getCachedFactor(model) !== null;
  }

  /**
   * Get model details
   */
  getModelDetails(model: string) {
    return this.getCachedFactor(model);
  }

  /**
   * Clear factor cache
   */
  clearCache(): void {
    this.factorCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.factorCache.size,
      keys: Array.from(this.factorCache.keys())
    };
  }
}

// Default instance for convenience
export const aiCalculator = new AIEmissionsCalculator();

// Direct function exports for even smaller bundles
export { getAIFactor, AI_FACTORS };

/**
 * Quick calculation functions for common use cases
 */
export function calculateGPT4Emissions(tokens: number): number {
  return tokens * 0.0045; // Pre-calculated factor for performance
}

export function calculateGPT35Emissions(tokens: number): number {
  return tokens * 0.0022;
}

export function calculateClaudeEmissions(tokens: number): number {
  return tokens * 0.0006;
}

export function calculateGeminiEmissions(tokens: number): number {
  return tokens * 0.00035;
}

// Type exports
export type { AIEmissionData, AICalculationOptions };
