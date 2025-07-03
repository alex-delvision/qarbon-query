/**
 * Universal Tracker Registry
 *
 * Central registry for managing different emission adapters
 */

export interface FormatConfidence {
  adapterName: string;
  score: number;
  evidence: string;
}

export interface FormatDetectionResult {
  bestMatch: string | null;
  confidenceScores: FormatConfidence[];
}

/**
 * Enhanced detection result containing primary adapter recommendation,
 * ranked confidence scores, and optional reason for unrecognized scenarios.
 *
 * JSON API Contract:
 * {
 *   "primaryAdapter": "json" | null,
 *   "rankedConfidences": [
 *     {
 *       "adapterName": "json",
 *       "score": 0.95,
 *       "evidence": "Valid JSON structure with emission fields"
 *     }
 *   ],
 *   "unrecognizedReason": "No adapters detected valid format" // optional, only when primaryAdapter is null
 * }
 *
 * Kotlin/Java API Signatures:
 * data class DetectionResult(
 *     val primaryAdapter: String?,
 *     val rankedConfidences: List<FormatConfidence>,
 *     val unrecognizedReason: String? = null
 * )
 *
 * // Java equivalent:
 * public class DetectionResult {
 *     @Nullable public final String primaryAdapter;
 *     @NonNull public final List<FormatConfidence> rankedConfidences;
 *     @Nullable public final String unrecognizedReason;
 *
 *     public DetectionResult(
 *         @Nullable String primaryAdapter,
 *         @NonNull List<FormatConfidence> rankedConfidences,
 *         @Nullable String unrecognizedReason
 *     ) {
 *         this.primaryAdapter = primaryAdapter;
 *         this.rankedConfidences = Collections.unmodifiableList(rankedConfidences);
 *         this.unrecognizedReason = unrecognizedReason;
 *     }
 * }
 */
export interface DetectionResult {
  /** The primary recommended adapter, or null if no suitable adapter found */
  primaryAdapter: string | null;
  /** All adapters ranked by confidence score in descending order */
  rankedConfidences: FormatConfidence[];
  /** Optional reason why no adapter was recognized (only present when primaryAdapter is null) */
  unrecognizedReason?: string;
}

export interface TrackerAdapter {
  name: string;
  version: string;
  initialize(config: unknown): Promise<void>;
  track(event: unknown): Promise<void>;
  flush?(): Promise<void>;
  destroy?(): Promise<void>;
}

export interface EmissionAdapter {
  detect(raw: unknown): boolean;
  detectConfidence(input: Buffer | NodeJS.ReadableStream): FormatConfidence;
  ingest(raw: unknown): unknown;
}

export class UniversalTrackerRegistry {
  private adapters = new Map<string, EmissionAdapter>();

  constructor(initial: Record<string, EmissionAdapter> = {}) {
    Object.entries(initial).forEach(([k, a]) => this.registerAdapter(k, a));
  }

  registerAdapter(name: string, adapter: EmissionAdapter): void {
    this.adapters.set(name, adapter);
  }

  /**
   * Legacy simple format detection for backward compatibility
   */
  detectFormatLegacy(raw: unknown): string | null {
    for (const [name, adapter] of this.adapters) {
      if (adapter.detect(raw)) return name;
    }
    return null;
  }

  /**
   * Format detection with overloaded signatures for both legacy and enhanced usage.
   *
   * The method has two distinct behaviors based on input type:
   *
   * **Legacy API (Backward Compatible):**
   * ```typescript
   * const format = registry.detectFormat('{"test": true}'); // Returns: 'json' | null (synchronous)
   * const format2 = registry.detectFormat(['item1', 'item2']); // Returns: null (synchronous)
   * ```
   *
   * **Enhanced API (New):**
   * ```typescript
   * const buffer = Buffer.from('{"emissions": 0.5}');
   * const result = await registry.detectFormat(buffer); // Returns: Promise<FormatDetectionResult>
   * // {
   * //   bestMatch: 'json',
   * //   confidenceScores: [
   * //     { adapterName: 'json', score: 0.95, evidence: 'Valid JSON structure' },
   * //     { adapterName: 'csv', score: 0.1, evidence: 'Could be CSV but lacks headers' }
   * //   ]
   * // }
   * ```
   *
   * **Migration Path:**
   * - Existing code using `detectFormat(string | object)` continues to work unchanged
   * - To access confidence scores, convert data to Buffer and await the result
   * - Stream processing is supported for large files with `NodeJS.ReadableStream`
   *
   * @param raw - Legacy input: any data type for simple string/null detection
   * @returns Legacy output: string (adapter name) or null (not detected)
   *
   * @param input - Enhanced input: Buffer or ReadableStream for confidence-based detection
   * @returns Enhanced output: Promise resolving to FormatDetectionResult with confidence scores
   *
   * @example
   * ```typescript
   * // Legacy usage (synchronous)
   * const simpleFormat = registry.detectFormat('{"test": true}'); // 'json'
   *
   * // Enhanced usage (asynchronous)
   * const buffer = Buffer.from('{"emissions": 0.5}');
   * const detailedResult = await registry.detectFormat(buffer);
   * console.log(detailedResult.bestMatch); // 'json'
   * console.log(detailedResult.confidenceScores[0].score); // 0.95
   *
   * // Stream usage
   * const stream = createReadStream('data.json');
   * const streamResult = await registry.detectFormat(stream);
   * ```
   *
   * @see {@link FormatDetectionResult} for details on enhanced return type
   * @see {@link MIGRATION_GUIDE.md} for complete migration instructions
   */
  detectFormat(raw: unknown): string | null;
  detectFormat(
    input: Buffer | NodeJS.ReadableStream
  ): Promise<FormatDetectionResult>;
  detectFormat(input: unknown): string | null | Promise<FormatDetectionResult> {
    // Legacy path: if input is not Buffer or ReadableStream, use simple detection
    if (!(input instanceof Buffer) && !this.isReadableStream(input)) {
      return this.detectFormatLegacy(input);
    }

    // Enhanced path: use confidence-based detection for Buffer/ReadableStream
    return this.detectFormatWithConfidence(
      input as Buffer | NodeJS.ReadableStream
    );
  }

