/**
 * Main pipeline orchestrator for qarbon-query
 *
 * Coordinates data flow from input → adapter → normalized data → calculator → result
 */
import { universalTrackerRegistry } from '@qarbon/tracker-adapters';
import { calculator } from '@qarbon/emissions';
/**
 * Core pipeline orchestrator class
 */
export class Pipeline {
  config;
  stageResults = [];
  constructor(config) {
    this.config = this.getDefaultConfig();
    if (config) {
      this.configure(config);
    }
  }
  /**
   * Process input through the complete pipeline
   */
  async process(input, options = {}) {
    const startTime = performance.now();
    this.stageResults = [];
    try {
      // Stage 1: Input Detection and Adaptation
      const adaptedData = await this.adaptInput(input, options);
      // Stage 2: Grid Integration (if enabled)
      const gridEnhancedData = await this.enhanceWithGrid(adaptedData, options);
      // Stage 3: Emission Calculation
      const calculatedData = await this.calculateEmissions(
        gridEnhancedData,
        options
      );
      // Stage 4: Uncertainty Quantification (if enabled)
      const uncertaintyData = await this.calculateUncertainty(
        calculatedData,
        options
      );
      // Stage 5: Optimization Application (if enabled)
      const optimizedResult = await this.applyOptimizations(
        uncertaintyData,
        options
      );
      const totalDuration = performance.now() - startTime;
      return {
        ...optimizedResult,
        stages: this.stageResults,
        totalDuration,
      };
    } catch (error) {
      const totalDuration = performance.now() - startTime;
      // Return error result with partial stage information
      return {
        emissions: [],
        footprint: { total: 0, breakdown: {}, period: 'monthly' },
        metadata: {
          calculatedAt: new Date().toISOString(),
          methodology: 'qarbon-v1',
          confidence: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        stages: this.stageResults,
        totalDuration,
      };
    }
  }
  /**
   * Configure the pipeline
   */
  configure(config) {
    this.config = { ...this.config, ...config };
  }
  /**
   * Get stage results for debugging
   */
  getStageResults() {
    return [...this.stageResults];
  }
  /**
   * Stage 1: Adapt input to normalized EmissionData format
   */
  async adaptInput(input, options) {
    const stageStart = performance.now();
    let output;
    try {
      // If input is already EmissionData array, use as-is
      if (
        Array.isArray(input) &&
        input.every(item => this.isEmissionData(item))
      ) {
        output = input;
      }
      // If input is single EmissionData object, wrap in array
      else if (this.isEmissionData(input)) {
        output = [input];
      }
      // Otherwise, use adapter registry to convert
      else {
        const detectionResult = await universalTrackerRegistry.detectFormat(
          Buffer.isBuffer(input) ? input : Buffer.from(JSON.stringify(input))
        );
        if (!detectionResult.bestMatch) {
          throw new Error('No suitable adapter found for input format');
        }
        const ingestedData = universalTrackerRegistry.ingest(input);
        output = this.normalizeToEmissionDataArray(ingestedData, options);
      }
      this.recordStage('adaptation', input, output, stageStart);
      return output;
    } catch (error) {
      this.recordStage('adaptation', input, null, stageStart, [error]);
      throw error;
    }
  }
  /**
   * Stage 2: Enhance with grid data (placeholder)
   */
  async enhanceWithGrid(data, options) {
    const stageStart = performance.now();
    if (!this.config.gridManager.enabled || !options.useGrid) {
      this.recordStage('grid-enhancement', data, data, stageStart);
      return data;
    }
    try {
      // TODO: Implement grid manager integration
      // For now, just pass through with placeholder grid data
      const enhancedData = data.map(emission => ({
        ...emission,
        region: options.region || this.config.gridManager.defaultRegion,
        gridIntensity: 500, // Placeholder: 500g CO2/kWh
      }));
      this.recordStage('grid-enhancement', data, enhancedData, stageStart);
      return enhancedData;
    } catch (error) {
      this.recordStage('grid-enhancement', data, data, stageStart, [error]);
      return data; // Fallback to original data
    }
  }
  /**
   * Stage 3: Calculate emissions using existing calculator
   */
  async calculateEmissions(data, options) {
    const stageStart = performance.now();
    try {
      // Use existing calculator to generate comprehensive result
      const result = calculator.generateResult(data);
      // Enhance with pipeline metadata
      const enhancedResult = {
        ...result,
        metadata: {
          ...result.metadata,
          methodology: options.methodology || result.metadata.methodology,
          pipelineVersion: '2.0.0',
          enhancedPipeline: true,
        },
      };
      this.recordStage('calculation', data, enhancedResult, stageStart);
      return enhancedResult;
    } catch (error) {
      this.recordStage('calculation', data, null, stageStart, [error]);
      throw error;
    }
  }
  /**
   * Stage 4: Calculate uncertainty (placeholder)
   */
  async calculateUncertainty(result, options) {
    const stageStart = performance.now();
    if (!this.config.uncertainty.enabled || !options.useUncertainty) {
      this.recordStage('uncertainty', result, result, stageStart);
      return result;
    }
    try {
      // TODO: Implement uncertainty calculation
      // For now, add placeholder uncertainty metrics
      const uncertaintyMetrics = {
        confidenceLevel: this.config.uncertainty.confidenceLevel,
        standardDeviation: 0.1,
        confidenceInterval: {
          lower: 0.9,
          upper: 1.1,
        },
        monteCarloSamples: this.config.uncertainty.monteCarloSamples,
      };
      const enhancedResult = {
        ...result,
        uncertainty: uncertaintyMetrics,
      };
      this.recordStage('uncertainty', result, enhancedResult, stageStart);
      return enhancedResult;
    } catch (error) {
      this.recordStage('uncertainty', result, result, stageStart, [error]);
      return result; // Fallback to original result
    }
  }
  /**
   * Stage 5: Apply optimizations (placeholder)
   */
  async applyOptimizations(result, options) {
    const stageStart = performance.now();
    if (!this.config.optimizations.enabled || !options.useOptimizations) {
      const executionResult = {
        ...result,
        stages: [],
        totalDuration: 0,
      };
      this.recordStage('optimization', result, executionResult, stageStart);
      return executionResult;
    }
    try {
      // TODO: Implement optimization logic
      // For now, add placeholder optimization metrics
      const optimizationMetrics = {
        cacheHits: 0,
        cacheMisses: 1,
        batchesProcessed: 1,
        memoryUsage: process.memoryUsage().heapUsed,
        performanceGain: 0.15,
      };
      const optimizedResult = {
        ...result,
        stages: [],
        totalDuration: 0,
        optimizations: optimizationMetrics,
      };
      this.recordStage('optimization', result, optimizedResult, stageStart);
      return optimizedResult;
    } catch (error) {
      this.recordStage('optimization', result, result, stageStart, [error]);
      const fallbackResult = {
        ...result,
        stages: [],
        totalDuration: 0,
      };
      return fallbackResult;
    }
  }
  /**
   * Helper methods
   */
  isEmissionData(obj) {
    return (
      obj &&
      typeof obj.id === 'string' &&
      typeof obj.timestamp === 'string' &&
      typeof obj.source === 'string' &&
      typeof obj.amount === 'number' &&
      typeof obj.unit === 'string' &&
      typeof obj.category === 'string'
    );
  }
  normalizeToEmissionDataArray(data, options) {
    // Simple normalization - this would be enhanced based on adapter output
    if (Array.isArray(data)) {
      return data.map(item => this.normalizeToEmissionData(item, options));
    }
    return [this.normalizeToEmissionData(data, options)];
  }
  normalizeToEmissionData(data, options) {
    return {
      id: data.id || `generated_${Date.now()}_${Math.random()}`,
      timestamp: data.timestamp || new Date().toISOString(),
      source: data.source || 'pipeline',
      amount: data.amount || data.emissions || 0,
      unit: data.unit || 'g',
      category: options.category || data.category || 'other',
      confidence: data.confidence,
    };
  }
  recordStage(stage, input, output, startTime, errors) {
    this.stageResults.push({
      stage,
      input,
      output,
      duration: performance.now() - startTime,
      errors,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  }
  getDefaultConfig() {
    return {
      adapters: [
        { name: 'json', enabled: true, priority: 1 },
        { name: 'csv', enabled: true, priority: 2 },
        { name: 'xml', enabled: true, priority: 3 },
      ],
      gridManager: {
        enabled: false,
        defaultRegion: 'US',
        updateInterval: 3600000, // 1 hour
        sources: ['eGRID', 'ENTSO-E'],
      },
      optimizations: {
        enabled: false,
        caching: true,
        batchProcessing: true,
        memoryOptimization: true,
        maxCacheSize: 1000,
        batchSize: 100,
      },
      uncertainty: {
        enabled: false,
        confidenceLevel: 0.95,
        monteCarloSamples: 1000,
        propagateErrors: true,
      },
      compatibility: {
        legacySupport: true,
        strictMode: false,
        deprecationWarnings: true,
      },
    };
  }
}
// Export default pipeline instance
export const pipeline = new Pipeline();
//# sourceMappingURL=pipeline.js.map
