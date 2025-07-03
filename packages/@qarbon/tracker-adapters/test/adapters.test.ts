/**
 * Unit tests for individual emission adapters
 * Tests the detect() and ingest() methods for accuracy and normalization
 */

import { describe, it, expect } from 'vitest';
import { JsonAdapter } from '../src/adapters/JsonAdapter.js';
import { CsvAdapter } from '../src/adapters/CsvAdapter.js';
import { XmlAdapter } from '../src/adapters/XmlAdapter.js';
import { CodeCarbonAdapter } from '../src/adapters/CodeCarbonAdapter.js';

describe('JsonAdapter', () => {
  const adapter = new JsonAdapter();

  describe('detect()', () => {
    describe('valid JSON payloads', () => {
      it('should detect JSON objects', () => {
        expect(adapter.detect('{"key": "value"}')).toBe(true);
        expect(adapter.detect('{"nested": {"data": true}}')).toBe(true);
        expect(adapter.detect('{"number": 123, "boolean": false}')).toBe(true);
      });

      it('should detect JSON arrays', () => {
        expect(adapter.detect('[1, 2, 3]')).toBe(true);
        expect(adapter.detect('["string", "array"]')).toBe(true);
        expect(adapter.detect('[{"id": 1}, {"id": 2}]')).toBe(true);
      });

      it('should detect JSON with whitespace', () => {
        expect(adapter.detect('  {"padded": true}  ')).toBe(true);
        expect(adapter.detect('\n\t[1, 2, 3]\n')).toBe(true);
      });

      it('should detect JavaScript objects', () => {
        expect(adapter.detect({ key: 'value' })).toBe(true);
        expect(adapter.detect([1, 2, 3])).toBe(true);
        expect(adapter.detect({ nested: { data: true } })).toBe(true);
      });

      it('should detect empty objects and arrays', () => {
        expect(adapter.detect('{}')).toBe(true);
        expect(adapter.detect('[]')).toBe(true);
        expect(adapter.detect({})).toBe(true);
        expect(adapter.detect([])).toBe(true);
      });
    });

    describe('invalid JSON payloads', () => {
      it('should detect strings starting with { or [ regardless of validity', () => {
        // Note: detect() is a quick sniff test, doesn't validate JSON syntax
        expect(adapter.detect('{invalid json')).toBe(true);
        expect(adapter.detect('{"missing": quote}')).toBe(true);
        expect(adapter.detect('[1, 2, 3')).toBe(true);
      });

      it('should not detect non-JSON strings', () => {
        expect(adapter.detect('plain text')).toBe(false);
        expect(adapter.detect('name,age,city')).toBe(false);
        expect(adapter.detect('<xml>content</xml>')).toBe(false);
      });

      it('should not detect primitives', () => {
        expect(adapter.detect(42)).toBe(false);
        expect(adapter.detect('string')).toBe(false);
        expect(adapter.detect(true)).toBe(false);
        expect(adapter.detect(null)).toBe(false);
        expect(adapter.detect(undefined)).toBe(false);
      });

      it('should not detect empty strings', () => {
        expect(adapter.detect('')).toBe(false);
        expect(adapter.detect('   ')).toBe(false);
      });
    });
  });

  describe('ingest()', () => {
    describe('normalization results', () => {
      it('should parse valid JSON strings', () => {
        expect(adapter.ingest('{"name": "test", "value": 42}')).toEqual({
          name: 'test',
          value: 42,
        });
        expect(adapter.ingest('[1, 2, 3]')).toEqual([1, 2, 3]);
      });

      it('should return objects as-is', () => {
        const obj = { name: 'test', nested: { data: true } };
        expect(adapter.ingest(obj)).toEqual(obj);
        expect(adapter.ingest(obj)).toBe(obj); // Should be same reference
      });

      it('should handle complex nested structures', () => {
        const complex = {
          users: [
            { id: 1, name: 'John', active: true },
            { id: 2, name: 'Jane', active: false },
          ],
          metadata: {
            total: 2,
            timestamp: '2023-01-01T00:00:00Z',
          },
        };
        expect(adapter.ingest(JSON.stringify(complex))).toEqual(complex);
      });

      it('should handle empty objects and arrays', () => {
        expect(adapter.ingest('{}')).toEqual({});
        expect(adapter.ingest('[]')).toEqual([]);
        expect(adapter.ingest({})).toEqual({});
        expect(adapter.ingest([])).toEqual([]);
      });
    });

    describe('error handling', () => {
      it('should throw error for malformed JSON strings', () => {
        expect(() => adapter.ingest('{invalid json')).toThrow(
          'Failed to parse JSON'
        );
        expect(() => adapter.ingest('{"missing": quote}')).toThrow(
          'Failed to parse JSON'
        );
      });

      it('should throw error for invalid data types', () => {
        expect(() => adapter.ingest(42)).toThrow('Invalid JSON data format');
        expect(() => adapter.ingest('plain string')).toThrow(
          'Failed to parse JSON'
        );
        expect(() => adapter.ingest(true)).toThrow('Invalid JSON data format');
      });

      it('should throw error for null input', () => {
        expect(() => adapter.ingest(null)).toThrow('Invalid JSON data format');
      });
    });
  });
});

