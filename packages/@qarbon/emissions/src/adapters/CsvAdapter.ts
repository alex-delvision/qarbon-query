/**
 * CSV Adapter
 *
 * Handles CSV data with configurable column mapping for emissions and energy data.
 * Supports flexible field mapping and data type conversion.
 *
 * @example
 * ```typescript
 * import { CsvAdapter } from './CsvAdapter';
 *
 * const adapter = new CsvAdapter({
 *   columnMapping: {
 *     timestamp: 'date',
 *     emissions: 'co2_kg',
 *     energy: 'energy_kwh',
 *     source: 'measurement_source'
 *   }
 * });
 * const result = adapter.normalize(csvData);
 * ```
 *
 * @example CSV input format:
 * ```csv
 * date,co2_kg,energy_kwh,power_w,duration_h,source,location
 * 2023-07-15T10:30:00Z,0.125,0.25,125,2,ml_training,datacenter_1
 * 2023-07-15T12:30:00Z,0.089,0.18,90,2,web_server,datacenter_1
 * ```
 *
 * @example Alternative CSV format:
 * ```csv
 * timestamp,carbon_emissions,total_energy,average_power,device_id,facility
 * 2023-07-15T10:30:00Z,125.5,250,125,server_01,aws_us_west_2
 * 2023-07-15T12:30:00Z,89.2,180,90,server_02,aws_us_west_2
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

export interface CsvColumnMapping {
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

export interface CsvAdapterConfig {
  columnMapping: CsvColumnMapping;
  delimiter?: string;
  hasHeader?: boolean;
  emissionsUnit?: string;
  energyUnit?: string;
  powerUnit?: string;
  durationUnit?: string;
  skipRows?: number;
}

export interface CsvData {
  headers?: string[];
  rows: string[][];
  config: CsvAdapterConfig;
}

export class CsvAdapter extends BaseAdapter<CsvData> {
  private config: CsvAdapterConfig;

  constructor(config?: CsvAdapterConfig) {
    super({
      name: 'CsvAdapter',
      version: '1.0.0',
      description: 'Adapter for CSV data with configurable column mapping',
      supportedFormats: ['csv'],
      confidence: 0.7,
    });

    this.config = {
      delimiter: ',',
      hasHeader: true,
      emissionsUnit: 'kg',
      energyUnit: 'kWh',
      powerUnit: 'W',
      durationUnit: 'hours',
      skipRows: 0,
      columnMapping: {},
      ...config,
    };
  }

  validate(input: CsvData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate input structure
    if (!input.rows || !Array.isArray(input.rows)) {
      errors.push('Missing or invalid rows array');
      return { isValid: false, errors };
    }

    if (input.rows.length === 0) {
      errors.push('No data rows found');
      return { isValid: false, errors };
    }

    // Validate configuration
    const config = { ...this.config, ...input.config };
    if (
      !config.columnMapping ||
      Object.keys(config.columnMapping).length === 0
    ) {
      errors.push('Column mapping configuration is required');
    }

    // Validate headers if present
    let headers: string[] = [];
    if (config.hasHeader) {
      if (input.headers) {
        headers = input.headers;
      } else if (input.rows.length > 0) {
        headers = input.rows[0];
      } else {
        warnings.push('hasHeader is true but no header row found');
      }
    }

    // Check if mapped columns exist in headers (if we have headers)
    if (headers.length > 0) {
      const missingColumns: string[] = [];
      Object.entries(config.columnMapping).forEach(([field, column]) => {
        if (column && !headers.includes(column)) {
          missingColumns.push(`${field} -> ${column}`);
        }
      });

      if (missingColumns.length > 0) {
        warnings.push(
          `Mapped columns not found in headers: ${missingColumns.join(', ')}`
        );
      }
    }

    // Validate data rows have consistent column count
    const dataRows = config.hasHeader ? input.rows.slice(1) : input.rows;
    if (dataRows.length > 0) {
      const expectedColumnCount = dataRows[0].length;
      const inconsistentRows = dataRows.findIndex(
        row => row.length !== expectedColumnCount
      );
      if (inconsistentRows !== -1) {
        warnings.push(
          `Inconsistent column count in row ${inconsistentRows + (config.hasHeader ? 2 : 1)}`
        );
      }
    }

    // Check for required mappings
    if (!config.columnMapping.timestamp) {
      warnings.push('No timestamp column mapping specified');
    }

    const hasEmissionsOrEnergy =
      config.columnMapping.emissions || config.columnMapping.energy;
    if (!hasEmissionsOrEnergy) {
      warnings.push('No emissions or energy column mapping specified');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  normalize(input: CsvData): NormalizedData {
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw new Error(`Invalid CSV data: ${validation.errors?.join(', ')}`);
    }

    const config = { ...this.config, ...input.config };

    // Determine headers
    let headers: string[] = [];
    let dataStartIndex = config.skipRows || 0;

    if (config.hasHeader) {
      headers = input.headers || input.rows[dataStartIndex];
      dataStartIndex += 1;
    }

    // Process rows
    const dataRows = input.rows.slice(dataStartIndex);
    const normalizedRows: NormalizedData[] = [];

    dataRows.forEach((row, index) => {
      try {
        const normalizedRow = this.normalizeRow(row, headers, config, index);
        normalizedRows.push(normalizedRow);
      } catch (error) {
        // Skip invalid rows but could log warning
        console.warn(`Skipping row ${index + dataStartIndex + 1}: ${error}`);
      }
    });

    // If only one row, return it directly; otherwise return aggregated data
    if (normalizedRows.length === 1) {
      return normalizedRows[0];
    }

    // Aggregate multiple rows
    return this.aggregateRows(normalizedRows);
  }

  private normalizeRow(
    row: string[],
    headers: string[],
    config: CsvAdapterConfig,
    rowIndex: number
  ): NormalizedData {
    const data: { [key: string]: any } = {};

    // Map row data using headers or positional mapping
    if (headers.length > 0) {
      headers.forEach((header, index) => {
        if (index < row.length) {
          data[header] = row[index];
        }
      });
    } else {
      // Use positional mapping if no headers
      Object.entries(config.columnMapping).forEach(([field, column]) => {
        const columnIndex = parseInt(column || '');
        if (!isNaN(columnIndex) && columnIndex < row.length) {
          data[field] = row[columnIndex];
        }
      });
    }

    // Extract mapped values
    const getValue = (field: string): any => {
      const column = config.columnMapping[field];
      return column ? data[column] : undefined;
    };

    const timestampValue = getValue('timestamp');
    const emissionsValue = this.parseNumber(getValue('emissions'));
    const energyValue = this.parseNumber(getValue('energy'));
    const powerValue = this.parseNumber(getValue('power'));
    const durationValue = this.parseNumber(getValue('duration'));
    const sourceValue = getValue('source') || 'csv_import';
    const deviceIdValue = getValue('device_id') || `device_${rowIndex}`;
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
      id: `csv_row_${rowIndex}_${timestamp.getTime()}`,
      timestamp: timestamp.toISOString(),
      source: sourceValue,
      category: 'csv_import',

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
            name: locationValue,
          }
        : undefined,

      // Raw data for reference
      raw_data: Object.fromEntries(
        headers.map((header, index) => [header, row[index]])
      ),

      // Metadata
      metadata: {
        adapter: 'CsvAdapter',
        adapter_version: '1.0.0',
        row_index: rowIndex,
        confidence: 0.7,
      },
    };
  }

  private aggregateRows(rows: NormalizedData[]): NormalizedData {
    if (rows.length === 0) {
      throw new Error('No valid rows to aggregate');
    }

    // Calculate totals
    const totalEmissions = rows.reduce((sum, row) => {
      return sum + (row.emissions?.total || 0);
    }, 0);

    const totalEnergy = rows.reduce((sum, row) => {
      return sum + (row.energy?.total || 0);
    }, 0);

    const avgPower = rows.reduce((sum, row, index, arr) => {
      return sum + (row.power?.average || 0) / arr.length;
    }, 0);

    return {
      id: `csv_aggregate_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'csv_import',
      category: 'csv_aggregate',

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
        row_count: rows.length,
        date_range: {
          start: rows[0].timestamp,
          end: rows[rows.length - 1].timestamp,
        },
      },

      metadata: {
        adapter: 'CsvAdapter',
        adapter_version: '1.0.0',
        confidence: 0.7,
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
          // Check for CSV structure
          if (typeof data !== 'object' || data === null) return false;
          return Array.isArray(data.rows) && data.rows.length > 0;
        },
      },
      {
        weight: 0.3,
        test: (data: any) => {
          // Check for headers or configuration
          if (typeof data !== 'object' || data === null) return false;
          return (
            Array.isArray(data.headers) ||
            (data.config && typeof data.config === 'object')
          );
        },
      },
      {
        weight: 0.2,
        test: (data: any) => {
          // Check for CSV-like row structure
          if (typeof data !== 'object' || data === null) return false;
          if (!Array.isArray(data.rows) || data.rows.length === 0) return false;
          return Array.isArray(data.rows[0]);
        },
      },
      {
        weight: 0.1,
        test: (data: any) => {
          // Check for column mapping configuration
          if (typeof data !== 'object' || data === null) return false;
          return (
            data.config &&
            data.config.columnMapping &&
            typeof data.config.columnMapping === 'object'
          );
        },
      },
    ];
  }

  private parseNumber(value: any): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.trim());
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  private parseTimestamp(value: string): Date | null {
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
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
   * Create a CsvAdapter with specific column mapping
   */
  static withMapping(
    mapping: CsvColumnMapping,
    options?: Partial<CsvAdapterConfig>
  ): CsvAdapter {
    return new CsvAdapter({
      columnMapping: mapping,
      ...options,
    });
  }
}

// Auto-register the adapter with default configuration
adapterRegistry.registerAdapter(new CsvAdapter());
