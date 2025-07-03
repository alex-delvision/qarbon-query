/**
 * Green Algorithms Adapter
 * 
 * Handles data from Green Algorithms (http://www.green-algorithms.org/), a calculator
 * for estimating the carbon footprint of computational work.
 * 
 * @example
 * ```typescript
 * import { GreenAlgorithmsAdapter } from './GreenAlgorithmsAdapter';
 * 
 * const adapter = new GreenAlgorithmsAdapter();
 * const result = adapter.normalize(greenAlgorithmsData);
 * ```
 * 
 * @example Green Algorithms JSON format:
 * ```json
 * {
 *   "calculation_id": "calc_2023_07_15_142530",
 *   "timestamp": "2023-07-15T14:25:30Z",
 *   "algorithm_name": "Deep Learning Training",
 *   "computational_work": {
 *     "runtime_hours": 12.5,
 *     "cores_used": 16,
 *     "memory_gb": 64,
 *     "gpu_model": "V100",
 *     "gpu_hours": 25.0
 *   },
 *   "location": {
 *     "country": "United Kingdom",
 *     "data_center": "AWS eu-west-2"
 *   },
 *   "power_usage": {
 *     "cpu_power_watts": 180,
 *     "memory_power_watts": 8,
 *     "gpu_power_watts": 300,
 *     "total_power_watts": 488
 *   },
 *   "energy_consumption": {
 *     "total_kwh": 6.1,
 *     "cpu_kwh": 2.25,
 *     "memory_kwh": 0.1,
 *     "gpu_kwh": 7.5
 *   },
 *   "carbon_intensity": {
 *     "value": 256,
 *     "unit": "gCO2e/kWh",
 *     "source": "national_grid"
 *   },
 *   "carbon_footprint": {
 *     "total_co2e_kg": 1.56,
 *     "uncertainty_range": {
 *       "low": 0.78,
 *       "high": 3.12
 *     }
 *   },
 *   "methodology": {
 *     "version": "1.3",
 *     "reference": "Lannelongue et al. 2021"
 *   },
 *   "assumptions": {
 *     "pue": 1.4,
 *     "usage_factor": 1.0,
 *     "pragmatic_scaling": true
 *   }
 * }
 * ```
 */

import { BaseAdapter, ValidationResult, NormalizedData, AdapterMetadata, DetectionHeuristic } from './index';
import { adapterRegistry } from './index';

export interface GreenAlgorithmsData {
  calculation_id: string;
  timestamp: string;
  algorithm_name: string;
  computational_work: {
    runtime_hours: number;
    cores_used: number;
    memory_gb: number;
    gpu_model?: string;
    gpu_hours?: number;
  };
  location: {
    country: string;
    data_center?: string;
  };
  power_usage: {
    cpu_power_watts: number;
    memory_power_watts: number;
    gpu_power_watts?: number;
    total_power_watts: number;
  };
  energy_consumption: {
    total_kwh: number;
    cpu_kwh: number;
    memory_kwh: number;
    gpu_kwh?: number;
  };
  carbon_intensity: {
    value: number;
    unit: string;
    source?: string;
  };
  carbon_footprint: {
    total_co2e_kg: number;
    uncertainty_range?: {
      low: number;
      high: number;
    };
  };
  methodology?: {
    version?: string;
    reference?: string;
  };
  assumptions?: {
    pue?: number;
    usage_factor?: number;
    pragmatic_scaling?: boolean;
  };
}

export class GreenAlgorithmsAdapter extends BaseAdapter<GreenAlgorithmsData> {
  constructor() {
    super({
      name: 'GreenAlgorithmsAdapter',
      version: '1.0.0',
      description: 'Adapter for Green Algorithms carbon footprint calculations',
      supportedFormats: ['json'],
      confidence: 0.88
    });
  }

  validate(input: GreenAlgorithmsData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!input.calculation_id) {
      errors.push('Missing required field: calculation_id');
    }
    if (!input.timestamp) {
      errors.push('Missing required field: timestamp');
    }
    if (!input.algorithm_name) {
      errors.push('Missing required field: algorithm_name');
    }
    if (!input.computational_work) {
      errors.push('Missing required field: computational_work');
    } else {
      if (typeof input.computational_work.runtime_hours !== 'number') {
        errors.push('Invalid or missing computational_work.runtime_hours field');
      }
      if (typeof input.computational_work.cores_used !== 'number') {
        errors.push('Invalid or missing computational_work.cores_used field');
      }
      if (typeof input.computational_work.memory_gb !== 'number') {
        errors.push('Invalid or missing computational_work.memory_gb field');
      }
    }
    if (!input.location) {
      errors.push('Missing required field: location');
    } else {
      if (!input.location.country) {
        errors.push('Missing required field: location.country');
      }
    }
    if (!input.power_usage) {
      errors.push('Missing required field: power_usage');
    }
    if (!input.energy_consumption) {
      errors.push('Missing required field: energy_consumption');
    }
    if (!input.carbon_intensity) {
      errors.push('Missing required field: carbon_intensity');
    }
    if (!input.carbon_footprint) {
      errors.push('Missing required field: carbon_footprint');
    }

    // Data quality warnings
    if (input.carbon_footprint && input.carbon_footprint.total_co2e_kg < 0) {
      warnings.push('Negative carbon footprint value detected');
    }
    if (input.energy_consumption && input.energy_consumption.total_kwh < 0) {
      warnings.push('Negative energy consumption detected');
    }
    if (input.computational_work && input.computational_work.runtime_hours < 0) {
      warnings.push('Negative runtime detected');
    }

