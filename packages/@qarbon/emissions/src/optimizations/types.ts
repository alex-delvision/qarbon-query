/**
 * Type definitions for optimizations module
 */

export interface EmissionInput {
  id: string;
  category: 'transport' | 'energy' | 'digital' | 'ai' | 'other';
  type: string;
  value: number;
  unit?: string;
  model?: string;
  region?: string;
  metadata?: Record<string, any>;
}

export interface EmissionOutput {
  id: string;
  amount: number;
  unit: string;
  category: string;
  source: string;
  timestamp: string;
  confidence?: { low: number; high: number };
  metadata?: Record<string, any>;
}

export interface BatchCalculationOptions {
  useWasm?: boolean;
  useSIMD?: boolean;
  useCache?: boolean;
  maxCacheSize?: number;
  wasmThreshold?: number;
  features?: FeatureFlags;
}

export interface FeatureFlags {
  enableBatchOptimizations: boolean;
  enableWasmCalculations: boolean;
  enableSIMDOperations: boolean;
  enableStreaming: boolean;
  enableCache: boolean;
  enableFallback: boolean;
  wasmBatchThreshold: number;
  cacheTTL: number;
  maxCacheSize: number;
}

export interface CacheEntry {
  factor: any;
  timestamp: number;
  ttl: number;
}

export interface WasmCalculationResult {
  results: Float64Array;
  success: boolean;
  error?: string;
}

export interface SIMDOperations {
  isSupported: boolean;
  vectorizedMultiply: (a: Float64Array, b: Float64Array) => Float64Array;
  vectorizedAdd: (a: Float64Array, b: Float64Array) => Float64Array;
  vectorizedScale: (values: Float64Array, factor: number) => Float64Array;
}

export interface StreamingCalculationOptions {
  batchSize?: number;
  highWaterMark?: number;
  objectMode?: boolean;
  features?: FeatureFlags;
}

export interface BatchMetrics {
  totalInputs: number;
  processedInputs: number;
  failedInputs: number;
  processingTime: number;
  useWasm: boolean;
  useSIMD: boolean;
  cacheHits: number;
  cacheMisses: number;
}
