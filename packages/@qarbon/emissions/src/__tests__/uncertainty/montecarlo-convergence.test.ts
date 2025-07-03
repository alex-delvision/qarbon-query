import { describe, it, expect, beforeEach } from 'vitest';
import { monteCarlo, simpleMonteCarloRange } from '../../uncertainty/monteCarlo';
import { sensitivityAnalysis } from '../../uncertainty/sensitivityAnalysis';
import { propagateUncertainty } from '../../uncertainty/uncertaintyPropagation';

// Statistical test utilities
function calculateMean(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateStandardDeviation(values: number[]): number {
  const mean = calculateMean(values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculateKolmogorovSmirnovStatistic(sample1: number[], sample2: number[]): number {
  const combined = [...sample1, ...sample2].sort((a, b) => a - b);
  const unique = [...new Set(combined)];
  
  let maxDiff = 0;
  for (const value of unique) {
    const cdf1 = sample1.filter(x => x <= value).length / sample1.length;
    const cdf2 = sample2.filter(x => x <= value).length / sample2.length;
    maxDiff = Math.max(maxDiff, Math.abs(cdf1 - cdf2));
  }
  
  return maxDiff;
}

// Test functions for Monte Carlo
const linearFunction = (params: Record<string, number>) => {
  return params.a * params.x + params.b;
};

const nonlinearFunction = (params: Record<string, number>) => {
  return params.a * Math.pow(params.x, 2) + params.b * Math.sin(params.c * params.x) + params.d;
};

const emissionsFunction = (params: Record<string, number>) => {
  return params.tokens * params.emissionFactor * params.gridIntensity / 1000; // Convert to kg
};

describe('Monte Carlo Convergence Tests', () => {
  describe('Sample Size Convergence', () => {
    it('should converge to theoretical mean with increasing sample size', () => {
      const uncertainties = {
        x: { low: 0, high: 10, distribution: 'uniform' as const }
      };
      
      const theoreticalMean = 5; // Mean of uniform distribution [0,10]
      const sampleSizes = [100, 500, 1000, 5000, 10000];
      const tolerance = [0.5, 0.3, 0.2, 0.15, 0.1]; // Decreasing tolerance
      
      for (let i = 0; i < sampleSizes.length; i++) {
        const result = monteCarlo(
          (params) => params.x,
          uncertainties,
          sampleSizes[i],
          0.95
        );
        
        const error = Math.abs(result.mean - theoreticalMean);
        console.log(`Sample size ${sampleSizes[i]}: mean=${result.mean.toFixed(3)}, error=${error.toFixed(3)}`);
        
        expect(error).toBeLessThan(tolerance[i]);
      }
    });

    it('should converge to theoretical standard deviation with increasing sample size', () => {
      const uncertainties = {
        x: { low: 0, high: 10, distribution: 'uniform' as const }
      };
      
      // Standard deviation of uniform distribution [a,b] = (b-a)/√12
      const theoreticalStd = 10 / Math.sqrt(12); // ≈ 2.887
      const sampleSizes = [1000, 5000, 10000];
      const tolerance = [0.3, 0.2, 0.15];
      
      for (let i = 0; i < sampleSizes.length; i++) {
        const result = monteCarlo(
          (params) => params.x,
          uncertainties,
          sampleSizes[i],
          0.95
        );
        
        const error = Math.abs(result.std - theoreticalStd);
        console.log(`Sample size ${sampleSizes[i]}: std=${result.std.toFixed(3)}, error=${error.toFixed(3)}`);
        
        expect(error).toBeLessThan(tolerance[i]);
      }
    });

    it('should have confidence intervals that stabilize with sample size', () => {
      const uncertainties = {
        x: { low: 0, high: 10, distribution: 'uniform' as const }
      };
      
      const results = [1000, 5000, 10000].map(sampleSize => 
        monteCarlo(
          (params) => params.x,
          uncertainties,
          sampleSize,
          0.95
        )
      );
      
      // Confidence interval width should decrease (or at least not increase significantly)
      for (let i = 1; i < results.length; i++) {
        const prevWidth = results[i-1].confidenceInterval.high - results[i-1].confidenceInterval.low;
        const currWidth = results[i].confidenceInterval.high - results[i].confidenceInterval.low;
        
        console.log(`CI width: ${prevWidth.toFixed(3)} → ${currWidth.toFixed(3)}`);
        
        // Allow some variance but should generally decrease or stay stable
        expect(currWidth / prevWidth).toBeLessThan(1.2);
      }
    });
  });

  describe('Distribution Convergence', () => {
    it('should produce samples that follow the expected distribution', () => {
      const uncertainties = {
        x: { low: 0, high: 10, distribution: 'uniform' as const }
      };
      
      const result = monteCarlo(
        (params) => params.x,
        uncertainties,
        10000,
        0.95
      );
      
      // For uniform distribution, samples should be roughly evenly distributed
      const samples = result.samples;
      const bins = 10;
      const binWidth = 10 / bins;
      const binCounts = new Array(bins).fill(0);
      
      samples.forEach(sample => {
        const binIndex = Math.min(Math.floor(sample / binWidth), bins - 1);
        binCounts[binIndex]++;
      });
      
      // Each bin should have roughly 1000 samples (10000/10)
      const expectedCount = samples.length / bins;
      const tolerance = expectedCount * 0.15; // 15% tolerance
      
      binCounts.forEach((count, i) => {
        console.log(`Bin ${i}: ${count} samples (expected: ${expectedCount})`);
        expect(Math.abs(count - expectedCount)).toBeLessThan(tolerance);
      });
    });

    it('should handle normal distribution correctly', () => {
      const uncertainties = {
        x: { low: 0, high: 10, distribution: 'normal' as const, mean: 5, std: 1 }
      };
      
      const result = monteCarlo(
        (params) => params.x,
        uncertainties,
        10000,
        0.95
      );
      
      // Mean should be close to 5
      expect(Math.abs(result.mean - 5)).toBeLessThan(0.1);
      
      // Standard deviation should be close to 1
      expect(Math.abs(result.std - 1)).toBeLessThan(0.1);
      
      // About 68% of samples should be within 1 std of mean
      const withinOneStd = result.samples.filter(x => Math.abs(x - 5) <= 1).length;
      const percentage = withinOneStd / result.samples.length;
      
      console.log(`Samples within 1 std: ${(percentage * 100).toFixed(1)}%`);
      expect(percentage).toBeGreaterThan(0.65);
      expect(percentage).toBeLessThan(0.72);
    });
  });

  describe('Reproducibility and Stability', () => {
    it('should produce similar results across multiple runs', () => {
      const uncertainties = {
        a: { low: 1, high: 3, distribution: 'uniform' as const },
        x: { low: 0, high: 10, distribution: 'uniform' as const },
        b: { low: -1, high: 1, distribution: 'uniform' as const }
      };
      
      const runs = 5;
      const results = Array.from({ length: runs }, () =>
        monteCarlo(linearFunction, uncertainties, 5000, 0.95)
      );
      
      const means = results.map(r => r.mean);
      const stds = results.map(r => r.std);
      
      const meanOfMeans = calculateMean(means);
      const stdOfMeans = calculateStandardDeviation(means);
      const meanOfStds = calculateMean(stds);
      const stdOfStds = calculateStandardDeviation(stds);
      
      console.log(`Mean stability: ${meanOfMeans.toFixed(3)} ± ${stdOfMeans.toFixed(3)}`);
      console.log(`Std stability: ${meanOfStds.toFixed(3)} ± ${stdOfStds.toFixed(3)}`);
      
      // Results should be stable (low coefficient of variation)
      expect(stdOfMeans / meanOfMeans).toBeLessThan(0.05); // 5% CV for means
      expect(stdOfStds / meanOfStds).toBeLessThan(0.1); // 10% CV for stds
    });

    it('should show convergence for nonlinear functions', () => {
      const uncertainties = {
        a: { low: 0.5, high: 1.5, distribution: 'uniform' as const },
        x: { low: 0, high: 2 * Math.PI, distribution: 'uniform' as const },
        b: { low: 0.8, high: 1.2, distribution: 'uniform' as const },
        c: { low: 0.9, high: 1.1, distribution: 'uniform' as const },
        d: { low: -0.5, high: 0.5, distribution: 'uniform' as const }
      };
      
      const sampleSizes = [1000, 5000, 10000];
      const results = sampleSizes.map(size =>
        monteCarlo(nonlinearFunction, uncertainties, size, 0.95)
      );
      
      // Check that results are converging
      for (let i = 1; i < results.length; i++) {
        const prevResult = results[i-1];
        const currResult = results[i];
        
        // Mean should not change dramatically
        const meanChange = Math.abs(currResult.mean - prevResult.mean) / Math.abs(prevResult.mean);
        console.log(`Mean change (${sampleSizes[i-1]} → ${sampleSizes[i]}): ${(meanChange * 100).toFixed(2)}%`);
        
        expect(meanChange).toBeLessThan(0.1); // Less than 10% change
      }
    });
  });

  describe('Emissions-Specific Convergence', () => {
    it('should converge for realistic emissions calculations', () => {
      const uncertainties = {
        tokens: { low: 900, high: 1100, distribution: 'normal' as const, mean: 1000, std: 50 },
        emissionFactor: { low: 0.002, high: 0.0024, distribution: 'uniform' as const },
        gridIntensity: { low: 400, high: 500, distribution: 'normal' as const, mean: 450, std: 25 }
      };
      
      const sampleSizes = [1000, 5000, 10000];
      const results = sampleSizes.map(size =>
        monteCarlo(emissionsFunction, uncertainties, size, 0.95)
      );
      
      // Theoretical mean calculation
      const expectedEmissions = 1000 * 0.0022 * 450 / 1000; // ≈ 0.99 kg
      
      results.forEach((result, i) => {
        const error = Math.abs(result.mean - expectedEmissions);
        console.log(`Sample size ${sampleSizes[i]}: emissions=${result.mean.toFixed(4)} kg, error=${error.toFixed(4)}`);
        
        // Error should decrease with sample size
        const tolerance = [0.1, 0.05, 0.03][i];
        expect(error).toBeLessThan(tolerance);
      });
    });

    it('should handle multiple emission factors with convergence', () => {
      const models = ['gpt-3.5', 'gpt-4', 'claude-2'];
      const factors = [0.0022, 0.0085, 0.0030];
      
      models.forEach((model, index) => {
        const uncertainties = {
          tokens: { low: 800, high: 1200, distribution: 'uniform' as const },
          emissionFactor: { 
            low: factors[index] * 0.9, 
            high: factors[index] * 1.1, 
            distribution: 'uniform' as const 
          },
          gridIntensity: { low: 400, high: 600, distribution: 'uniform' as const }
        };
        
        const result = monteCarlo(emissionsFunction, uncertainties, 10000, 0.95);
        
        // Check that confidence intervals make sense
        const intervalWidth = result.confidenceInterval.high - result.confidenceInterval.low;
        const relativeWidth = intervalWidth / result.mean;
        
        console.log(`${model}: CI width = ${(relativeWidth * 100).toFixed(1)}% of mean`);
        
        // Relative uncertainty should be reasonable (10-50%)
        expect(relativeWidth).toBeGreaterThan(0.1);
        expect(relativeWidth).toBeLessThan(0.5);
        
        // Mean should be positive
        expect(result.mean).toBeGreaterThan(0);
      });
    });
  });

  describe('Statistical Validation', () => {
    it('should pass Kolmogorov-Smirnov test for distribution consistency', () => {
      const uncertainties = {
        x: { low: 0, high: 10, distribution: 'uniform' as const }
      };
      
      // Generate two independent samples
      const sample1 = monteCarlo(
        (params) => params.x,
        uncertainties,
        5000,
        0.95
      ).samples;
      
      const sample2 = monteCarlo(
        (params) => params.x,
        uncertainties,
        5000,
        0.95
      ).samples;
      
      // Calculate KS statistic
      const ksStatistic = calculateKolmogorovSmirnovStatistic(sample1, sample2);
      
      // Critical value for α = 0.05 and n1 = n2 = 5000
      const criticalValue = 1.36 * Math.sqrt(2 / 5000); // ≈ 0.027
      
      console.log(`KS statistic: ${ksStatistic.toFixed(4)}, critical value: ${criticalValue.toFixed(4)}`);
      
      // Should not reject null hypothesis (samples from same distribution)
      expect(ksStatistic).toBeLessThan(criticalValue);
    });

    it('should maintain proper confidence interval coverage', () => {
      const uncertainties = {
        x: { low: 0, high: 10, distribution: 'uniform' as const }
      };
      
      const trueValue = 5; // True mean of uniform [0,10]
      const numTrials = 100;
      const confidenceLevel = 0.95;
      let coverageCount = 0;
      
      for (let i = 0; i < numTrials; i++) {
        const result = monteCarlo(
          (params) => params.x,
          uncertainties,
          1000,
          confidenceLevel
        );
        
        if (trueValue >= result.confidenceInterval.low && 
            trueValue <= result.confidenceInterval.high) {
          coverageCount++;
        }
      }
      
      const coverage = coverageCount / numTrials;
      console.log(`CI coverage: ${(coverage * 100).toFixed(1)}% (expected: ${(confidenceLevel * 100)}%)`);
      
      // Coverage should be close to nominal level (within 5%)
      expect(Math.abs(coverage - confidenceLevel)).toBeLessThan(0.05);
    });
  });

  describe('Convergence Diagnostics', () => {
    it('should show decreasing variance of sample mean with sample size', () => {
      const uncertainties = {
        x: { low: 0, high: 10, distribution: 'uniform' as const }
      };
      
      const sampleSizes = [500, 1000, 2000, 5000];
      const meanVariances: number[] = [];
      
      // For each sample size, run multiple trials and calculate variance of means
      sampleSizes.forEach(size => {
        const means = Array.from({ length: 50 }, () => {
          return monteCarlo(
            (params) => params.x,
            uncertainties,
            size,
            0.95
          ).mean;
        });
        
        const variance = calculateStandardDeviation(means) ** 2;
        meanVariances.push(variance);
        
        console.log(`Sample size ${size}: variance of means = ${variance.toFixed(6)}`);
      });
      
      // Variance should decrease approximately as 1/n
      for (let i = 1; i < meanVariances.length; i++) {
        const ratio = meanVariances[i] / meanVariances[i-1];
        const expectedRatio = sampleSizes[i-1] / sampleSizes[i];
        
        console.log(`Variance ratio: ${ratio.toFixed(3)}, expected: ${expectedRatio.toFixed(3)}`);
        
        // Should be reasonably close to theoretical relationship
        expect(Math.abs(ratio - expectedRatio) / expectedRatio).toBeLessThan(0.3);
      }
    });

    it('should demonstrate Central Limit Theorem convergence', () => {
      // Even for non-normal inputs, sample means should approach normality
      const uncertainties = {
        x: { low: 0, high: 1, distribution: 'uniform' as const } // Non-normal distribution
      };
      
      const numTrials = 1000;
      const sampleSize = 100;
      
      // Collect sample means
      const sampleMeans = Array.from({ length: numTrials }, () => {
        return monteCarlo(
          (params) => params.x,
          uncertainties,
          sampleSize,
          0.95
        ).mean;
      });
      
      // Test for approximate normality using moments
      const mean = calculateMean(sampleMeans);
      const std = calculateStandardDeviation(sampleMeans);
      
      // Calculate skewness and kurtosis
      const skewness = sampleMeans.reduce((sum, x) => 
        sum + Math.pow((x - mean) / std, 3), 0) / numTrials;
      const kurtosis = sampleMeans.reduce((sum, x) => 
        sum + Math.pow((x - mean) / std, 4), 0) / numTrials;
      
      console.log(`Sample means - Skewness: ${skewness.toFixed(3)}, Kurtosis: ${kurtosis.toFixed(3)}`);
      
      // For normal distribution: skewness ≈ 0, kurtosis ≈ 3
      expect(Math.abs(skewness)).toBeLessThan(0.3); // Should be approximately symmetric
      expect(Math.abs(kurtosis - 3)).toBeLessThan(1); // Should have normal tail behavior
    });
  });
});
