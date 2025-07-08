/**
 * ML CO2 Impact Adapter
 *
 * Handles data from ML CO2 Impact (https://mlco2.github.io/impact/), a platform for tracking
 * carbon emissions from machine learning experiments and model training.
 *
 * @example
 * ```typescript
 * import { MLCO2ImpactAdapter } from './MLCO2ImpactAdapter';
 *
 * const adapter = new MLCO2ImpactAdapter();
 * const result = adapter.normalize(mlco2Data);
 * ```
 *
 * @example ML CO2 Impact JSON format:
 * ```json
 * {
 *   "experiment_id": "exp_2023_07_15_ml_training",
 *   "model_name": "ResNet-50",
 *   "timestamp": "2023-07-15T10:30:00Z",
 *   "duration": 7200,
 *   "impact": {
 *     "carbon_emissions": 0.156,
 *     "energy_consumption": 0.425,
 *     "energy_mix": {
 *       "renewable": 0.45,
 *       "fossil": 0.55
 *     }
 *   },
 *   "hardware": {
 *     "gpu": {
 *       "model": "NVIDIA V100",
 *       "count": 4,
 *       "memory": "32GB"
 *     },
 *     "cpu": {
 *       "model": "Intel Xeon E5-2670",
 *       "count": 16
 *     }
 *   },
 *   "location": {
 *     "country": "United States",
 *     "region": "US-West",
 *     "carbon_intensity": 367.2
 *   },
 *   "software": {
 *     "framework": "PyTorch",
 *     "version": "1.9.0",
 *     "cuda_version": "11.1"
 *   },
 *   "dataset": {
 *     "name": "ImageNet",
 *     "size": "150GB",
 *     "samples": 1281167
 *   },
 *   "training": {
 *     "epochs": 100,
 *     "batch_size": 256,
 *     "learning_rate": 0.001,
 *     "optimizer": "Adam"
 *   }
 * }
 * ```
 */

import {
  BaseAdapter,
  ValidationResult,
  NormalizedData,
  AdapterMetadata,
  DetectionHeuristic,
} from './index';
import { adapterRegistry } from './index';

export interface MLCO2ImpactData {
  experiment_id: string;
  model_name: string;
  timestamp: string;
  duration: number;
  impact: {
    carbon_emissions: number;
    energy_consumption: number;
    energy_mix?: {
      renewable: number;
      fossil: number;
    };
  };
  hardware: {
    gpu?: {
      model: string;
      count: number;
      memory?: string;
    };
    cpu?: {
      model: string;
      count: number;
    };
  };
  location: {
    country: string;
    region?: string;
    carbon_intensity?: number;
  };
  software?: {
    framework?: string;
    version?: string;
    cuda_version?: string;
  };
  dataset?: {
    name?: string;
    size?: string;
    samples?: number;
  };
  training?: {
    epochs?: number;
    batch_size?: number;
    learning_rate?: number;
    optimizer?: string;
  };
}

export class MLCO2ImpactAdapter extends BaseAdapter<MLCO2ImpactData> {
  constructor() {
    super({
      name: 'MLCO2ImpactAdapter',
      version: '1.0.0',
      description: 'Adapter for ML CO2 Impact emissions tracking data',
      supportedFormats: ['json'],
      confidence: 0.9,
    });
  }

  validate(input: MLCO2ImpactData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!input.experiment_id) {
      errors.push('Missing required field: experiment_id');
    }
    if (!input.model_name) {
      errors.push('Missing required field: model_name');
    }
    if (!input.timestamp) {
      errors.push('Missing required field: timestamp');
    }
    if (typeof input.duration !== 'number') {
      errors.push('Invalid or missing duration field');
    }
    if (!input.impact) {
      errors.push('Missing required field: impact');
    } else {
      if (typeof input.impact.carbon_emissions !== 'number') {
        errors.push('Invalid or missing impact.carbon_emissions field');
      }
      if (typeof input.impact.energy_consumption !== 'number') {
        errors.push('Invalid or missing impact.energy_consumption field');
      }
    }
    if (!input.hardware) {
      errors.push('Missing required field: hardware');
    }
    if (!input.location) {
      errors.push('Missing required field: location');
    } else {
      if (!input.location.country) {
        errors.push('Missing required field: location.country');
      }
    }

