/**
 * Eco2AI Adapter
 * 
 * Handles data from Eco2AI (https://github.com/sb-ai-lab/Eco2AI), a Python library for 
 * carbon emissions tracking specifically designed for AI experiments and model training.
 * 
 * @example
 * ```typescript
 * import { Eco2AIAdapter } from './Eco2AIAdapter';
 * 
 * const adapter = new Eco2AIAdapter();
 * const result = adapter.normalize(eco2aiData);
 * ```
 * 
 * @example Eco2AI JSON format:
 * ```json
 * {
 *   "session_id": "session_20230715_103000",
 *   "experiment_id": "ai_training_resnet",
 *   "start_time": "2023-07-15T10:30:00Z",
 *   "end_time": "2023-07-15T12:45:00Z",
 *   "duration": 8100,
 *   "emissions": {
 *     "co2": 0.287,
 *     "co2_unit": "kg",
 *     "power": 142.5,
 *     "power_unit": "W",
 *     "energy": 0.321,
 *     "energy_unit": "kWh"
 *   },
 *   "system": {
 *     "platform": "Linux",
 *     "python_version": "3.9.7",
 *     "cpu_model": "Intel(R) Core(TM) i9-10900K CPU @ 3.70GHz",
 *     "cpu_count": 10,
 *     "ram_size": 32.0,
 *     "gpu_model": "NVIDIA GeForce RTX 3090",
 *     "gpu_count": 2
 *   },
 *   "carbon_intensity": {
 *     "value": 445.2,
 *     "unit": "gCO2/kWh",
 *     "source": "electricitymap"
 *   },
 *   "location": {
 *     "country": "Germany",
 *     "region": "DE"
 *   },
 *   "user_info": {
 *     "project_name": "image_classification",
 *     "experiment_description": "Training ResNet-50 on ImageNet dataset",
 *     "tags": ["deep-learning", "computer-vision", "resnet"]
 *   },
 *   "eco2ai_version": "0.2.1"
 * }
 * ```
 */

import { BaseAdapter, ValidationResult, NormalizedData, AdapterMetadata, DetectionHeuristic } from './index';
import { adapterRegistry } from './index';

export interface Eco2AIData {
  session_id: string;
  experiment_id?: string;
  start_time: string;
  end_time: string;
  duration: number;
  emissions: {
    co2: number;
    co2_unit: string;
    power: number;
    power_unit: string;
    energy: number;
    energy_unit: string;
  };
  system: {
    platform: string;
    python_version: string;
    cpu_model: string;
    cpu_count: number;
    ram_size: number;
    gpu_model?: string;
    gpu_count?: number;
  };
  carbon_intensity: {
    value: number;
    unit: string;
    source?: string;
  };
  location: {
    country: string;
    region: string;
  };
  user_info?: {
    project_name?: string;
    experiment_description?: string;
    tags?: string[];
  };
  eco2ai_version: string;
}

export class Eco2AIAdapter extends BaseAdapter<Eco2AIData> {
  constructor() {
    super({
      name: 'Eco2AIAdapter',
      version: '1.0.0',
      description: 'Adapter for Eco2AI emissions tracking data',
      supportedFormats: ['json'],
      confidence: 0.92
    });
  }

  validate(input: Eco2AIData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!input.session_id) {
      errors.push('Missing required field: session_id');
    }
    if (!input.start_time) {
      errors.push('Missing required field: start_time');
    }
    if (!input.end_time) {
      errors.push('Missing required field: end_time');
    }
    if (typeof input.duration !== 'number') {
      errors.push('Invalid or missing duration field');
    }
    if (!input.emissions) {
      errors.push('Missing required field: emissions');
    } else {
      if (typeof input.emissions.co2 !== 'number') {
        errors.push('Invalid or missing emissions.co2 field');
      }
      if (typeof input.emissions.power !== 'number') {
        errors.push('Invalid or missing emissions.power field');
      }
      if (typeof input.emissions.energy !== 'number') {
        errors.push('Invalid or missing emissions.energy field');
      }
    }
    if (!input.system) {
      errors.push('Missing required field: system');
    }
    if (!input.carbon_intensity) {
      errors.push('Missing required field: carbon_intensity');
    }
    if (!input.location) {
      errors.push('Missing required field: location');
    }
    if (!input.eco2ai_version) {
      errors.push('Missing required field: eco2ai_version');
    }

