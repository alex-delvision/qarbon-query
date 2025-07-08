/**
 * CSV Emission Adapter
 *
 * Handles detection and ingestion of CSV formatted data
 */
import {
  EmissionAdapter,
  FormatConfidence,
} from '../UniversalTrackerRegistry.js';
/**
 * Column mapping configuration for CSV headers
 */
export interface ColumnMappingConfig {
  timestamp: string[];
  model: string[];
  duration: string[];
  emissions: string[];
}
export declare class CsvAdapter implements EmissionAdapter {
  private static readonly DEFAULT_COLUMN_MAPPING;
  private columnMapping;
  constructor(customMapping?: Partial<ColumnMappingConfig>);
  /**
   * Detect if the raw data is CSV format
   * Quick sniff test for CSV data
   */
  detect(raw: unknown): boolean;
  /**
   * Analyze input and return confidence score for CSV format
   * Checks for CSV structure, headers, and emission-related content
   */
  detectConfidence(input: Buffer | NodeJS.ReadableStream): FormatConfidence;
  /**
   * Ingest and parse CSV data into canonical JS object/array
   * Lightweight CSV parsing - splits lines and commas
   */
  ingest(raw: unknown): unknown[];
  /**
   * Safely convert a string to a number, returning undefined if NaN or empty
   */
  private safeNumber;
  /**
   * Add custom column mappings for specific field types
   */
  addColumnMapping(field: keyof ColumnMappingConfig, aliases: string[]): void;
  /**
   * Set complete column mapping configuration
   */
  setColumnMapping(mapping: Partial<ColumnMappingConfig>): void;
  /**
   * Get current column mapping configuration
   */
  getColumnMapping(): ColumnMappingConfig;
  /**
   * Reset column mapping to defaults
   */
  resetColumnMapping(): void;
}
//# sourceMappingURL=CsvAdapter.d.ts.map
