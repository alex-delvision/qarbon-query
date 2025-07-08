/**
 * JSON Emission Adapter
 *
 * Handles detection and ingestion of JSON formatted data
 */
import {
  EmissionAdapter,
  FormatConfidence,
} from '../UniversalTrackerRegistry.js';
export declare class JsonAdapter implements EmissionAdapter {
  /**
   * Detect if the raw data is JSON format
   * Quick sniff test for JSON data
   */
  detect(raw: unknown): boolean;
  /**
   * Analyze input and return confidence score for JSON format
   * Searches for canonical property sets and valid JSON structure
   */
  detectConfidence(input: Buffer | NodeJS.ReadableStream): FormatConfidence;
  /**
   * Ingest and parse JSON data into canonical JS object/array
   */
  ingest(raw: unknown): unknown;
}
//# sourceMappingURL=JsonAdapter.d.ts.map
