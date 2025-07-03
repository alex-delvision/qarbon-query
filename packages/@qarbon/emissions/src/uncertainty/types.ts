/**
 * Type definitions for uncertainty quantification
 */

export interface DistributionStats {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  percentiles: {
    p5: number;
    p10: number;
    p25: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  confidenceInterval: {
    level: number;
    low: number;
    high: number;
  };
  samples: number[];
}

export interface UncertaintyRange {
  low: number;
  high: number;
  distribution?: 'normal' | 'uniform' | 'lognormal' | 'triangular';
  params?: {
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
    mode?: number; // for triangular distribution
  };
}

export interface ParameterUncertainty {
  [paramName: string]: UncertaintyRange;
}

export interface SensitivityResult {
  parameter: string;
  mainEffect: number;
  totalEffect: number;
  firstOrderSobol: number;
  totalSobol: number;
  partialDerivative: number;
}

export interface UncertaintyResult {
  low: number;
  mean: number;
  high: number;
  confidenceLevel: number;
  distribution: DistributionStats;
  sensitivity?: SensitivityResult[];
}

export type EmissionFunction = (params: Record<string, number>) => number;
