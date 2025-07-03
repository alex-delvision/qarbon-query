import { describe, it, expect, beforeEach } from 'vitest';
import {
  UniversalTrackerRegistry,
  EmissionAdapter,
} from '../src/UniversalTrackerRegistry.js';

// Mock EmissionAdapter for testing universal tracker integration
class MockEmissionAdapter implements EmissionAdapter {
  private shouldDetect: boolean;
  private ingestResult: unknown;

  constructor(shouldDetect = true, ingestResult: unknown = { mocked: true }) {
    this.shouldDetect = shouldDetect;
    this.ingestResult = ingestResult;
  }

  detect(_raw: unknown): boolean {
    return this.shouldDetect;
  }

  detectConfidence(_input: Buffer | NodeJS.ReadableStream) {
    return {
      adapterName: 'MockAdapter',
      score: this.shouldDetect ? 0.8 : 0.0,
      evidence: this.shouldDetect
        ? 'Mock detection positive'
        : 'Mock detection negative',
    };
  }

  ingest(_raw: unknown): unknown {
    return this.ingestResult;
  }

  setShouldDetect(value: boolean): void {
    this.shouldDetect = value;
  }

  setIngestResult(result: unknown): void {
    this.ingestResult = result;
  }
}

describe('UniversalTrackerRegistry Integration', () => {
  let registry: UniversalTrackerRegistry;
  let mockAdapter: MockEmissionAdapter;

  beforeEach(() => {
    registry = new UniversalTrackerRegistry();
    mockAdapter = new MockEmissionAdapter();
  });

  describe('basic integration', () => {
    it('should integrate with a mock adapter and detect format', () => {
      registry.registerAdapter('mock', mockAdapter);
      mockAdapter.setShouldDetect(true);
      expect(registry.detectFormat('mock-data')).toBe('mock');
    });

    it('should handle multiple adapters with priority', () => {
      const secondAdapter = new MockEmissionAdapter(false, { second: true });

      registry.registerAdapter('first', mockAdapter);
      registry.registerAdapter('second', secondAdapter);

      // First adapter should match
      mockAdapter.setShouldDetect(true);
      expect(registry.detectFormat('test-data')).toBe('first');
    });

    it('should ingest data through the correct adapter', () => {
      const expectedResult = { integrated: true, data: 'processed' };
      mockAdapter.setIngestResult(expectedResult);

      registry.registerAdapter('integration-test', mockAdapter);

      const result = registry.ingest('raw-data');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('error handling integration', () => {
    it('should handle unknown formats gracefully', () => {
      mockAdapter.setShouldDetect(false);
      registry.registerAdapter('test', mockAdapter);

      expect(() => registry.ingest('unknown-format')).toThrow(
        'Unknown emission data format'
      );
    });

    it('should return null for undetected formats', () => {
      mockAdapter.setShouldDetect(false);
      registry.registerAdapter('test', mockAdapter);

      expect(registry.detectFormat('unrecognized-data')).toBeNull();
    });
  });

  describe('confidence-based detection integration', async () => {
    it('should handle buffer-based detection', async () => {
      registry.registerAdapter('buffer-test', mockAdapter);
      mockAdapter.setShouldDetect(true);

      const buffer = Buffer.from('test data');
      const result = await registry.detectFormat(buffer);

      expect(result.bestMatch).toBe('buffer-test');
      expect(result.confidenceScores).toHaveLength(1);
      expect(result.confidenceScores[0].score).toBe(0.8);
    });
  });
});
