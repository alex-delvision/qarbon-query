import { getOptimizedAIFactor, calculateBatchAI, getRegionMultiplier } from './optimized/factors';
import { featureFlags } from './optimized/feature-flags';
import { performanceTracker, measurePerformance } from './optimized/performance';

/**
 * Crypto-only entry point for tree-shaking
 * Minimal bundle focused on cryptocurrency emissions calculations
 */

import { getCryptoFactor, CRYPTO_FACTORS } from './factors';

// Local types for minimal bundle
interface CryptoEmissionData {
  id: string;
  timestamp: string;
  source: string;
  amount: number;
  unit: 'g' | 'kg';
  category: 'crypto';
  confidence?: { low: number; high: number };
  currency?: string;
  network?: string;
  transactionType?: string;
}

interface CryptoCalculationOptions {
  timestamp?: Date;
  includeUncertainty?: boolean;
  network?: string;
  transactionType?: 'transfer' | 'mint' | 'smart_contract';
}

/**
 * Lightweight crypto emissions calculator
 * Optimized for minimal bundle size and maximum performance
 */
export class CryptoEmissionsCalculator {
  private factorCache = new Map<string, any>();
  private networkCache = new Map<string, number>();

  /**
   * Calculate transaction emissions
   */
  calculateTransactionEmissions(
    transactionCount: number,
    currency: string,
    options: CryptoCalculationOptions = {}
  ): CryptoEmissionData {
    const factor = this.getCachedFactor(currency);
    if (!factor) {
      throw new Error(`Unknown cryptocurrency: ${currency}`);
    }

    const networkMultiplier = this.getNetworkMultiplier(options.network || 'mainnet');
    const typeMultiplier = this.getTransactionTypeMultiplier(options.transactionType || 'transfer');
    const amount = transactionCount * factor.co2PerTransaction * networkMultiplier * typeMultiplier;

    return {
      id: `crypto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: options.timestamp?.toISOString() || new Date().toISOString(),
      source: `${currency}_transaction`,
      amount: Math.round(amount * 1000) / 1000,
      unit: 'g',
      category: 'crypto',
      confidence: factor.confidence,
      currency,
      network: options.network,
      transactionType: options.transactionType
    };
  }

  /**
   * Calculate mining emissions
   */
  calculateMiningEmissions(
    hashRate: number,
    currency: string,
    durationHours: number,
    options: CryptoCalculationOptions = {}
  ): CryptoEmissionData {
    const factor = this.getCachedFactor(currency);
    if (!factor) {
      throw new Error(`Unknown cryptocurrency: ${currency}`);
    }

    const networkMultiplier = this.getNetworkMultiplier(options.network || 'mainnet');
    const amount = hashRate * durationHours * factor.co2PerHashPerHour * networkMultiplier;

    return {
      id: `crypto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: options.timestamp?.toISOString() || new Date().toISOString(),
      source: `${currency}_mining`,
      amount: Math.round(amount * 1000) / 1000,
      unit: 'g',
      category: 'crypto',
      confidence: factor.confidence,
      currency,
      network: options.network,
      transactionType: 'mining'
    };
  }

