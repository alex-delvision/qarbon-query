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
export class AIImpactTrackerAdapter {
  /**
   * Detect if the raw data is AI Impact Tracker format
   * Quick sniff test for AI Impact Tracker emission data structure
   *
   * @param raw - The raw data to detect (string or object)
   * @returns true if data appears to be AI Impact Tracker format, false otherwise
   */
  detect(raw) {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      // Quick check for JSON-like structure
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          return this.hasAIImpactTrackerFields(parsed);
        } catch {
          return false;
        }
      }
      return false;
    }
    if (typeof raw === 'object' && raw !== null) {
      return this.hasAIImpactTrackerFields(raw);
    }
    return false;
  }
  /**
   * Analyze input and return confidence score for AI Impact Tracker format
   * Searches for canonical AI Impact Tracker property sets
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
        adapterName: 'AIImpactTrackerAdapter',
        score: Math.min(1.0, Math.max(0.0, score)),
        evidence: evidence.join('; '),
      };
    }
    if (parsedData && typeof parsedData === 'object') {
      const dataObj = parsedData;
      // Check for required AI Impact Tracker fields
      const hasModel = 'model' in dataObj;
      const hasTokens = 'tokens' in dataObj;
      const hasTimestamp = 'timestamp' in dataObj;
      const hasEnergyPerToken = 'energyPerToken' in dataObj;
      let requiredFieldCount = 0;
      if (hasModel) {
        score += 0.15;
        requiredFieldCount++;
        evidence.push('model field present');
        // Validate model type
        const modelValue = dataObj.model;
        if (typeof modelValue === 'string' && modelValue.trim() !== '') {
          score += 0.05;
          evidence.push('Valid model type');
        }
      }
      if (hasTokens) {
        score += 0.2;
        requiredFieldCount++;
        evidence.push('tokens field present');
        // Validate tokens structure
        const tokensValue = dataObj.tokens;
        if (tokensValue && typeof tokensValue === 'object') {
          const tokensObj = tokensValue;
          if ('total' in tokensObj) {
            score += 0.15;
            evidence.push('tokens.total field present');
            // Validate total type
            const totalValue = tokensObj.total;
            if (
              typeof totalValue === 'number' ||
              (typeof totalValue === 'string' && !isNaN(Number(totalValue)))
            ) {
              score += 0.05;
              evidence.push('Valid tokens.total type');
            }
          }
          // Check for optional token fields
          if ('prompt' in tokensObj || 'completion' in tokensObj) {
            score += 0.05;
            evidence.push('Optional token fields present');
          }
        }
      }
      if (hasTimestamp) {
        score += 0.1;
        requiredFieldCount++;
        evidence.push('timestamp field present');
        // Validate timestamp type
        const timestampValue = dataObj.timestamp;
        if (
          typeof timestampValue === 'string' ||
          typeof timestampValue === 'number'
        ) {
          score += 0.05;
          evidence.push('Valid timestamp type');
        }
      }
      if (hasEnergyPerToken) {
        score += 0.15;
        requiredFieldCount++;
        evidence.push('energyPerToken field present');
        // Validate energyPerToken type
        const energyValue = dataObj.energyPerToken;
        if (
          typeof energyValue === 'number' ||
          (typeof energyValue === 'string' && !isNaN(Number(energyValue)))
        ) {
          score += 0.05;
          evidence.push('Valid energyPerToken type');
        }
      }
      // Bonus for having all required fields
      if (requiredFieldCount === 4) {
        score += 0.2;
        evidence.push('All required AI Impact Tracker fields present');
      } else {
        // Penalty for partial matches - cap at 0.75
        score = Math.min(0.75, score);
        evidence.push(
          `Partial match (${requiredFieldCount}/4 required fields)`
        );
      }
      // Check for optional emissions field
      if ('emissions' in dataObj) {
        score += 0.05;
        evidence.push('Optional emissions field present');
        const emissionsValue = dataObj.emissions;
        if (
          typeof emissionsValue === 'number' ||
          (typeof emissionsValue === 'string' && !isNaN(Number(emissionsValue)))
        ) {
          score += 0.05;
          evidence.push('Valid emissions type');
        }
      }
      // Check for array of AI Impact Tracker objects
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        const firstItem = parsedData[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          const itemObj = firstItem;
          if (this.hasAIImpactTrackerFields(itemObj)) {
            score += 0.1;
            evidence.push('Array of AI Impact Tracker objects');
          }
        }
      }
    }
    return {
      adapterName: 'AIImpactTrackerAdapter',
      score: Math.min(1.0, Math.max(0.0, score)),
      evidence: evidence.join('; '),
    };
  }
  /**
   * Ingest and normalize AI Impact Tracker data into canonical format
   *
   * @param raw - The raw AI Impact Tracker data (string or object)
   * @returns Normalized emission data with camelCase properties
   * @throws Error if data format is invalid or required fields are missing
   */
  ingest(raw) {
    let input; // eslint-disable-line @typescript-eslint/no-explicit-any -- TODO: Type this more specifically
    // Parse string input or use object directly
    if (typeof raw === 'string') {
      try {
        input = JSON.parse(raw);
      } catch (error) {
        throw new Error(
          `Failed to parse AI Impact Tracker JSON data: ${error}`
        );
      }
    } else if (typeof raw === 'object' && raw !== null) {
      input = raw;
    } else {
      throw new Error('AI Impact Tracker data must be a JSON string or object');
    }
    // Validate required fields exist
    if (!this.hasAIImpactTrackerFields(input)) {
      throw new Error(
        'AI Impact Tracker data must contain required fields: model, tokens.total, timestamp, energyPerToken'
      );
    }
    // Extract and validate model
    const model = input.model;
    if (typeof model !== 'string' || model.trim() === '') {
      throw new Error('AI Impact Tracker "model" must be a non-empty string');
    }
    // Extract and validate tokens
    const tokens = input.tokens;
    if (!tokens || typeof tokens !== 'object') {
      throw new Error('AI Impact Tracker "tokens" must be an object');
    }
    const tokensTotal = Number(tokens.total);
    if (isNaN(tokensTotal) || tokensTotal < 0) {
      throw new Error(
        'AI Impact Tracker "tokens.total" must be a valid non-negative number'
      );
    }
    // Extract prompt and completion tokens (optional but validate if present)
    const tokensPrompt =
      tokens.prompt !== undefined ? Number(tokens.prompt) : 0;
    const tokensCompletion =
      tokens.completion !== undefined ? Number(tokens.completion) : 0;
    if (
      tokens.prompt !== undefined &&
      (isNaN(tokensPrompt) || tokensPrompt < 0)
    ) {
      throw new Error(
        'AI Impact Tracker "tokens.prompt" must be a valid non-negative number'
      );
    }
    if (
      tokens.completion !== undefined &&
      (isNaN(tokensCompletion) || tokensCompletion < 0)
    ) {
      throw new Error(
        'AI Impact Tracker "tokens.completion" must be a valid non-negative number'
      );
    }
    // Extract and validate timestamp
    const timestamp = input.timestamp;
    if (
      timestamp === undefined ||
      timestamp === null ||
      (typeof timestamp !== 'string' && typeof timestamp !== 'number')
    ) {
      throw new Error(
        'AI Impact Tracker "timestamp" must be a string or number'
      );
    }
    // Extract and validate energyPerToken
    const energyPerToken = Number(input.energyPerToken);
    if (isNaN(energyPerToken) || energyPerToken < 0) {
      throw new Error(
        'AI Impact Tracker "energyPerToken" must be a valid non-negative number'
      );
    }
    // Extract or compute emissions
    let emissions;
    if (input.emissions !== undefined) {
      emissions = Number(input.emissions);
      if (isNaN(emissions) || emissions < 0) {
        throw new Error(
          'AI Impact Tracker "emissions" must be a valid non-negative number'
        );
      }
    } else {
      // Compute emissions as tokens.total * energyPerToken
      emissions = tokensTotal * energyPerToken;
    }
    // Extract or set default confidence metadata
    let confidence;
    if (input.confidence !== undefined) {
      // Validate existing confidence structure
      if (
        typeof input.confidence === 'object' &&
        input.confidence !== null &&
        'low' in input.confidence &&
        'high' in input.confidence
      ) {
        const confLow = Number(input.confidence.low);
        const confHigh = Number(input.confidence.high);
        if (isNaN(confLow) || isNaN(confHigh)) {
          throw new Error(
            'AI Impact Tracker "confidence.low" and "confidence.high" must be valid numbers'
          );
        }
        if (confLow > confHigh) {
          throw new Error(
            'AI Impact Tracker "confidence.low" must be less than or equal to "confidence.high"'
          );
        }
        confidence = { low: confLow, high: confHigh };
      } else {
        throw new Error(
          'AI Impact Tracker "confidence" must be an object with "low" and "high" properties'
        );
      }
    } else {
      // Set default confidence range (±20%)
      const margin = emissions * 0.2;
      confidence = {
        low: Math.max(0, emissions - margin),
        high: emissions + margin,
      };
    }
    // Return normalized object with camelCase properties
    const result = {
      model: model.trim(),
      tokens: {
        prompt: tokensPrompt,
        completion: tokensCompletion,
        total: tokensTotal,
      },
      timestamp,
      energyPerToken,
      emissions,
    };
    // Only include confidence if it's defined
    if (confidence !== undefined) {
      result.confidence = confidence;
    }
    return result;
  }
  /**
   * Check if the given data has the required AI Impact Tracker fields
   *
   * @param data - The data to check
   * @returns true if data has required fields: model, tokens.total, timestamp, energyPerToken
   */
  hasAIImpactTrackerFields(data) {
    return (
      data &&
      typeof data === 'object' &&
      'model' in data &&
      'tokens' in data &&
      data.tokens && // eslint-disable-line @typescript-eslint/no-explicit-any
      typeof data.tokens === 'object' && // eslint-disable-line @typescript-eslint/no-explicit-any
      'total' in data.tokens && // eslint-disable-line @typescript-eslint/no-explicit-any
      'timestamp' in data &&
      'energyPerToken' in data
    );
  }
}
//# sourceMappingURL=AIImpactTrackerAdapter.js.map
