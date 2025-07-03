/**
 * @qarbon/core - Core pipeline orchestration
 * 
 * Main entry point for the qarbon-query core pipeline system.
 * Provides unified processing from any input format to emission results.
 */

export { Pipeline, pipeline } from './pipeline';
export type {
  PipelineProcessor,
  PipelineOptions,
  PipelineConfig,
  PipelineExecutionResult,
  PipelineStageResult,
  AdapterConfig,
  GridManagerConfig,
  OptimizationConfig,
  UncertaintyConfig,
  CompatibilityConfig,
  OptimizationMetrics,
  UncertaintyMetrics
} from './types';

// Re-export shared types for convenience
export type { 
  EmissionData, 
  EmissionResult, 
  CarbonFootprint 
} from '@qarbon/shared';
