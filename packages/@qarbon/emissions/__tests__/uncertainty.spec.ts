import { describe, it, expect } from 'vitest';
import { monteCarlo, simpleMonteCarloRange } from '../src/uncertainty/monteCarlo';
import { sensitivityAnalysis } from '../src/uncertainty/sensitivityAnalysis';
import { propagateUncertainty, adjustConfidenceInterval } from '../src/uncertainty/uncertaintyPropagation';
import { calculateAIEmissionsWithUncertainty } from '../src/compatibility';

describe('Uncertainty Quantification', () => {
  describe('Monte Carlo Simulation', () => {
    it('should run Monte Carlo simulation with uniform distribution', () => {
      const emissionFn = (params: Record<string, number>) => {
        return params.emissionFactor * 100; // Base emission of 100g
      };

      const uncertainties = {
        emissionFactor: {
          low: 0.8,
          high: 1.2,
          distribution: 'uniform' as const
        }
      };

      const result = monteCarlo(emissionFn, uncertainties, 1000, 0.95);

      expect(result.mean).toBeCloseTo(100, -1); // Allow ±5 variance
      expect(result.std).toBeGreaterThan(0);
      expect(result.confidenceInterval.low).toBeLessThan(result.mean);
      expect(result.confidenceInterval.high).toBeGreaterThan(result.mean);
      expect(result.samples).toHaveLength(1000);
    });

    it('should run simple Monte Carlo range calculation', () => {
      const emissionFn = (params: Record<string, number>) => {
        return params.factor1 * params.factor2 * 50;
      };

      const uncertainties = {
        factor1: { low: 0.9, high: 1.1 },
        factor2: { low: 0.8, high: 1.2 }
      };

      const result = simpleMonteCarloRange(emissionFn, uncertainties, 500, 0.95);

      expect(result.mean).toBeCloseTo(50, -1); // Allow ±5 variance
      expect(result.low).toBeLessThan(result.mean);
      expect(result.high).toBeGreaterThan(result.mean);
    });
  });

  describe('Sensitivity Analysis', () => {
    it('should calculate sensitivity using partial derivatives', () => {
      const emissionFn = (params: Record<string, number>) => {
        return params.tokens * params.emissionFactor + params.overhead;
      };

      const uncertainties = {
        tokens: { low: 900, high: 1100 },
        emissionFactor: { low: 0.001, high: 0.003 },
        overhead: { low: 0, high: 10 }
      };

      const baseParams = {
        tokens: 1000,
        emissionFactor: 0.002,
        overhead: 5
      };

      const results = sensitivityAnalysis(emissionFn, uncertainties, baseParams, {
        includeSobol: false
      });

      expect(results).toHaveLength(3);
      expect(results[0].parameter).toBeDefined();
      expect(results[0].mainEffect).toBeGreaterThanOrEqual(0);
      expect(results[0].partialDerivative).toBeDefined();
    });
  });

  describe('Uncertainty Propagation', () => {
    it('should adjust confidence intervals between levels', () => {
      const result = adjustConfidenceInterval(1.8, 2.6, 0.95, 0.90);

      expect(result.low).toBeGreaterThan(1.8);
      expect(result.high).toBeLessThan(2.6);
      expect(result.high - result.low).toBeLessThan(2.6 - 1.8);
    });

    it('should propagate uncertainty using linear method', () => {
      const emissionFn = (params: Record<string, number>) => {
        return params.a * params.b + params.c;
      };

      const uncertainties = {
        a: { low: 0.9, high: 1.1 },
        b: { low: 0.8, high: 1.2 },
        c: { low: -1, high: 1 }
      };

      const propagator = propagateUncertainty(uncertainties, {
        method: 'linear',
        confidenceLevel: 0.95
      });

      const result = propagator(emissionFn);

      expect(result.mean).toBeDefined();
      expect(result.low).toBeLessThan(result.mean);
      expect(result.high).toBeGreaterThan(result.mean);
      expect(result.confidenceLevel).toBe(0.95);
    });
  });

  describe('AI Emissions with Uncertainty', () => {
    it('should calculate AI emissions without uncertainty', () => {
      const result = calculateAIEmissionsWithUncertainty(1000, 'gpt-3.5', {
        includeUncertainty: false
      });

      expect(result.amount).toBeGreaterThan(0);
      expect(result.uncertainty).toBeUndefined();
      expect(result.category).toBe('ai');
    });

    it('should calculate AI emissions with uncertainty using linear method', () => {
      const result = calculateAIEmissionsWithUncertainty(1000, 'gpt-3.5', {
        includeUncertainty: true,
        confidenceLevel: 95,
        method: 'linear'
      });

      expect(result.amount).toBeGreaterThan(0);
      expect(result.uncertainty).toBeDefined();
      expect(result.uncertainty!.mean).toBeCloseTo(result.amount, 1);
      expect(result.uncertainty!.low).toBeLessThan(result.uncertainty!.mean);
      expect(result.uncertainty!.high).toBeGreaterThan(result.uncertainty!.mean);
      expect(result.uncertainty!.confidenceLevel).toBe(95);
    });

    it('should calculate AI emissions with uncertainty using Monte Carlo', () => {
      const result = calculateAIEmissionsWithUncertainty(1000, 'gpt-4', {
        includeUncertainty: true,
        confidenceLevel: 90,
        method: 'montecarlo',
        iterations: 500
      });

      expect(result.amount).toBeGreaterThan(0);
      expect(result.uncertainty).toBeDefined();
      expect(result.uncertainty!.mean).toBeCloseTo(result.amount, 0);
      // Allow for some variance in Monte Carlo results
      expect(result.uncertainty!.low).toBeLessThanOrEqual(result.uncertainty!.high);
      expect(result.uncertainty!.high - result.uncertainty!.low).toBeGreaterThan(0);
      expect(result.uncertainty!.confidenceLevel).toBe(90);
    });

    it('should handle different confidence levels', () => {
      const result90 = calculateAIEmissionsWithUncertainty(1000, 'gpt-3.5', {
        includeUncertainty: true,
        confidenceLevel: 90,
        method: 'linear'
      });

      const result99 = calculateAIEmissionsWithUncertainty(1000, 'gpt-3.5', {
        includeUncertainty: true,
        confidenceLevel: 99,
        method: 'linear'
      });

      // 99% CI should be wider than 90% CI
      const range90 = result90.uncertainty!.high - result90.uncertainty!.low;
      const range99 = result99.uncertainty!.high - result99.uncertainty!.low;
      
      expect(range99).toBeGreaterThan(range90);
    });

    it('should work with models that have confidence intervals in factors', () => {
      const result = calculateAIEmissionsWithUncertainty(1000, 'gpt-3.5', {
        includeUncertainty: true,
        confidenceLevel: 95,
        method: 'linear'
      });

      expect(result.confidence).toBeDefined();
      expect(result.uncertainty).toBeDefined();
      // Should use the confidence intervals from the AI factor
      expect(result.uncertainty!.low).toBeGreaterThan(0);
      expect(result.uncertainty!.high).toBeGreaterThan(result.uncertainty!.low);
    });
  });
});