    // Validate timestamp format
    if (input.timestamp && !this.isValidTimestamp(input.timestamp)) {
      errors.push('Invalid timestamp format');
    }

    // Validate carbon intensity
    if (input.carbon_intensity && input.carbon_intensity.value < 0) {
      warnings.push('Negative carbon intensity detected');
    }

    // Validate uncertainty range
    if (input.carbon_footprint?.uncertainty_range) {
      const { low, high } = input.carbon_footprint.uncertainty_range;
      if (low > high) {
        warnings.push('Uncertainty range low value is greater than high value');
      }
      if (low < 0 || high < 0) {
        warnings.push('Negative values in uncertainty range');
      }
    }

    // Validate PUE assumption
    if (input.assumptions?.pue && input.assumptions.pue < 1.0) {
      warnings.push('PUE (Power Usage Effectiveness) should be >= 1.0');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  normalize(input: GreenAlgorithmsData): NormalizedData {
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw new Error(`Invalid Green Algorithms data: ${validation.errors?.join(', ')}`);
    }

    return {
      id: `greenalgos_${input.calculation_id}`,
      timestamp: new Date(input.timestamp).toISOString(),
      source: 'green_algorithms',
      category: 'computation',
      
      // Core emissions data
      emissions: {
        total: input.carbon_footprint.total_co2e_kg,
        unit: 'kg',
        scope: 'scope2', // Electricity-based emissions
        uncertainty: input.carbon_footprint.uncertainty_range ? {
          low: input.carbon_footprint.uncertainty_range.low,
          high: input.carbon_footprint.uncertainty_range.high
        } : undefined
      },
      
      // Energy consumption breakdown
      energy: {
        total: input.energy_consumption.total_kwh,
        unit: 'kWh',
        breakdown: {
          cpu: input.energy_consumption.cpu_kwh,
          memory: input.energy_consumption.memory_kwh,
          gpu: input.energy_consumption.gpu_kwh || 0
        }
      },
      
      // Power consumption breakdown
      power: {
        total: input.power_usage.total_power_watts,
        unit: 'W',
        breakdown: {
          cpu: input.power_usage.cpu_power_watts,
          memory: input.power_usage.memory_power_watts,
          gpu: input.power_usage.gpu_power_watts || 0
        }
      },
      
      // Carbon intensity data
      carbon_intensity: {
        value: input.carbon_intensity.value,
        unit: input.carbon_intensity.unit,
        source: input.carbon_intensity.source
      },
      
      // Computational work details
      computation: {
        algorithm_name: input.algorithm_name,
        runtime_hours: input.computational_work.runtime_hours,
        cores_used: input.computational_work.cores_used,
        memory_gb: input.computational_work.memory_gb,
        gpu_model: input.computational_work.gpu_model,
        gpu_hours: input.computational_work.gpu_hours
      },
      
      // Geographic data
      location: {
        country: input.location.country,
        data_center: input.location.data_center
      },
      
      // Methodology and assumptions
      methodology: input.methodology ? {
        version: input.methodology.version,
        reference: input.methodology.reference
      } : undefined,
      
      assumptions: input.assumptions ? {
        pue: input.assumptions.pue,
        usage_factor: input.assumptions.usage_factor,
        pragmatic_scaling: input.assumptions.pragmatic_scaling
      } : undefined,
      
      // Metadata
      metadata: {
        adapter: 'GreenAlgorithmsAdapter',
        adapter_version: '1.0.0',
        confidence: 0.88
      }
    };
  }

  getConfidence(input: any): number {
    return this.calculateHeuristicConfidence(input);
  }

  protected getDetectionHeuristics(): DetectionHeuristic[] {
    return [
      {
        weight: 0.4,
        test: (data: any) => {
          // Check for Green Algorithms specific fields
          const greenAlgoFields = ['calculation_id', 'algorithm_name', 'carbon_footprint'];
          return greenAlgoFields.every(field => data && typeof data === 'object' && field in data);
        }
      },
      {
        weight: 0.3,
        test: (data: any) => {
          // Check for computational work structure
          if (typeof data !== 'object' || data === null) return false;
          if (!data.computational_work || typeof data.computational_work !== 'object') return false;
          const compFields = ['runtime_hours', 'cores_used', 'memory_gb'];
          return compFields.every(field => field in data.computational_work);
        }
      },
      {
        weight: 0.2,
        test: (data: any) => {
          // Check for power usage and energy consumption structure
          if (typeof data !== 'object' || data === null) return false;
          const hasEnergyConsumption = data.energy_consumption && typeof data.energy_consumption === 'object';
          const hasPowerUsage = data.power_usage && typeof data.power_usage === 'object';
          return hasEnergyConsumption && hasPowerUsage;
        }
      },
      {
        weight: 0.1,
        test: (data: any) => {
          // Check for methodology or assumptions
          if (typeof data !== 'object' || data === null) return false;
          return 'methodology' in data || 'assumptions' in data;
        }
      }
    ];
  }

  private isValidTimestamp(timestamp: string): boolean {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
  }
}

// Auto-register the adapter
adapterRegistry.registerAdapter(new GreenAlgorithmsAdapter());