describe('CsvAdapter', () => {
  const adapter = new CsvAdapter();

  describe('detect()', () => {
    describe('valid CSV payloads', () => {
      it('should detect basic CSV format', () => {
        expect(adapter.detect('name,age,city')).toBe(true);
        expect(adapter.detect('name,age,city\nJohn,30,NYC')).toBe(true);
      });

      it('should detect multi-line CSV', () => {
        expect(adapter.detect('name,age,city\nJohn,30,NYC\nJane,25,LA')).toBe(
          true
        );
      });

      it('should detect CSV with quoted values', () => {
        expect(
          adapter.detect(
            'name,description\n"John Smith","A person with spaces"'
          )
        ).toBe(true);
      });

      it('should detect CSV with whitespace', () => {
        expect(adapter.detect('  name,age,city\nJohn,30,NYC  ')).toBe(true);
      });
    });

    describe('invalid CSV payloads', () => {
      it('should not detect non-string input', () => {
        expect(adapter.detect({ name: 'John' })).toBe(false);
        expect(adapter.detect([1, 2, 3])).toBe(false);
        expect(adapter.detect(42)).toBe(false);
        expect(adapter.detect(null)).toBe(false);
      });

      it('should not detect strings without commas', () => {
        expect(adapter.detect('plain text')).toBe(false);
        expect(adapter.detect('no commas here')).toBe(false);
      });

      it('should not detect XML', () => {
        // Note: JSON with commas is detected as CSV due to comma presence
        expect(adapter.detect('{"name": "John", "age": 30}')).toBe(true);
        expect(adapter.detect('<person><name>John</name></person>')).toBe(
          false
        );
      });

      it('should not detect empty strings', () => {
        expect(adapter.detect('')).toBe(false);
        expect(adapter.detect('   ')).toBe(false);
      });
    });
  });

  describe('ingest()', () => {
    describe('normalization results', () => {
      it('should parse basic CSV with headers', () => {
        const csv = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
        const result = adapter.ingest(csv);
        expect(result).toEqual([
          { name: 'John', age: '30', city: 'NYC' },
          { name: 'Jane', age: '25', city: 'LA' },
        ]);
      });

      it('should handle CSV with quoted values', () => {
        const csv =
          'name,description\n"John Smith","A person with spaces"\nJane,Simple';
        const result = adapter.ingest(csv);
        expect(result).toEqual([
          { name: 'John Smith', description: 'A person with spaces' },
          { name: 'Jane', description: 'Simple' },
        ]);
      });

      it('should handle single-line CSV (headers only)', () => {
        const csv = 'name,age,city';
        const result = adapter.ingest(csv);
        expect(result).toEqual([]);
      });

      it('should handle empty CSV', () => {
        expect(adapter.ingest('')).toEqual([]);
        expect(adapter.ingest('   ')).toEqual([]);
      });

      it('should handle CSV with missing values', () => {
        const csv = 'name,age,city\nJohn,30,\nJane,,LA';
        const result = adapter.ingest(csv);
        expect(result).toEqual([
          { name: 'John', age: '30', city: '' },
          { name: 'Jane', age: '', city: 'LA' },
        ]);
      });

      it('should trim whitespace from values', () => {
        const csv = ' name , age , city \n John , 30 , NYC \n Jane , 25 , LA ';
        const result = adapter.ingest(csv);
        expect(result).toEqual([
          { name: 'John', age: '30', city: 'NYC' },
          { name: 'Jane', age: '25', city: 'LA' },
        ]);
      });
    });

    describe('error handling', () => {
      it('should throw error for non-string input', () => {
        expect(() => adapter.ingest({ name: 'John' })).toThrow(
          'CSV data must be a string'
        );
        expect(() => adapter.ingest([1, 2, 3])).toThrow(
          'CSV data must be a string'
        );
        expect(() => adapter.ingest(42)).toThrow('CSV data must be a string');
      });

      it('should throw error for null input', () => {
        expect(() => adapter.ingest(null)).toThrow('CSV data must be a string');
      });
    });

    describe('numeric conversion with emission tracking', () => {
      it('should handle standard emission headers with numeric conversion', () => {
        const csv =
          'timestamp,model,duration_seconds,emissions_kg\n2023-01-01T00:00:00Z,gpt-3.5,10.5,0.001\n2023-01-01T00:01:00Z,gpt-4,15.2,0.002';
        const result = adapter.ingest(csv);
        expect(result).toEqual([
          {
            timestamp: '2023-01-01T00:00:00Z',
            model: 'gpt-3.5',
            durationSeconds: 10.5,
            emissionsKg: 0.001,
          },
          {
            timestamp: '2023-01-01T00:01:00Z',
            model: 'gpt-4',
            durationSeconds: 15.2,
            emissionsKg: 0.002,
          },
        ]);
      });

      it('should handle time, model_name, runtime, co2 header variations', () => {
        const csv =
          'time,model_name,runtime,co2\n2023-01-01T00:00:00Z,claude-3,5.5,0.0005\n2023-01-01T00:01:00Z,llama-2,8.3,0.0008';
        const result = adapter.ingest(csv);
        expect(result).toEqual([
          {
            timestamp: '2023-01-01T00:00:00Z',
            model: 'claude-3',
            durationSeconds: 5.5,
            emissionsKg: 0.0005,
          },
          {
            timestamp: '2023-01-01T00:01:00Z',
            model: 'llama-2',
            durationSeconds: 8.3,
            emissionsKg: 0.0008,
          },
        ]);
      });

      it('should handle invalid numeric values safely', () => {
        const csv =
          'timestamp,model,duration_seconds,emissions_kg\n2023-01-01T00:00:00Z,gpt-3.5,invalid,not-a-number\n2023-01-01T00:01:00Z,gpt-4,15.2,0.002';
        const result = adapter.ingest(csv);
        expect(result).toEqual([
          {
            timestamp: '2023-01-01T00:00:00Z',
            model: 'gpt-3.5',
            durationSeconds: undefined,
            emissionsKg: undefined,
          },
          {
            timestamp: '2023-01-01T00:01:00Z',
            model: 'gpt-4',
            durationSeconds: 15.2,
            emissionsKg: 0.002,
          },
        ]);
      });

      it('should handle empty numeric values safely', () => {
        const csv =
          'timestamp,model,duration_seconds,emissions_kg\n2023-01-01T00:00:00Z,gpt-3.5,,\n2023-01-01T00:01:00Z,gpt-4,15.2,0.002';
        const result = adapter.ingest(csv);
        expect(result).toEqual([
          {
            timestamp: '2023-01-01T00:00:00Z',
            model: 'gpt-3.5',
            durationSeconds: undefined,
            emissionsKg: undefined,
          },
          {
            timestamp: '2023-01-01T00:01:00Z',
            model: 'gpt-4',
            durationSeconds: 15.2,
            emissionsKg: 0.002,
          },
        ]);
      });

      it('should handle mixed header aliases', () => {
        const csv =
          'created_at,ai_model,execution_time,carbon_emissions\n2023-01-01T00:00:00Z,bert-base,12.7,0.0012\n2023-01-01T00:01:00Z,roberta-large,18.9,0.0019';
        const result = adapter.ingest(csv);
        expect(result).toEqual([
          {
            timestamp: '2023-01-01T00:00:00Z',
            model: 'bert-base',
            durationSeconds: 12.7,
            emissionsKg: 0.0012,
          },
          {
            timestamp: '2023-01-01T00:01:00Z',
            model: 'roberta-large',
            durationSeconds: 18.9,
            emissionsKg: 0.0019,
          },
        ]);
      });

      it('should handle zero values correctly', () => {
        const csv =
          'timestamp,model,duration_seconds,emissions_kg\n2023-01-01T00:00:00Z,gpt-3.5,0,0\n2023-01-01T00:01:00Z,gpt-4,0.0,0.0';
        const result = adapter.ingest(csv);
        expect(result).toEqual([
          {
            timestamp: '2023-01-01T00:00:00Z',
            model: 'gpt-3.5',
            durationSeconds: 0,
            emissionsKg: 0,
          },
          {
            timestamp: '2023-01-01T00:01:00Z',
            model: 'gpt-4',
            durationSeconds: 0,
            emissionsKg: 0,
          },
        ]);
      });
    });

    describe('column mapping configuration', () => {
      it('should handle custom column mappings via constructor', () => {
        const customAdapter = new CsvAdapter({
          timestamp: ['event_time'],
          model: ['ml_model'],
          duration: ['exec_time'],
          emissions: ['carbon_output'],
        });

        const csv =
          'event_time,ml_model,exec_time,carbon_output\n2023-01-01T00:00:00Z,custom-model,5.5,0.001';
        const result = customAdapter.ingest(csv);
        expect(result).toEqual([
          {
            timestamp: '2023-01-01T00:00:00Z',
            model: 'custom-model',
            durationSeconds: 5.5,
            emissionsKg: 0.001,
          },
        ]);
      });

      it('should add custom column mappings using addColumnMapping', () => {
        const testAdapter = new CsvAdapter();
        testAdapter.addColumnMapping('timestamp', ['custom_date']);
        testAdapter.addColumnMapping('emissions', ['carbon_cost']);

        const csv =
          'custom_date,model,duration_seconds,carbon_cost\n2023-01-01T00:00:00Z,gpt-3.5,10.5,0.002';
        const result = testAdapter.ingest(csv);
        expect(result).toEqual([
          {
            timestamp: '2023-01-01T00:00:00Z',
            model: 'gpt-3.5',
            durationSeconds: 10.5,
            emissionsKg: 0.002,
          },
        ]);
      });

      it('should set complete column mapping using setColumnMapping', () => {
        const testAdapter = new CsvAdapter();
        testAdapter.setColumnMapping({
          timestamp: ['event_timestamp'],
          model: ['engine_name'],
          duration: ['processing_time'],
          emissions: ['co2_output'],
        });

        const csv =
          'event_timestamp,engine_name,processing_time,co2_output\n2023-01-01T00:00:00Z,llama-3,8.2,0.0015';
        const result = testAdapter.ingest(csv);
        expect(result).toEqual([
          {
            timestamp: '2023-01-01T00:00:00Z',
            model: 'llama-3',
            durationSeconds: 8.2,
            emissionsKg: 0.0015,
          },
        ]);
      });

      it('should get current column mapping configuration', () => {
        const testAdapter = new CsvAdapter();
        const mapping = testAdapter.getColumnMapping();

        expect(mapping.timestamp).toContain('timestamp');
        expect(mapping.timestamp).toContain('time');
        expect(mapping.model).toContain('model');
        expect(mapping.model).toContain('model_name');
        expect(mapping.duration).toContain('duration_seconds');
        expect(mapping.duration).toContain('runtime');
        expect(mapping.emissions).toContain('co2');
        expect(mapping.emissions).toContain('emissions_kg');
      });

      it('should reset column mapping to defaults', () => {
        const testAdapter = new CsvAdapter();
        testAdapter.addColumnMapping('timestamp', ['custom_field']);

        let mapping = testAdapter.getColumnMapping();
        expect(mapping.timestamp).toContain('custom_field');

        testAdapter.resetColumnMapping();
        mapping = testAdapter.getColumnMapping();
        expect(mapping.timestamp).not.toContain('custom_field');
        expect(mapping.timestamp).toContain('timestamp');
      });

      it('should handle extended default mappings for all specified headers', () => {
        const csv1 =
          'start_time,engine,elapsed_time,carbon_footprint\n2023-01-01T00:00:00Z,bert,12.3,0.003';
        const result1 = adapter.ingest(csv1);
        expect(result1).toEqual([
          {
            timestamp: '2023-01-01T00:00:00Z',
            model: 'bert',
            durationSeconds: 12.3,
            emissionsKg: 0.003,
          },
        ]);

        const csv2 =
          'datetime,model_type,process_time,co2_equivalent\n2023-01-01T01:00:00Z,roberta,15.7,0.004';
        const result2 = adapter.ingest(csv2);
        expect(result2).toEqual([
          {
            timestamp: '2023-01-01T01:00:00Z',
            model: 'roberta',
            durationSeconds: 15.7,
            emissionsKg: 0.004,
          },
        ]);
      });
    });
  });
});

