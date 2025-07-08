/**
 * Core pipeline types for qarbon-query
 */
import type { EmissionResult } from '@qarbon/shared';
/**
 * Pipeline configuration options
 */
export interface PipelineOptions {
  category?: 'transport' | 'energy' | 'digital' | 'ai' | 'other';
  useGrid?: boolean;
  useOptimizations?: boolean;
  useUncertainty?: boolean;
  region?: string;
  methodology?: string;
}
/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  adapters: AdapterConfig[];
  gridManager: GridManagerConfig;
  optimizations: OptimizationConfig;
  uncertainty: UncertaintyConfig;
  compatibility: CompatibilityConfig;
}
/**
 * Adapter configuration
 */
export interface AdapterConfig {
  name: string;
  enabled: boolean;
  priority: number;
  options?: Record<string, any>;
}
/**
 * Grid manager configuration
 */
export interface GridManagerConfig {
  enabled: boolean;
  defaultRegion: string;
  updateInterval: number;
  sources: string[];
}
/**
 * Optimization configuration
 */
export interface OptimizationConfig {
  enabled: boolean;
  caching: boolean;
  batchProcessing: boolean;
  memoryOptimization: boolean;
  maxCacheSize: number;
  batchSize: number;
}
/**
 * Uncertainty configuration
 */
export interface UncertaintyConfig {
  enabled: boolean;
  confidenceLevel: number;
  monteCarloSamples: number;
  propagateErrors: boolean;
}
/**
 * Compatibility configuration
 */
export interface CompatibilityConfig {
  legacySupport: boolean;
  strictMode: boolean;
  deprecationWarnings: boolean;
}
/**
 * Pipeline stage result
 */
export interface PipelineStageResult {
  stage: string;
  input: any;
  output: any;
  duration: number;
  errors?: Error[];
  metadata?: Record<string, any>;
}
/**
 * Pipeline execution result
 */
export interface PipelineExecutionResult extends EmissionResult {
  stages: PipelineStageResult[];
  totalDuration: number;
  optimizations?: OptimizationMetrics;
  uncertainty?: UncertaintyMetrics;
}
/**
 * Optimization metrics
 */
export interface OptimizationMetrics {
  cacheHits: number;
  cacheMisses: number;
  batchesProcessed: number;
  memoryUsage: number;
  performanceGain: number;
}
/**
 * Uncertainty metrics
 */
export interface UncertaintyMetrics {
  confidenceLevel: number;
  standardDeviation: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  monteCarloSamples: number;
}
/**
 * Pipeline processor interface
 */
export interface PipelineProcessor {
  process(
    input: any,
    options?: PipelineOptions
  ): Promise<PipelineExecutionResult>;
  configure(config: Partial<PipelineConfig>): void;
  getStageResults(): PipelineStageResult[];
}
//# sourceMappingURL=types.d.ts.map
