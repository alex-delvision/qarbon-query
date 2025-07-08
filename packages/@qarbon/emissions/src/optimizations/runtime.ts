/**
 * Runtime performance optimizations
 * Includes Map-based lookups, pre-compiled regexes, and optimized calculations
 */

// Pre-compiled regular expressions for performance
const COMPILED_REGEXES = {
  // AWS instance type patterns
  awsInstanceType: /^([a-z]+)(\d+)\.(\w+)$/,

  // Azure instance type patterns
  azureInstanceType: /^Standard_([A-Z]+)(\d+)([a-z]*)?$/,

  // GCP instance type patterns
  gcpInstanceType: /^([a-z]+)-(\w+)-(\d+)$/,

  // AI model patterns
  aiModelGPT: /^gpt-?([3-4])\.?([05])?(-turbo|-instruct)?$/i,
  aiModelClaude: /^claude-?(instant|v?[12])?$/i,
  aiModelGemini: /^gemini-?(pro|ultra)?$/i,

  // Crypto patterns
  cryptoBitcoin: /^btc|bitcoin$/i,
  cryptoEthereum: /^eth|ethereum$/i,
  cryptoSolana: /^sol|solana$/i,

  // Region patterns
  awsRegion:
    /^(us|eu|ap|ca|sa|af|me)-(east|west|north|south|central|southeast|northeast)-\d+$/,
  azureRegion:
    /^(eastus|westus|northeurope|westeurope|southeastasia|eastasia)(\d+)?$/,
  gcpRegion:
    /^(us|europe|asia)-(east|west|north|south|central|southeast|northeast)\d+(-[a-z])?$/,
};

// Pre-computed lookup Maps for O(1) performance
const FACTOR_MAPS = {
  aiModels: new Map<string, any>(),
  cloudInstances: new Map<string, any>(),
  cryptoCurrencies: new Map<string, any>(),
  regions: new Map<string, number>(),
  gridIntensity: new Map<string, number>(),
};

// Initialize lookup maps
export function initializeOptimizedLookups() {
  // This would be called during module initialization
  // to populate the Maps with factor data for O(1) lookups
}

/**
 * Optimized factor lookup using Map instead of object property access
 */
export class OptimizedFactorLookup {
  private static instance: OptimizedFactorLookup;
  private aiFactorMap = new Map<string, any>();
  private cloudFactorMap = new Map<string, any>();
  private cryptoFactorMap = new Map<string, any>();
  private regionMultiplierMap = new Map<string, number>();

  static getInstance(): OptimizedFactorLookup {
    if (!OptimizedFactorLookup.instance) {
      OptimizedFactorLookup.instance = new OptimizedFactorLookup();
    }
    return OptimizedFactorLookup.instance;
  }

  /**
   * Get AI factor with optimized lookup
   */
  getAIFactor(model: string): any | null {
    // Try exact match first
    if (this.aiFactorMap.has(model)) {
      return this.aiFactorMap.get(model);
    }

    // Try pattern matching with pre-compiled regexes
    const normalizedModel = model.toLowerCase();

    if (COMPILED_REGEXES.aiModelGPT.test(normalizedModel)) {
      const match = normalizedModel.match(COMPILED_REGEXES.aiModelGPT);
      if (match) {
        const version = match[1];
        const variant = match[2] || '';
        const type = match[3] || '';
        const key = `gpt-${version}${variant}${type}`;
        return this.aiFactorMap.get(key);
      }
    }

    if (COMPILED_REGEXES.aiModelClaude.test(normalizedModel)) {
      const match = normalizedModel.match(COMPILED_REGEXES.aiModelClaude);
      if (match) {
        const variant = match[1] || '';
        const key = `claude${variant ? '-' + variant : ''}`;
        return this.aiFactorMap.get(key);
      }
    }

    if (COMPILED_REGEXES.aiModelGemini.test(normalizedModel)) {
      const match = normalizedModel.match(COMPILED_REGEXES.aiModelGemini);
      if (match) {
        const variant = match[1] || 'pro';
        const key = `gemini-${variant}`;
        return this.aiFactorMap.get(key);
      }
    }

    return null;
  }

  /**
   * Get cloud factor with optimized lookup
   */
  getCloudFactor(instanceType: string): any | null {
    // Try exact match first
    if (this.cloudFactorMap.has(instanceType)) {
      return this.cloudFactorMap.get(instanceType);
    }

    // Try pattern matching for AWS instances
    if (COMPILED_REGEXES.awsInstanceType.test(instanceType)) {
      const match = instanceType.match(COMPILED_REGEXES.awsInstanceType);
      if (match) {
        const [, family, generation, size] = match;
        // Try variations
        const variations = [
          `${family}${generation}.${size}`,
          `${family}.${size}`,
          `${family}${generation}`,
          family,
        ];

        for (const variation of variations) {
          if (this.cloudFactorMap.has(variation)) {
            return this.cloudFactorMap.get(variation);
          }
        }
      }
    }

    return null;
  }