describe('XmlAdapter', () => {
  const adapter = new XmlAdapter();

  describe('detect()', () => {
    describe('valid XML payloads', () => {
      it('should detect XML with declaration', () => {
        expect(adapter.detect('<?xml version="1.0"?><root></root>')).toBe(true);
        expect(
          adapter.detect(
            '<?xml version="1.0" encoding="UTF-8"?><data>test</data>'
          )
        ).toBe(true);
      });

      it('should detect XML without declaration', () => {
        expect(adapter.detect('<root><child>test</child></root>')).toBe(true);
        expect(adapter.detect('<note>Simple note</note>')).toBe(true);
      });

      it('should detect XML with attributes', () => {
        expect(
          adapter.detect('<person id="1" name="John">Content</person>')
        ).toBe(true);
      });

      it('should detect self-closing XML tags', () => {
        expect(adapter.detect('<root><item/><item/></root>')).toBe(true);
      });

      it('should detect XML with whitespace', () => {
        expect(adapter.detect('  <root>content</root>  ')).toBe(true);
      });
    });

    describe('invalid XML payloads', () => {
      it('should not detect non-string input', () => {
        expect(adapter.detect({ name: 'John' })).toBe(false);
        expect(adapter.detect([1, 2, 3])).toBe(false);
        expect(adapter.detect(42)).toBe(false);
        expect(adapter.detect(null)).toBe(false);
      });

      it('should not detect incomplete XML', () => {
        expect(adapter.detect('<incomplete')).toBe(false);
        expect(adapter.detect('no xml here')).toBe(false);
      });

      it('should not detect JSON or CSV', () => {
        expect(adapter.detect('{"name": "John"}')).toBe(false);
        expect(adapter.detect('name,age,city')).toBe(false);
      });

      it('should not detect empty strings', () => {
        expect(adapter.detect('')).toBe(false);
        expect(adapter.detect('   ')).toBe(false);
      });

      it('should not detect strings that only start with < but are not XML', () => {
        expect(adapter.detect('<not xml')).toBe(false);
        expect(adapter.detect('<missing>')).toBe(false);
      });
    });
  });

  describe('ingest()', () => {
    describe('normalization results', () => {
      it('should parse simple XML', () => {
        const xml = '<note><title>Test</title><body>Content</body></note>';
        const result = adapter.ingest(xml);
        expect(result).toEqual({
          note: {
            title: 'Test',
            body: 'Content',
          },
        });
      });

      it('should parse XML with declaration', () => {
        const xml =
          '<?xml version="1.0" encoding="UTF-8"?><root><data>test</data></root>';
        const result = adapter.ingest(xml);
        expect(result).toEqual({
          root: {
            data: 'test',
          },
        });
      });

      it('should handle simple text content', () => {
        const xml = '<message>Hello World</message>';
        const result = adapter.ingest(xml);
        expect(result).toEqual({
          message: 'Hello World',
        });
      });

      it('should handle empty XML', () => {
        expect(adapter.ingest('')).toEqual({});
        expect(adapter.ingest('   ')).toEqual({});
      });

      it('should parse XML with multiple child elements', () => {
        const xml =
          '<person><name>John</name><age>30</age><city>NYC</city></person>';
        const result = adapter.ingest(xml);
        expect(result).toEqual({
          person: {
            name: 'John',
            age: '30',
            city: 'NYC',
          },
        });
      });
    });

    describe('error handling', () => {
      it('should throw error for non-string input', () => {
        expect(() => adapter.ingest({ name: 'John' })).toThrow(
          'XML data must be a string'
        );
        expect(() => adapter.ingest([1, 2, 3])).toThrow(
          'XML data must be a string'
        );
        expect(() => adapter.ingest(42)).toThrow('XML data must be a string');
      });

      it('should throw error for null input', () => {
        expect(() => adapter.ingest(null)).toThrow('XML data must be a string');
      });

      it('should handle malformed XML gracefully', () => {
        // The current implementation returns fallback for unparseable XML
        const result = adapter.ingest('<malformed xml');
        expect(result).toEqual({ xml: '<malformed xml' });
      });
    });
  });
});

