/**
 * Compatibility wrappers for legacy calculator APIs
 * 
 * Maintains backward compatibility while enabling new pipeline features
 * when used through adapters or enhanced APIs.
 */

import { EmissionData, EmissionResult } from '@qarbon/shared';
import { calculator } from './calculator';
import type { PipelineOptions } from '@qarbon/core';

// Dynamic import to avoid circular dependencies
let pipeline: any;
let pipelineAvailable = false;

// Lazy load pipeline to avoid dependency issues
async function ensurePipeline() {
  if (!pipelineAvailable) {
    try {
      const coreModule = await import('@qarbon/core');
      pipeline = coreModule.pipeline;
      pipelineAvailable = true;
    } catch (error) {
      console.warn('Enhanced pipeline not available, using legacy calculator:', error);
      pipelineAvailable = false;
    }
  }
  return pipelineAvailable;
}

/**
 * Legacy API: Calculate AI emissions
 * Maintains exact same signature and behavior as before
 */
export async function calculateAIEmissions(tokens: number, model: string): Promise<EmissionData> {
  return await calculator.calculateAIEmissions(tokens, model);
}

/**
 * Enhanced API: Calculate AI emissions with uncertainty quantification
 * 
 * @param tokens - Number of tokens processed
 * @param model - AI model name
 * @param options - Uncertainty quantification options
 * @returns Emission data with optional uncertainty bounds
 */
export function calculateAIEmissionsWithUncertainty(
  tokens: number,
  model: string,
  options?: {
    includeUncertainty?: boolean;
    confidenceLevel?: 90 | 95 | 99;
    method?: 'linear' | 'montecarlo';
    iterations?: number;
  }
): {
  id: string;
  timestamp: string;
  source: string;
  amount: number;
  unit: 'kg' | 'g' | 'tonnes';
  category: 'transport' | 'energy' | 'digital' | 'ai' | 'other';
  confidence?: { low: number; high: number };
  uncertainty?: {
    low: number;
    mean: number;
    high: number;
    confidenceLevel: number;
  };
} {
  return calculator.calculateAIEmissionsWithUncertainty(tokens, model, options);
}

/**
 * Enhanced API: Calculate AI emissions with adapter support
 * New API that leverages the pipeline for enhanced features
 */
export async function calculateAIEmissionsEnhanced(
  input: any,
  options: PipelineOptions = {}
): Promise<EmissionResult> {
  const pipelineReady = await ensurePipeline();
  
  if (pipelineReady && pipeline) {
    return pipeline.process(input, {
      category: 'ai',
      ...options
    });
  }
  
  // Fallback to legacy calculator if pipeline not available
  if (typeof input === 'object' && 'tokens' in input && 'model' in input) {
    const emission = await calculator.calculateAIEmissions(input.tokens, input.model);
    return calculator.generateResult([emission]);
  }
  
  throw new Error('Invalid input format and enhanced pipeline not available');
}

/**
 * Legacy API: Calculate digital emissions
 */
export async function calculateDigitalEmissions(
  dataTransfer: number,
  timeSpent: number,
  deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop'
): Promise<EmissionData> {
  return await calculator.calculateDigitalEmissions(dataTransfer, timeSpent, deviceType);
}

/**
 * Enhanced API: Calculate digital emissions with adapter support
 */
export async function calculateDigitalEmissionsEnhanced(
  input: any,
  options: PipelineOptions = {}
): Promise<EmissionResult> {
  const pipelineReady = await ensurePipeline();
  
  if (pipelineReady && pipeline) {
    return pipeline.process(input, {
      category: 'digital',
      ...options
    });
  }
  
  // Fallback to legacy calculator
  if (typeof input === 'object' && 'dataTransfer' in input && 'timeSpent' in input) {
    const emission = await calculator.calculateDigitalEmissions(
      input.dataTransfer, 
      input.timeSpent, 
      input.deviceType
    );
    return calculator.generateResult([emission]);
  }
  
  throw new Error('Invalid input format and enhanced pipeline not available');
}

/**
 * Legacy API: Calculate transport emissions
 */
export async function calculateTransportEmissions(
  distance: number,
  mode: 'car' | 'train' | 'plane' | 'bus' = 'car'
): Promise<EmissionData> {
  return await calculator.calculateTransportEmissions(distance, mode);
}

/**
 * Enhanced API: Calculate transport emissions with adapter support
 */
export async function calculateTransportEmissionsEnhanced(
  input: any,
  options: PipelineOptions = {}
): Promise<EmissionResult> {
  const pipelineReady = await ensurePipeline();
  
  if (pipelineReady && pipeline) {
    return pipeline.process(input, {
      category: 'transport',
      ...options
    });
  }
  
  // Fallback to legacy calculator
  if (typeof input === 'object' && 'distance' in input && 'mode' in input) {
    const emission = await calculator.calculateTransportEmissions(input.distance, input.mode);
    return calculator.generateResult([emission]);
  }
  
  throw new Error('Invalid input format and enhanced pipeline not available');
}

/**
 * Legacy API: Calculate energy emissions
 */
export async function calculateEnergyEmissions(
  consumption: number,
  source: 'grid' | 'renewable' | 'fossil' = 'grid'
): Promise<EmissionData> {
  return await calculator.calculateEnergyEmissions(consumption, source);
}

/**
 * Enhanced API: Calculate energy emissions with adapter support
 */
export async function calculateEnergyEmissionsEnhanced(
  input: any,
  options: PipelineOptions = {}
): Promise<EmissionResult> {
  const pipelineReady = await ensurePipeline();
  
  if (pipelineReady && pipeline) {
    return pipeline.process(input, {
      category: 'energy',
      useGrid: true, // Enable grid awareness for energy calculations
      ...options
    });
  }
  
  // Fallback to legacy calculator
  if (typeof input === 'object' && 'consumption' in input && 'source' in input) {
    const emission = await calculator.calculateEnergyEmissions(input.consumption, input.source);
    return calculator.generateResult([emission]);
  }
  
  throw new Error('Invalid input format and enhanced pipeline not available');
}

/**
 * Universal enhanced API: Process any input through the pipeline
 */
export async function processEmissions(
  input: any,
  options: PipelineOptions = {}
): Promise<EmissionResult> {
  const pipelineReady = await ensurePipeline();
  
  if (pipelineReady && pipeline) {
    return pipeline.process(input, options);
  }
  
  throw new Error('Enhanced pipeline not available. Use specific legacy APIs instead.');
}

/**
 * Check if enhanced pipeline features are available
 */
export async function isEnhancedPipelineAvailable(): Promise<boolean> {
  return await ensurePipeline();
}

/**
 * Legacy compatibility: Generate result from emissions array
 */
export function generateResult(emissions: EmissionData[]): EmissionResult {
  return calculator.generateResult(emissions);
}
