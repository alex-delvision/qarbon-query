/**
 * JSON Adapter
 *
 * Handles JSON data with configurable property mapping for emissions and energy data.
 * Supports nested property paths and flexible field mapping.
 *
 * @example
 * ```typescript
 * import { JsonAdapter } from './JsonAdapter';
 *
 * const adapter = new JsonAdapter({
 *   propertyMapping: {
 *     timestamp: 'data.timestamp',
 *     emissions: 'metrics.carbon.total_kg',
 *     energy: 'metrics.energy.consumption_kwh',
 *     source: 'metadata.source_system'
 *   }
 * });
 * const result = adapter.normalize(jsonData);
 * ```
 *
 * @example JSON input format:
 * ```json
 * {
 *   "data": {
 *     "timestamp": "2023-07-15T10:30:00Z",
 *     "id": "measurement_001"
 *   },
 *   "metrics": {
 *     "carbon": {
 *       "total_kg": 0.125,
 *       "intensity": 445.2
 *     },
 *     "energy": {
 *       "consumption_kwh": 0.25,
 *       "power_w": 125
 *     }
 *   },
 *   "metadata": {
 *     "source_system": "monitoring_platform",
 *     "device_id": "server_01",
 *     "location": "datacenter_west"
 *   }
 * }
 * ```
 *
 * @example Alternative flat JSON format:
 * ```json
 * {
 *   "timestamp": "2023-07-15T10:30:00Z",
 *   "co2_emissions": 89.5,
 *   "energy_kwh": 0.18,
 *   "power_watts": 90,
 *   "duration_hours": 2,
 *   "source": "ml_training",
 *   "device": "gpu_cluster_02"
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

export interface JsonPropertyMapping {
  timestamp?: string;
  emissions?: string;
  energy?: string;
  power?: string;
  duration?: string;
  source?: string;
  device_id?: string;
  location?: string;
  [key: string]: string | undefined;
}

export interface JsonAdapterConfig {
  propertyMapping: JsonPropertyMapping;
  emissionsUnit?: string;
  energyUnit?: string;
  powerUnit?: string;
  durationUnit?: string;
  arrayPath?: string; // Path to array if data is nested in an array
}

export interface JsonData {
  data: any;
  config: JsonAdapterConfig;
}

export class JsonAdapter extends BaseAdapter<JsonData> {
  private config: JsonAdapterConfig;

  constructor(config?: JsonAdapterConfig) {
    super({
      name: 'JsonAdapter',
      version: '1.0.0',
      description: 'Adapter for JSON data with configurable property mapping',
      supportedFormats: ['json'],
      confidence: 0.65,
    });

    this.config = {
      emissionsUnit: 'kg',
      energyUnit: 'kWh',
      powerUnit: 'W',
      durationUnit: 'hours',
      propertyMapping: {},
      ...config,
    };
  }

  validate(input: JsonData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate input structure
    if (!input.data) {
      errors.push('Missing data object');
      return { isValid: false, errors };
    }

    // Validate configuration
    const config = { ...this.config, ...input.config };
    if (
      !config.propertyMapping ||
      Object.keys(config.propertyMapping).length === 0
    ) {
      errors.push('Property mapping configuration is required');
    }

    // Check if this is array data
    let dataToValidate = input.data;
    if (config.arrayPath) {
      dataToValidate = this.getNestedValue(input.data, config.arrayPath);
      if (!Array.isArray(dataToValidate)) {
        errors.push(
          `Array path '${config.arrayPath}' does not point to an array`
        );
        return { isValid: false, errors };
      }
      if (dataToValidate.length === 0) {
        errors.push('Array is empty');
        return { isValid: false, errors };
      }
      dataToValidate = dataToValidate[0]; // Validate against first item
    }

    // Validate mapped properties exist in data
    const missingProperties: string[] = [];
    Object.entries(config.propertyMapping).forEach(([field, path]) => {
      if (path && this.getNestedValue(dataToValidate, path) === undefined) {
        missingProperties.push(`${field} -> ${path}`);
      }
    });

    if (missingProperties.length > 0) {
      warnings.push(
        `Mapped properties not found in data: ${missingProperties.join(', ')}`
      );
    }

    // Check for required mappings
    if (!config.propertyMapping.timestamp) {
      warnings.push('No timestamp property mapping specified');
    }

    const hasEmissionsOrEnergy =
      config.propertyMapping.emissions || config.propertyMapping.energy;
    if (!hasEmissionsOrEnergy) {
      warnings.push('No emissions or energy property mapping specified');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  normalize(input: JsonData): NormalizedData {
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw new Error(`Invalid JSON data: ${validation.errors?.join(', ')}`);
    }

    const config = { ...this.config, ...input.config };

    // Handle array data
    if (config.arrayPath) {
      const arrayData = this.getNestedValue(input.data, config.arrayPath);
      if (Array.isArray(arrayData)) {
        const normalizedRows = arrayData.map((item, index) =>
          this.normalizeObject(item, config, index)
        );

        if (normalizedRows.length === 1) {
          return normalizedRows[0];
        }

        return this.aggregateObjects(normalizedRows);
      }
    }

    // Handle single object
    return this.normalizeObject(input.data, config, 0);
  }

  private normalizeObject(
    data: any,
    config: JsonAdapterConfig,
    index: number
  ): NormalizedData {
    // Extract mapped values
    const getValue = (field: string): any => {
      const path = config.propertyMapping[field];
      return path ? this.getNestedValue(data, path) : undefined;
    };

    const timestampValue = getValue('timestamp');
    const emissionsValue = this.parseNumber(getValue('emissions'));
    const energyValue = this.parseNumber(getValue('energy'));
    const powerValue = this.parseNumber(getValue('power'));
    const durationValue = this.parseNumber(getValue('duration'));
    const sourceValue = getValue('source') || 'json_import';
    const deviceIdValue = getValue('device_id') || `device_${index}`;
    const locationValue = getValue('location');

    // Validate required fields
    if (!timestampValue) {
      throw new Error('Missing timestamp value');
    }

    if (!emissionsValue && !energyValue) {
      throw new Error('Missing both emissions and energy values');
    }

    // Convert timestamp
    const timestamp = this.parseTimestamp(timestampValue);
    if (!timestamp) {
      throw new Error(`Invalid timestamp: ${timestampValue}`);
    }

    // Calculate missing values if possible
    let calculatedEmissions: number | undefined;
    let calculatedEnergy: number | undefined;

    if (!emissionsValue && energyValue) {
      // Could estimate emissions from energy if carbon intensity available
      calculatedEmissions = undefined;
    }

    if (!energyValue && powerValue && durationValue) {
      // Calculate energy from power and duration
      calculatedEnergy = this.calculateEnergy(
        powerValue,
        durationValue,
        config.durationUnit
      );
    }

    return {
      id: `json_${index}_${timestamp.getTime()}`,
      timestamp: timestamp.toISOString(),
      source: sourceValue,
      category: 'json_import',

      // Core emissions data
      emissions: emissionsValue
        ? {
            total: emissionsValue,
            unit: config.emissionsUnit || 'kg',
            scope: 'scope2', // Default assumption
          }
        : undefined,

      // Energy data
      energy:
        energyValue || calculatedEnergy
          ? {
              total: energyValue || calculatedEnergy!,
              unit: config.energyUnit || 'kWh',
              estimated: !energyValue && calculatedEnergy !== undefined,
            }
          : undefined,

      // Power data
      power: powerValue
        ? {
            average: powerValue,
            unit: config.powerUnit || 'W',
          }
        : undefined,

      // Duration data
      duration: durationValue
        ? {
            value: durationValue,
            unit: config.durationUnit || 'hours',
          }
        : undefined,

      // Device and location
      device: {
        id: deviceIdValue,
      },

      location: locationValue
        ? {
            name:
              typeof locationValue === 'string'
                ? locationValue
                : JSON.stringify(locationValue),
          }
        : undefined,

      // Raw data for reference
      raw_data: data,

      // Additional properties not in mapping
      additional_properties: this.extractAdditionalProperties(
        data,
        config.propertyMapping
      ),

      // Metadata
      metadata: {
        adapter: 'JsonAdapter',
        adapter_version: '1.0.0',
        object_index: index,
        confidence: 0.65,
      },
    };
  }

  private aggregateObjects(objects: NormalizedData[]): NormalizedData {
    if (objects.length === 0) {
      throw new Error('No valid objects to aggregate');
    }

    // Calculate totals
    const totalEmissions = objects.reduce((sum, obj) => {
      return sum + (obj.emissions?.total || 0);
    }, 0);

    const totalEnergy = objects.reduce((sum, obj) => {
      return sum + (obj.energy?.total || 0);
    }, 0);

    const avgPower = objects.reduce((sum, obj, index, arr) => {
      return sum + (obj.power?.average || 0) / arr.length;
    }, 0);

    return {
      id: `json_aggregate_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'json_import',
      category: 'json_aggregate',

      emissions:
        totalEmissions > 0
          ? {
              total: totalEmissions,
              unit: 'kg',
              scope: 'scope2',
            }
          : undefined,

      energy:
        totalEnergy > 0
          ? {
              total: totalEnergy,
              unit: 'kWh',
            }
          : undefined,

      power:
        avgPower > 0
          ? {
              average: avgPower,
              unit: 'W',
            }
          : undefined,

      aggregation: {
        object_count: objects.length,
        date_range: {
          start: objects[0].timestamp,
          end: objects[objects.length - 1].timestamp,
        },
      },

      metadata: {
        adapter: 'JsonAdapter',
        adapter_version: '1.0.0',
        confidence: 0.65,
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
          // Check for JSON structure with data and config
          if (typeof data !== 'object' || data === null) return false;
          return 'data' in data && 'config' in data;
        },
      },
      {
        weight: 0.3,
        test: (data: any) => {
          // Check for config with property mapping
          if (typeof data !== 'object' || data === null) return false;
          return (
            data.config &&
            data.config.propertyMapping &&
            typeof data.config.propertyMapping === 'object'
          );
        },
      },
      {
        weight: 0.2,
        test: (data: any) => {
          // Check for nested object structure in data
          if (typeof data !== 'object' || data === null) return false;
          if (!data.data || typeof data.data !== 'object') return false;
          return Object.keys(data.data).length > 0;
        },
      },
      {
        weight: 0.1,
        test: (data: any) => {
          // Check for common property patterns
          if (typeof data !== 'object' || data === null) return false;
          if (!data.data || typeof data.data !== 'object') return false;
          const commonFields = ['timestamp', 'emissions', 'energy', 'power'];
          return commonFields.some(field =>
            this.hasNestedProperty(data.data, field)
          );
        },
      },
    ];
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private hasNestedProperty(obj: any, field: string): boolean {
    if (typeof obj !== 'object' || obj === null) return false;

    // Check direct property
    if (field in obj) return true;

    // Check nested properties
    return Object.values(obj).some(value => {
      if (typeof value === 'object' && value !== null) {
        return this.hasNestedProperty(value, field);
      }
      return false;
    });
  }

  private extractAdditionalProperties(
    data: any,
    mapping: JsonPropertyMapping
  ): { [key: string]: any } {
    const mappedPaths = new Set(Object.values(mapping).filter(Boolean));
    const additional: { [key: string]: any } = {};

    const extractRecursive = (obj: any, prefix: string = '') => {
      if (typeof obj !== 'object' || obj === null) return;

      Object.entries(obj).forEach(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;

        if (!mappedPaths.has(path)) {
          if (
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value)
          ) {
            extractRecursive(value, path);
          } else {
            additional[path] = value;
          }
        }
      });
    };

    extractRecursive(data);
    return additional;
  }

  private parseNumber(value: any): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.trim());
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  private parseTimestamp(value: any): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') {
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      } catch {
        return null;
      }
    }
    return null;
  }

  private calculateEnergy(
    power: number,
    duration: number,
    durationUnit?: string
  ): number {
    // Convert duration to hours
    let durationHours = duration;
    switch (durationUnit?.toLowerCase()) {
      case 'seconds':
        durationHours = duration / 3600;
        break;
      case 'minutes':
        durationHours = duration / 60;
        break;
      case 'hours':
      default:
        durationHours = duration;
        break;
    }

    // Calculate energy in kWh
    return (power * durationHours) / 1000;
  }

  /**
   * Create a JsonAdapter with specific property mapping
   */
  static withMapping(
    mapping: JsonPropertyMapping,
    options?: Partial<JsonAdapterConfig>
  ): JsonAdapter {
    return new JsonAdapter({
      propertyMapping: mapping,
      ...options,
    });
  }
}

// Auto-register the adapter with default configuration
adapterRegistry.registerAdapter(new JsonAdapter());
