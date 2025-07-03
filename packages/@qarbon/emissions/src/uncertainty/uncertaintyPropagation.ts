/**
 * Uncertainty propagation utilities for combining and managing uncertainties
 */

import { UncertaintyRange, ParameterUncertainty, UncertaintyResult } from './types';

/**
 * Propagate uncertainty using linear approximation (Taylor series first-order)
 */
export function linearUncertaintyPropagation(
  partialDerivatives: Record<string, number>,
  uncertainties: ParameterUncertainty
): UncertaintyRange {
  let variance = 0;
  
  for (const [paramName, derivative] of Object.entries(partialDerivatives)) {
    if (paramName in uncertainties) {
      const uncertainty = uncertainties[paramName];
      // Assume uniform distribution and convert to standard deviation
      const std = (uncertainty.high - uncertainty.low) / Math.sqrt(12);
      variance += Math.pow(derivative * std, 2);
    }
  }
  
  const stdDev = Math.sqrt(variance);
  const mean = 0; // Assuming we're calculating around the mean
  
  return {
    low: mean - 1.96 * stdDev, // 95% confidence interval
    high: mean + 1.96 * stdDev,
    distribution: 'normal',
    params: {
      mean,
      std: stdDev,
    },
  };
}

/**
 * Combine uncertainties assuming independence
 */
export function combineIndependentUncertainties(
  uncertainties: UncertaintyRange[]
): UncertaintyRange {
  if (uncertainties.length === 0) {
    return { low: 0, high: 0 };
  }
  
  if (uncertainties.length === 1) {
    return uncertainties[0];
  }
  
  let totalVariance = 0;
  let totalMean = 0;
  
  for (const uncertainty of uncertainties) {
    const mean = (uncertainty.low + uncertainty.high) / 2;
    const range = uncertainty.high - uncertainty.low;
    
    // Convert range to variance based on distribution
    let variance: number;
    switch (uncertainty.distribution) {
      case 'normal':
        variance = Math.pow(range / 4, 2); // 95% within 2σ
        break;
      case 'uniform':
        variance = Math.pow(range, 2) / 12;
        break;
      case 'triangular':
        variance = Math.pow(range, 2) / 24;
        break;
      default:
        variance = Math.pow(range, 2) / 12; // Default to uniform
    }
    
    totalVariance += variance;
    totalMean += mean;
  }
  
  const combinedStd = Math.sqrt(totalVariance);
  
  return {
    low: totalMean - 1.96 * combinedStd,
    high: totalMean + 1.96 * combinedStd,
    distribution: 'normal',
    params: {
      mean: totalMean,
      std: combinedStd,
    },
  };
}

/**
 * Convert between different confidence levels
 */
export function convertConfidenceLevel(
  uncertainty: UncertaintyRange,
  fromLevel: number,
  toLevel: number
): UncertaintyRange {
  const mean = (uncertainty.low + uncertainty.high) / 2;
  const currentHalfWidth = (uncertainty.high - uncertainty.low) / 2;
  
  // Convert to standard deviation assuming normal distribution
  const alpha1 = 1 - fromLevel;
  const alpha2 = 1 - toLevel;
  
  // Z-scores for the confidence levels
  const z1 = getZScore(1 - alpha1 / 2);
  const z2 = getZScore(1 - alpha2 / 2);
  
  const std = currentHalfWidth / z1;
  const newHalfWidth = std * z2;
  
  return {
    low: mean - newHalfWidth,
    high: mean + newHalfWidth,
    distribution: uncertainty.distribution || 'normal',
    params: {
      mean,
      std,
    },
  };
}

/**
 * Get Z-score for a given probability (approximation)
 */
function getZScore(p: number): number {
  // Approximation of inverse normal CDF
  if (p <= 0 || p >= 1) {
    throw new Error('Probability must be between 0 and 1');
  }
  
  if (p === 0.5) return 0;
  
  // Common values
  const commonValues: Record<string, number> = {
    '0.90': 1.282,
    '0.95': 1.645,
    '0.975': 1.96,
    '0.99': 2.326,
    '0.995': 2.576,
  };
  
  const key = p.toFixed(3);
  if (key in commonValues) {
    return commonValues[key];
  }
  
  // Approximation using Beasley-Springer-Moro algorithm (simplified)
  const t = Math.sqrt(-2 * Math.log(1 - p));
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;
  
  return t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
}