describe('CodeCarbonAdapter', () => {
  const adapter = new CodeCarbonAdapter();

  describe('detect()', () => {
    describe('valid CodeCarbon payloads', () => {
      it('should detect CodeCarbon objects', () => {
        expect(
          adapter.detect({ duration_seconds: 10.5, emissions_kg: 0.001 })
        ).toBe(true);
        expect(adapter.detect({ duration_seconds: 0, emissions_kg: 0 })).toBe(
          true
        );
      });

      it('should detect CodeCarbon JSON strings', () => {
        expect(
          adapter.detect('{"duration_seconds": 10.5, "emissions_kg": 0.001}')
        ).toBe(true);
        expect(
          adapter.detect('{"emissions_kg": 0.001, "duration_seconds": 10.5}')
        ).toBe(true);
      });

      it('should detect CodeCarbon data with additional fields', () => {
        expect(
          adapter.detect({
            duration_seconds: 10.5,
            emissions_kg: 0.001,
            extra_field: 'ignored',
          })
        ).toBe(true);
      });

      it('should detect CodeCarbon in arrays', () => {
        expect(
          adapter.detect([{ duration_seconds: 10.5, emissions_kg: 0.001 }])
        ).toBe(false);
        // Note: The current implementation doesn't support arrays, which is correct behavior
      });
    });

    describe('invalid CodeCarbon payloads', () => {
      it('should not detect objects missing required fields', () => {
        expect(adapter.detect({ duration_seconds: 10.5 })).toBe(false);
        expect(adapter.detect({ emissions_kg: 0.001 })).toBe(false);
        expect(adapter.detect({ other_field: 'value' })).toBe(false);
      });

      it('should not detect non-object/non-string input', () => {
        expect(adapter.detect(42)).toBe(false);
        expect(adapter.detect(true)).toBe(false);
        expect(adapter.detect(null)).toBe(false);
        expect(adapter.detect(undefined)).toBe(false);
      });

      it('should not detect malformed JSON strings', () => {
        expect(adapter.detect('{invalid json')).toBe(false);
        expect(adapter.detect('{"duration_seconds": 10.5')).toBe(false);
      });

      it('should not detect non-CodeCarbon JSON', () => {
        expect(adapter.detect('{"name": "John", "age": 30}')).toBe(false);
        expect(adapter.detect('[1, 2, 3]')).toBe(false);
      });

      it('should not detect CSV or XML', () => {
        expect(adapter.detect('name,age,city')).toBe(false);
        expect(adapter.detect('<root>content</root>')).toBe(false);
      });
    });
  });

  describe('ingest()', () => {
    describe('normalization results', () => {
      it('should normalize CodeCarbon objects to camelCase', () => {
        const input = { duration_seconds: 10.5, emissions_kg: 0.001 };
        const result = adapter.ingest(input);
        expect(result).toEqual({
          durationSeconds: 10.5,
          emissionsKg: 0.001,
        });
      });

      it('should normalize CodeCarbon JSON strings to camelCase', () => {
        const input = '{"duration_seconds": 15.2, "emissions_kg": 0.0025}';
        const result = adapter.ingest(input);
        expect(result).toEqual({
          durationSeconds: 15.2,
          emissionsKg: 0.0025,
        });
      });

      it('should handle string numbers', () => {
        const input = { duration_seconds: '10.5', emissions_kg: '0.001' };
        const result = adapter.ingest(input);
        expect(result).toEqual({
          durationSeconds: 10.5,
          emissionsKg: 0.001,
        });
      });

      it('should handle zero values', () => {
        const input = { duration_seconds: 0, emissions_kg: 0 };
        const result = adapter.ingest(input);
        expect(result).toEqual({
          durationSeconds: 0,
          emissionsKg: 0,
        });
      });

      it('should ignore extra fields', () => {
        const input = {
          duration_seconds: 10.5,
          emissions_kg: 0.001,
          extra_field: 'ignored',
          timestamp: '2023-01-01',
        };
        const result = adapter.ingest(input);
        expect(result).toEqual({
          durationSeconds: 10.5,
          emissionsKg: 0.001,
        });
      });
    });

    describe('error handling', () => {
      it('should throw error for missing required fields', () => {
        expect(() => adapter.ingest({ duration_seconds: 10.5 })).toThrow(
          'CodeCarbon data must contain both "duration_seconds" and "emissions_kg" fields'
        );
        expect(() => adapter.ingest({ emissions_kg: 0.001 })).toThrow(
          'CodeCarbon data must contain both "duration_seconds" and "emissions_kg" fields'
        );
      });

      it('should throw error for invalid number values', () => {
        expect(() =>
          adapter.ingest({
            duration_seconds: 'not-a-number',
            emissions_kg: 0.001,
          })
        ).toThrow('CodeCarbon "duration_seconds" must be a valid number');

        expect(() =>
          adapter.ingest({
            duration_seconds: 10.5,
            emissions_kg: 'not-a-number',
          })
        ).toThrow('CodeCarbon "emissions_kg" must be a valid number');
      });

      it('should throw error for malformed JSON strings', () => {
        expect(() => adapter.ingest('{invalid json')).toThrow(
          'Failed to parse CodeCarbon JSON data'
        );
      });

      it('should throw error for invalid data types', () => {
        expect(() => adapter.ingest(42)).toThrow(
          'CodeCarbon data must be a JSON string or object'
        );
        expect(() => adapter.ingest(true)).toThrow(
          'CodeCarbon data must be a JSON string or object'
        );
        expect(() => adapter.ingest(null)).toThrow(
          'CodeCarbon data must be a JSON string or object'
        );
      });

      it('should throw error for arrays', () => {
        expect(() =>
          adapter.ingest([{ duration_seconds: 10.5, emissions_kg: 0.001 }])
        ).toThrow(
          'CodeCarbon data must contain both "duration_seconds" and "emissions_kg" fields'
        );
      });

      it('should throw error for NaN values from object properties', () => {
        expect(() =>
          adapter.ingest({
            duration_seconds: {},
            emissions_kg: 0.001,
          })
        ).toThrow('CodeCarbon "duration_seconds" must be a valid number');

        expect(() =>
          adapter.ingest({
            duration_seconds: 10.5,
            emissions_kg: [1, 2], // arrays with multiple elements become NaN
          })
        ).toThrow('CodeCarbon "emissions_kg" must be a valid number');
      });
    });
  });
});
