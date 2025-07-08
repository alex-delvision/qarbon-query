/**
 * Monte Carlo simulation for uncertainty quantification
 */

import {
  DistributionStats,
  UncertaintyRange,
  ParameterUncertainty,
  EmissionFunction,
} from './types';

/**
 * Generate random samples from different probability distributions
 */
export class RandomSampler {
  private static seededRandom(seed: number): () => number {
    let x = Math.sin(seed) * 10000;
    return () => {
      x = Math.sin(x) * 10000;
      return x - Math.floor(x);
    };
  }

  /**
   * Generate samples from a normal distribution using Box-Muller transform
   */
  static normal(
    mean: number,
    std: number,
    count: number,
    seed?: number
  ): number[] {
    const random = seed ? this.seededRandom(seed) : Math.random;
    const samples: number[] = [];

    for (let i = 0; i < count; i += 2) {
      const u1 = random();
      const u2 = random();

      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);

      samples.push(z0 * std + mean);
      if (samples.length < count) {
        samples.push(z1 * std + mean);
      }
    }

    return samples.slice(0, count);
  }

  /**
   * Generate samples from a uniform distribution
   */
  static uniform(
    min: number,
    max: number,
    count: number,
    seed?: number
  ): number[] {
    const random = seed ? this.seededRandom(seed) : Math.random;
    const samples: number[] = [];

    for (let i = 0; i < count; i++) {
      samples.push(min + (max - min) * random());
    }

    return samples;
  }

  /**
   * Generate samples from a lognormal distribution
   */
  static lognormal(
    mean: number,
    std: number,
    count: number,
    seed?: number
  ): number[] {
    const normalSamples = this.normal(mean, std, count, seed);
    return normalSamples.map(x => Math.exp(x));
  }

  /**
   * Generate samples from a triangular distribution
   */
  static triangular(
    min: number,
    max: number,
    mode: number,
    count: number,
    seed?: number
  ): number[] {
    const random = seed ? this.seededRandom(seed) : Math.random;
    const samples: number[] = [];

    for (let i = 0; i < count; i++) {
      const u = random();
      const fc = (mode - min) / (max - min);

      let x: number;
      if (u < fc) {
        x = min + Math.sqrt(u * (max - min) * (mode - min));
      } else {
        x = max - Math.sqrt((1 - u) * (max - min) * (max - mode));
      }

      samples.push(x);
    }

    return samples;
  }

  /**
   * Generate samples from an uncertainty range
   */
  static fromUncertaintyRange(
    range: UncertaintyRange,
    count: number,
    seed?: number
  ): number[] {
    const { low, high, distribution = 'uniform', params = {} } = range;

    switch (distribution) {
      case 'normal':
        const mean = params.mean ?? (low + high) / 2;
        const std = params.std ?? (high - low) / 4; // 95% within bounds
        return this.normal(mean, std, count, seed);

      case 'uniform':
        return this.uniform(low, high, count, seed);

      case 'lognormal':
        const logMean = params.mean ?? Math.log((low + high) / 2);
        const logStd = params.std ?? Math.log(high / low) / 4;
        return this.lognormal(logMean, logStd, count, seed);

      case 'triangular':
        const mode = params.mode ?? (low + high) / 2;
        return this.triangular(low, high, mode, count, seed);

      default:
        return this.uniform(low, high, count, seed);
    }
  }
}

/**
 * Calculate distribution statistics from samples
 */
export function calculateDistributionStats(
  samples: number[],
  ciLevel: number = 0.95
): DistributionStats {
  const sorted = [...samples].sort((a, b) => a - b);
  const n = sorted.length;

  const mean = samples.reduce((sum, x) => sum + x, 0) / n;
  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

  const variance =
    samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
  const std = Math.sqrt(variance);

  const percentile = (p: number) => {
    const index = (p / 100) * (n - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  const confidenceLevel = ciLevel;
  const alpha = 1 - confidenceLevel;
  const ciLow = percentile((alpha / 2) * 100);
  const ciHigh = percentile((1 - alpha / 2) * 100);

  return {
    mean,
    median,
    std,
    min: sorted[0],
    max: sorted[n - 1],
    percentiles: {
      p5: percentile(5),
      p10: percentile(10),
      p25: percentile(25),
      p75: percentile(75),
      p90: percentile(90),
      p95: percentile(95),
      p99: percentile(99),
    },
    confidenceInterval: {
      level: confidenceLevel,
      low: ciLow,
      high: ciHigh,
    },
    samples: sorted,
  };
}

/**
 * Monte Carlo simulation for uncertainty quantification
 *
 * @param emissionFn - Function that calculates emissions given parameters
 * @param params - Parameter uncertainties
 * @param iterations - Number of Monte Carlo iterations
 * @param ciLevel - Confidence interval level (0.90, 0.95, 0.99)
 * @param seed - Optional seed for reproducible results
 * @returns Distribution statistics
 */
export function monteCarlo(
  emissionFn: EmissionFunction,
  params: ParameterUncertainty,
  iterations: number = 10000,
  ciLevel: number = 0.95,
  seed?: number
): DistributionStats {
  const paramNames = Object.keys(params);
  const samples: number[] = [];

  // Generate parameter samples
  const paramSamples: Record<string, number[]> = {};
  for (const paramName of paramNames) {
    paramSamples[paramName] = RandomSampler.fromUncertaintyRange(
      params[paramName],
      iterations,
      seed ? seed + paramName.length : undefined
    );
  }

  // Run Monte Carlo simulation
  for (let i = 0; i < iterations; i++) {
    const paramValues: Record<string, number> = {};

    for (const paramName of paramNames) {
      paramValues[paramName] = paramSamples[paramName][i];
    }

    try {
      const result = emissionFn(paramValues);
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        samples.push(result);
      }
    } catch (error) {
      // Skip invalid samples
      continue;
    }
  }

  if (samples.length === 0) {
    throw new Error('No valid samples generated from Monte Carlo simulation');
  }

  return calculateDistributionStats(samples, ciLevel);
}

/**
 * Simplified Monte Carlo for basic uncertainty propagation
 */
export function simpleMonteCarloRange(
  emissionFn: EmissionFunction,
  params: ParameterUncertainty,
  iterations: number = 1000,
  ciLevel: number = 0.95
): { low: number; mean: number; high: number } {
  const stats = monteCarlo(emissionFn, params, iterations, ciLevel);
  return {
    low: stats.confidenceInterval.low,
    mean: stats.mean,
    high: stats.confidenceInterval.high,
  };
}
