import { getOptimizedAIFactor, calculateBatchAI, getRegionMultiplier } from './optimized/factors';
import { featureFlags } from './optimized/feature-flags';
import { performanceTracker, measurePerformance } from './optimized/performance';

/**
 * Cloud-only entry point for tree-shaking
 * Minimal bundle focused on cloud emissions calculations
 */

import { getCloudFactor, CLOUD_FACTORS } from './factors';

// Local types for minimal bundle
interface CloudEmissionData {
  id: string;
  timestamp: string;
  source: string;
  amount: number;
  unit: 'g' | 'kg';
  category: 'cloud';
  confidence?: { low: number; high: number };
  provider?: string;
  service?: string;
  region?: string;
}

interface CloudCalculationOptions {
  region?: string;
  timestamp?: Date;
  includeUncertainty?: boolean;
  provider?: string;
}

/**
 * Lightweight cloud emissions calculator
 * Optimized for minimal bundle size and maximum performance
 */
export class CloudEmissionsCalculator {
  private factorCache = new Map<string, any>();
  private regionCache = new Map<string, number>();

  /**
   * Calculate cloud compute emissions
   */
  calculateComputeEmissions(
    cpuHours: number,
    instanceType: string,
    options: CloudCalculationOptions = {}
  ): CloudEmissionData {
    const factor = this.getCachedFactor(instanceType);
    if (!factor) {
      throw new Error(`Unknown instance type: ${instanceType}`);
    }

    const regionMultiplier = this.getRegionMultiplier(options.region || 'us-east-1');
    const amount = cpuHours * factor.co2PerHour * regionMultiplier;

    return {
      id: `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: options.timestamp?.toISOString() || new Date().toISOString(),
      source: `${instanceType}_compute`,
      amount: Math.round(amount * 1000) / 1000,
      unit: 'g',
      category: 'cloud',
      confidence: factor.confidence,
      provider: options.provider,
      region: options.region
    };
  }

  /**
   * Calculate storage emissions
   */
  calculateStorageEmissions(
    storageGB: number,
    storageType: string,
    options: CloudCalculationOptions = {}
  ): CloudEmissionData {
    const factor = this.getCachedFactor(storageType);
    if (!factor) {
      throw new Error(`Unknown storage type: ${storageType}`);
    }

    const regionMultiplier = this.getRegionMultiplier(options.region || 'us-east-1');
    const amount = storageGB * factor.co2PerGBMonth * regionMultiplier;

    return {
      id: `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: options.timestamp?.toISOString() || new Date().toISOString(),
      source: `${storageType}_storage`,
      amount: Math.round(amount * 1000) / 1000,
      unit: 'g',
      category: 'cloud',
      confidence: factor.confidence,
      provider: options.provider,
      service: 'storage',
      region: options.region
    };
  }

  /**
   * Calculate network emissions
   */
  calculateNetworkEmissions(
    dataTransferGB: number,
    transferType: string = 'internet-egress',
    options: CloudCalculationOptions = {}
  ): CloudEmissionData {
    const factor = this.getCachedFactor(transferType);
    if (!factor) {
      throw new Error(`Unknown transfer type: ${transferType}`);
    }

    const regionMultiplier = this.getRegionMultiplier(options.region || 'us-east-1');
    const amount = dataTransferGB * factor.co2PerGB * regionMultiplier;

    return {
      id: `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: options.timestamp?.toISOString() || new Date().toISOString(),
      source: `${transferType}_network`,
      amount: Math.round(amount * 1000) / 1000,
      unit: 'g',
      category: 'cloud',
      confidence: factor.confidence,
      provider: options.provider,
      service: 'network',
      region: options.region
    };
  }

  /**
   * Batch calculate emissions for multiple cloud resources
   */
  calculateBatch(inputs: Array<{
    type: 'compute' | 'storage' | 'network';
    amount: number;
    resourceType: string;
    options?: CloudCalculationOptions;
  }>): CloudEmissionData[] {
    return inputs.map(input => {
      switch (input.type) {
        case 'compute':
          return this.calculateComputeEmissions(input.amount, input.resourceType, input.options);
        case 'storage':
          return this.calculateStorageEmissions(input.amount, input.resourceType, input.options);
        case 'network':
          return this.calculateNetworkEmissions(input.amount, input.resourceType, input.options);
        default:
          throw new Error(`Unknown resource type: ${input.type}`);
      }
    });
  }

  /**
   * Get cached factor with performance optimization
   */
  private getCachedFactor(resourceType: string) {
    if (this.factorCache.has(resourceType)) {
      return this.factorCache.get(resourceType);
    }

    const factor = getCloudFactor(resourceType);
    if (factor) {
      this.factorCache.set(resourceType, factor);
    }

    return factor;
  }

  /**
   * Get region carbon intensity multiplier
   */
  private getRegionMultiplier(region: string): number {
    if (this.regionCache.has(region)) {
      return this.regionCache.get(region)!;
    }

    // Simplified region multipliers for common regions
    const regionMultipliers: Record<string, number> = {
      'us-east-1': 1.0,      // Virginia - baseline
      'us-west-2': 0.3,      // Oregon - clean energy
      'eu-west-1': 0.6,      // Ireland - moderate clean energy
      'eu-north-1': 0.1,     // Stockholm - very clean energy
      'ap-southeast-1': 1.4,  // Singapore - high carbon intensity
      'ap-south-1': 1.8,     // Mumbai - coal heavy
      'ca-central-1': 0.2,   // Canada - clean energy
      'us-west-1': 0.4,      // N. California - clean energy
      'eu-central-1': 0.8,   // Frankfurt - moderate
      'ap-northeast-1': 1.2, // Tokyo - moderate-high
    };

    const multiplier = regionMultipliers[region] || 1.0;
    this.regionCache.set(region, multiplier);
    return multiplier;
  }

  /**
   * Get supported instance types
   */
  getSupportedInstanceTypes(): string[] {
    return Object.keys(CLOUD_FACTORS);
  }

  /**
   * Check if instance type is supported
   */
  isInstanceTypeSupported(instanceType: string): boolean {
    return this.getCachedFactor(instanceType) !== null;
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.factorCache.clear();
    this.regionCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      factorCacheSize: this.factorCache.size,
      regionCacheSize: this.regionCache.size,
      factorKeys: Array.from(this.factorCache.keys()),
      regionKeys: Array.from(this.regionCache.keys())
    };
  }
}

// Default instance for convenience
export const cloudCalculator = new CloudEmissionsCalculator();

// Direct function exports for even smaller bundles
export { getCloudFactor, CLOUD_FACTORS };

/**
 * Quick calculation functions for common AWS instance types
 */
export function calculateEC2T3MicroEmissions(hours: number, region = 'us-east-1'): number {
  const baseEmission = hours * 0.012; // Pre-calculated factor
  const regionMultiplier = region === 'us-west-2' ? 0.3 : 1.0;
  return baseEmission * regionMultiplier;
}

export function calculateEC2T3SmallEmissions(hours: number, region = 'us-east-1'): number {
  const baseEmission = hours * 0.024;
  const regionMultiplier = region === 'us-west-2' ? 0.3 : 1.0;
  return baseEmission * regionMultiplier;
}

export function calculateS3StorageEmissions(storageGB: number, region = 'us-east-1'): number {
  const baseEmission = storageGB * 0.00001; // Per GB per month
  const regionMultiplier = region === 'us-west-2' ? 0.3 : 1.0;
  return baseEmission * regionMultiplier;
}

// Type exports
export type { CloudEmissionData, CloudCalculationOptions };
