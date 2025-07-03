/**
 * Tests for UniversalTrackerRegistry and EmissionAdapters
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  UniversalTrackerRegistry,
  EmissionAdapter,
} from '../src/UniversalTrackerRegistry.js';
import { JsonAdapter } from '../src/adapters/JsonAdapter.js';
import { CsvAdapter } from '../src/adapters/CsvAdapter.js';
import { XmlAdapter } from '../src/adapters/XmlAdapter.js';

// Mock EmissionAdapter for testing
class MockEmissionAdapter implements EmissionAdapter {
  private shouldDetect: boolean;
  private ingestResult: unknown;
  private shouldThrowOnIngest: boolean;

  constructor(
    shouldDetect = true,
    ingestResult: unknown = { mocked: true },
    shouldThrowOnIngest = false
  ) {
    this.shouldDetect = shouldDetect;
    this.ingestResult = ingestResult;
    this.shouldThrowOnIngest = shouldThrowOnIngest;
  }

  detect(_raw: unknown): boolean {
    // eslint-disable-line @typescript-eslint/no-unused-vars
    return this.shouldDetect;
  }

  detectConfidence(
    _input: Buffer | NodeJS.ReadableStream
  ): import('../src/UniversalTrackerRegistry.js').FormatConfidence {
    return {
      adapterName: 'MockAdapter',
      score: this.shouldDetect ? 0.8 : 0.0,
      evidence: this.shouldDetect
        ? 'Mock detection positive'
        : 'Mock detection negative',
    };
  }

  ingest(_raw: unknown): unknown {
    // eslint-disable-line @typescript-eslint/no-unused-vars
    if (this.shouldThrowOnIngest) {
      throw new Error('Mock ingest error');
    }
    return this.ingestResult;
  }

  // Helper methods for testing
  setShouldDetect(value: boolean): void {
    this.shouldDetect = value;
  }

  setIngestResult(result: unknown): void {
    this.ingestResult = result;
  }

  setShouldThrowOnIngest(value: boolean): void {
    this.shouldThrowOnIngest = value;
  }
}

describe('UniversalTrackerRegistry', () => {
  let registry: UniversalTrackerRegistry;
  let mockAdapter: MockEmissionAdapter;

  beforeEach(() => {
    registry = new UniversalTrackerRegistry();
    mockAdapter = new MockEmissionAdapter();
  });

  describe('registerAdapter', () => {
    it('should register a new adapter', () => {
      registry.registerAdapter('test', mockAdapter);

      // Test that the adapter was registered by trying to detect with it
      mockAdapter.setShouldDetect(true);
      expect(registry.detectFormat('test-data')).toBe('test');
    });

    it('should register multiple adapters', () => {
      const mockAdapter2 = new MockEmissionAdapter();

      registry.registerAdapter('adapter1', mockAdapter);
      registry.registerAdapter('adapter2', mockAdapter2);

      // First adapter should match
      mockAdapter.setShouldDetect(true);
      mockAdapter2.setShouldDetect(false);
      expect(registry.detectFormat('test-data')).toBe('adapter1');

      // Second adapter should match when first doesn't
      mockAdapter.setShouldDetect(false);
      mockAdapter2.setShouldDetect(true);
      expect(registry.detectFormat('test-data')).toBe('adapter2');
    });

    it('should overwrite existing adapter with same name', () => {
      const mockAdapter2 = new MockEmissionAdapter(true, { different: true });

      registry.registerAdapter('test', mockAdapter);
      registry.registerAdapter('test', mockAdapter2); // Overwrite

      const result = registry.ingest('test-data');
      expect(result).toEqual({ different: true });
    });
  });

  describe('detectFormat', () => {
    it('should return correct key for matching adapter', () => {
      registry.registerAdapter('json', mockAdapter);
      mockAdapter.setShouldDetect(true);

      expect(registry.detectFormat('{"test": true}')).toBe('json');
    });

    it('should return null when no adapter matches', () => {
      registry.registerAdapter('json', mockAdapter);
      mockAdapter.setShouldDetect(false);

      expect(registry.detectFormat('{"test": true}')).toBeNull();
    });

    it('should return first matching adapter name', () => {
      const mockAdapter2 = new MockEmissionAdapter(true);

      registry.registerAdapter('first', mockAdapter);
      registry.registerAdapter('second', mockAdapter2);

      // Both match, should return first
      expect(registry.detectFormat('test-data')).toBe('first');
    });

    it('should work with different data types', () => {
      registry.registerAdapter('test', mockAdapter);
      mockAdapter.setShouldDetect(true);

      expect(registry.detectFormat('string-data')).toBe('test');
      expect(registry.detectFormat({ object: 'data' })).toBe('test');
      expect(registry.detectFormat(['array', 'data'])).toBe('test');
      expect(registry.detectFormat(123)).toBe('test');
    });
  });

  describe('ingest', () => {
    it('should return parsed object from matching adapter', () => {
      const expectedResult = { parsed: true, data: 'test' };
      mockAdapter.setIngestResult(expectedResult);

      registry.registerAdapter('test', mockAdapter);

      const result = registry.ingest('raw-data');
      expect(result).toEqual(expectedResult);
    });

    it('should call ingest on the correct adapter based on detection', () => {
      const jsonResult = { type: 'json' };
      const csvResult = { type: 'csv' };

      const jsonMock = new MockEmissionAdapter(false, jsonResult);
      const csvMock = new MockEmissionAdapter(true, csvResult);

      registry.registerAdapter('json', jsonMock);
      registry.registerAdapter('csv', csvMock);

      const result = registry.ingest('csv-data');
      expect(result).toEqual(csvResult);
    });

    it('should throw error for unknown format by default', () => {
      registry.registerAdapter('test', mockAdapter);
      mockAdapter.setShouldDetect(false); // No adapter matches

      expect(() => registry.ingest('unknown-data')).toThrow(
        'Unknown emission data format'
      );
    });

    it('should handle adapter ingest errors', () => {
      mockAdapter.setShouldThrowOnIngest(true);
      registry.registerAdapter('test', mockAdapter);

      expect(() => registry.ingest('test-data')).toThrow('Mock ingest error');
    });
  });

  describe('constructor with initial adapters', () => {
    it('should register initial adapters from constructor', () => {
      const initialAdapters = {
        json: new MockEmissionAdapter(true, { from: 'json' }),
        csv: new MockEmissionAdapter(false, { from: 'csv' }),
      };

      const registryWithInitial = new UniversalTrackerRegistry(initialAdapters);

      expect(registryWithInitial.detectFormat('test')).toBe('json');
      expect(registryWithInitial.ingest('test')).toEqual({ from: 'json' });
    });
  });
});

describe('Real Adapters Integration', () => {
  let registry: UniversalTrackerRegistry;

  beforeEach(() => {
    registry = new UniversalTrackerRegistry({
      json: new JsonAdapter(),
      csv: new CsvAdapter(),
      xml: new XmlAdapter(),
    });
  });

  describe('JSON Adapter', () => {
    it('should detect JSON strings correctly', () => {
      expect(registry.detectFormat('{"test": true}')).toBe('json');
      expect(registry.detectFormat('[1, 2, 3]')).toBe('json');
      expect(registry.detectFormat('  {"spaced": true}  ')).toBe('json'); // with whitespace
    });

    it('should detect JSON objects correctly', () => {
      expect(registry.detectFormat({ test: true })).toBe('json');
      expect(registry.detectFormat([1, 2, 3])).toBe('json');
    });

    it('should parse JSON strings correctly', () => {
      const jsonString = '{"name": "test", "value": 42}';
      const result = registry.ingest(jsonString);
      expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('should return objects as-is', () => {
      const obj = { name: 'test', value: 42 };
      const result = registry.ingest(obj);
      expect(result).toEqual(obj);
    });

    it('should throw error for invalid JSON strings', () => {
      expect(() => registry.ingest('{invalid json')).toThrow(
        'Failed to parse JSON'
      );
    });
  });

  describe('CSV Adapter', () => {
    it('should detect CSV strings correctly', () => {
      expect(
        registry.detectFormat('name,age,city\nJohn,30,NYC\nJane,25,LA')
      ).toBe('csv');
      expect(registry.detectFormat('a,b,c')).toBe('csv');
      expect(registry.detectFormat('single,line,csv')).toBe('csv');
    });

    it('should not detect non-CSV strings', () => {
      // Should not match CSV since JSON adapter comes first and matches objects
      expect(registry.detectFormat('no commas here')).not.toBe('csv');
      expect(registry.detectFormat('{"json": true}')).toBe('json'); // JSON takes precedence
    });

    it('should parse CSV strings correctly', () => {
      const csvString = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      const result = registry.ingest(csvString);
      expect(result).toEqual([
        { name: 'John', age: '30', city: 'NYC' },
        { name: 'Jane', age: '25', city: 'LA' },
      ]);
    });

    it('should handle CSV with quoted values', () => {
      const csvString =
        'name,description\n"John Smith","A person with spaces"\nJane,Simple';
      const result = registry.ingest(csvString);
      expect(result).toEqual([
        { name: 'John Smith', description: 'A person with spaces' },
        { name: 'Jane', description: 'Simple' },
      ]);
    });

    it('should return empty array for empty CSV', () => {
      // Empty strings are not detected by CSV adapter, so let's test what the CSV adapter itself does
      const csvAdapter = new CsvAdapter();
      expect(csvAdapter.ingest('')).toEqual([]);
      expect(csvAdapter.ingest('   ')).toEqual([]);
    });
  });

  describe('XML Adapter', () => {
    it('should detect XML strings correctly', () => {
      expect(registry.detectFormat('<?xml version="1.0"?><root></root>')).toBe(
        'xml'
      );
      expect(registry.detectFormat('<root><child>test</child></root>')).toBe(
        'xml'
      );
      expect(registry.detectFormat('<note>Simple note</note>')).toBe('xml');
    });

    it('should not detect non-XML strings', () => {
      expect(registry.detectFormat('not xml')).not.toBe('xml');
      expect(registry.detectFormat('<incomplete')).not.toBe('xml');
    });

    it('should parse simple XML correctly', () => {
      const xmlString = '<note><title>Test</title><body>Content</body></note>';
      const result = registry.ingest(xmlString);
      expect(result).toEqual({
        note: {
          title: 'Test',
          body: 'Content',
        },
      });
    });

    it('should handle XML with declaration', () => {
      const xmlString =
        '<?xml version="1.0" encoding="UTF-8"?><root><data>test</data></root>';
      const result = registry.ingest(xmlString);
      expect(result).toEqual({
        root: {
          data: 'test',
        },
      });
    });

    it('should return empty object for empty XML', () => {
      // Empty strings are not detected by XML adapter, so we need to test the adapter directly
      const xmlAdapter = new XmlAdapter();
      expect(xmlAdapter.ingest('')).toEqual({});
      expect(xmlAdapter.ingest('   ')).toEqual({});
    });
  });

  describe('Format Detection Priority', () => {
    it('should prioritize JSON for ambiguous data', () => {
      // This could be detected as JSON (it's an object)
      const data = { name: 'test', values: 'a,b,c' };
      expect(registry.detectFormat(data)).toBe('json');
    });

    it('should detect CSV when JSON detection fails', () => {
      // Create a registry without JSON to test CSV priority
      const csvOnlyRegistry = new UniversalTrackerRegistry({
        csv: new CsvAdapter(),
        xml: new XmlAdapter(),
      });

      expect(csvOnlyRegistry.detectFormat('name,age\nJohn,30')).toBe('csv');
    });
  });

  describe('Unknown Format Handling', () => {
    it('should throw error for completely unknown formats', () => {
      expect(() => registry.ingest('completely unknown format 12345')).toThrow(
        'Unknown emission data format'
      );
    });

    it('should handle numbers and other primitive types', () => {
      expect(() => registry.ingest(12345)).toThrow(
        'Unknown emission data format'
      );
      expect(() => registry.ingest(true)).toThrow(
        'Unknown emission data format'
      );
    });
  });

  describe('Multi-format Scenario Test', () => {
    const testCases = [
      {
        name: 'Valid JSON',
        buffer: Buffer.from(
          '{"timestamp": "2023-01-01T00:00:00Z", "emissions": 0.5, "model": "gpt-4"}'
        ),
        expectedAdapter: 'json',
      },
      {
        name: 'Valid CSV',
        buffer: Buffer.from(
          'timestamp,model,emissions\n2023-01-01T00:00:00Z,gpt-4,0.001'
        ),
        expectedAdapter: 'csv',
      },
      {
        name: 'Valid XML',
        buffer: Buffer.from(
          '<?xml version="1.0"?><emissions><record><timestamp>2023-01-01T00:00:00Z</timestamp><model>gpt-4</model></record></emissions>'
        ),
        expectedAdapter: 'xml',
      },
    ];

    for (const { name, buffer, expectedAdapter } of testCases) {
      it(`should detect ${name} correctly`, () => {
        const result = registry.detectFormat(buffer.toString());
        expect(result).toBe(expectedAdapter);
      });
    }
  });
});

describe('Fallback Registry for Unknown Formats', () => {
  // Example of a registry that returns a fallback instead of throwing
  class FallbackUniversalTrackerRegistry extends UniversalTrackerRegistry {
    protected processUnknown(raw: unknown): unknown {
      return { unknown: true, raw: raw };
    }
  }

  it('should return fallback for unknown format instead of throwing', () => {
    const fallbackRegistry = new FallbackUniversalTrackerRegistry({
      json: new JsonAdapter(),
    });

    // Known format should work normally
    expect(fallbackRegistry.ingest('{"test": true}')).toEqual({ test: true });

    // Unknown format should return fallback
    const result = fallbackRegistry.ingest('unknown format');
    expect(result).toEqual({ unknown: true, raw: 'unknown format' });
  });

  it('should demonstrate creating registry with custom fallback behavior', () => {
    class CustomFallbackRegistry extends UniversalTrackerRegistry {
      protected processUnknown(_raw: unknown): unknown {
        return {
          error: 'Unsupported format',
          receivedType: typeof _raw,
          fallbackProcessed: true,
        };
      }
    }

    const customRegistry = new CustomFallbackRegistry();
    const result = customRegistry.ingest(12345);

    expect(result).toEqual({
      error: 'Unsupported format',
      receivedType: 'number',
      fallbackProcessed: true,
    });
  });
});

describe('Adapter Mocking in Tests', () => {
  it('should demonstrate how to mock adapters for testing', () => {
    const mockAdapter = new MockEmissionAdapter();
    const mockSpy = vi.fn().mockReturnValue({ mocked: 'result' });

    // Override the ingest method with a spy
    mockAdapter.ingest = mockSpy;

    const registry = new UniversalTrackerRegistry({
      mock: mockAdapter,
    });

    const result = registry.ingest('test-data');

    expect(mockSpy).toHaveBeenCalledWith('test-data');
    expect(result).toEqual({ mocked: 'result' });
  });

  it('should demonstrate spying on real adapter methods', () => {
    const jsonAdapter = new JsonAdapter();
    const detectSpy = vi.spyOn(jsonAdapter, 'detect');
    const ingestSpy = vi.spyOn(jsonAdapter, 'ingest');

    const registry = new UniversalTrackerRegistry({
      json: jsonAdapter,
    });

    const testData = '{"test": true}';
    const result = registry.ingest(testData);

    expect(detectSpy).toHaveBeenCalledWith(testData);
    expect(ingestSpy).toHaveBeenCalledWith(testData);
    expect(result).toEqual({ test: true });
  });
});
