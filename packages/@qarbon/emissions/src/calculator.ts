// Local type definitions to avoid dependency issues in tests
interface EmissionData {
  id: string;
  timestamp: string;
  source: string;
  amount: number;
  unit: 'kg' | 'g' | 'tonnes';
  category: 'transport' | 'energy' | 'digital' | 'ai' | 'other';
  confidence?: { low: number; high: number };
  region?: string;
}

// Uncertainty quantification interfaces
interface UncertaintyOptions {
  includeUncertainty?: boolean;
  confidenceLevel?: 90 | 95 | 99;
  method?: 'linear' | 'montecarlo';
  iterations?: number;
}

interface EmissionDataWithUncertainty extends EmissionData {
  uncertainty?: {
    low: number;
    mean: number;
    high: number;
    confidenceLevel: number;
  };
}

interface EmissionResult {
  emissions: EmissionData[];
  footprint: any;
  metadata: {
    calculatedAt: string;
    methodology: string;
    confidence: number;
  };
}

// Enhanced calculation options
interface CalculationOptions {
  region?: string;
  timestamp?: Date;
  includeUncertainty?: boolean;
  useOptimizations?: boolean;
  batchSize?: number;
  uncertaintyOptions?: UncertaintyOptions;
}

// Input types for batch processing
type SingleInput = {
  type: 'digital';
  dataTransfer: number;
  timeSpent: number;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
} | {
  type: 'transport';
  distance: number;
  mode?: 'car' | 'train' | 'plane' | 'bus';
} | {
  type: 'energy';
  consumption: number;
  source?: 'grid' | 'renewable' | 'fossil';
} | {
  type: 'ai';
  tokens: number;
  model: string;
};

type BatchInput = SingleInput & CalculationOptions;

// Result types
interface CalculationResult {
  data: EmissionData | EmissionDataWithUncertainty;
  processingTime: number;
  source: 'direct' | 'adapter' | 'batch';
}

// Import generateFootprint from shared package, will be mocked in tests
let generateFootprint: any;
try {
  const shared = require('@qarbon/shared');
  generateFootprint = shared.generateFootprint;
} catch {
  // Fallback for tests
  generateFootprint = () => ({ total: 0, breakdown: {}, period: 'monthly' });
}
import { getEmissionFactor, getAIFactor } from './factors';
import { monteCarlo, simpleMonteCarloRange } from './uncertainty/monteCarlo';
import { createUncertaintyFromCI, adjustConfidenceInterval } from './uncertainty/uncertaintyPropagation';
import { adapterRegistry, BaseAdapter } from './adapters';
import { GridIntensityManager } from './grid/intensity-manager';
import { BatchCalculator } from './optimizations/batch-calculator';
import { StreamingCalculator } from './optimizations/streaming-calculator';
import { featureFlags } from './optimizations/feature-flags';

/**
 * Enhanced emissions calculator class
 * Supports batch processing, adapters, regional overrides, and optimizations
 */
export class EmissionsCalculator {
  private gridIntensityManager: GridIntensityManager;
  private batchCalculator: BatchCalculator;
  private streamingCalculator: StreamingCalculator;
  private optimizationsEnabled: boolean;
  private uncertaintyEnabled: boolean;

  constructor(options: {
    enableOptimizations?: boolean;
    enableUncertainty?: boolean;
  } = {}) {
    this.gridIntensityManager = new GridIntensityManager();
    this.batchCalculator = new BatchCalculator();
    this.streamingCalculator = new StreamingCalculator();
    this.optimizationsEnabled = options.enableOptimizations ?? true;
    this.uncertaintyEnabled = options.enableUncertainty ?? true;
  }

