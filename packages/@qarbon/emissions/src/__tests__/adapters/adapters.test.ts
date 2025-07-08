import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CodeCarbonAdapter } from '../../adapters/CodeCarbonAdapter';
import { CsvAdapter } from '../../adapters/CsvAdapter';
import { JsonAdapter } from '../../adapters/JsonAdapter';
import { adapterRegistry, BaseAdapter } from '../../adapters/index';

// Load fixture data
const fixturesPath = join(__dirname, '__fixtures__');
const codeCarbonSample = JSON.parse(
  readFileSync(join(fixturesPath, 'codecarbon-sample.json'), 'utf-8')
);
const csvSampleContent = readFileSync(
  join(fixturesPath, 'csv-sample.csv'),
  'utf-8'
);
const jsonSample = JSON.parse(
  readFileSync(join(fixturesPath, 'json-sample.json'), 'utf-8')
);

describe('Adapter System', () => {
  beforeEach(() => {
    // Clear registry before each test
    const adapters = adapterRegistry.getAdapters();
    adapters.forEach(adapter => {
      adapterRegistry.unregisterAdapter(adapter.getMetadata().name);
    });
  });

  describe('CodeCarbon Adapter', () => {
    let adapter: CodeCarbonAdapter;

    beforeEach(() => {
      adapter = new CodeCarbonAdapter();
    });

    describe('Validation', () => {
      it('should validate correct CodeCarbon data', () => {
        const result = adapter.validate(codeCarbonSample);
        expect(result.isValid).toBe(true);
        expect(result.errors).toBeUndefined();
      });

      it('should detect missing required fields', () => {
        const invalidData = { ...codeCarbonSample };
        delete invalidData.timestamp;
        delete invalidData.emissions;

        const result = adapter.validate(invalidData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Missing required field: timestamp');
        expect(result.errors).toContain('Invalid or missing emissions field');
      });

      it('should warn about data quality issues', () => {
        const dataWithIssues = {
          ...codeCarbonSample,
          emissions: -0.1,
          duration: -100,
          longitude: 200, // Invalid longitude
        };

        const result = adapter.validate(dataWithIssues);
        expect(result.warnings).toContain('Negative emissions value detected');
        expect(result.warnings).toContain('Negative duration detected');
        expect(result.warnings).toContain(
          'Geographic coordinates appear to be invalid'
        );
      });
    });

    describe('Normalization', () => {
      it('should normalize CodeCarbon data correctly', () => {
        const result = adapter.normalize(codeCarbonSample);

        expect(result.id).toBe('codecarbon_run_2023-07-15_10-30-00');
        expect(result.source).toBe('codecarbon');
        expect(result.category).toBe('compute');

        // Verify emissions data
        expect(result.emissions.total).toBe(0.245);
        expect(result.emissions.unit).toBe('kg');
        expect(result.emissions.rate).toBe(0.000068);
        expect(result.emissions.scope).toBe('scope2');

        // Verify energy breakdown
        expect(result.energy.total).toBe(0.364);
        expect(result.energy.unit).toBe('kWh');
        expect(result.energy.breakdown.cpu).toBe(0.045);
        expect(result.energy.breakdown.gpu).toBe(0.307);
        expect(result.energy.breakdown.ram).toBe(0.012);

        // Verify power breakdown
        expect(result.power.cpu).toBe(12.5);
        expect(result.power.gpu).toBe(85.3);
        expect(result.power.ram).toBe(3.2);

        // Verify execution context
        expect(result.execution.duration).toBe(3600);
        expect(result.execution.project).toBe('ml-training-project');
        expect(result.execution.run_id).toBe('run_2023-07-15_10-30-00');
      });

      it('should throw error for invalid data during normalization', () => {
        const invalidData = { ...codeCarbonSample };
        delete invalidData.timestamp;

        expect(() => adapter.normalize(invalidData)).toThrow(
          'Invalid CodeCarbon data'
        );
      });
    });

    describe('Confidence and Detection', () => {
      it('should return high confidence for CodeCarbon-like data', () => {
        const confidence = adapter.getConfidence(codeCarbonSample);
        expect(confidence).toBeGreaterThan(0.8);
      });

      it('should return low confidence for non-CodeCarbon data', () => {
        const nonCodeCarbonData = { some: 'random', data: 123 };
        const confidence = adapter.getConfidence(nonCodeCarbonData);
        expect(confidence).toBeLessThan(0.3);
      });
    });
  });

  describe('CSV Adapter', () => {
    let adapter: CsvAdapter;

    beforeEach(() => {
      adapter = new CsvAdapter({
        columnMapping: {
          timestamp: 'timestamp',
          emissions: 'co2_kg',
          energy: 'energy_kwh',
          power: 'power_w',
          duration: 'duration_h',
          source: 'source',
          location: 'location',
        },
      });
    });

    describe('Validation', () => {
      it('should validate CSV data with proper structure', () => {
        const csvData = {
          headers: [
            'timestamp',
            'co2_kg',
            'energy_kwh',
            'power_w',
            'duration_h',
            'source',
            'location',
          ],
          rows: csvSampleContent
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.split(',')),
          config: {
            columnMapping: {
              timestamp: 'timestamp',
              emissions: 'co2_kg',
              energy: 'energy_kwh',
            },
          },
        };

        const result = adapter.validate(csvData);
        expect(result.isValid).toBe(true);
      });

      it('should detect missing column mappings', () => {
        const csvData = {
          rows: [['data1', 'data2']],
          config: { columnMapping: {} },
        };

        const result = adapter.validate(csvData);
        expect(result.warnings).toContain(
          'No timestamp column mapping specified'
        );
        expect(result.warnings).toContain(
          'No emissions or energy column mapping specified'
        );
      });
    });

    describe('Normalization', () => {
      it('should normalize CSV data correctly', () => {
        const rows = csvSampleContent
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.split(','));
        const csvData = {
          rows,
          config: {
            hasHeader: true,
            columnMapping: {
              timestamp: 'timestamp',
              emissions: 'co2_kg',
              energy: 'energy_kwh',
              power: 'power_w',
              source: 'source',
              location: 'location',
            },
          },
        };

        const result = adapter.normalize(csvData);

        // Should return aggregated data for multiple rows
        expect(result.summary).toBeDefined();
        expect(result.summary.totalEmissions).toBeCloseTo(0.573, 2); // Sum of all emissions
        expect(result.summary.totalEnergy).toBeCloseTo(1.16, 2); // Sum of all energy
        expect(result.summary.recordCount).toBe(4);

        // Individual records should be included
        expect(result.records).toHaveLength(4);
        expect(result.records[0].emissions.total).toBe(0.125);
        expect(result.records[0].energy.total).toBe(0.25);
      });
    });
  });

  describe('JSON Adapter', () => {
    let adapter: JsonAdapter;

    beforeEach(() => {
      adapter = new JsonAdapter();
    });

    describe('Validation and Normalization', () => {
      it('should validate and normalize JSON data correctly', () => {
        const validation = adapter.validate(jsonSample);
        expect(validation.isValid).toBe(true);

        const result = adapter.normalize(jsonSample);
        expect(result.records).toHaveLength(2);

        const firstRecord = result.records[0];
        expect(firstRecord.emissions.total).toBe(125.5);
        expect(firstRecord.emissions.unit).toBe('g');
        expect(firstRecord.energy.total).toBe(0.25);
        expect(firstRecord.source).toBe('server_monitoring');
      });
    });
  });

  describe('Adapter Registry', () => {
    it('should register and retrieve adapters', () => {
      const adapter = new CodeCarbonAdapter();
      adapterRegistry.registerAdapter(adapter);

      const retrieved = adapterRegistry.getAdapter('CodeCarbonAdapter');
      expect(retrieved).toBe(adapter);

      const all = adapterRegistry.getAdapters();
      expect(all).toContain(adapter);
    });

    it('should unregister adapters', () => {
      const adapter = new CodeCarbonAdapter();
      adapterRegistry.registerAdapter(adapter);

      const unregistered =
        adapterRegistry.unregisterAdapter('CodeCarbonAdapter');
      expect(unregistered).toBe(true);

      const retrieved = adapterRegistry.getAdapter('CodeCarbonAdapter');
      expect(retrieved).toBeUndefined();
    });

    it('should auto-detect best adapter for CodeCarbon data', () => {
      const codeCarbonAdapter = new CodeCarbonAdapter();
      const csvAdapter = new CsvAdapter();

      adapterRegistry.registerAdapter(codeCarbonAdapter);
      adapterRegistry.registerAdapter(csvAdapter);

      const detected = adapterRegistry.autoDetect(codeCarbonSample);
      expect(detected).toBe(codeCarbonAdapter);
    });

    it('should return null when no suitable adapter is found', () => {
      const csvAdapter = new CsvAdapter();
      adapterRegistry.registerAdapter(csvAdapter);

      // Random data that doesn't match any adapter well
      const randomData = { random: 'data', without: 'emissions' };
      const detected = adapterRegistry.autoDetect(randomData);
      expect(detected).toBeNull();
    });
  });

  describe('Cross-Adapter Compatibility', () => {
    it('should produce consistent output format across adapters', () => {
      const codeCarbonAdapter = new CodeCarbonAdapter();
      const csvAdapter = new CsvAdapter({
        columnMapping: {
          timestamp: 'timestamp',
          emissions: 'co2_kg',
          energy: 'energy_kwh',
        },
      });

      const codeCarbonResult = codeCarbonAdapter.normalize(codeCarbonSample);

      const csvData = {
        rows: [
          ['timestamp', 'co2_kg', 'energy_kwh'],
          ['2023-07-15T10:30:00Z', '0.245', '0.364'],
        ],
        config: {
          hasHeader: true,
          columnMapping: {
            timestamp: 'timestamp',
            emissions: 'co2_kg',
            energy: 'energy_kwh',
          },
        },
      };
      const csvResult = csvAdapter.normalize(csvData);

      // Both should have consistent structure
      expect(codeCarbonResult).toHaveProperty('timestamp');
      expect(codeCarbonResult).toHaveProperty('emissions');
      expect(codeCarbonResult).toHaveProperty('energy');

      if (csvResult.records) {
        expect(csvResult.records[0]).toHaveProperty('timestamp');
        expect(csvResult.records[0]).toHaveProperty('emissions');
        expect(csvResult.records[0]).toHaveProperty('energy');
      }
    });
  });
});
