/**
 * Feature flags for optimizations module
 */

import { FeatureFlags } from './types';

// Default feature flags
const DEFAULT_FEATURES: FeatureFlags = {
  enableBatchOptimizations: true,
  enableWasmCalculations: true,
  enableSIMDOperations: true,
  enableStreaming: true,
  enableCache: true,
  enableFallback: true,
  wasmBatchThreshold: 1000,
  cacheTTL: 300000, // 5 minutes
  maxCacheSize: 1000,
};

/**
 * Feature flags manager
 */
export class FeatureFlagsManager {
  private flags: FeatureFlags;

  constructor(initialFlags?: Partial<FeatureFlags>) {
    this.flags = { ...DEFAULT_FEATURES, ...initialFlags };
  }

  /**
   * Get current feature flags
   */
  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Update feature flags
   */
  updateFlags(updates: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...updates };
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(feature: keyof FeatureFlags): boolean {
    return Boolean(this.flags[feature]);
  }

  /**
   * Get numeric value for a feature
   */
  getValue(feature: keyof FeatureFlags): number {
    const value = this.flags[feature];
    return typeof value === 'number' ? value : 0;
  }

  /**
   * Create a scoped feature flags instance
   */
  createScope(overrides: Partial<FeatureFlags>): FeatureFlagsManager {
    return new FeatureFlagsManager({ ...this.flags, ...overrides });
  }

  /**
   * Reset to default flags
   */
  reset(): void {
    this.flags = { ...DEFAULT_FEATURES };
  }

  /**
   * Load feature flags from environment variables
   */
  loadFromEnv(): void {
    const envFlags: Partial<FeatureFlags> = {};

    // Boolean flags
    const booleanFlags = [
      'enableBatchOptimizations',
      'enableWasmCalculations',
      'enableSIMDOperations',
      'enableStreaming',
      'enableCache',
      'enableFallback',
    ];

    for (const flag of booleanFlags) {
      const envVar = `QARBON_${flag.toUpperCase()}`;
      const value = process.env[envVar];
      if (value !== undefined) {
        (envFlags as any)[flag] = value === 'true' || value === '1';
      }
    }

    // Numeric flags
    const numericFlags = ['wasmBatchThreshold', 'cacheTTL', 'maxCacheSize'];

    for (const flag of numericFlags) {
      const envVar = `QARBON_${flag.toUpperCase()}`;
      const value = process.env[envVar];
      if (value !== undefined) {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
          (envFlags as any)[flag] = numValue;
        }
      }
    }

    this.updateFlags(envFlags);
  }
}

// Default global instance
export const featureFlags = new FeatureFlagsManager();

// Load from environment on module initialization
if (typeof process !== 'undefined' && process.env) {
  featureFlags.loadFromEnv();
}
