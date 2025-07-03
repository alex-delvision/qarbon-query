/**
 * Universal Tracker Registry
 *
 * Central registry for managing different emission adapters
 */
export class UniversalTrackerRegistry {
    adapters = new Map();
    constructor(initial = {}) {
        Object.entries(initial).forEach(([k, a]) => this.registerAdapter(k, a));
    }
    registerAdapter(name, adapter) {
        this.adapters.set(name, adapter);
    }
    /**
     * Legacy simple format detection for backward compatibility
     */
    detectFormatLegacy(raw) {
        for (const [name, adapter] of this.adapters) {
            if (adapter.detect(raw))
                return name;
        }
        return null;
    }
    detectFormat(input) {
        // Legacy path: if input is not Buffer or ReadableStream, use simple detection
        if (!(input instanceof Buffer) && !this.isReadableStream(input)) {
            return this.detectFormatLegacy(input);
        }
        // Enhanced path: use confidence-based detection for Buffer/ReadableStream
        return this.detectFormatWithConfidence(input);
    }
    /**
     * Enhanced format detection that runs detectConfidence on all adapters in parallel.
     * Returns both the best match and all confidence scores sorted by score.
     *
     * @param input - Buffer or ReadableStream to analyze
     * @returns FormatDetectionResult with bestMatch and sorted confidenceScores
     */
    async detectFormatWithConfidence(input) {
        // Create promises for all adapters to run detectConfidence in parallel
        const confidencePromises = Array.from(this.adapters.entries()).map(async ([registryKey, adapter]) => {
            try {
                const confidence = adapter.detectConfidence(input);
                // Override the adapterName with the registry key for consistency
                return {
                    ...confidence,
                    adapterName: registryKey,
                };
            }
            catch (error) {
                // If an adapter fails, return a zero confidence result
                return {
                    adapterName: registryKey,
                    score: 0.0,
                    evidence: `Error during detection: ${error instanceof Error ? error.message : 'Unknown error'}`,
                };
            }
        });
        // Wait for all confidence checks to complete
        const confidenceResults = await Promise.all(confidencePromises);
        // Sort by score in descending order (highest confidence first)
        const sortedResults = confidenceResults.sort((a, b) => b.score - a.score);
        // Determine best match (highest scoring adapter with score > 0)
        const bestMatch = sortedResults.length > 0 && sortedResults[0] && sortedResults[0].score > 0
            ? sortedResults[0].adapterName
            : null;
        return {
            bestMatch,
            confidenceScores: sortedResults,
        };
    }
    isReadableStream(obj) {
        return obj != null && typeof obj === 'object' && 'readable' in obj;
    }
    ingest(raw) {
        const fmt = this.detectFormatLegacy(raw);
        if (!fmt)
            return this.processUnknown(raw);
        return this.adapters.get(fmt).ingest(raw);
    }
    processUnknown(_raw) {
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
//# sourceMappingURL=UniversalTrackerRegistry.js.map