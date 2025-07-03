/**
 * Test for detectConfidence implementations
 */
import { describe, it, expect } from 'vitest';
import {
  XmlAdapter,
  JsonAdapter,
  CsvAdapter,
  CodeCarbonAdapter,
  AIImpactTrackerAdapter,
  FitAdapter,
  JSONSchemaAdapter,
} from '../src/adapters/index.js';

describe('detectConfidence implementations', () => {
  describe('XmlAdapter detectConfidence', () => {
    const adapter = new XmlAdapter();

    it('should give high confidence for valid XML with declaration', () => {
      const xmlData = Buffer.from(
        '<?xml version="1.0" encoding="UTF-8"?><emissions><co2>123</co2><duration>3600</duration></emissions>'
      );
      const result = adapter.detectConfidence(xmlData);

      expect(result.adapterName).toBe('XmlAdapter');
      expect(result.score).toBeGreaterThan(0.3);
      expect(result.evidence).toContain('XML declaration present');
      expect(result.evidence).toContain('Emission-related content detected');
    });

    it('should give medium confidence for XML without declaration', () => {
      const xmlData = Buffer.from('<data><value>test</value></data>');
      const result = adapter.detectConfidence(xmlData);

      expect(result.adapterName).toBe('XmlAdapter');
      expect(result.score).toBeGreaterThan(0.1);
      expect(result.score).toBeLessThan(0.8);
      expect(result.evidence).toContain('Contains XML tags');
    });

    it('should give low confidence for HTML-like content', () => {
      const htmlData = Buffer.from(
        '<html><body><div>Not XML</div></body></html>'
      );
      const result = adapter.detectConfidence(htmlData);

      expect(result.adapterName).toBe('XmlAdapter');
      expect(result.score).toBeLessThan(0.5);
      expect(result.evidence).toContain('HTML-like content detected (penalty)');
    });
  });

  describe('JsonAdapter detectConfidence', () => {
    const adapter = new JsonAdapter();

    it('should give high confidence for JSON with emission properties', () => {
      const jsonData = Buffer.from(
        '{"emissions": 0.5, "duration": 3600, "model": "gpt-4", "timestamp": "2023-01-01"}'
      );
      const result = adapter.detectConfidence(jsonData);

      expect(result.adapterName).toBe('JsonAdapter');
      expect(result.score).toBeGreaterThan(0.8);
      expect(result.evidence).toContain('Valid JSON syntax');
      expect(result.evidence).toContain('Emission properties found');
      expect(result.evidence).toContain('Multiple canonical property types');
    });

    it('should give medium confidence for valid JSON without emission properties', () => {
      const jsonData = Buffer.from('{"name": "test", "value": 123}');
      const result = adapter.detectConfidence(jsonData);

      expect(result.adapterName).toBe('JsonAdapter');
      expect(result.score).toBeGreaterThan(0.5);
      expect(result.evidence).toContain('Valid JSON syntax');
    });

    it('should give low confidence for malformed JSON', () => {
      const jsonData = Buffer.from('{"name": "test", "value":');
      const result = adapter.detectConfidence(jsonData);

      expect(result.adapterName).toBe('JsonAdapter');
      expect(result.score).toBeLessThan(0.5);
    });
  });

  describe('CsvAdapter detectConfidence', () => {
    const adapter = new CsvAdapter();

    it('should give high confidence for CSV with emission headers', () => {
      const csvData = Buffer.from(
        'timestamp,model,emissions,duration\n2023-01-01,gpt-4,0.5,3600\n2023-01-02,gpt-3.5,0.3,1800'
      );
      const result = adapter.detectConfidence(csvData);

      expect(result.adapterName).toBe('CsvAdapter');
      expect(result.score).toBeGreaterThan(0.8);
      expect(result.evidence).toContain('Comma-separated structure detected');
      expect(result.evidence).toContain('Emission columns detected');
      expect(result.evidence).toContain('Multiple canonical column types');
    });

    it('should give medium confidence for generic CSV', () => {
      const csvData = Buffer.from(
        'name,value,description\ntest1,123,first\ntest2,456,second'
      );
      const result = adapter.detectConfidence(csvData);

      expect(result.adapterName).toBe('CsvAdapter');
      expect(result.score).toBeGreaterThan(0.3);
      expect(result.score).toBeLessThan(0.8);
      expect(result.evidence).toContain('Comma-separated structure detected');
    });

    it('should give zero confidence for non-CSV data', () => {
      const nonCsvData = Buffer.from('This is not CSV data at all');
      const result = adapter.detectConfidence(nonCsvData);

      expect(result.adapterName).toBe('CsvAdapter');
      expect(result.score).toBe(0.0);
      expect(result.evidence).toContain('No comma separators found');
    });
  });

  describe('CodeCarbonAdapter detectConfidence', () => {
    const adapter = new CodeCarbonAdapter();

    it('should give high confidence for valid CodeCarbon data', () => {
      const codeCarbonData = Buffer.from(
        '{"duration_seconds": 3600, "emissions_kg": 0.5, "project_name": "test"}'
      );
      const result = adapter.detectConfidence(codeCarbonData);

      expect(result.adapterName).toBe('CodeCarbonAdapter');
      expect(result.score).toBeGreaterThan(0.8);
      expect(result.evidence).toContain('Valid JSON syntax');
      expect(result.evidence).toContain('CodeCarbon canonical fields present');
    });

    it('should give partial confidence for data with only one required field', () => {
      const partialData = Buffer.from(
        '{"duration_seconds": 3600, "other_field": "value"}'
      );
      const result = adapter.detectConfidence(partialData);

      expect(result.adapterName).toBe('CodeCarbonAdapter');
      expect(result.score).toBeGreaterThan(0.3);
      expect(result.score).toBeLessThan(0.8);
      expect(result.evidence).toContain('duration_seconds field present');
    });
  });

  describe('Edge cases', () => {
    it('should handle truncated CodeCarbon JSON missing emissions_kg', () => {
      const codeCarbonData = Buffer.from('{"duration_seconds": 3600}');
      const result = new CodeCarbonAdapter().detectConfidence(codeCarbonData);

      expect(result.adapterName).toBe('CodeCarbonAdapter');
      expect(result.score).toBeGreaterThan(0.2);
      expect(result.score).toBeLessThan(0.7);
      expect(result.evidence).toContain('duration_seconds field present');
    });

    it('should handle malformed CSV row', () => {
      const malformedCSV = Buffer.from('name,age,city\nJohn,Doe');
      const result = new CsvAdapter().detectConfidence(malformedCSV);

      expect(result.adapterName).toBe('CsvAdapter');
      expect(result.score).toBeLessThan(0.6);
      expect(result.evidence).toContain('Malformed CSV structure detected');
    });
  });

  describe('AIImpactTrackerAdapter detectConfidence', () => {
    const adapter = new AIImpactTrackerAdapter();

    it('should give high confidence for valid AI Impact Tracker data', () => {
      const aiData = Buffer.from(
        '{"model": "gpt-4", "tokens": {"total": 1000}, "timestamp": "2023-01-01", "energyPerToken": 0.001}'
      );
      const result = adapter.detectConfidence(aiData);

      expect(result.adapterName).toBe('AIImpactTrackerAdapter');
      expect(result.score).toBeGreaterThan(0.8);
      expect(result.evidence).toContain('Valid JSON syntax');
      expect(result.evidence).toContain(
        'All required AI Impact Tracker fields present'
      );
    });

    it('should give partial confidence for incomplete AI Impact Tracker data', () => {
      const partialData = Buffer.from(
        '{"model": "gpt-4", "tokens": {"total": 1000}}'
      );
      const result = adapter.detectConfidence(partialData);

      expect(result.adapterName).toBe('AIImpactTrackerAdapter');
      expect(result.score).toBeGreaterThan(0.3);
      expect(result.evidence).toContain('model field present');
      expect(result.evidence).toContain('tokens field present');
    });
  });

  describe('FitAdapter detectConfidence', () => {
    const adapter = new FitAdapter();

    it('should give high confidence for valid FIT header', () => {
      // Create a mock FIT file header: 14 bytes header size, protocol version, profile version, data size, '.FIT' signature
      const fitHeader = Buffer.alloc(16);
      fitHeader.writeUInt8(14, 0); // Header size
      fitHeader.writeUInt8(16, 1); // Protocol version (1.6)
      fitHeader.writeUInt16LE(2120, 2); // Profile version
      fitHeader.writeUInt32LE(2, 4); // Data size (2 bytes for minimal data)
      fitHeader.write('.FIT', 8); // File type signature
      fitHeader.writeUInt16LE(0, 12); // Header CRC
      fitHeader.writeUInt16LE(0, 14); // File CRC

      const result = adapter.detectConfidence(fitHeader);

      expect(result.adapterName).toBe('FitAdapter');
      expect(result.score).toBeGreaterThan(0.6);
      expect(result.evidence).toContain('Valid FIT header structure');
    });

    it('should give zero confidence for non-FIT data', () => {
      const nonFitData = Buffer.from('short'); // Less than 14 bytes
      const result = adapter.detectConfidence(nonFitData);

      expect(result.adapterName).toBe('FitAdapter');
      expect(result.score).toBe(0.0);
      expect(result.evidence).toContain('File too small for FIT format');
    });
  });

  describe('JSONSchemaAdapter detectConfidence', () => {
    const schemas = {
      'emission-v1': {
        type: 'object' as const,
        properties: {
          timestamp: { type: 'string' as const },
          emissions: { type: 'number' as const },
          source: { type: 'string' as const },
        },
        required: ['timestamp', 'emissions'],
      },
    };
    const adapter = new JSONSchemaAdapter({ schemas });

    it('should give high confidence for perfect schema match', () => {
      const schemaData = Buffer.from(
        '{"timestamp": "2023-01-01", "emissions": 0.5, "source": "test"}'
      );
      const result = adapter.detectConfidence(schemaData);

      expect(result.adapterName).toBe('JSONSchemaAdapter');
      expect(result.score).toBeGreaterThan(0.9);
      expect(result.evidence).toContain('Perfect match with schema');
    });

    it('should give medium confidence for partial schema match', () => {
      const partialData = Buffer.from(
        '{"timestamp": "2023-01-01", "emissions": "not-a-number"}'
      );
      const result = adapter.detectConfidence(partialData);

      expect(result.adapterName).toBe('JSONSchemaAdapter');
      expect(result.score).toBeGreaterThan(0.3);
      expect(result.score).toBeLessThan(0.9);
      expect(result.evidence).toContain('match with schema');
    });

    it('should give low confidence for non-matching data', () => {
      const nonMatchingData = Buffer.from('{"unrelated": "data"}');
      const result = adapter.detectConfidence(nonMatchingData);

      expect(result.adapterName).toBe('JSONSchemaAdapter');
      expect(result.score).toBeLessThan(0.5);
    });
  });
});