/**
 * Create uncertainty range from confidence interval
 */
export function createUncertaintyFromCI(
  mean: number,
  low: number,
  high: number,
  confidenceLevel: number = 0.95
): UncertaintyRange {
  return {
    low,
    high,
    distribution: 'normal',
    params: {
      mean,
      std: (high - low) / (2 * getZScore(1 - (1 - confidenceLevel) / 2)),
    },
  };
}

/**
 * Convert existing confidence intervals to different confidence levels
 */
export function adjustConfidenceInterval(
  currentLow: number,
  currentHigh: number,
  fromConfidence: number,
  toConfidence: number
): { low: number; high: number } {
  const uncertainty = createUncertaintyFromCI(
    (currentLow + currentHigh) / 2,
    currentLow,
    currentHigh,
    fromConfidence
  );
  
  const adjusted = convertConfidenceLevel(uncertainty, fromConfidence, toConfidence);
  
  return {
    low: adjusted.low,
    high: adjusted.high,
  };
}

/**
 * Propagate uncertainty through a complex calculation
 */
export function propagateUncertainty(
  inputUncertainties: ParameterUncertainty,
  options: {
    method?: 'linear' | 'montecarlo';
    confidenceLevel?: number;
    iterations?: number;
  } = {}
): (emissionFn: (params: Record<string, number>) => number) => UncertaintyResult {
  const { method = 'linear', confidenceLevel = 0.95, iterations = 1000 } = options;
  
  return (emissionFn) => {
    if (method === 'montecarlo') {
      // Use Monte Carlo method
      const { monteCarlo } = require('./monteCarlo');
      const stats = monteCarlo(emissionFn, inputUncertainties, iterations, confidenceLevel);
      
      return {
        low: stats.confidenceInterval.low,
        mean: stats.mean,
        high: stats.confidenceInterval.high,
        confidenceLevel,
        distribution: stats,
      };
    } else {
      // Use linear approximation
      const baseParams: Record<string, number> = {};
      for (const [paramName, uncertainty] of Object.entries(inputUncertainties)) {
        baseParams[paramName] = (uncertainty.low + uncertainty.high) / 2;
      }
      
      const baseEmission = emissionFn(baseParams);
      
      // Calculate partial derivatives
      const derivatives: Record<string, number> = {};
      for (const paramName of Object.keys(inputUncertainties)) {
        const h = 0.01;
        const perturbedParams = { ...baseParams };
        perturbedParams[paramName] += h;
        const perturbedEmission = emissionFn(perturbedParams);
        derivatives[paramName] = (perturbedEmission - baseEmission) / h;
      }
      
      const propagatedUncertainty = linearUncertaintyPropagation(derivatives, inputUncertainties);
      
      return {
        low: baseEmission + propagatedUncertainty.low,
        mean: baseEmission,
        high: baseEmission + propagatedUncertainty.high,
        confidenceLevel,
        distribution: {
          mean: baseEmission,
          median: baseEmission,
          std: propagatedUncertainty.params?.std || 0,
          min: baseEmission + propagatedUncertainty.low,
          max: baseEmission + propagatedUncertainty.high,
          percentiles: {
            p5: baseEmission + propagatedUncertainty.low * 0.5,
            p10: baseEmission + propagatedUncertainty.low * 0.7,
            p25: baseEmission + propagatedUncertainty.low * 0.9,
            p75: baseEmission + propagatedUncertainty.high * 0.9,
            p90: baseEmission + propagatedUncertainty.high * 0.7,
            p95: baseEmission + propagatedUncertainty.high * 0.5,
            p99: baseEmission + propagatedUncertainty.high * 0.1,
          },
          confidenceInterval: {
            level: confidenceLevel,
            low: baseEmission + propagatedUncertainty.low,
            high: baseEmission + propagatedUncertainty.high,
          },
          samples: [], // Not available for linear method
        },
      };
    }
  };
}
