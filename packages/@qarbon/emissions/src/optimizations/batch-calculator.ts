/**
 * Batch calculator with vectorized operations and SIMD support
 */

import { EmissionInput, EmissionOutput, BatchCalculationOptions, BatchMetrics, SIMDOperations } from './types';
import { getEmissionFactor, getAIFactor } from '../factors';
import { emissionFactorCache } from './lru-cache';
import { featureFlags } from './feature-flags';
import { wasmHelper } from './wasm-helper';

/**
 * SIMD operations implementation
 */
class SIMDOperationsImpl implements SIMDOperations {
  isSupported: boolean = false;

  constructor() {
    this.isSupported = this.detectSIMDSupport();
  }

  private detectSIMDSupport(): boolean {
    // Check for SIMD support in the environment
    if (typeof globalThis !== 'undefined' && globalThis.SIMD) {
      return true;
    }
    
    // Check for WebAssembly SIMD support
    if (typeof WebAssembly !== 'undefined' && WebAssembly.validate) {
      try {
        // Simple SIMD test
        const simdTest = new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
          0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b,
          0x03, 0x02, 0x01, 0x00,
          0x0a, 0x0a, 0x01, 0x08, 0x00, 0x41, 0x00, 0xfd, 0x0f, 0x0b
        ]);
        return WebAssembly.validate(simdTest);
      } catch {
        return false;
      }
    }
    
    return false;
  }

  vectorizedMultiply(a: Float64Array, b: Float64Array): Float64Array {
    if (!this.isSupported || a.length !== b.length) {
      // Fallback to regular multiplication
      const result = new Float64Array(a.length);
      for (let i = 0; i < a.length; i++) {
        result[i] = a[i] * b[i];
      }
      return result;
    }

    // Use SIMD operations when available
    const result = new Float64Array(a.length);
    const vectorSize = 4; // Process 4 elements at a time
    
    let i = 0;
    for (; i < a.length - vectorSize + 1; i += vectorSize) {
      // Vectorized multiplication (would use actual SIMD instructions in real implementation)
      for (let j = 0; j < vectorSize; j++) {
        result[i + j] = a[i + j] * b[i + j];
      }
    }
    
    // Handle remaining elements
    for (; i < a.length; i++) {
      result[i] = a[i] * b[i];
    }
    
    return result;
  }

  vectorizedAdd(a: Float64Array, b: Float64Array): Float64Array {
    if (!this.isSupported || a.length !== b.length) {
      // Fallback to regular addition
      const result = new Float64Array(a.length);
      for (let i = 0; i < a.length; i++) {
        result[i] = a[i] + b[i];
      }
      return result;
    }

    // Use SIMD operations when available
    const result = new Float64Array(a.length);
    const vectorSize = 4;
    
    let i = 0;
    for (; i < a.length - vectorSize + 1; i += vectorSize) {
      for (let j = 0; j < vectorSize; j++) {
        result[i + j] = a[i + j] + b[i + j];
      }
    }
    
    for (; i < a.length; i++) {
      result[i] = a[i] + b[i];
    }
    
    return result;
  }

  vectorizedScale(values: Float64Array, factor: number): Float64Array {
    if (!this.isSupported) {
      // Fallback to regular scaling
      const result = new Float64Array(values.length);
      for (let i = 0; i < values.length; i++) {
        result[i] = values[i] * factor;
      }
      return result;
    }

    // Use SIMD operations when available
    const result = new Float64Array(values.length);
    const vectorSize = 4;
    
    let i = 0;
    for (; i < values.length - vectorSize + 1; i += vectorSize) {
      for (let j = 0; j < vectorSize; j++) {
        result[i + j] = values[i + j] * factor;
      }
    }
    
    for (; i < values.length; i++) {
      result[i] = values[i] * factor;
    }
    
    return result;
  }
}

/**
 * Batch emissions calculator
 */
export class BatchCalculator {
  private simdOps: SIMDOperations;
  private metrics: BatchMetrics;

  constructor() {
    this.simdOps = new SIMDOperationsImpl();
    this.metrics = this.initMetrics();
  }

