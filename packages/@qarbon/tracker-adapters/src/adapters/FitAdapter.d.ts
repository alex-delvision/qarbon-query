/**
 * FIT (Flexible and Interoperable Data Transfer) Binary Adapter
 *
 * Handles detection and ingestion of FIT protocol binary data
 * Verifies protocol headers and CRC for confidence scoring
 */
import {
  EmissionAdapter,
  FormatConfidence,
} from '../UniversalTrackerRegistry.js';
export declare class FitAdapter implements EmissionAdapter {
  private static readonly FIT_HEADER_SIZE;
  private static readonly FIT_FILE_TYPE_OFFSET;
  private static readonly FIT_PROTOCOL_VERSION_OFFSET;
  private static readonly FIT_PROFILE_VERSION_OFFSET;
  private static readonly FIT_DATA_SIZE_OFFSET;
  /**
   * Detect if the raw data is FIT format
   * Quick sniff test for FIT binary data
   */
  detect(raw: unknown): boolean;
  /**
   * Analyze input and return confidence score for FIT format
   * Verifies protocol headers and CRC
   */
  detectConfidence(input: Buffer | NodeJS.ReadableStream): FormatConfidence;
  /**
   * Ingest and parse FIT binary data into canonical format
   */
  ingest(raw: unknown): unknown;
  /**
   * Validate FIT file header structure
   */
  private validateFitHeader;
  /**
   * Verify CRC checksum (simplified implementation)
   */
  private verifyCrc;
  /**
   * Calculate CRC-16 checksum (simplified implementation)
   */
  private calculateCrc16;
  /**
   * Parse FIT file header
   */
  private parseFitHeader;
  /**
   * Parse FIT records (simplified implementation)
   */
  private parseFitRecords;
  /**
   * Parse definition message (simplified)
   */
  private parseDefinitionMessage;
  /**
   * Parse data message (simplified)
   */
  private parseDataMessage;
  /**
   * Find emission-related message types in the data
   */
  private findEmissionMessageTypes;
  /**
   * Extract emission-related data from parsed records
   */
  private extractEmissionData;
}
//# sourceMappingURL=FitAdapter.d.ts.map