    // Data quality warnings
    if (input.emissions && input.emissions.co2 < 0) {
      warnings.push('Negative CO2 emissions value detected');
    }
    if (input.emissions && input.emissions.energy < 0) {
      warnings.push('Negative energy consumption detected');
    }
    if (input.emissions && input.emissions.power < 0) {
      warnings.push('Negative power consumption detected');
    }
    if (input.duration < 0) {
      warnings.push('Negative duration detected');
    }

    // Validate timestamps
    if (input.start_time && !this.isValidTimestamp(input.start_time)) {
      errors.push('Invalid start_time format');
    }
    if (input.end_time && !this.isValidTimestamp(input.end_time)) {
      errors.push('Invalid end_time format');
    }

    // Validate time consistency
    if (input.start_time && input.end_time) {
      const startDate = new Date(input.start_time);
      const endDate = new Date(input.end_time);
      if (endDate <= startDate) {
        warnings.push('End time should be after start time');
      }
    }

    // Validate carbon intensity
    if (input.carbon_intensity && input.carbon_intensity.value < 0) {
      warnings.push('Negative carbon intensity detected');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  normalize(input: Eco2AIData): NormalizedData {
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw new Error(`Invalid Eco2AI data: ${validation.errors?.join(', ')}`);
    }

    return {
      id: `eco2ai_${input.session_id}`,
      timestamp: new Date(input.start_time).toISOString(),
      source: 'eco2ai',
      category: 'ai_experiment',
      
      // Core emissions data
      emissions: {
        total: input.emissions.co2,
        unit: input.emissions.co2_unit,
        scope: 'scope2' // Electricity-based emissions
      },
      
      // Energy and power data
      energy: {
        total: input.emissions.energy,
        unit: input.emissions.energy_unit
      },
      
      power: {
        average: input.emissions.power,
        unit: input.emissions.power_unit
      },
      
      // Carbon intensity data
      carbon_intensity: {
        value: input.carbon_intensity.value,
        unit: input.carbon_intensity.unit,
        source: input.carbon_intensity.source
      },
      
      // Timing information
      timing: {
        start_time: new Date(input.start_time).toISOString(),
        end_time: new Date(input.end_time).toISOString(),
        duration: input.duration,
        duration_unit: 'seconds'
      },
      
      // AI/ML context
      ai_context: {
        session_id: input.session_id,
        experiment_id: input.experiment_id,
        project_name: input.user_info?.project_name,
        description: input.user_info?.experiment_description,
        tags: input.user_info?.tags
      },
      
      // Hardware specifications
      hardware: {
        cpu: {
          model: input.system.cpu_model,
          count: input.system.cpu_count
        },
        gpu: input.system.gpu_model ? {
          model: input.system.gpu_model,
          count: input.system.gpu_count || 1
        } : undefined,
        ram: {
          size: input.system.ram_size,
          unit: 'GB'
        }
      },
      
      // System environment
      system: {
        platform: input.system.platform,
        python_version: input.system.python_version
      },
      
      // Geographic data
      location: {
        country: input.location.country,
        region: input.location.region
      },
      
      // Metadata
      metadata: {
        adapter: 'Eco2AIAdapter',
        adapter_version: '1.0.0',
        eco2ai_version: input.eco2ai_version,
        confidence: 0.92
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
          // Check for Eco2AI specific fields
          const eco2aiFields = ['eco2ai_version', 'session_id', 'carbon_intensity'];
          return eco2aiFields.every(field => data && typeof data === 'object' && field in data);
        }
      },
      {
        weight: 0.3,
        test: (data: any) => {
          // Check for typical Eco2AI emissions structure
          if (typeof data !== 'object' || data === null) return false;
          if (!data.emissions || typeof data.emissions !== 'object') return false;
          const emissionFields = ['co2', 'power', 'energy'];
          return emissionFields.every(field => field in data.emissions);
        }
      },
      {
        weight: 0.2,
        test: (data: any) => {
          // Check for Eco2AI system info pattern
          if (typeof data !== 'object' || data === null) return false;
          if (!data.system || typeof data.system !== 'object') return false;
          const systemFields = ['platform', 'python_version', 'cpu_model'];
          return systemFields.every(field => field in data.system);
        }
      },
      {
        weight: 0.1,
        test: (data: any) => {
          // Check for timing structure
          if (typeof data !== 'object' || data === null) return false;
          const timeFields = ['start_time', 'end_time', 'duration'];
          return timeFields.every(field => field in data);
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
adapterRegistry.registerAdapter(new Eco2AIAdapter());