  /**
   * Enhanced format detection that runs detectConfidence on all adapters in parallel.
   * Returns both the best match and all confidence scores sorted by score.
   *
   * @param input - Buffer or ReadableStream to analyze
   * @returns FormatDetectionResult with bestMatch and sorted confidenceScores
   */
  async detectFormatWithConfidence(
    input: Buffer | NodeJS.ReadableStream
  ): Promise<FormatDetectionResult> {
    // Create promises for all adapters to run detectConfidence in parallel
    const confidencePromises = Array.from(this.adapters.entries()).map(
      async ([registryKey, adapter]) => {
        try {
          const confidence = adapter.detectConfidence(input);
          // Override the adapterName with the registry key for consistency
          return {
            ...confidence,
            adapterName: registryKey,
          };
        } catch (error) {
          // If an adapter fails, return a zero confidence result
          return {
            adapterName: registryKey,
            score: 0.0,
            evidence: `Error during detection: ${error instanceof Error ? error.message : 'Unknown error'}`,
          } as FormatConfidence;
        }
      }
    );

    // Wait for all confidence checks to complete
    const confidenceResults = await Promise.all(confidencePromises);

    // Sort by score in descending order (highest confidence first)
    const sortedResults = confidenceResults.sort((a, b) => b.score - a.score);

    // Determine best match (highest scoring adapter with score > 0)
    const bestMatch =
      sortedResults.length > 0 && sortedResults[0] && sortedResults[0].score > 0
        ? sortedResults[0].adapterName
        : null;

    return {
      bestMatch,
      confidenceScores: sortedResults,
    };
  }

  private isReadableStream(obj: unknown): obj is NodeJS.ReadableStream {
    return obj != null && typeof obj === 'object' && 'readable' in obj;
  }

  ingest(raw: unknown): unknown {
    const fmt = this.detectFormatLegacy(raw);
    if (!fmt) return this.processUnknown(raw);
    return this.adapters.get(fmt)!.ingest(raw);
  }

  protected processUnknown(_raw: unknown): unknown {
    // eslint-disable-line @typescript-eslint/no-unused-vars
    throw new Error('Unknown emission data format');
  }
}

// Export a default instance with registered default adapters
// Note: JSONSchemaAdapter is NOT included in the default registry because
// it requires schemas to be provided at instantiation. Users must create
// their own instance with appropriate schemas and register it manually.
import { JsonAdapter } from './adapters/JsonAdapter.js';
import { CsvAdapter } from './adapters/CsvAdapter.js';
import { XmlAdapter } from './adapters/XmlAdapter.js';
import { CodeCarbonAdapter } from './adapters/CodeCarbonAdapter.js';
import { AIImpactTrackerAdapter } from './adapters/AIImpactTrackerAdapter.js';
import { FitAdapter } from './adapters/FitAdapter.js';

export const universalTrackerRegistry = new UniversalTrackerRegistry({
  json: new JsonAdapter(),
  csv: new CsvAdapter(),
  xml: new XmlAdapter(),
  codecarbon: new CodeCarbonAdapter(),
  aiimpact: new AIImpactTrackerAdapter(),
  fit: new FitAdapter(),
});

// Example: How to register JSONSchemaAdapter with custom schemas
// import { JSONSchemaAdapter } from "./adapters/JSONSchemaAdapter.js";
//
// const mySchemas = {
//   "emission-v1": {
//     type: "object",
//     properties: {
//       timestamp: { type: "string", format: "date-time" },
//       emissions: { type: "number" },
//       source: { type: "string" }
//     },
//     required: ["timestamp", "emissions", "source"]
//   }
// };
//
// const jsonSchemaAdapter = new JSONSchemaAdapter({ schemas: mySchemas });
// universalTrackerRegistry.registerAdapter("json-schema", jsonSchemaAdapter);