    // Data quality warnings
    if (input.impact && input.impact.carbon_emissions < 0) {
      warnings.push('Negative carbon emissions value detected');
    }
    if (input.impact && input.impact.energy_consumption < 0) {
      warnings.push('Negative energy consumption detected');
    }
    if (input.duration < 0) {
      warnings.push('Negative duration detected');
    }

    // Validate timestamp format
    if (input.timestamp && !this.isValidTimestamp(input.timestamp)) {
      errors.push('Invalid timestamp format');
    }

    // Validate energy mix consistency
    if (input.impact?.energy_mix) {
      const { renewable, fossil } = input.impact.energy_mix;
      if (renewable + fossil !== 1.0) {
        warnings.push('Energy mix renewable + fossil ratios should sum to 1.0');
      }
    }

    // Validate carbon intensity
    if (
      input.location?.carbon_intensity &&
      input.location.carbon_intensity < 0
    ) {
      warnings.push('Negative carbon intensity detected');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  normalize(input: MLCO2ImpactData): NormalizedData {
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw new Error(
        `Invalid ML CO2 Impact data: ${validation.errors?.join(', ')}`
      );
    }

    return {
      id: `mlco2_${input.experiment_id}`,
      timestamp: new Date(input.timestamp).toISOString(),
      source: 'mlco2impact',
      category: 'ml_training',

      // Core emissions data
      emissions: {
        total: input.impact.carbon_emissions,
        unit: 'kg',
        scope: 'scope2', // Electricity-based emissions
      },

      // Energy consumption data
      energy: {
        total: input.impact.energy_consumption,
        unit: 'kWh',
        mix: input.impact.energy_mix
          ? {
              renewable: input.impact.energy_mix.renewable,
              fossil: input.impact.energy_mix.fossil,
            }
          : undefined,
      },

      // ML-specific context
      ml_context: {
        experiment_id: input.experiment_id,
        model_name: input.model_name,
        duration: input.duration,
        training: input.training
          ? {
              epochs: input.training.epochs,
              batch_size: input.training.batch_size,
              learning_rate: input.training.learning_rate,
              optimizer: input.training.optimizer,
            }
          : undefined,
        dataset: input.dataset
          ? {
              name: input.dataset.name,
              size: input.dataset.size,
              samples: input.dataset.samples,
            }
          : undefined,
      },

      // Hardware specifications
      hardware: {
        gpu: input.hardware.gpu
          ? {
              model: input.hardware.gpu.model,
              count: input.hardware.gpu.count,
              memory: input.hardware.gpu.memory,
            }
          : undefined,
        cpu: input.hardware.cpu
          ? {
              model: input.hardware.cpu.model,
              count: input.hardware.cpu.count,
            }
          : undefined,
      },

      // Geographic and carbon intensity data
      location: {
        country: input.location.country,
        region: input.location.region,
        carbon_intensity: input.location.carbon_intensity,
      },

      // Software environment
      software: input.software
        ? {
            framework: input.software.framework,
            version: input.software.version,
            cuda_version: input.software.cuda_version,
          }
        : undefined,

      // Metadata
      metadata: {
        adapter: 'MLCO2ImpactAdapter',
        adapter_version: '1.0.0',
        confidence: 0.9,
      },
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
          // Check for ML CO2 Impact specific fields
          const mlco2Fields = ['experiment_id', 'model_name', 'impact'];
          return mlco2Fields.every(
            field => data && typeof data === 'object' && field in data
          );
        },
      },
      {
        weight: 0.3,
        test: (data: any) => {
          // Check for ML-specific training fields
          if (typeof data !== 'object' || data === null) return false;
          const mlFields = ['training', 'dataset', 'model_name'];
          return mlFields.some(field => field in data);
        },
      },
      {
        weight: 0.2,
        test: (data: any) => {
          // Check for impact structure
          if (typeof data !== 'object' || data === null) return false;
          if (!data.impact || typeof data.impact !== 'object') return false;
          const impactFields = ['carbon_emissions', 'energy_consumption'];
          return impactFields.every(field => field in data.impact);
        },
      },
      {
        weight: 0.1,
        test: (data: any) => {
          // Check for hardware specification pattern
          if (typeof data !== 'object' || data === null) return false;
          if (!data.hardware || typeof data.hardware !== 'object') return false;
          return 'gpu' in data.hardware || 'cpu' in data.hardware;
        },
      },
    ];
  }

  private isValidTimestamp(timestamp: string): boolean {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
  }
}

// Auto-register the adapter
adapterRegistry.registerAdapter(new MLCO2ImpactAdapter());
