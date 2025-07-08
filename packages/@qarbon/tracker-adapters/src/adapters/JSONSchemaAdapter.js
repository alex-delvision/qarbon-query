/**
 * JSON Schema Emission Adapter
 *
 * Handles detection and ingestion of data based on JSON Schema validation
 * with confidence scoring and adaptive matching
 */
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
export class JSONSchemaAdapter {
  ajv; // eslint-disable-line @typescript-eslint/no-explicit-any
  schemas;
  strict;
  lastDetectionResult = { confidence: 0 };
  constructor(options) {
    this.schemas = options.schemas;
    this.strict = options.strict ?? false;
    // Initialize Ajv instance once
    this.ajv = new Ajv({
      // eslint-disable-line @typescript-eslint/no-explicit-any
      allErrors: true,
      strict: false, // Use false to avoid unknown format errors
    });
    // Add format support
    addFormats(this.ajv); // eslint-disable-line @typescript-eslint/no-explicit-any
    // Add all schemas to the Ajv instance
    Object.entries(this.schemas).forEach(([name, schema]) => {
      this.ajv.addSchema(schema, name);
    });
  }
  /**
   * Add a new schema to the adapter
   */
  addSchema(name, schema) {
    this.schemas[name] = schema;
    this.ajv.addSchema(schema, name);
  }
  /**
   * Get all registered schemas
   */
  getSchemas() {
    return { ...this.schemas };
  }
  /**
   * Private scoring function that returns confidence 0-1
   * - Returns 1.0 if data is valid against schema
   * - Returns ratio of passed validations vs total for invalid data
   */
  score(data, schema) {
    const validate = this.ajv.compile(schema);
    const isValid = validate(data);
    if (isValid) {
      return 1.0;
    }
    // For invalid data, calculate confidence based on validation errors
    const errors = validate.errors || [];
    if (errors.length === 0) {
      return 0;
    }
    // Count how many required properties are present vs missing
    let totalChecks = 0;
    let passedChecks = 0;
    // Analyze different types of validation errors
    for (const error of errors) {
      totalChecks++;
      // If it's a missing required property, it's a complete fail for that check
      if (error.keyword === 'required') {
        // Don't increment passedChecks
      }
      // For type errors, format errors, etc., give partial credit if the property exists
      else if (error.keyword === 'type' || error.keyword === 'format') {
        // The property exists but has wrong type/format - partial credit
        passedChecks += 0.5;
      }
      // For other validation errors, give some minimal credit for structure
      else {
        passedChecks += 0.3;
      }
    }
    // Consider further penalization for deep property mismatches
    passedChecks = Math.max(
      0,
      passedChecks -
        errors.filter(e => e.instancePath.split('/').length > 2).length * 0.1
    );
    // Capping confidence score
    passedChecks = Math.min(0.95, passedChecks);
    // If we have a schema with required properties, also check how many are present
    if (
      typeof schema === 'object' &&
      schema !== null &&
      'required' in schema &&
      Array.isArray(schema.required)
    ) {
      const requiredProps = schema.required;
      const dataObj = data;
      if (typeof dataObj === 'object' && dataObj !== null) {
        requiredProps.forEach(prop => {
          totalChecks++;
          if (prop in dataObj) {
            passedChecks++;
          }
        });
      }
    }
    return totalChecks > 0
      ? Math.max(0, Math.min(1, passedChecks / totalChecks))
      : 0;
  }
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
  detect(raw) {
    let parsedData;
    // Early rejection for null, undefined, and primitive types
    if (raw === null || raw === undefined) {
      this.lastDetectionResult = { confidence: 0 };
      return false;
    }
    try {
      // Step 1: Parse raw to JS object (string → JSON.parse, object pass through)
      if (typeof raw === 'string') {
        parsedData = JSON.parse(raw);
      } else {
        parsedData = raw;
      }
    } catch {
      // Step 4: Always catch JSON.parse errors and return false
      this.lastDetectionResult = { confidence: 0 };
      return false;
    }
    // Reject primitive types (after parsing)
    if (
      parsedData === null ||
      parsedData === undefined ||
      typeof parsedData === 'string' ||
      typeof parsedData === 'number' ||
      typeof parsedData === 'boolean'
    ) {
      this.lastDetectionResult = { confidence: 0 };
      return false;
    }
    // Step 2: Iterate registered schemas, run validator; if valid → save confidence 1, matched schema name, return true
    for (const [name, schema] of Object.entries(this.schemas)) {
      const validate = this.ajv.compile(schema);
      const isValid = validate(parsedData);
      if (isValid) {
        // Found a perfect match - save confidence 1, matched schema name, return true
        this.lastDetectionResult = {
          matchedSchema: name,
          confidence: 1.0,
        };
        return true;
      }
    }
    // Step 3: If none fully valid, compute partial confidence for each using `score`
    let bestMatch;
    let bestConfidence = 0;
    for (const [name, schema] of Object.entries(this.schemas)) {
      const confidence = this.score(parsedData, schema);
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestMatch = name;
      }
    }
    // Pick highest score; if it exceeds threshold set matchedSchema and store confidence
    // but still return true to allow ingest; otherwise return false
    // Note: We use a lower threshold for detection to allow ingest to handle validation
    const threshold = 0.2; // Low threshold for detection - strict validation happens in ingest
    if (bestConfidence > threshold) {
      this.lastDetectionResult = {
        matchedSchema: bestMatch,
        confidence: bestConfidence,
      };
      return true; // Allow ingest even with partial match
    } else {
      this.lastDetectionResult = {
        matchedSchema: bestMatch,
        confidence: bestConfidence,
      };
      return false; // Confidence too low
    }
  }
  /**
   * Analyze input and return confidence score for JSON Schema format
   * Uses schema validation to determine confidence
   */
  detectConfidence(input) {
    let content;
    if (input instanceof Buffer) {
      content = input.toString('utf8');
    } else {
      // For ReadableStream, we need to read synchronously - this is a simplified approach
      // In production, consider making this method async
      throw new Error(
        'ReadableStream input not supported in this implementation'
      );
    }
    const trimmed = content.trim();
    let score = 0.0;
    const evidence = [];
    // Try to parse as JSON
    let parsedData;
    try {
      parsedData = JSON.parse(trimmed);
      score += 0.3;
      evidence.push('Valid JSON syntax');
    } catch {
      // Check for JSON-like structure even if invalid
      if (/[{[].*[}]]/.test(trimmed)) {
        score += 0.1;
        evidence.push('JSON-like structure');
      }
      return {
        adapterName: 'JSONSchemaAdapter',
        score: Math.min(1.0, Math.max(0.0, score)),
        evidence: evidence.join('; '),
      };
    }
    // Check against all registered schemas
    let bestSchemaMatch = '';
    let bestSchemaScore = 0;
    for (const [name, schema] of Object.entries(this.schemas)) {
      const schemaScore = this.score(parsedData, schema);
      if (schemaScore > bestSchemaScore) {
        bestSchemaScore = schemaScore;
        bestSchemaMatch = name;
      }
    }
    // Add the best schema match score
    score += bestSchemaScore * 0.7; // Weight schema validation heavily
    if (bestSchemaScore === 1.0) {
      score = 1.05; // Give perfect matches a slight edge over generic JSON
      evidence.push(`Perfect match with schema: ${bestSchemaMatch}`);
    } else if (bestSchemaScore > 0.8) {
      evidence.push(
        `Strong match with schema: ${bestSchemaMatch} (${(bestSchemaScore * 100).toFixed(1)}%)`
      );
    } else if (bestSchemaScore > 0.5) {
      evidence.push(
        `Partial match with schema: ${bestSchemaMatch} (${(bestSchemaScore * 100).toFixed(1)}%)`
      );
    } else if (bestSchemaScore > 0.2) {
      evidence.push(
        `Weak match with schema: ${bestSchemaMatch} (${(bestSchemaScore * 100).toFixed(1)}%)`
      );
    } else {
      evidence.push('No significant schema matches found');
    }
    return {
      adapterName: 'JSONSchemaAdapter',
      score: Math.max(0.0, score), // Allow scores above 1.0 for perfect matches
      evidence: evidence.join('; '),
    };
  }
  /**
   * Ingest the raw data, using the last detection result to avoid re-validation
   *
   * Implementation follows these steps:
   * 1. If detect(raw) returns false throw "Unknown JSON schema" (align with other adapters)
   * 2. Return an object { data: parsed, schema: matchedSchema, confidence }
   * 3. If confidence<1 and strict option is true, throw validation error list
   * 4. Provide detailed error messages from Ajv when validation fails
   */
  ingest(raw) {
    // Step 1: If detect(raw) returns false throw "Unknown JSON schema"
    if (!this.detect(raw)) {
      throw new Error('Unknown JSON schema');
    }
    // At this point, detect() has populated lastDetectionResult
    const { matchedSchema, confidence } = this.lastDetectionResult;
    if (!matchedSchema) {
      throw new Error('Unknown JSON schema');
    }
    const schema = this.schemas[matchedSchema];
    if (!schema) {
      throw new Error(`Schema '${matchedSchema}' not found`);
    }
    // Parse the raw data (same logic as in detect())
    let parsedData;
    try {
      if (typeof raw === 'string') {
        parsedData = JSON.parse(raw);
      } else {
        parsedData = raw;
      }
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error}`);
    }
    // Step 3: If confidence<1 and strict option is true, throw validation error list
    if (confidence < 1 && this.strict) {
      // Get detailed validation errors from Ajv
      const validate = this.ajv.compile(schema);
      const isValid = validate(parsedData);
      if (!isValid && validate.errors) {
        // Step 4: Provide detailed error messages from Ajv when validation fails
        const errorMessages = validate.errors.map(err => {
          const path = err.instancePath || 'root';
          const message = err.message || 'validation failed';
          const allowedValues = err.params?.allowedValues
            ? ` (allowed values: ${err.params.allowedValues.join(', ')})`
            : '';
          return `${path}: ${message}${allowedValues}`;
        });
        throw new Error(
          `Schema validation failed: ${errorMessages.join('; ')}`
        );
      }
    }
    // Step 2: Return an object { data: parsed, schema: matchedSchema, confidence }
    return {
      data: parsedData,
      schema: matchedSchema,
      confidence: confidence,
    };
  }
  /**
   * Get the last detection result
   */
  getLastDetectionResult() {
    return { ...this.lastDetectionResult };
  }
}
//# sourceMappingURL=JSONSchemaAdapter.js.map
