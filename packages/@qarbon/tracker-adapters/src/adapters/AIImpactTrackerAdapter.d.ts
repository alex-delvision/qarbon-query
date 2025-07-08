/**
 * AIImpactTracker Emission Adapter
 *
 * This adapter handles the detection and normalization of AI Impact Tracker formatted emission data.
 * It serves as a bridge between the AI Impact Tracker data format and the universal tracker registry,
 * ensuring consistent data structure across different emission tracking systems.
 *
 * @fileoverview AIImpactTracker adapter for emission data processing
 *
 * ## Purpose
 * - Detects AI Impact Tracker formatted data from various input sources
 * - Validates and normalizes emission data into canonical format
 * - Handles both JSON string and object inputs
 * - Computes missing emissions values when not provided
 *
 * ## Expected Input Format
 * The adapter expects data with the following structure:
 * ```typescript
 * {
 *   model: string,                    // AI model name (required, non-empty)
 *   tokens: {                         // Token usage information (required)
 *     total: number,                  // Total tokens used (required, >= 0)
 *     prompt?: number,                // Prompt tokens (optional, >= 0)
 *     completion?: number             // Completion tokens (optional, >= 0)
 *   },
 *   timestamp: string | number,       // When the emission occurred (required)
 *   energyPerToken: number,           // Energy consumption per token (required, >= 0)
 *   emissions?: number                // CO2 emissions (optional, >= 0)
 * }
 * ```
 *
 * ## Normalization Rules
 * 1. **Input Parsing**: Accepts both JSON strings and objects
 * 2. **Field Validation**: All required fields must be present and valid
 * 3. **Type Coercion**: Numeric fields are converted using Number() constructor
 * 4. **Emissions Calculation**: If emissions field is missing, computed as tokens.total * energyPerToken
 * 5. **String Trimming**: Model names are trimmed of whitespace
 * 6. **Default Values**: Optional token fields default to 0 if not provided
 * 7. **Error Handling**: Throws descriptive errors for invalid data formats
 *
 * ## Output Format
 * Returns normalized data with camelCase properties matching AIImpactTrackerData interface
 *
 * @author Qarbon Development Team
 * @since 1.0.0
 */
import type {
  EmissionAdapter,
  FormatConfidence,
} from '../UniversalTrackerRegistry.js';
export interface AIImpactTrackerData {
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  timestamp: string | number;
  energyPerToken: number;
  emissions: number;
  confidence?: {
    low: number;
    high: number;
  };
}
export declare class AIImpactTrackerAdapter implements EmissionAdapter {
  /**
   * Detect if the raw data is AI Impact Tracker format
   * Quick sniff test for AI Impact Tracker emission data structure
   *
   * @param raw - The raw data to detect (string or object)
   * @returns true if data appears to be AI Impact Tracker format, false otherwise
   */
  detect(raw: unknown): boolean;
  /**
   * Analyze input and return confidence score for AI Impact Tracker format
   * Searches for canonical AI Impact Tracker property sets
   */
  detectConfidence(input: Buffer | NodeJS.ReadableStream): FormatConfidence;
  /**
   * Ingest and normalize AI Impact Tracker data into canonical format
   *
   * @param raw - The raw AI Impact Tracker data (string or object)
   * @returns Normalized emission data with camelCase properties
   * @throws Error if data format is invalid or required fields are missing
   */
  ingest(raw: unknown): {
    model: string;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    timestamp: string | number;
    energyPerToken: number;
    emissions: number;
    confidence?: {
      low: number;
      high: number;
    };
  };
  /**
   * Check if the given data has the required AI Impact Tracker fields
   *
   * @param data - The data to check
   * @returns true if data has required fields: model, tokens.total, timestamp, energyPerToken
   */
  private hasAIImpactTrackerFields;
}
//# sourceMappingURL=AIImpactTrackerAdapter.d.ts.map