  /**
   * Main calculate method that accepts both single and batch inputs
   * Dispatches to appropriate processing method based on input type
   */
  async calculate(
    input: SingleInput | SingleInput[] | any,
    options: CalculationOptions = {}
  ): Promise<CalculationResult | CalculationResult[]> {
    const startTime = performance.now();

    // Handle array inputs (batch processing)
    if (Array.isArray(input)) {
      return this.calculateBatch(input, options);
    }

    // Handle single structured input
    if (this.isStructuredInput(input)) {
      return this.calculateSingle(input, options);
    }

    // Try to auto-detect and use appropriate adapter
    const adapter = adapterRegistry.autoDetect(input);
    if (adapter) {
      return this.calculateWithAdapter(input, adapter, options);
    }

    // Fallback to legacy method detection
    return this.calculateLegacy(input, options);
  }

  /**
   * Calculate emissions for digital activities (legacy method with delegation)
   */
  calculateDigitalEmissions(
    dataTransfer: number, // in MB
    timeSpent: number, // in minutes
    deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop',
    options: CalculationOptions = {}
  ): Promise<EmissionData> {
    return this.calculateSingle({
      type: 'digital',
      dataTransfer,
      timeSpent,
      deviceType
    }, options).then(result => result.data as EmissionData);
  }

  /**
   * Calculate transport emissions (legacy method with delegation)
   */
  calculateTransportEmissions(
    distance: number, // in km
    mode: 'car' | 'train' | 'plane' | 'bus' = 'car',
    options: CalculationOptions = {}
  ): Promise<EmissionData> {
    return this.calculateSingle({
      type: 'transport',
      distance,
      mode
    }, options).then(result => result.data as EmissionData);
  }

  /**
   * Check if input is a structured SingleInput type
   */
  private isStructuredInput(input: any): input is SingleInput {
    return input && typeof input === 'object' && 'type' in input &&
           ['digital', 'transport', 'energy', 'ai'].includes(input.type);
  }

  /**
   * Calculate single emission using structured input
   */
  private async calculateSingle(
    input: SingleInput,
    options: CalculationOptions
  ): Promise<CalculationResult> {
    const startTime = performance.now();
    
    // Apply regional grid intensity if needed and region is provided
    let regionAdjustment = 1;
    if (options.region && (input.type === 'digital' || input.type === 'energy')) {
      try {
        const timestamp = options.timestamp || new Date();
        const intensityResponse = await this.gridIntensityManager.getIntensity(options.region, timestamp);
        // Apply regional adjustment based on grid intensity
        regionAdjustment = intensityResponse.intensity / 475; // 475 is global average
      } catch (error) {
        console.warn(`Failed to get regional grid intensity for ${options.region}:`, error);
      }
    }

    let emissionData: EmissionData;

    switch (input.type) {
      case 'digital':
        emissionData = this.calculateDigitalEmissionsInternal(
          input.dataTransfer,
          input.timeSpent,
          input.deviceType || 'desktop'
        );
        break;
      case 'transport':
        emissionData = this.calculateTransportEmissionsInternal(
          input.distance,
          input.mode || 'car'
        );
        break;
      case 'energy':
        emissionData = this.calculateEnergyEmissionsInternal(
          input.consumption,
          input.source || 'grid'
        );
        break;
      case 'ai':
        emissionData = this.calculateAIEmissionsInternal(
          input.tokens,
          input.model
        );
        break;
      default:
        throw new Error(`Unsupported input type: ${(input as any).type}`);
    }

    // Apply regional adjustment
    if (regionAdjustment !== 1) {
      emissionData.amount *= regionAdjustment;
      emissionData.amount = Math.round(emissionData.amount * 100) / 100;
      emissionData.region = options.region;
    }

    // Apply uncertainty quantification if requested
    let finalData: EmissionData | EmissionDataWithUncertainty = emissionData;
    if (options.includeUncertainty && this.uncertaintyEnabled) {
      const uncertaintyOptions = options.uncertaintyOptions || {};
      const uncertainty = this.calculateEmissionUncertainty(
        emissionData.amount,
        emissionData.confidence || { low: emissionData.amount * 0.8, high: emissionData.amount * 1.2 },
        uncertaintyOptions.confidenceLevel || 95,
        uncertaintyOptions.method || 'montecarlo',
        uncertaintyOptions.iterations || 1000
      );
      finalData = { ...emissionData, uncertainty };
    }

    const processingTime = performance.now() - startTime;
    return {
      data: finalData,
      processingTime,
      source: 'direct'
    };
  }

