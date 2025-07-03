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

export class CodeCarbonAdapter implements EmissionAdapter {
  /**
   * Detect if the raw data is CodeCarbon format
   * Quick sniff test for CodeCarbon emission data structure
   *
   * @param raw - The raw data to detect (string or object)
   * @returns true if data appears to be CodeCarbon format, false otherwise
   */
  detect(raw: unknown): boolean {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();

      // Quick check for JSON-like structure
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          return this.hasCodeCarbonFields(parsed);
        } catch {
          return false;
        }
      }

      return false;
    }

    if (typeof raw === 'object' && raw !== null) {
      return this.hasCodeCarbonFields(raw);
    }

    return false;
  }

  /**
   * Analyze input and return confidence score for CodeCarbon format
   * Searches for canonical CodeCarbon property sets
   */
  detectConfidence(input: Buffer | NodeJS.ReadableStream): FormatConfidence {
    let content: string;

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
    const evidence: string[] = [];

    // Try to parse as JSON
    let parsedData: unknown;
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
        adapterName: 'CodeCarbonAdapter',
        score: Math.min(1.0, Math.max(0.0, score)),
        evidence: evidence.join('; '),
      };
    }

    if (parsedData && typeof parsedData === 'object') {
      const dataObj = parsedData as Record<string, unknown>;

      // Check for required CodeCarbon fields
      const hasDurationSeconds = 'duration_seconds' in dataObj;
      const hasEmissionsKg = 'emissions_kg' in dataObj;
      const hasDuration = 'duration' in dataObj; // CodeCarbon also uses 'duration'
      const hasEmissions = 'emissions' in dataObj; // CodeCarbon also uses 'emissions'

      // Strong indicators for CodeCarbon format
      if (hasDurationSeconds && hasEmissionsKg) {
        score += 0.7; // Increased from 0.6
        evidence.push('CodeCarbon canonical fields present');

        // Validate field types
        const durationValue = dataObj.duration_seconds;
        const emissionsValue = dataObj.emissions_kg;

        if (
          typeof durationValue === 'number' ||
          (typeof durationValue === 'string' && !isNaN(Number(durationValue)))
        ) {
          score += 0.15; // Increased from 0.1
          evidence.push('Valid duration_seconds type');
        }

        if (
          typeof emissionsValue === 'number' ||
          (typeof emissionsValue === 'string' && !isNaN(Number(emissionsValue)))
        ) {
          score += 0.15; // Increased from 0.1
          evidence.push('Valid emissions_kg type');
        }
      } else if (
        (hasDurationSeconds || hasDuration) &&
        (hasEmissionsKg || hasEmissions)
      ) {
        // Alternative CodeCarbon field combinations
        score += 0.5;
        evidence.push('CodeCarbon alternative field combination');

        const durationValue = dataObj.duration_seconds || dataObj.duration;
        const emissionsValue = dataObj.emissions_kg || dataObj.emissions;

        if (
          typeof durationValue === 'number' ||
          (typeof durationValue === 'string' && !isNaN(Number(durationValue)))
        ) {
          score += 0.1;
          evidence.push('Valid duration field type');
        }

        if (
          typeof emissionsValue === 'number' ||
          (typeof emissionsValue === 'string' && !isNaN(Number(emissionsValue)))
        ) {
          score += 0.1;
          evidence.push('Valid emissions field type');
        }
      } else {
        // Partial matches
        if (hasDurationSeconds) {
          score += 0.2;
          evidence.push('duration_seconds field present');
        }
        if (hasEmissionsKg) {
          score += 0.2;
          evidence.push('emissions_kg field present');
        }
      }

      // Check for other common CodeCarbon fields
      const optionalCodeCarbonFields = [
        'timestamp',
        'project_name',
        'run_id',
        'cpu_count',
        'cpu_model',
        'gpu_count',
        'gpu_model',
        'longitude',
        'latitude',
        'region',
        'provider',
        'electricity_mix_for_region',
        'os',
        'python_version',
        'codecarbon_version',
        'cpu_energy',
        'gpu_energy',
        'ram_energy',
      ];

      let optionalFieldCount = 0;
      optionalCodeCarbonFields.forEach(field => {
        if (field in dataObj) {
          optionalFieldCount++;
        }
      });

      if (optionalFieldCount > 0) {
        score += Math.min(0.2, optionalFieldCount * 0.02);
        evidence.push(
          `${optionalFieldCount} optional CodeCarbon fields present`
        );
      }

      // Check for array of CodeCarbon objects
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        const firstItem = parsedData[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          const itemObj = firstItem as Record<string, unknown>;
          if ('duration_seconds' in itemObj && 'emissions_kg' in itemObj) {
            score += 0.1;
            evidence.push('Array of CodeCarbon objects');
          }
        }
      }
    }

    return {
      adapterName: 'CodeCarbonAdapter',
      score: Math.min(1.0, Math.max(0.0, score)),
      evidence: evidence.join('; '),
    };
  }

  /**
   * Ingest and normalize CodeCarbon data into canonical format
   *
   * @param raw - The raw CodeCarbon data (string or object)
   * @returns Normalized emission data with camelCase properties
   * @throws Error if data format is invalid or required fields are missing
   */
  ingest(raw: unknown): { durationSeconds: number; emissionsKg: number } {
    let input: unknown;

    // Parse string input or use object directly
    if (typeof raw === 'string') {
      try {
        input = JSON.parse(raw);
      } catch (error) {
        throw new Error(`Failed to parse CodeCarbon JSON data: ${error}`);
      }
    } else if (typeof raw === 'object' && raw !== null) {
      input = raw;
    } else {
      throw new Error('CodeCarbon data must be a JSON string or object');
    }

    // Validate required fields exist and are numbers
    if (!this.hasCodeCarbonFields(input)) {
      throw new Error(
        'CodeCarbon data must contain both "duration_seconds" and "emissions_kg" fields'
      );
    }

    const durationSeconds = Number((input as any).duration_seconds); // eslint-disable-line @typescript-eslint/no-explicit-any
    const emissionsKg = Number((input as any).emissions_kg); // eslint-disable-line @typescript-eslint/no-explicit-any

    // Validate that conversion to numbers was successful
    if (isNaN(durationSeconds)) {
      throw new Error('CodeCarbon "duration_seconds" must be a valid number');
    }

    if (isNaN(emissionsKg)) {
      throw new Error('CodeCarbon "emissions_kg" must be a valid number');
    }

    // Return normalized object with camelCase properties
    return {
      durationSeconds,
      emissionsKg,
    };
  }

  /**
   * Check if the given data has the required CodeCarbon fields
   *
   * @param data - The data to check
   * @returns true if data has both duration_seconds and emissions_kg fields
   */
  private hasCodeCarbonFields(
    data: unknown
  ): data is { duration_seconds: unknown; emissions_kg: unknown } {
    return Boolean(
      data &&
        typeof data === 'object' &&
        'duration_seconds' in data &&
        'emissions_kg' in data
    );
  }
}