  /**
   * Calculate staking emissions (for PoS currencies)
   */
  calculateStakingEmissions(
    stakedAmount: number,
    currency: string,
    durationHours: number,
    options: CryptoCalculationOptions = {}
  ): CryptoEmissionData {
    const factor = this.getCachedFactor(currency);
    if (!factor) {
      throw new Error(`Unknown cryptocurrency: ${currency}`);
    }

    if (!factor.co2PerStakedTokenPerHour) {
      throw new Error(`${currency} does not support staking emissions calculation`);
    }

    const networkMultiplier = this.getNetworkMultiplier(options.network || 'mainnet');
    const amount = stakedAmount * durationHours * factor.co2PerStakedTokenPerHour * networkMultiplier;

    return {
      id: `crypto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: options.timestamp?.toISOString() || new Date().toISOString(),
      source: `${currency}_staking`,
      amount: Math.round(amount * 1000) / 1000,
      unit: 'g',
      category: 'crypto',
      confidence: factor.confidence,
      currency,
      network: options.network,
      transactionType: 'staking'
    };
  }

  /**
   * Batch calculate emissions for multiple crypto operations
   */
  calculateBatch(inputs: Array<{
    type: 'transaction' | 'mining' | 'staking';
    amount: number;
    currency: string;
    duration?: number;
    options?: CryptoCalculationOptions;
  }>): CryptoEmissionData[] {
    return inputs.map(input => {
      switch (input.type) {
        case 'transaction':
          return this.calculateTransactionEmissions(input.amount, input.currency, input.options);
        case 'mining':
          return this.calculateMiningEmissions(input.amount, input.currency, input.duration || 1, input.options);
        case 'staking':
          return this.calculateStakingEmissions(input.amount, input.currency, input.duration || 1, input.options);
        default:
          throw new Error(`Unknown operation type: ${input.type}`);
      }
    });
  }

  /**
   * Get cached factor with performance optimization
   */
  private getCachedFactor(currency: string) {
    if (this.factorCache.has(currency)) {
      return this.factorCache.get(currency);
    }

    const factor = getCryptoFactor(currency);
    if (factor) {
      this.factorCache.set(currency, factor);
    }

    return factor;
  }

  /**
   * Get network multiplier for different blockchain networks
   */
  private getNetworkMultiplier(network: string): number {
    if (this.networkCache.has(network)) {
      return this.networkCache.get(network)!;
    }

    const networkMultipliers: Record<string, number> = {
      'mainnet': 1.0,
      'testnet': 0.1,
      'polygon': 0.001,
      'bsc': 0.005,
      'arbitrum': 0.01,
      'optimism': 0.01,
      'avalanche': 0.1,
      'solana': 0.0001,
      'cardano': 0.001,
      'lightning': 0.0001
    };

    const multiplier = networkMultipliers[network] || 1.0;
    this.networkCache.set(network, multiplier);
    return multiplier;
  }

  /**
   * Get transaction type multiplier
   */
  private getTransactionTypeMultiplier(transactionType: string): number {
    const typeMultipliers: Record<string, number> = {
      'transfer': 1.0,
      'mint': 2.0,
      'smart_contract': 3.0,
      'mining': 1.0,
      'staking': 0.1
    };

    return typeMultipliers[transactionType] || 1.0;
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[] {
    return Object.keys(CRYPTO_FACTORS);
  }

  /**
   * Check if currency is supported
   */
  isCurrencySupported(currency: string): boolean {
    return this.getCachedFactor(currency) !== null;
  }

  /**
   * Get currency details
   */
  getCurrencyDetails(currency: string) {
    return this.getCachedFactor(currency);
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.factorCache.clear();
    this.networkCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      factorCacheSize: this.factorCache.size,
      networkCacheSize: this.networkCache.size,
      factorKeys: Array.from(this.factorCache.keys()),
      networkKeys: Array.from(this.networkCache.keys())
    };
  }
}

// Default instance for convenience
export const cryptoCalculator = new CryptoEmissionsCalculator();

// Direct function exports for even smaller bundles
export { getCryptoFactor, CRYPTO_FACTORS };

/**
 * Quick calculation functions for popular cryptocurrencies
 */
export function calculateBitcoinTransactionEmissions(transactions: number): number {
  return transactions * 707; // Pre-calculated factor in grams
}

export function calculateEthereumTransactionEmissions(transactions: number): number {
  return transactions * 0.0212; // Post-merge PoS emissions
}

export function calculateLitecoinTransactionEmissions(transactions: number): number {
  return transactions * 18.5;
}

export function calculateDogecoinTransactionEmissions(transactions: number): number {
  return transactions * 0.12;
}

export function calculateSolanaTransactionEmissions(transactions: number): number {
  return transactions * 0.00051;
}

export function calculateCardanoTransactionEmissions(transactions: number): number {
  return transactions * 0.0012;
}

// Type exports
export type { CryptoEmissionData, CryptoCalculationOptions };
