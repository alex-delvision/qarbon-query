/**
 * Energy Usage Adapter
 *
 * Handles generic energy usage data from watt-meters, smart plugs, and other energy
 * monitoring devices. Provides a flexible interface for various energy logging formats.
 *
 * @example
 * ```typescript
 * import { EnergyUsageAdapter } from './EnergyUsageAdapter';
 *
 * const adapter = new EnergyUsageAdapter();
 * const result = adapter.normalize(energyData);
 * ```
 *
 * @example Energy Usage JSON format:
 * ```json
 * {
 *   "device_id": "meter_001",
 *   "timestamp": "2023-07-15T14:30:00Z",
 *   "measurement_period": {
 *     "start": "2023-07-15T14:00:00Z",
 *     "end": "2023-07-15T14:30:00Z",
 *     "duration_seconds": 1800
 *   },
 *   "energy": {
 *     "total_kwh": 0.75,
 *     "peak_power_w": 450,
 *     "average_power_w": 150,
 *     "min_power_w": 25
 *   },
 *   "location": {
 *     "site": "office_building_a",
 *     "floor": 3,
 *     "room": "server_room_301"
 *   },
 *   "device_info": {
 *     "manufacturer": "Schneider Electric",
 *     "model": "PM8000",
 *     "firmware_version": "2.1.0",
 *     "accuracy_class": "0.2S"
 *   },
 *   "metadata": {
 *     "monitored_equipment": "ML training server",
 *     "tags": ["compute", "ai-training", "gpu-cluster"],
 *     "notes": "Training ResNet model on ImageNet"
 *   }
 * }
 * ```
 *
 * @example Alternative simple format:
 * ```json
 * {
 *   "timestamp": "2023-07-15T14:30:00Z",
 *   "power_watts": 275,
 *   "energy_kwh": 0.45,
 *   "duration_minutes": 60,
 *   "device": "smart_plug_kitchen"
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

export interface EnergyUsageData {
  device_id?: string;
  device?: string; // Alternative device identifier
  timestamp: string;
  measurement_period?: {
    start?: string;
    end?: string;
    duration_seconds?: number;
  };
  energy: {
    total_kwh?: number;
    energy_kwh?: number; // Alternative energy field
    peak_power_w?: number;
    average_power_w?: number;
    power_watts?: number; // Alternative power field
    min_power_w?: number;
  };
  location?: {
    site?: string;
    floor?: number;
    room?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  device_info?: {
    manufacturer?: string;
    model?: string;
    firmware_version?: string;
    accuracy_class?: string;
  };
  metadata?: {
    monitored_equipment?: string;
    tags?: string[];
    notes?: string;
    carbon_intensity?: number;
    carbon_intensity_unit?: string;
  };
  // Support for simple format
  duration_minutes?: number;
}

export class EnergyUsageAdapter extends BaseAdapter<EnergyUsageData> {
  constructor() {
    super({
      name: 'EnergyUsageAdapter',
      version: '1.0.0',
      description:
        'Adapter for generic energy usage data from watt-meters and energy monitoring devices',
      supportedFormats: ['json'],
      confidence: 0.75,
    });
  }

  validate(input: EnergyUsageData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!input.timestamp) {
      errors.push('Missing required field: timestamp');
    }

    // Device identification
    if (!input.device_id && !input.device) {
      warnings.push('No device identifier found (device_id or device)');
    }

    // Energy data validation
    if (!input.energy) {
      errors.push('Missing required field: energy');
    } else {
      const hasEnergyValue =
        input.energy.total_kwh !== undefined ||
        input.energy.energy_kwh !== undefined;
      const hasPowerValue =
        input.energy.average_power_w !== undefined ||
        input.energy.power_watts !== undefined ||
        input.energy.peak_power_w !== undefined;

      if (!hasEnergyValue && !hasPowerValue) {
        errors.push(
          'Energy object must contain either energy (kWh) or power (W) measurements'
        );
      }

      // Validate energy values
      const energyValue = input.energy.total_kwh || input.energy.energy_kwh;
      if (energyValue !== undefined && energyValue < 0) {
        warnings.push('Negative energy value detected');
      }

      // Validate power values
      const powerValues = [
        input.energy.average_power_w,
        input.energy.power_watts,
        input.energy.peak_power_w,
        input.energy.min_power_w,
      ].filter(v => v !== undefined);

      if (powerValues.some(v => v! < 0)) {
        warnings.push('Negative power value detected');
      }

      // Validate power value consistency
      if (
        input.energy.min_power_w !== undefined &&
        input.energy.peak_power_w !== undefined
      ) {
        if (input.energy.min_power_w > input.energy.peak_power_w) {
          warnings.push('Minimum power is greater than peak power');
        }
      }
    }

    // Validate timestamp format
    if (input.timestamp && !this.isValidTimestamp(input.timestamp)) {
      errors.push('Invalid timestamp format');
    }

    // Validate measurement period
    if (input.measurement_period) {
      if (
        input.measurement_period.start &&
        !this.isValidTimestamp(input.measurement_period.start)
      ) {
        errors.push('Invalid measurement_period.start timestamp format');
      }
      if (
        input.measurement_period.end &&
        !this.isValidTimestamp(input.measurement_period.end)
      ) {
        errors.push('Invalid measurement_period.end timestamp format');
      }

      if (input.measurement_period.start && input.measurement_period.end) {
        const startDate = new Date(input.measurement_period.start);
        const endDate = new Date(input.measurement_period.end);
        if (endDate <= startDate) {
          warnings.push(
            'Measurement period end time should be after start time'
          );
        }
      }

      if (
        input.measurement_period.duration_seconds !== undefined &&
        input.measurement_period.duration_seconds < 0
      ) {
        warnings.push('Negative measurement duration detected');
      }
    }

    // Validate duration consistency
    if (input.duration_minutes !== undefined && input.duration_minutes < 0) {
      warnings.push('Negative duration detected');
    }

    // Validate coordinates
    if (input.location?.coordinates) {
      const { latitude, longitude } = input.location.coordinates;
      if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        warnings.push('Geographic coordinates appear to be invalid');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  normalize(input: EnergyUsageData): NormalizedData {
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw new Error(
        `Invalid Energy Usage data: ${validation.errors?.join(', ')}`
      );
    }

    // Determine device identifier
    const deviceId = input.device_id || input.device || 'unknown_device';

    // Determine energy value
    const energyValue = input.energy.total_kwh || input.energy.energy_kwh;

    // Determine power value
    const powerValue = input.energy.average_power_w || input.energy.power_watts;

    // Calculate duration if not provided
    let durationSeconds: number | undefined;
    if (input.measurement_period?.duration_seconds) {
      durationSeconds = input.measurement_period.duration_seconds;
    } else if (input.duration_minutes) {
      durationSeconds = input.duration_minutes * 60;
    } else if (
      input.measurement_period?.start &&
      input.measurement_period?.end
    ) {
      const startDate = new Date(input.measurement_period.start);
      const endDate = new Date(input.measurement_period.end);
      durationSeconds = (endDate.getTime() - startDate.getTime()) / 1000;
    }

    // Estimate energy from power if energy not available
    let estimatedEnergy: number | undefined;
    if (!energyValue && powerValue && durationSeconds) {
      estimatedEnergy = (powerValue * durationSeconds) / (1000 * 3600); // Convert W*s to kWh
    }

    return {
      id: `energy_${deviceId}_${new Date(input.timestamp).getTime()}`,
      timestamp: new Date(input.timestamp).toISOString(),
      source: 'energy_meter',
      category: 'energy_consumption',

      // Core energy data
      energy: {
        total: energyValue || estimatedEnergy || 0,
        unit: 'kWh',
        measured: energyValue !== undefined,
        estimated: estimatedEnergy !== undefined && energyValue === undefined,
      },

      // Power data
      power: {
        average: powerValue,
        peak: input.energy.peak_power_w,
        minimum: input.energy.min_power_w,
        unit: 'W',
      },

      // Timing information
      timing: {
        timestamp: new Date(input.timestamp).toISOString(),
        measurement_start: input.measurement_period?.start
          ? new Date(input.measurement_period.start).toISOString()
          : undefined,
        measurement_end: input.measurement_period?.end
          ? new Date(input.measurement_period.end).toISOString()
          : undefined,
        duration_seconds: durationSeconds,
      },

      // Device information
      device: {
        id: deviceId,
        manufacturer: input.device_info?.manufacturer,
        model: input.device_info?.model,
        firmware_version: input.device_info?.firmware_version,
        accuracy_class: input.device_info?.accuracy_class,
      },

      // Location data
      location: input.location
        ? {
            site: input.location.site,
            floor: input.location.floor,
            room: input.location.room,
            coordinates: input.location.coordinates,
          }
        : undefined,

      // Equipment and context
      equipment: {
        monitored_equipment: input.metadata?.monitored_equipment,
        tags: input.metadata?.tags,
        notes: input.metadata?.notes,
      },

      // Carbon intensity if available
      carbon_intensity: input.metadata?.carbon_intensity
        ? {
            value: input.metadata.carbon_intensity,
            unit: input.metadata.carbon_intensity_unit || 'gCO2/kWh',
          }
        : undefined,

      // Estimated emissions if carbon intensity available
      emissions:
        input.metadata?.carbon_intensity && (energyValue || estimatedEnergy)
          ? {
              total:
                ((energyValue || estimatedEnergy || 0) *
                  input.metadata.carbon_intensity) /
                1000, // Convert to kg
              unit: 'kg',
              scope: 'scope2',
              estimated: true,
            }
          : undefined,

      // Metadata
      metadata: {
        adapter: 'EnergyUsageAdapter',
        adapter_version: '1.0.0',
        confidence: 0.75,
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
          // Check for energy/power fields
          if (typeof data !== 'object' || data === null) return false;
          const energyFields = ['energy', 'power_watts', 'energy_kwh'];
          return (
            energyFields.some(field => field in data) ||
            (data.energy && typeof data.energy === 'object')
          );
        },
      },
      {
        weight: 0.3,
        test: (data: any) => {
          // Check for device identification
          if (typeof data !== 'object' || data === null) return false;
          const deviceFields = ['device_id', 'device', 'device_info'];
          return deviceFields.some(field => field in data);
        },
      },
      {
        weight: 0.2,
        test: (data: any) => {
          // Check for timestamp and duration
          if (typeof data !== 'object' || data === null) return false;
          const timeFields = [
            'timestamp',
            'measurement_period',
            'duration_minutes',
          ];
          return timeFields.some(field => field in data);
        },
      },
      {
        weight: 0.1,
        test: (data: any) => {
          // Check for energy-specific measurement fields
          if (typeof data !== 'object' || data === null) return false;
          if (!data.energy || typeof data.energy !== 'object') return false;
          const energyFields = ['total_kwh', 'average_power_w', 'peak_power_w'];
          return energyFields.some(field => field in data.energy);
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
adapterRegistry.registerAdapter(new EnergyUsageAdapter());