  /**
   * Calculate batch emissions using optimizations
   */
  private async calculateBatch(
    inputs: (SingleInput | any)[],
    options: CalculationOptions
  ): Promise<CalculationResult[]> {
    const startTime = performance.now();
    
    // Use optimized batch calculator if enabled and available
    if (this.optimizationsEnabled && featureFlags.getFlags().enableBatchOptimizations) {
      try {
        // Convert inputs to batch format
        const batchInputs = inputs.map(input => ({ ...input, ...options }));
        const { results } = await this.batchCalculator.calculateBatch(batchInputs, {
          batchSize: options.batchSize || 100,
          features: featureFlags.getFlags()
        });
        
        const processingTime = performance.now() - startTime;
        return results.map(result => ({
          data: result as EmissionData,
          processingTime: processingTime / results.length,
          source: 'batch' as const
        }));
      } catch (error) {
        console.warn('Batch optimization failed, falling back to sequential processing:', error);
      }
    }

    // Fallback to sequential processing
    const results: CalculationResult[] = [];
    for (const input of inputs) {
      try {
        const result = await this.calculate(input, options) as CalculationResult;
        results.push(result);
      } catch (error) {
        console.error('Failed to process input:', input, error);
        // Continue processing other inputs
      }
    }
    
    return results;
  }

  /**
   * Calculate using adapter
   */
  private async calculateWithAdapter(
    input: any,
    adapter: BaseAdapter,
    options: CalculationOptions
  ): Promise<CalculationResult> {
    const startTime = performance.now();
    
    try {
      // Validate input with adapter
      const validation = adapter.validate(input);
      if (!validation.isValid) {
        throw new Error(`Adapter validation failed: ${validation.errors?.join(', ')}`);
      }

      // Normalize data using adapter
      const normalizedData = await adapter.normalize(input);
      
      // Convert normalized data to structured input format
      const structuredInput = this.normalizedDataToStructuredInput(normalizedData);
      
      // Process using regular calculation
      const result = await this.calculateSingle(structuredInput, options);
      
      return {
        ...result,
        source: 'adapter'
      };
    } catch (error) {
      console.error('Adapter processing failed:', error);
      throw error;
    }
  }

  /**
   * Legacy calculation method for backward compatibility
   */
  private async calculateLegacy(
    input: any,
    options: CalculationOptions
  ): Promise<CalculationResult> {
    const startTime = performance.now();
    
    // Try to infer input type and convert to structured format
    let structuredInput: SingleInput;
    
    if (input.dataTransfer !== undefined || input.timeSpent !== undefined) {
      structuredInput = {
        type: 'digital',
        dataTransfer: input.dataTransfer || 0,
        timeSpent: input.timeSpent || 0,
        deviceType: input.deviceType
      };
    } else if (input.distance !== undefined) {
      structuredInput = {
        type: 'transport',
        distance: input.distance,
        mode: input.mode
      };
    } else if (input.consumption !== undefined) {
      structuredInput = {
        type: 'energy',
        consumption: input.consumption,
        source: input.source
      };
    } else if (input.tokens !== undefined || input.model !== undefined) {
      structuredInput = {
        type: 'ai',
        tokens: input.tokens || 0,
        model: input.model
      };
    } else {
      throw new Error('Unable to process input: unknown format');
    }
    
    return this.calculateSingle(structuredInput, options);
  }

