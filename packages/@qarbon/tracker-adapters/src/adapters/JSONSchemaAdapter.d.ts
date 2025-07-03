/**
 * JSON Schema Emission Adapter
 *
 * Handles detection and ingestion of data based on JSON Schema validation
 * with confidence scoring and adaptive matching
 */
import { JSONSchemaType } from 'ajv';
import { EmissionAdapter, FormatConfidence } from '../UniversalTrackerRegistry.js';
export interface JSONSchemaAdapterOptions {
    schemas: Record<string, JSONSchemaType<unknown>>;
    strict?: boolean;
}
export interface DetectionResult {
    matchedSchema?: string;
    confidence: number;
}
export declare class JSONSchemaAdapter implements EmissionAdapter {
    private ajv;
    private schemas;
    private strict;
    private lastDetectionResult;
    constructor(options: JSONSchemaAdapterOptions);
    /**
     * Add a new schema to the adapter
     */
    addSchema(name: string, schema: JSONSchemaType<unknown>): void;
    /**
     * Get all registered schemas
     */
    getSchemas(): Record<string, JSONSchemaType<unknown>>;
    /**
     * Private scoring function that returns confidence 0-1
     * - Returns 1.0 if data is valid against schema
     * - Returns ratio of passed validations vs total for invalid data
     */
    private score;
    /**
     * Detect if the raw data matches any of the registered schemas
     * Stores the detection result for reuse in ingest()
     *
     * Implementation follows these steps:
     * 1. Parse `raw` to JS object (string → JSON.parse, object pass through)
     * 2. Iterate registered schemas, run validator; if valid → save confidence 1, matched schema name, return true
     * 3. If none fully valid, compute partial confidence for each using `score`; pick highest score;
     *    if it exceeds 0.3 (configurable threshold) set `matchedSchema` and store confidence but still return true to allow ingest;
     *    otherwise return false
     * 4. Always catch JSON.parse errors and return false
     */
    detect(raw: unknown): boolean;
    /**
     * Analyze input and return confidence score for JSON Schema format
     * Uses schema validation to determine confidence
     */
    detectConfidence(input: Buffer | NodeJS.ReadableStream): FormatConfidence;
    /**
     * Ingest the raw data, using the last detection result to avoid re-validation
     *
     * Implementation follows these steps:
     * 1. If detect(raw) returns false throw "Unknown JSON schema" (align with other adapters)
     * 2. Return an object { data: parsed, schema: matchedSchema, confidence }
     * 3. If confidence<1 and strict option is true, throw validation error list
     * 4. Provide detailed error messages from Ajv when validation fails
     */
    ingest(raw: unknown): {
        data: unknown;
        schema: string;
        confidence: number;
    };
    /**
     * Get the last detection result
     */
    getLastDetectionResult(): DetectionResult;
}
//# sourceMappingURL=JSONSchemaAdapter.d.ts.map