  /**
   * Get region multiplier with optimized lookup
   */
  getRegionMultiplier(region: string): number {
    return this.regionMultiplierMap.get(region) || 1.0;
  }

  /**
   * Pre-populate maps for faster lookups
   */
  initialize(
    aiFactors: any,
    cloudFactors: any,
    cryptoFactors: any,
    regionMultipliers: any
  ) {
    // Populate AI factors map
    Object.entries(aiFactors).forEach(([key, value]) => {
      this.aiFactorMap.set(key, value);
      this.aiFactorMap.set(key.toLowerCase(), value);
    });

    // Populate cloud factors map
    Object.entries(cloudFactors).forEach(([key, value]) => {
      this.cloudFactorMap.set(key, value);
      this.cloudFactorMap.set(key.toLowerCase(), value);
    });

    // Populate crypto factors map
    Object.entries(cryptoFactors).forEach(([key, value]) => {
      this.cryptoFactorMap.set(key, value);
      this.cryptoFactorMap.set(key.toLowerCase(), value);
    });

    // Populate region multipliers map
    Object.entries(regionMultipliers).forEach(([key, value]) => {
      this.regionMultiplierMap.set(key, value as number);
      this.regionMultiplierMap.set(key.toLowerCase(), value as number);
    });
  }
}

/**
 * Optimized batch calculations using typed arrays
 */
export class OptimizedBatchCalculator {
  /**
   * Batch calculate AI emissions using Float32Array for better performance
   */
  static calculateAIBatch(
    tokens: number[],
    factors: number[],
    regionMultipliers: number[] = []
  ): Float32Array {
    const length = tokens.length;
    const results = new Float32Array(length);

    // Use SIMD-friendly operations when possible
    for (let i = 0; i < length; i++) {
      const regionMultiplier = regionMultipliers[i] || 1.0;
      results[i] = tokens[i] * factors[i] * regionMultiplier;
    }

    return results;
  }

  /**
   * Batch calculate cloud emissions with optimized math
   */
  static calculateCloudBatch(
    hours: number[],
    factors: number[],
    regionMultipliers: number[] = []
  ): Float32Array {
    const length = hours.length;
    const results = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      const regionMultiplier = regionMultipliers[i] || 1.0;
      results[i] = hours[i] * factors[i] * regionMultiplier;
    }

    return results;
  }

  /**
   * Vectorized operations for large datasets
   */
  static vectorizedMultiply(a: Float32Array, b: Float32Array): Float32Array {
    const length = Math.min(a.length, b.length);
    const result = new Float32Array(length);

    // Unroll loop for better performance
    let i = 0;
    for (; i < length - 3; i += 4) {
      result[i] = a[i] * b[i];
      result[i + 1] = a[i + 1] * b[i + 1];
      result[i + 2] = a[i + 2] * b[i + 2];
      result[i + 3] = a[i + 3] * b[i + 3];
    }

    // Handle remaining elements
    for (; i < length; i++) {
      result[i] = a[i] * b[i];
    }

    return result;
  }
}

/**
 * Memory-efficient object pooling for frequently created objects
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }

  clear(): void {
    this.pool.length = 0;
  }

  get size(): number {
    return this.pool.length;
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  static startTimer(operation: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
      return duration;
    };
  }

  static recordMetric(operation: string, value: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(value);
  }

  static getStats(
    operation: string
  ): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(operation);
    if (!values || values.length === 0) {
      return null;
    }

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  static getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [operation] of this.metrics) {
      stats[operation] = this.getStats(operation);
    }
    return stats;
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }
}

/**
 * Worker thread pool for Node.js environments
 */
export class WorkerPool {
  private workers: any[] = [];
  private queue: Array<{ data: any; resolve: Function; reject: Function }> = [];
  private workerScript: string;

  constructor(workerScript: string, maxWorkers = 4) {
    this.workerScript = workerScript;

    // Only initialize in Node.js environment
    if (typeof window === 'undefined' && typeof Worker !== 'undefined') {
      this.initializeWorkers(maxWorkers);
    }
  }

  private initializeWorkers(count: number): void {
    // Worker initialization would be implemented here
    // This is a placeholder for the actual implementation
  }

  async execute(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.workers.length === 0) {
        // Fallback to main thread if no workers available
        resolve(this.processInMainThread(data));
        return;
      }

      this.queue.push({ data, resolve, reject });
      this.processQueue();
    });
  }

  private processInMainThread(data: any): any {
    // Fallback processing in main thread
    return data;
  }

  private processQueue(): void {
    // Worker queue processing would be implemented here
  }

  destroy(): void {
    this.workers.forEach(worker => worker?.terminate?.());
    this.workers = [];
    this.queue = [];
  }
}