  /**
   * Convert normalized adapter data to structured input
   */
  private normalizedDataToStructuredInput(normalizedData: any): SingleInput {
    // This is a simplified conversion - in practice, this would be more sophisticated
    if (normalizedData.type) {
      return normalizedData as SingleInput;
    }
    
    // Try to infer type from available fields
    if (normalizedData.dataTransfer !== undefined || normalizedData.timeSpent !== undefined) {
      return {
        type: 'digital',
        dataTransfer: normalizedData.dataTransfer || 0,
        timeSpent: normalizedData.timeSpent || 0,
        deviceType: normalizedData.deviceType
      };
    }
    
    // Add more inference logic as needed
    throw new Error('Unable to convert normalized data to structured input');
  }

  /**
   * Internal calculation methods (unchanged from original)
   */
  private calculateDigitalEmissionsInternal(
    dataTransfer: number,
    timeSpent: number,
    deviceType: 'mobile' | 'desktop' | 'tablet'
  ): EmissionData {
    const factor = getEmissionFactor('digital', deviceType);
    const amount = dataTransfer * factor.dataFactor + timeSpent * factor.timeFactor;

    return {
      id: `digital_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: `${deviceType}_usage`,
      amount: Math.round(amount * 100) / 100,
      unit: 'g',
      category: 'digital',
    };
  }

  private calculateTransportEmissionsInternal(
    distance: number,
    mode: 'car' | 'train' | 'plane' | 'bus'
  ): EmissionData {
    const factor = getEmissionFactor('transport', mode);
    const amount = distance * factor.perKm;

    return {
      id: `transport_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: `${mode}_travel`,
      amount: Math.round(amount * 100) / 100,
      unit: 'kg',
      category: 'transport',
    };
  }

  private calculateEnergyEmissionsInternal(
    consumption: number,
    source: 'grid' | 'renewable' | 'fossil'
  ): EmissionData {
    const factor = getEmissionFactor('energy', source);
    const amount = consumption * factor.perKwh;

    return {
      id: `energy_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: `${source}_energy`,
      amount: Math.round(amount * 100) / 100,
      unit: 'kg',
      category: 'energy',
    };
  }

  private calculateAIEmissionsInternal(
    tokens: number,
    model: string
  ): EmissionData {
    const factor = getAIFactor(model);
    if (!factor) {
      throw new Error(`Unknown AI model: ${model}`);
    }

    const amount = tokens > 0 
      ? tokens * factor.co2PerToken
      : factor.co2PerQuery || 0;

    return {
      id: `ai_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: `${model}_inference`,
      amount: Math.round(amount * 100) / 100,
      unit: 'g',
      category: 'ai',
      confidence: factor.confidence,
    };
  }

  /**
   * Calculate energy emissions (legacy method with delegation)
   */
  calculateEnergyEmissions(
    consumption: number, // in kWh
    source: 'grid' | 'renewable' | 'fossil' = 'grid',
    options: CalculationOptions = {}
  ): Promise<EmissionData> {
    return this.calculateSingle({
      type: 'energy',
      consumption,
      source
    }, options).then(result => result.data as EmissionData);
  }

  /**
   * Calculate AI emissions (legacy method with delegation)
   */
  calculateAIEmissions(
    tokens: number,
    model: string,
    options: CalculationOptions = {}
  ): Promise<EmissionData> {
    return this.calculateSingle({
      type: 'ai',
      tokens,
      model
    }, options).then(result => result.data as EmissionData);
  }

