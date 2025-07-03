/**
 * Tests for enhanced detectFormat functionality with confidence-based detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UniversalTrackerRegistry } from '../src/UniversalTrackerRegistry.js';
import {
  JsonAdapter,
  CsvAdapter,
  XmlAdapter,
  CodeCarbonAdapter,
  AIImpactTrackerAdapter,
  FitAdapter,
  JSONSchemaAdapter,
} from '../src/adapters/index.js';

describe('Enhanced detectFormat with confidence scores', () => {
  let registry: UniversalTrackerRegistry;

  beforeEach(() => {
    const schemas = {
      emission: {
        type: 'object' as const,
        properties: {
          timestamp: { type: 'string' },
          emissions: { type: 'number' },
          duration: { type: 'number' },
        },
        required: ['timestamp', 'emissions'],
      },
    };

    registry = new UniversalTrackerRegistry({
      json: new JsonAdapter(),
      csv: new CsvAdapter(),
      xml: new XmlAdapter(),
      codecarbon: new CodeCarbonAdapter(),
      aiimpact: new AIImpactTrackerAdapter(),
      fit: new FitAdapter(),
      jsonschema: new JSONSchemaAdapter({ schemas }),
    });
  });

  describe('detectFormat with Buffer input', () => {
    it('should return FormatDetectionResult for JSON data', async () => {
      const jsonData = Buffer.from(
        '{"emissions": 0.5, "duration": 3600, "model": "gpt-4"}'
      );
      const result = await registry.detectFormat(jsonData);

      expect(result).toHaveProperty('bestMatch');
      expect(result).toHaveProperty('confidenceScores');
      expect(result.bestMatch).toBe('json');
      expect(result.confidenceScores).toHaveLength(7); // json, csv, xml, codecarbon, aiimpact, fit, jsonschema
      expect(result.confidenceScores[0].adapterName).toBe('json');
      expect(result.confidenceScores[0].score).toBeGreaterThan(0.8);
    });

    it('should return FormatDetectionResult for CSV data', async () => {
      const csvData = Buffer.from(
        'timestamp,model,emissions,duration\n2023-01-01,gpt-4,0.5,3600'
      );
      const result = await registry.detectFormat(csvData);

      expect(result.bestMatch).toBe('csv');
      expect(result.confidenceScores[0].adapterName).toBe('csv');
      expect(result.confidenceScores[0].score).toBeGreaterThan(0.7);
    });

    it('should return FormatDetectionResult for XML data', async () => {
      const xmlData = Buffer.from(
        '<?xml version="1.0"?><emissions><co2>0.5</co2><duration>3600</duration></emissions>'
      );
      const result = await registry.detectFormat(xmlData);

      expect(result.bestMatch).toBe('xml');
      expect(result.confidenceScores[0].adapterName).toBe('xml');
      expect(result.confidenceScores[0].score).toBeGreaterThan(0.3);
    });

    it('should sort confidence scores in descending order', async () => {
      const jsonData = Buffer.from('{"emissions": 0.5, "duration": 3600}');
      const result = await registry.detectFormat(jsonData);

      expect(result.confidenceScores).toHaveLength(7);

      // Scores should be in descending order
      for (let i = 0; i < result.confidenceScores.length - 1; i++) {
        expect(result.confidenceScores[i].score).toBeGreaterThanOrEqual(
          result.confidenceScores[i + 1].score
        );
      }
    });

    it('should return null bestMatch when no adapter has confidence > 0', async () => {
      const unknownData = Buffer.from('random unknown data format 12345');
      const result = await registry.detectFormat(unknownData);

      expect(result.bestMatch).toBeNull();
      expect(result.confidenceScores).toHaveLength(7);
      expect(result.confidenceScores.every(score => score.score === 0.0)).toBe(
        true
      );
    });

    it('should handle adapter errors gracefully', async () => {
      // Create a mock adapter that throws an error
      const errorAdapter = {
        detect: () => false,
        detectConfidence: () => {
          throw new Error('Test error');
        },
        ingest: () => ({}),
      };

      registry.registerAdapter('error', errorAdapter);

      const testData = Buffer.from('{"test": true}');
      const result = await registry.detectFormat(testData);

      expect(result.confidenceScores).toHaveLength(8); // json, csv, xml, codecarbon, aiimpact, fit, jsonschema, error

      // Find the error adapter result
      const errorResult = result.confidenceScores.find(
        score => score.adapterName === 'error'
      );
      expect(errorResult).toBeDefined();
      expect(errorResult!.score).toBe(0.0);
      expect(errorResult!.evidence).toContain('Error during detection');
    });
  });

  describe('detectFormatWithConfidence method', () => {
    it('should be accessible and return same results as detectFormat with Buffer', async () => {
      const jsonData = Buffer.from('{"emissions": 0.5}');

      const detectFormatResult = await registry.detectFormat(jsonData);
      const detectFormatWithConfidenceResult =
        await registry.detectFormatWithConfidence(jsonData);

      expect(detectFormatResult).toEqual(detectFormatWithConfidenceResult);
    });
  });

  describe('backward compatibility', () => {
    it('should still work with legacy input types', () => {
      // These should work synchronously as before
      expect(registry.detectFormat('{"test": true}')).toBe('json');
      expect(registry.detectFormat('name,value\ntest,123')).toBe('csv');
      expect(registry.detectFormat('<root><test>true</test></root>')).toBe(
        'xml'
      );
      expect(registry.detectFormat('unknown format')).toBeNull();
    });

    it('should return different types for different inputs', async () => {
      // Legacy input - synchronous string return
      const legacyResult = registry.detectFormat('{"test": true}');
      expect(typeof legacyResult).toBe('string');
      expect(legacyResult).toBe('json');

      // Buffer input - asynchronous FormatDetectionResult return
      const bufferResult = registry.detectFormat(Buffer.from('{"test": true}'));
      expect(bufferResult).toBeInstanceOf(Promise);

      const resolvedResult = await bufferResult;
      expect(resolvedResult).toHaveProperty('bestMatch');
      expect(resolvedResult).toHaveProperty('confidenceScores');
      expect(resolvedResult.bestMatch).toBe('json');
    });
  });

  describe('parallel execution', () => {
    it('should run all adapters in parallel', async () => {
      const jsonData = Buffer.from('{"emissions": 0.5, "duration": 3600}');

      const startTime = Date.now();
      const result = await registry.detectFormat(jsonData);
      const endTime = Date.now();

      // Should complete quickly due to parallel execution
      expect(endTime - startTime).toBeLessThan(1000);
      expect(result.confidenceScores).toHaveLength(7);

      // All adapters should have been checked
      const adapterNames = result.confidenceScores.map(
        score => score.adapterName
      );
      expect(adapterNames).toContain('json');
      expect(adapterNames).toContain('csv');
      expect(adapterNames).toContain('xml');
      expect(adapterNames).toContain('codecarbon');
      expect(adapterNames).toContain('aiimpact');
      expect(adapterNames).toContain('fit');
      expect(adapterNames).toContain('jsonschema');
    });
  });
});
