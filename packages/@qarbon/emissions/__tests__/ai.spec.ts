import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmissionsCalculator } from '../src/calculator';
import { getAIFactor, AI_FACTORS } from '../src/factors';

describe('AI Emissions Calculator', () => {
  let calculator: EmissionsCalculator;

  beforeEach(() => {
    calculator = new EmissionsCalculator();
  });

  describe('GPT-3.5 Emissions', () => {
    it('should calculate ≈2.2g CO2e for 1000 tokens', async () => {
      const result = await calculator.calculateAIEmissions(1000, 'gpt-3.5');
      
      // GPT-3.5 should emit approximately 2.2g CO2e per 1000 tokens
      // Using a tolerance of ±0.1g to account for rounding
      expect(result.amount).toBeCloseTo(2.2, 1);
      expect(result.unit).toBe('g');
      expect(result.category).toBe('ai');
      expect(result.source).toBe('gpt-3.5_inference');
    });

    it('should calculate emissions based on token count', async () => {
      const result500 = await calculator.calculateAIEmissions(500, 'gpt-3.5');
      const result1000 = await calculator.calculateAIEmissions(1000, 'gpt-3.5');
      const result2000 = await calculator.calculateAIEmissions(2000, 'gpt-3.5');

      // Emissions should scale linearly with token count
      expect(result1000.amount).toBeCloseTo(result500.amount * 2, 1);
      expect(result2000.amount).toBeCloseTo(result1000.amount * 2, 1);
    });

    it('should handle zero tokens with fallback to query-based emissions', async () => {
      const result = await calculator.calculateAIEmissions(0, 'gpt-3.5');
      
      // Should use co2PerQuery value (2.2g) when tokens = 0
      expect(result.amount).toBe(2.2);
      expect(result.unit).toBe('g');
    });

    it('should include confidence intervals', async () => {
      const result = await calculator.calculateAIEmissions(1000, 'gpt-3.5');
      
      expect(result.confidence).toBeDefined();
      expect(result.confidence).toEqual({ low: 1.8, high: 2.6 });
    });
  });

  describe('Multiple AI Models', () => {
    it('should calculate different emissions for different models', async () => {
      const gpt35Result = await calculator.calculateAIEmissions(1000, 'gpt-3.5');
      const gpt4Result = await calculator.calculateAIEmissions(1000, 'gpt-4');
      const claudeResult = await calculator.calculateAIEmissions(1000, 'claude-2');

      // GPT-4 should emit more than GPT-3.5
      expect(gpt4Result.amount).toBeGreaterThan(gpt35Result.amount);
      
      // All should be positive values
      expect(gpt35Result.amount).toBeGreaterThan(0);
      expect(gpt4Result.amount).toBeGreaterThan(0);
      expect(claudeResult.amount).toBeGreaterThan(0);
    });

    it('should handle fuzzy model name matching', async () => {
      const direct = await calculator.calculateAIEmissions(1000, 'gpt-3.5');
      const fuzzy1 = await calculator.calculateAIEmissions(1000, 'gpt-3.5-turbo');
      const fuzzy2 = await calculator.calculateAIEmissions(1000, 'gpt-3.5-turbo-16k');

      // Should all resolve to same emissions
      expect(fuzzy1.amount).toBe(direct.amount);
      expect(fuzzy2.amount).toBe(direct.amount);
    });

    it('should throw error for unknown models', async () => {
      await expect(calculator.calculateAIEmissions(1000, 'unknown-model'))
        .rejects.toThrow('Unknown AI model: unknown-model');
    });
  });

  describe('AI Factor Retrieval', () => {
    it('should retrieve correct factor for GPT-3.5', () => {
      const factor = getAIFactor('gpt-3.5');
      
      expect(factor).toBeDefined();
      expect(factor?.co2PerToken).toBe(0.0022);
      expect(factor?.co2PerQuery).toBe(2.2);
      expect(factor?.confidence).toEqual({ low: 1.8, high: 2.6 });
    });

    it('should verify 1000 tokens * factor = 2.2g for GPT-3.5', () => {
      const factor = getAIFactor('gpt-3.5');
      expect(factor).toBeDefined();
      
      if (factor) {
        const calculatedEmissions = 1000 * factor.co2PerToken;
        expect(calculatedEmissions).toBeCloseTo(2.2, 1);
        
        // The actual emissions calculation should prefer co2PerQuery for average usage
        // but for specific token counts, it should use co2PerToken
        expect(1000 * factor.co2PerToken).toBe(2.2);
      }
    });

    it('should handle model name normalization', () => {
      const variations = [
        'gpt-3.5',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo-16k',
        'GPT-3.5',
        'gpt35',
        'gpt-35'
      ];

      variations.forEach(variation => {
        const factor = getAIFactor(variation);
        expect(factor).toBeDefined();
        expect(factor?.co2PerToken).toBe(0.0022);
      });
    });
  });

  describe('Emissions Data Structure', () => {
    it('should return properly structured emission data', async () => {
      const result = await calculator.calculateAIEmissions(1000, 'gpt-3.5');
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('unit');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('confidence');
      
      expect(result.id).toMatch(/^ai_\d+$/);
      expect(result.timestamp).toBeDefined();
      expect(result.source).toBe('gpt-3.5_inference');
      expect(result.unit).toBe('g');
      expect(result.category).toBe('ai');
    });

    it('should round emissions to 2 decimal places', async () => {
      const result = await calculator.calculateAIEmissions(333, 'gpt-3.5');
      
      // 333 * 0.0022 = 0.7326, should round to 0.73
      expect(result.amount).toBe(0.73);
      expect(result.amount.toString()).not.toContain('0.7326');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large token counts', async () => {
      const result = await calculator.calculateAIEmissions(1000000, 'gpt-3.5');
      
      expect(result.amount).toBe(2200); // 1M * 0.0022 = 2200g
      expect(result.unit).toBe('g');
    });

    it('should handle negative token counts gracefully', async () => {
      // Should use fallback to query-based emissions
      const result = await calculator.calculateAIEmissions(-100, 'gpt-3.5');
      
      expect(result.amount).toBe(2.2);
    });

    it('should handle fractional token counts', async () => {
      const result = await calculator.calculateAIEmissions(1000.5, 'gpt-3.5');
      
      expect(result.amount).toBeCloseTo(2.2, 2);
    });
  });

  describe('AI Factor Constants', () => {
    it('should have correct GPT-3.5 factor values', () => {
      const factor = AI_FACTORS['gpt-3.5'];
      
      expect(factor.energyPerToken).toBe(0.0000006);
      expect(factor.co2PerToken).toBe(0.0022);
      expect(factor.co2PerQuery).toBe(2.2);
      expect(factor.confidence).toEqual({ low: 1.8, high: 2.6 });
    });

    it('should validate all AI factors have required properties', () => {
      Object.entries(AI_FACTORS).forEach(([model, factor]) => {
        expect(factor).toHaveProperty('energyPerToken');
        expect(factor).toHaveProperty('co2PerToken');
        expect(factor).toHaveProperty('confidence');
        
        expect(typeof factor.energyPerToken).toBe('number');
        expect(typeof factor.co2PerToken).toBe('number');
        expect(typeof factor.confidence).toBe('object');
        expect(factor.confidence).toHaveProperty('low');
        expect(factor.confidence).toHaveProperty('high');
        
        // Confidence bounds should be reasonable
        expect(factor.confidence.low).toBeGreaterThan(0);
        expect(factor.confidence.high).toBeGreaterThan(factor.confidence.low);
      });
    });
  });
});