  /**
   * Calculate AI emissions with uncertainty quantification
   */
  calculateAIEmissionsWithUncertainty(
    tokens: number,
    model: string,
    options: UncertaintyOptions = {}
  ): EmissionDataWithUncertainty {
    const {
      includeUncertainty = false,
      confidenceLevel = 95,
      method = 'montecarlo',
      iterations = 1000
    } = options;

    const factor = getAIFactor(model);
    if (!factor) {
      throw new Error(`Unknown AI model: ${model}`);
    }

    // Base calculation
    const baseAmount = tokens > 0 
      ? tokens * factor.co2PerToken
      : factor.co2PerQuery || 0;

    const baseData: EmissionData = {
      id: `ai_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: `${model}_inference`,
      amount: Math.round(baseAmount * 100) / 100,
      unit: 'g',
      category: 'ai',
      confidence: factor.confidence,
    };

    if (!includeUncertainty) {
      return baseData;
    }

    // Calculate uncertainty range
    const uncertaintyData = this.calculateEmissionUncertainty(
      baseAmount,
      factor.confidence,
      confidenceLevel,
      method,
      iterations
    );

    return {
      ...baseData,
      uncertainty: uncertaintyData
    };
  }

  /**
   * Calculate uncertainty for emissions based on confidence intervals
   */
  private calculateEmissionUncertainty(
    baseAmount: number,
    factorConfidence: { low: number; high: number },
    targetConfidenceLevel: number,
    method: 'linear' | 'montecarlo',
    iterations: number
  ): { low: number; mean: number; high: number; confidenceLevel: number } {
    // Convert confidence level to decimal
    const confidenceLevelDecimal = targetConfidenceLevel / 100;
    
    // If we have existing confidence intervals from factors, use them
    if (factorConfidence && factorConfidence.low && factorConfidence.high) {
      // Adjust the confidence interval to the target level (assuming 95% CI in factors)
      const adjusted = adjustConfidenceInterval(
        factorConfidence.low,
        factorConfidence.high,
        0.95, // Assuming factors have 95% CI
        confidenceLevelDecimal
      );
      
      return {
        low: Math.round(adjusted.low * 100) / 100,
        mean: Math.round(baseAmount * 100) / 100,
        high: Math.round(adjusted.high * 100) / 100,
        confidenceLevel: targetConfidenceLevel
      };
    }
    
    // If no confidence intervals available, create uncertainty based on typical model uncertainty
    // AI model emissions typically have 20-30% uncertainty
    const uncertaintyPercent = 0.25; // 25% uncertainty
    const range = baseAmount * uncertaintyPercent;
    
    if (method === 'montecarlo') {
      // Use Monte Carlo simulation for more accurate uncertainty propagation
      const emissionFn = (params: Record<string, number>) => {
        return params.emissionFactor * baseAmount;
      };
      
      const uncertainties = {
        emissionFactor: {
          low: 1 - uncertaintyPercent,
          high: 1 + uncertaintyPercent,
          distribution: 'normal' as const
        }
      };
      
      try {
        const result = simpleMonteCarloRange(
          emissionFn,
          uncertainties,
          iterations,
          confidenceLevelDecimal
        );
        
        return {
          low: Math.round(result.low * 100) / 100,
          mean: Math.round(result.mean * 100) / 100,
          high: Math.round(result.high * 100) / 100,
          confidenceLevel: targetConfidenceLevel
        };
      } catch (error) {
        console.warn('Monte Carlo simulation failed, falling back to linear method:', error);
      }
    }
    
    // Linear approximation method
    const zScore = this.getZScoreForConfidence(confidenceLevelDecimal);
    const std = range / 2; // Convert range to standard deviation
    
    return {
      low: Math.round((baseAmount - zScore * std) * 100) / 100,
      mean: Math.round(baseAmount * 100) / 100,
      high: Math.round((baseAmount + zScore * std) * 100) / 100,
      confidenceLevel: targetConfidenceLevel
    };
  }

  /**
   * Get Z-score for confidence level
   */
  private getZScoreForConfidence(confidenceLevel: number): number {
    const confidenceMap: Record<string, number> = {
      '0.90': 1.645,
      '0.95': 1.96,
      '0.99': 2.576
    };
    
    const key = confidenceLevel.toFixed(2);
    return confidenceMap[key] || 1.96; // Default to 95% CI
  }

  /**
   * Generate comprehensive emission result
   */
  generateResult(emissions: EmissionData[]): EmissionResult {
    return {
      emissions,
      footprint: generateFootprint(emissions),
      metadata: {
        calculatedAt: new Date().toISOString(),
        methodology: 'qarbon-v1',
        confidence: 0.85,
      },
    };
  }
}

// Default instance
export const calculator = new EmissionsCalculator();
