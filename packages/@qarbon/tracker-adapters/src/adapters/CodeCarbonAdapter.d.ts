/**
 * CodeCarbon Emission Adapter
 *
 * Handles detection and ingestion of CodeCarbon formatted emission data
 * Expects data with `duration_seconds` and `emissions_kg` fields
 */
import {
  EmissionAdapter,
  FormatConfidence,
} from '../UniversalTrackerRegistry.js';
export declare class CodeCarbonAdapter implements EmissionAdapter {
  /**
   * Detect if the raw data is CodeCarbon format
   * Quick sniff test for CodeCarbon emission data structure
   *
   * @param raw - The raw data to detect (string or object)
   * @returns true if data appears to be CodeCarbon format, false otherwise
   */
  detect(raw: unknown): boolean;
  /**
   * Analyze input and return confidence score for CodeCarbon format
   * Searches for canonical CodeCarbon property sets
   */
  detectConfidence(input: Buffer | NodeJS.ReadableStream): FormatConfidence;
  /**
   * Ingest and normalize CodeCarbon data into canonical format
   *
   * @param raw - The raw CodeCarbon data (string or object)
   * @returns Normalized emission data with camelCase properties
   * @throws Error if data format is invalid or required fields are missing
   */
  ingest(raw: unknown): {
    durationSeconds: number;
    emissionsKg: number;
  };
  /**
   * Check if the given data has the required CodeCarbon fields
   *
   * @param data - The data to check
   * @returns true if data has both duration_seconds and emissions_kg fields
   */
  private hasCodeCarbonFields;
}
//# sourceMappingURL=CodeCarbonAdapter.d.ts.map
