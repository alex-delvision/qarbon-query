/**
 * Unit tests for AIImpactTrackerAdapter
 * Tests the detect() and ingest() methods for accuracy, normalization, emissions calculation, and error handling
 */

import { describe, it, expect } from 'vitest';
import { AIImpactTrackerAdapter } from '../src/adapters/AIImpactTrackerAdapter.js';

describe('AIImpactTrackerAdapter', () => {
  const adapter = new AIImpactTrackerAdapter();

  describe('detect()', () => {
    describe('valid AI Impact Tracker payloads', () => {
      it('should detect AI Impact Tracker objects with all required fields', () => {
        expect(
          adapter.detect({
            model: 'gpt-3.5-turbo',
            tokens: { total: 100, prompt: 50, completion: 50 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          })
        ).toBe(true);
      });

      it('should detect AI Impact Tracker objects with minimal required fields', () => {
        expect(
          adapter.detect({
            model: 'gpt-4',
            tokens: { total: 200 },
            timestamp: 1672531200000,
            energyPerToken: 0.0015,
          })
        ).toBe(true);
      });

      it('should detect AI Impact Tracker objects with emissions field', () => {
        expect(
          adapter.detect({
            model: 'claude-2',
            tokens: { total: 150, prompt: 75, completion: 75 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.002,
            emissions: 0.3,
          })
        ).toBe(true);
      });

      it('should detect AI Impact Tracker JSON strings', () => {
        const jsonString = JSON.stringify({
          model: 'gpt-3.5-turbo',
          tokens: { total: 100, prompt: 50, completion: 50 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
        });
        expect(adapter.detect(jsonString)).toBe(true);
      });

      it('should detect AI Impact Tracker JSON strings with whitespace', () => {
        const jsonString = `  {
          "model": "gpt-4",
          "tokens": { "total": 200 },
          "timestamp": 1672531200000,
          "energyPerToken": 0.0015
        }  `;
        expect(adapter.detect(jsonString)).toBe(true);
      });

      it('should detect AI Impact Tracker data with additional fields', () => {
        expect(
          adapter.detect({
            model: 'gpt-3.5-turbo',
            tokens: { total: 100, prompt: 50, completion: 50 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
            extraField: 'should be ignored',
            metadata: { version: '1.0' },
          })
        ).toBe(true);
      });

      it('should detect AI Impact Tracker with zero values', () => {
        expect(
          adapter.detect({
            model: 'test-model',
            tokens: { total: 0, prompt: 0, completion: 0 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0,
          })
        ).toBe(true);
      });
    });

    describe('invalid AI Impact Tracker payloads', () => {
      it('should not detect objects missing model field', () => {
        expect(
          adapter.detect({
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          })
        ).toBe(false);
      });

      it('should not detect objects missing tokens field', () => {
        expect(
          adapter.detect({
            model: 'gpt-3.5-turbo',
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          })
        ).toBe(false);
      });

      it('should not detect objects missing tokens.total field', () => {
        expect(
          adapter.detect({
            model: 'gpt-3.5-turbo',
            tokens: { prompt: 50, completion: 50 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          })
        ).toBe(false);
      });

      it('should not detect objects missing timestamp field', () => {
        expect(
          adapter.detect({
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            energyPerToken: 0.001,
          })
        ).toBe(false);
      });

      it('should not detect objects missing energyPerToken field', () => {
        expect(
          adapter.detect({
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
          })
        ).toBe(false);
      });

      it('should not detect objects with tokens as non-object', () => {
        expect(
          adapter.detect({
            model: 'gpt-3.5-turbo',
            tokens: 100,
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          })
        ).toBe(false);
      });

      it('should not detect non-object/non-string input', () => {
        expect(adapter.detect(42)).toBe(false);
        expect(adapter.detect(true)).toBe(false);
        expect(adapter.detect(null)).toBe(false);
        expect(adapter.detect(undefined)).toBe(false);
        expect(adapter.detect([1, 2, 3])).toBe(false);
      });

      it('should not detect malformed JSON strings', () => {
        expect(adapter.detect('{invalid json')).toBe(false);
        expect(adapter.detect('{"model": "gpt-3.5-turbo"')).toBe(false);
        expect(adapter.detect('not json at all')).toBe(false);
      });

      it('should not detect non-AI Impact Tracker JSON', () => {
        expect(adapter.detect('{"name": "John", "age": 30}')).toBe(false);
        expect(adapter.detect('[1, 2, 3]')).toBe(false);
        expect(
          adapter.detect('{"duration_seconds": 10.5, "emissions_kg": 0.001}')
        ).toBe(false);
      });

      it('should not detect CSV or XML strings', () => {
        expect(adapter.detect('name,age,city')).toBe(false);
        expect(adapter.detect('<root>content</root>')).toBe(false);
      });

      it('should not detect empty strings', () => {
        expect(adapter.detect('')).toBe(false);
        expect(adapter.detect('   ')).toBe(false);
      });

      it('should not detect strings not starting with { or [', () => {
        expect(adapter.detect('plain text')).toBe(false);
        expect(adapter.detect('model: gpt-3.5-turbo')).toBe(false);
      });
    });
  });

  describe('ingest()', () => {
    describe('normalization results', () => {
      it('should normalize AI Impact Tracker objects with all fields', () => {
        const input = {
          model: '  gpt-3.5-turbo  ',
          tokens: { total: 100, prompt: 50, completion: 50 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
          emissions: 0.15,
        };
        const result = adapter.ingest(input);
        expect(result).toEqual({
          model: 'gpt-3.5-turbo',
          tokens: { total: 100, prompt: 50, completion: 50 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
          emissions: 0.15,
          confidence: { low: 0.12, high: 0.18 }, // ±20% of 0.15
        });
      });

      it('should normalize AI Impact Tracker objects with minimal fields', () => {
        const input = {
          model: 'gpt-4',
          tokens: { total: 200 },
          timestamp: 1672531200000,
          energyPerToken: 0.0015,
        };
        const result = adapter.ingest(input);
        expect(result).toEqual({
          model: 'gpt-4',
          tokens: { total: 200, prompt: 0, completion: 0 },
          timestamp: 1672531200000,
          energyPerToken: 0.0015,
          emissions: 0.3, // 200 * 0.0015
          confidence: { low: 0.24, high: 0.36 }, // ±20% of 0.3
        });
      });

      it('should parse AI Impact Tracker JSON strings', () => {
        const jsonString = JSON.stringify({
          model: 'claude-2',
          tokens: { total: 150, prompt: 75, completion: 75 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.002,
        });
        const result = adapter.ingest(jsonString);
        expect(result).toEqual({
          model: 'claude-2',
          tokens: { total: 150, prompt: 75, completion: 75 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.002,
          emissions: 0.3, // 150 * 0.002
          confidence: { low: 0.24, high: 0.36 }, // ±20% of 0.3
        });
      });

      it('should handle string numbers in input', () => {
        const input = {
          model: 'gpt-3.5-turbo',
          tokens: { total: '100', prompt: '50', completion: '50' },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: '0.001',
          emissions: '0.15',
        };
        const result = adapter.ingest(input);
        expect(result).toEqual({
          model: 'gpt-3.5-turbo',
          tokens: { total: 100, prompt: 50, completion: 50 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
          emissions: 0.15,
          confidence: { low: 0.12, high: 0.18 }, // ±20% of 0.15
        });
      });

      it('should trim whitespace from model field', () => {
        const input = {
          model: '  gpt-4-turbo  ',
          tokens: { total: 300 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.0012,
        };
        const result = adapter.ingest(input);
        expect(result.model).toBe('gpt-4-turbo');
      });

      it('should ignore extra fields', () => {
        const input = {
          model: 'gpt-3.5-turbo',
          tokens: { total: 100, prompt: 50, completion: 50 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
          extraField: 'ignored',
          metadata: { version: '1.0' },
        };
        const result = adapter.ingest(input);
        expect(result).toEqual({
          model: 'gpt-3.5-turbo',
          tokens: { total: 100, prompt: 50, completion: 50 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
          emissions: 0.1, // 100 * 0.001
          confidence: { low: 0.08, high: 0.12 }, // ±20% of 0.1
        });
        expect(result).not.toHaveProperty('extraField');
        expect(result).not.toHaveProperty('metadata');
      });
    });

    describe('emissions calculation', () => {
      it('should compute emissions when not provided', () => {
        const input = {
          model: 'gpt-3.5-turbo',
          tokens: { total: 1000 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
        };
        const result = adapter.ingest(input);
        expect(result.emissions).toBe(1.0); // 1000 * 0.001
      });

      it('should use provided emissions instead of computing', () => {
        const input = {
          model: 'gpt-3.5-turbo',
          tokens: { total: 1000 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
          emissions: 2.5, // Different from computed value
        };
        const result = adapter.ingest(input);
        expect(result.emissions).toBe(2.5); // Uses provided value, not 1.0
      });

      it('should compute emissions with fractional results', () => {
        const input = {
          model: 'gpt-4',
          tokens: { total: 333 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.003,
        };
        const result = adapter.ingest(input);
        expect(result.emissions).toBe(0.999); // 333 * 0.003
      });
    });

    describe('zero and edge cases', () => {
      it('should handle zero token counts', () => {
        const input = {
          model: 'test-model',
          tokens: { total: 0, prompt: 0, completion: 0 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
        };
        const result = adapter.ingest(input);
        expect(result).toEqual({
          model: 'test-model',
          tokens: { total: 0, prompt: 0, completion: 0 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
          emissions: 0, // 0 * 0.001
          confidence: { low: 0, high: 0 }, // ±20% of 0
        });
      });

      it('should handle zero energy per token', () => {
        const input = {
          model: 'test-model',
          tokens: { total: 100 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0,
        };
        const result = adapter.ingest(input);
        expect(result.emissions).toBe(0); // 100 * 0
      });

      it('should handle zero emissions field', () => {
        const input = {
          model: 'test-model',
          tokens: { total: 100 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
          emissions: 0,
        };
        const result = adapter.ingest(input);
        expect(result.emissions).toBe(0);
      });

      it('should handle large numbers', () => {
        const input = {
          model: 'large-model',
          tokens: { total: 1000000 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.000001,
        };
        const result = adapter.ingest(input);
        expect(result.emissions).toBe(1.0); // 1000000 * 0.000001
      });

      it('should default prompt and completion tokens to 0 when not provided', () => {
        const input = {
          model: 'gpt-3.5-turbo',
          tokens: { total: 100 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
        };
        const result = adapter.ingest(input);
        expect(result.tokens.prompt).toBe(0);
        expect(result.tokens.completion).toBe(0);
      });
    });

    describe('error handling', () => {
      describe('missing fields', () => {
        it('should throw error for missing model field', () => {
          const input = {
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker data must contain required fields: model, tokens.total, timestamp, energyPerToken'
          );
        });

        it('should throw error for missing tokens field', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker data must contain required fields: model, tokens.total, timestamp, energyPerToken'
          );
        });

        it('should throw error for missing tokens.total field', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { prompt: 50, completion: 50 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker data must contain required fields: model, tokens.total, timestamp, energyPerToken'
          );
        });

        it('should throw error for missing timestamp field', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker data must contain required fields: model, tokens.total, timestamp, energyPerToken'
          );
        });

        it('should throw error for missing energyPerToken field', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker data must contain required fields: model, tokens.total, timestamp, energyPerToken'
          );
        });
      });

      describe('invalid field types', () => {
        it('should throw error for non-string model', () => {
          const input = {
            model: 123,
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "model" must be a non-empty string'
          );
        });

        it('should throw error for empty model string', () => {
          const input = {
            model: '   ',
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "model" must be a non-empty string'
          );
        });

        it('should throw error for non-object tokens', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: 100,
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker data must contain required fields: model, tokens.total, timestamp, energyPerToken'
          );
        });

        it('should throw error for null tokens', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: null,
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker data must contain required fields: model, tokens.total, timestamp, energyPerToken'
          );
        });

        it('should throw error for invalid timestamp types', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: true,
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "timestamp" must be a string or number'
          );
        });

        it('should throw error for null timestamp', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: null,
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "timestamp" must be a string or number'
          );
        });

        it('should throw error for undefined timestamp', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: undefined,
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "timestamp" must be a string or number'
          );
        });
      });

      describe('non-numeric values', () => {
        it('should throw error for non-numeric tokens.total', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 'not-a-number' },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "tokens.total" must be a valid non-negative number'
          );
        });

        it('should throw error for negative tokens.total', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: -100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "tokens.total" must be a valid non-negative number'
          );
        });

        it('should throw error for non-numeric tokens.prompt', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100, prompt: 'invalid' },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "tokens.prompt" must be a valid non-negative number'
          );
        });

        it('should throw error for negative tokens.prompt', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100, prompt: -50 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "tokens.prompt" must be a valid non-negative number'
          );
        });

        it('should throw error for non-numeric tokens.completion', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100, completion: {} },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "tokens.completion" must be a valid non-negative number'
          );
        });

        it('should throw error for negative tokens.completion', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100, completion: -25 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "tokens.completion" must be a valid non-negative number'
          );
        });

        it('should throw error for non-numeric energyPerToken', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 'not-a-number',
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "energyPerToken" must be a valid non-negative number'
          );
        });

        it('should throw error for negative energyPerToken', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: -0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "energyPerToken" must be a valid non-negative number'
          );
        });

        it('should throw error for non-numeric emissions', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
            emissions: 'invalid',
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "emissions" must be a valid non-negative number'
          );
        });

        it('should throw error for negative emissions', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
            emissions: -0.5,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "emissions" must be a valid non-negative number'
          );
        });

        it('should throw error for NaN from object conversion', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: {} },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "tokens.total" must be a valid non-negative number'
          );
        });

        it('should throw error for NaN from array conversion', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: [1, 2, 3], // Arrays with multiple elements become NaN
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "energyPerToken" must be a valid non-negative number'
          );
        });
      });

      describe('malformed JSON', () => {
        it('should throw error for malformed JSON strings', () => {
          expect(() => adapter.ingest('{invalid json')).toThrow(
            'Failed to parse AI Impact Tracker JSON data'
          );
        });

        it('should throw error for incomplete JSON strings', () => {
          expect(() => adapter.ingest('{"model": "gpt-3.5-turbo"')).toThrow(
            'Failed to parse AI Impact Tracker JSON data'
          );
        });

        it('should throw error for non-JSON strings', () => {
          expect(() => adapter.ingest('not json at all')).toThrow(
            'Failed to parse AI Impact Tracker JSON data'
          );
        });
      });

      describe('wrong types', () => {
        it('should throw error for invalid data types', () => {
          expect(() => adapter.ingest(42)).toThrow(
            'AI Impact Tracker data must be a JSON string or object'
          );
          expect(() => adapter.ingest(true)).toThrow(
            'AI Impact Tracker data must be a JSON string or object'
          );
          expect(() => adapter.ingest(null)).toThrow(
            'AI Impact Tracker data must be a JSON string or object'
          );
          expect(() => adapter.ingest(undefined)).toThrow(
            'AI Impact Tracker data must be a JSON string or object'
          );
        });

        it('should throw error for arrays', () => {
          expect(() =>
            adapter.ingest([
              {
                model: 'gpt-3.5-turbo',
                tokens: { total: 100 },
                timestamp: '2023-01-01T00:00:00Z',
                energyPerToken: 0.001,
              },
            ])
          ).toThrow(
            'AI Impact Tracker data must contain required fields: model, tokens.total, timestamp, energyPerToken'
          );
        });

        it('should throw error for function input', () => {
          expect(() => adapter.ingest(() => {})).toThrow(
            'AI Impact Tracker data must be a JSON string or object'
          );
        });
      });
    });

    describe('confidence metadata', () => {
      it('should set default confidence range when not provided (±20%)', () => {
        const input = {
          model: 'gpt-3.5-turbo',
          tokens: { total: 100 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
        };
        const result = adapter.ingest(input);
        expect(result.confidence).toEqual({
          low: 0.08, // 0.1 - 20%
          high: 0.12, // 0.1 + 20%
        });
      });

      it('should set default confidence range for computed emissions', () => {
        const input = {
          model: 'gpt-4',
          tokens: { total: 500 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.002,
        };
        const result = adapter.ingest(input);
        const expectedEmissions = 1.0; // 500 * 0.002
        expect(result.emissions).toBe(expectedEmissions);
        expect(result.confidence).toEqual({
          low: 0.8, // 1.0 - 20%
          high: 1.2, // 1.0 + 20%
        });
      });

      it('should set default confidence range for provided emissions', () => {
        const input = {
          model: 'claude-2',
          tokens: { total: 200 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
          emissions: 0.5, // Explicit emissions value
        };
        const result = adapter.ingest(input);
        expect(result.emissions).toBe(0.5);
        expect(result.confidence).toEqual({
          low: 0.4, // 0.5 - 20%
          high: 0.6, // 0.5 + 20%
        });
      });

      it('should pass through existing confidence metadata', () => {
        const input = {
          model: 'gpt-3.5-turbo',
          tokens: { total: 100 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
          confidence: { low: 0.05, high: 0.15 },
        };
        const result = adapter.ingest(input);
        expect(result.confidence).toEqual({
          low: 0.05,
          high: 0.15,
        });
      });

      it('should handle string confidence values', () => {
        const input = {
          model: 'gpt-4',
          tokens: { total: 200 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.002,
          confidence: { low: '0.25', high: '0.75' },
        };
        const result = adapter.ingest(input);
        expect(result.confidence).toEqual({
          low: 0.25,
          high: 0.75,
        });
      });

      it('should handle zero emissions with default confidence', () => {
        const input = {
          model: 'test-model',
          tokens: { total: 0 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
        };
        const result = adapter.ingest(input);
        expect(result.emissions).toBe(0);
        expect(result.confidence).toEqual({
          low: 0, // Math.max(0, 0 - 0) = 0
          high: 0, // 0 + 0 = 0
        });
      });

      it('should handle low emissions ensuring confidence.low never goes below 0', () => {
        const input = {
          model: 'efficient-model',
          tokens: { total: 10 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
        };
        const result = adapter.ingest(input);
        expect(result.emissions).toBe(0.01);
        expect(result.confidence).toEqual({
          low: 0, // Math.max(0, 0.01 - 0.002) = 0
          high: 0.012, // 0.01 + 0.002
        });
      });

      describe('confidence validation errors', () => {
        it('should throw error for confidence with non-numeric low value', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
            confidence: { low: 'invalid', high: 0.15 },
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "confidence.low" and "confidence.high" must be valid numbers'
          );
        });

        it('should throw error for confidence with non-numeric high value', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
            confidence: { low: 0.05, high: {} },
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "confidence.low" and "confidence.high" must be valid numbers'
          );
        });

        it('should throw error when confidence.low > confidence.high', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
            confidence: { low: 0.2, high: 0.1 },
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "confidence.low" must be less than or equal to "confidence.high"'
          );
        });

        it('should throw error for confidence missing low property', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
            confidence: { high: 0.15 },
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "confidence" must be an object with "low" and "high" properties'
          );
        });

        it('should throw error for confidence missing high property', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
            confidence: { low: 0.05 },
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "confidence" must be an object with "low" and "high" properties'
          );
        });

        it('should throw error for confidence as non-object', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
            confidence: 'invalid',
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "confidence" must be an object with "low" and "high" properties'
          );
        });

        it('should throw error for null confidence', () => {
          const input = {
            model: 'gpt-3.5-turbo',
            tokens: { total: 100 },
            timestamp: '2023-01-01T00:00:00Z',
            energyPerToken: 0.001,
            confidence: null,
          };
          expect(() => adapter.ingest(input)).toThrow(
            'AI Impact Tracker "confidence" must be an object with "low" and "high" properties'
          );
        });
      });
    });
  });
});