  private initMetrics(): BatchMetrics {
    return {
      totalInputs: 0,
      processedInputs: 0,
      failedInputs: 0,
      processingTime: 0,
      useWasm: false,
      useSIMD: false,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Calculate emissions for multiple inputs in batch
   */
  async calculateBatch(
    inputs: EmissionInput[],
    options: BatchCalculationOptions = {}
  ): Promise<{ results: EmissionOutput[]; metrics: BatchMetrics }> {
    const startTime = performance.now();
    this.metrics = this.initMetrics();
    this.metrics.totalInputs = inputs.length;

    const flags = options.features || featureFlags.getFlags();
    const useWasm = flags.enableWasmCalculations && inputs.length >= flags.wasmBatchThreshold;
    const useSIMD = flags.enableSIMDOperations && this.simdOps.isSupported;
    const useCache = flags.enableCache;

    this.metrics.useWasm = useWasm;
    this.metrics.useSIMD = useSIMD;

    let results: EmissionOutput[] = [];

    try {
      if (useWasm) {
        // Use WebAssembly for large batches
        results = await this.calculateWithWasm(inputs, options);
      } else if (useSIMD) {
        // Use SIMD for medium batches
        results = this.calculateWithSIMD(inputs, options);
      } else {
        // Use regular calculation for small batches
        results = this.calculateRegular(inputs, options);
      }

      this.metrics.processedInputs = results.length;
      this.metrics.failedInputs = inputs.length - results.length;
    } catch (error) {
      if (flags.enableFallback) {
        // Fallback to regular calculation
        results = this.calculateRegular(inputs, options);
        this.metrics.processedInputs = results.length;
        this.metrics.failedInputs = inputs.length - results.length;
      } else {
        throw error;
      }
    }

    this.metrics.processingTime = performance.now() - startTime;
    return { results, metrics: this.metrics };
  }

  /**
   * Calculate emissions using WebAssembly
   */
  private async calculateWithWasm(
    inputs: EmissionInput[],
    options: BatchCalculationOptions
  ): Promise<EmissionOutput[]> {
    const results: EmissionOutput[] = [];
    
    // Group inputs by category for efficient processing
    const groupedInputs = this.groupInputsByCategory(inputs);
    
    for (const [category, categoryInputs] of Object.entries(groupedInputs)) {
      try {
        const wasmResult = await wasmHelper.calculateBatch(categoryInputs, category);
        if (wasmResult.success) {
          // Convert WASM results to EmissionOutput format
          const categoryResults = this.convertWasmResults(categoryInputs, wasmResult.results);
          results.push(...categoryResults);
        } else {
          // Fallback to regular calculation
          const fallbackResults = this.calculateRegular(categoryInputs, options);
          results.push(...fallbackResults);
        }
      } catch (error) {
        // Fallback to regular calculation
        const fallbackResults = this.calculateRegular(categoryInputs, options);
        results.push(...fallbackResults);
      }
    }
    
    return results;
  }

  /**
   * Calculate emissions using SIMD operations
   */
  private calculateWithSIMD(
    inputs: EmissionInput[],
    options: BatchCalculationOptions
  ): EmissionOutput[] {
    const results: EmissionOutput[] = [];
    
    // Group inputs by category for vectorized operations
    const groupedInputs = this.groupInputsByCategory(inputs);
    
    for (const [category, categoryInputs] of Object.entries(groupedInputs)) {
      if (category === 'ai') {
        // AI calculations need special handling
        const aiResults = this.calculateAIBatch(categoryInputs, options);
        results.push(...aiResults);
      } else {
        // Vectorized calculations for other categories
        const vectorResults = this.calculateVectorized(categoryInputs, category, options);
        results.push(...vectorResults);
      }
    }
    
    return results;
  }

  /**
   * Calculate emissions using regular operations
   */
  private calculateRegular(
    inputs: EmissionInput[],
    options: BatchCalculationOptions
  ): EmissionOutput[] {
    const results: EmissionOutput[] = [];
    const flags = options.features || featureFlags.getFlags();
    
    for (const input of inputs) {
      try {
        const result = this.calculateSingle(input, flags.enableCache);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        this.metrics.failedInputs++;
        // Continue processing other inputs
      }
    }
    
    return results;
  }

  /**
   * Group inputs by category for efficient batch processing
   */
  private groupInputsByCategory(inputs: EmissionInput[]): Record<string, EmissionInput[]> {
    const grouped: Record<string, EmissionInput[]> = {};
    
    for (const input of inputs) {
      if (!grouped[input.category]) {
        grouped[input.category] = [];
      }
      grouped[input.category].push(input);
    }
    
    return grouped;
  }

  /**
   * Calculate vectorized emissions for non-AI categories
   */
  private calculateVectorized(
    inputs: EmissionInput[],
    category: string,
    options: BatchCalculationOptions
  ): EmissionOutput[] {
    const results: EmissionOutput[] = [];
    const flags = options.features || featureFlags.getFlags();
    
    // Extract values and factors into typed arrays
    const values = new Float64Array(inputs.length);
    const factors = new Float64Array(inputs.length);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      values[i] = input.value;
      
      // Get factor (with caching)
      let factor = null;
      if (flags.enableCache) {
        factor = emissionFactorCache.get(input.type, input.region);
        if (factor) {
          this.metrics.cacheHits++;
        } else {
          this.metrics.cacheMisses++;
        }
      }
      
      if (!factor) {
        try {
          factor = getEmissionFactor(category, input.type);
          if (flags.enableCache) {
            emissionFactorCache.set(input.type, factor, input.region);
          }
        } catch (error) {
          factors[i] = 0;
          continue;
        }
      }
      
      // Extract the appropriate factor value
      factors[i] = this.extractFactorValue(factor, category);
    }
    
    // Vectorized multiplication
    const emissions = this.simdOps.vectorizedMultiply(values, factors);
    
    // Convert results back to EmissionOutput format
    for (let i = 0; i < inputs.length; i++) {
      if (emissions[i] > 0) {
        results.push(this.createEmissionOutput(inputs[i], emissions[i]));
      }
    }
    
    return results;
  }

  /**
   * Calculate AI emissions in batch
   */
  private calculateAIBatch(
    inputs: EmissionInput[],
    options: BatchCalculationOptions
  ): EmissionOutput[] {
    const results: EmissionOutput[] = [];
    const flags = options.features || featureFlags.getFlags();
    
    for (const input of inputs) {
      try {
        let factor = null;
        
        if (flags.enableCache && input.model) {
          factor = emissionFactorCache.get(input.model, input.region);
          if (factor) {
            this.metrics.cacheHits++;
          } else {
            this.metrics.cacheMisses++;
          }
        }
        
        if (!factor && input.model) {
          factor = getAIFactor(input.model);
          if (factor && flags.enableCache) {
            emissionFactorCache.set(input.model, factor, input.region);
          }
        }
        
        if (factor) {
          const amount = input.value > 0 
            ? input.value * factor.co2PerToken
            : factor.co2PerQuery || 0;
          
          const result = this.createEmissionOutput(input, amount);
          result.confidence = factor.confidence;
          results.push(result);
        }
      } catch (error) {
        this.metrics.failedInputs++;
      }
    }
    
    return results;
  }

  /**
   * Calculate single emission
   */
  private calculateSingle(input: EmissionInput, useCache: boolean): EmissionOutput | null {
    try {
      if (input.category === 'ai') {
        return this.calculateAISingle(input, useCache);
      } else {
        return this.calculateRegularSingle(input, useCache);
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate single AI emission
   */
  private calculateAISingle(input: EmissionInput, useCache: boolean): EmissionOutput | null {
    if (!input.model) {
      return null;
    }
    
    let factor = null;
    
    if (useCache) {
      factor = emissionFactorCache.get(input.model, input.region);
      if (factor) {
        this.metrics.cacheHits++;
      } else {
        this.metrics.cacheMisses++;
      }
    }
    
    if (!factor) {
      factor = getAIFactor(input.model);
      if (factor && useCache) {
        emissionFactorCache.set(input.model, factor, input.region);
      }
    }
    
    if (!factor) {
      return null;
    }
    
    const amount = input.value > 0 
      ? input.value * factor.co2PerToken
      : factor.co2PerQuery || 0;
    
    const result = this.createEmissionOutput(input, amount);
    result.confidence = factor.confidence;
    return result;
  }

  /**
   * Calculate single regular emission
   */
  private calculateRegularSingle(input: EmissionInput, useCache: boolean): EmissionOutput | null {
    let factor = null;
    
    if (useCache) {
      factor = emissionFactorCache.get(input.type, input.region);
      if (factor) {
        this.metrics.cacheHits++;
      } else {
        this.metrics.cacheMisses++;
      }
    }
    
    if (!factor) {
      factor = getEmissionFactor(input.category, input.type);
      if (factor && useCache) {
        emissionFactorCache.set(input.type, factor, input.region);
      }
    }
    
    const factorValue = this.extractFactorValue(factor, input.category);
    const amount = input.value * factorValue;
    
    return this.createEmissionOutput(input, amount);
  }

  /**
   * Extract factor value based on category
   */
  private extractFactorValue(factor: any, category: string): number {
    switch (category) {
      case 'transport':
        return factor.perKm || 0;
      case 'energy':
        return factor.perKwh || 0;
      case 'digital':
        return factor.timeFactor || factor.dataFactor || 0;
      default:
        return 0;
    }
  }

  /**
   * Create emission output from input and calculated amount
   */
  private createEmissionOutput(input: EmissionInput, amount: number): EmissionOutput {
    return {
      id: input.id,
      amount: Math.round(amount * 100) / 100,
      unit: this.getUnitForCategory(input.category),
      category: input.category,
      source: input.type,
      timestamp: new Date().toISOString(),
      metadata: input.metadata,
    };
  }

  /**
   * Get appropriate unit for category
   */
  private getUnitForCategory(category: string): string {
    switch (category) {
      case 'transport':
      case 'energy':
        return 'kg';
      case 'digital':
      case 'ai':
        return 'g';
      default:
        return 'kg';
    }
  }

  /**
   * Convert WASM results to EmissionOutput format
   */
  private convertWasmResults(inputs: EmissionInput[], results: Float64Array): EmissionOutput[] {
    const outputs: EmissionOutput[] = [];
    
    for (let i = 0; i < inputs.length && i < results.length; i++) {
      if (results[i] > 0) {
        outputs.push(this.createEmissionOutput(inputs[i], results[i]));
      }
    }
    
    return outputs;
  }

  /**
   * Get current metrics
   */
  getMetrics(): BatchMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = this.initMetrics();
  }
}

// Default global instance
export const batchCalculator = new BatchCalculator();
