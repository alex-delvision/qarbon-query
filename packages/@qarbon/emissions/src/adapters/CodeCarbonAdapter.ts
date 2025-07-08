/**
 * CodeCarbon Adapter
 *
 * Handles data from CodeCarbon (https://codecarbon.io/), a Python library for tracking
 * carbon emissions from compute resources during code execution.
 *
 * @example
 * ```typescript
 * import { CodeCarbonAdapter } from './CodeCarbonAdapter';
 *
 * const adapter = new CodeCarbonAdapter();
 * const result = adapter.normalize(codeCarbonData);
 * ```
 *
 * @example CodeCarbon JSON format:
 * ```json
 * {
 *   "timestamp": "2023-07-15T10:30:00Z",
 *   "project_name": "ml-training",
 *   "run_id": "run_2023-07-15_10-30-00",
 *   "duration": 3600,
 *   "emissions": 0.245,
 *   "emissions_rate": 0.000068,
 *   "cpu_power": 12.5,
 *   "gpu_power": 85.3,
 *   "ram_power": 3.2,
 *   "cpu_energy": 0.045,
 *   "gpu_energy": 0.307,
 *   "ram_energy": 0.012,
 *   "energy_consumed": 0.364,
 *   "country_name": "USA",
 *   "country_iso_code": "USA",
 *   "region": "california",
 *   "cloud_provider": "aws",
 *   "cloud_region": "us-west-2",
 *   "os": "Linux-5.4.0-74-generic-x86_64-with-Ubuntu-20.04-focal",
 *   "python_version": "3.8.10",
 *   "codecarbon_version": "1.2.0",
 *   "cpu_count": 4,
 *   "cpu_model": "Intel(R) Core(TM) i7-8700K CPU @ 3.70GHz",
 *   "gpu_count": 1,
 *   "gpu_model": "NVIDIA GeForce RTX 3080",
 *   "longitude": -122.4194,
 *   "latitude": 37.7749,
 *   "ram_total_size": 16.0,
 *   "tracking_mode": "machine"
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

export interface CodeCarbonData {
  timestamp: string;
  project_name: string;
  run_id: string;
  duration: number;
  emissions: number;
  emissions_rate: number;
  cpu_power?: number;
  gpu_power?: number;
  ram_power?: number;
  cpu_energy?: number;
  gpu_energy?: number;
  ram_energy?: number;
  energy_consumed: number;
  country_name?: string;
  country_iso_code?: string;
  region?: string;
  cloud_provider?: string;
  cloud_region?: string;
  os?: string;
  python_version?: string;
  codecarbon_version?: string;
  cpu_count?: number;
  cpu_model?: string;
  gpu_count?: number;
  gpu_model?: string;
  longitude?: number;
  latitude?: number;
  ram_total_size?: number;
  tracking_mode?: string;
}

export class CodeCarbonAdapter extends BaseAdapter<CodeCarbonData> {
  constructor() {
    super({
      name: 'CodeCarbonAdapter',
      version: '1.0.0',
      description: 'Adapter for CodeCarbon emissions tracking data',
      supportedFormats: ['json'],
      confidence: 0.95,
    });
  }

  validate(input: CodeCarbonData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!input.timestamp) {
      errors.push('Missing required field: timestamp');
    }
    if (!input.project_name) {
      errors.push('Missing required field: project_name');
    }
    if (!input.run_id) {
      errors.push('Missing required field: run_id');
    }
    if (typeof input.duration !== 'number') {
      errors.push('Invalid or missing duration field');
    }
    if (typeof input.emissions !== 'number') {
      errors.push('Invalid or missing emissions field');
    }
    if (typeof input.energy_consumed !== 'number') {
      errors.push('Invalid or missing energy_consumed field');
    }

    // Data quality warnings
    if (input.emissions < 0) {
      warnings.push('Negative emissions value detected');
    }
    if (input.duration < 0) {
      warnings.push('Negative duration detected');
    }
    if (input.energy_consumed < 0) {
      warnings.push('Negative energy consumption detected');
    }

    // Validate timestamp format
    if (input.timestamp && !this.isValidTimestamp(input.timestamp)) {
      errors.push('Invalid timestamp format');
    }

    // Validate geographic data consistency
    if (input.longitude && input.latitude) {
      if (Math.abs(input.longitude) > 180 || Math.abs(input.latitude) > 90) {
        warnings.push('Geographic coordinates appear to be invalid');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  normalize(input: CodeCarbonData): NormalizedData {
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw new Error(
        `Invalid CodeCarbon data: ${validation.errors?.join(', ')}`
      );
    }

    return {
      id: `codecarbon_${input.run_id}`,
      timestamp: new Date(input.timestamp).toISOString(),
      source: 'codecarbon',
      category: 'compute',

      // Core emissions data
      emissions: {
        total: input.emissions,
        unit: 'kg',
        rate: input.emissions_rate,
        scope: 'scope2', // Electricity-based emissions
      },

      // Energy consumption breakdown
      energy: {
        total: input.energy_consumed,
        unit: 'kWh',
        breakdown: {
          cpu: input.cpu_energy || 0,
          gpu: input.gpu_energy || 0,
          ram: input.ram_energy || 0,
        },
      },

      // Power consumption breakdown
      power: {
        cpu: input.cpu_power,
        gpu: input.gpu_power,
        ram: input.ram_power,
      },

      // Execution context
      execution: {
        duration: input.duration,
        project: input.project_name,
        run_id: input.run_id,
        tracking_mode: input.tracking_mode,
      },

      // Geographic and infrastructure data
      location: {
        country: input.country_name,
        country_code: input.country_iso_code,
        region: input.region,
        coordinates:
          input.longitude && input.latitude
            ? {
                longitude: input.longitude,
                latitude: input.latitude,
              }
            : undefined,
      },

      // Cloud infrastructure
      cloud: input.cloud_provider
        ? {
            provider: input.cloud_provider,
            region: input.cloud_region,
          }
        : undefined,

      // Hardware specifications
      hardware: {
        cpu: {
          count: input.cpu_count,
          model: input.cpu_model,
        },
        gpu: input.gpu_count
          ? {
              count: input.gpu_count,
              model: input.gpu_model,
            }
          : undefined,
        ram: {
          total_size: input.ram_total_size,
          unit: 'GB',
        },
      },

      // Software environment
      software: {
        os: input.os,
        python_version: input.python_version,
        codecarbon_version: input.codecarbon_version,
      },

      // Metadata
      metadata: {
        adapter: 'CodeCarbonAdapter',
        adapter_version: '1.0.0',
        confidence: 0.95,
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
          // Check for CodeCarbon specific fields
          const codeCarbonFields = [
            'codecarbon_version',
            'tracking_mode',
            'emissions_rate',
          ];
          return codeCarbonFields.some(
            field => data && typeof data === 'object' && field in data
          );
        },
      },
      {
        weight: 0.3,
        test: (data: any) => {
          // Check for typical CodeCarbon structure
          if (typeof data !== 'object' || data === null) return false;
          const requiredFields = [
            'timestamp',
            'project_name',
            'run_id',
            'emissions',
            'energy_consumed',
          ];
          return requiredFields.every(field => field in data);
        },
      },
      {
        weight: 0.2,
        test: (data: any) => {
          // Check for CodeCarbon energy breakdown pattern
          if (typeof data !== 'object' || data === null) return false;
          const energyFields = ['cpu_energy', 'gpu_energy', 'ram_energy'];
          return energyFields.some(field => field in data);
        },
      },
      {
        weight: 0.1,
        test: (data: any) => {
          // Check for CodeCarbon hardware info pattern
          if (typeof data !== 'object' || data === null) return false;
          const hardwareFields = [
            'cpu_count',
            'cpu_model',
            'gpu_count',
            'gpu_model',
          ];
          return hardwareFields.some(field => field in data);
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
adapterRegistry.registerAdapter(new CodeCarbonAdapter());
