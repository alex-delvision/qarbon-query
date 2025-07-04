/**
 * Example usage of uncertainty quantification module
 */

import { monteCarlo, simpleMonteCarloRange } from './monteCarlo';
import { sensitivityAnalysis } from './sensitivityAnalysis';
import { propagateUncertainty } from './uncertaintyPropagation';
import { EmissionsCalculator } from '../calculator';

/**
 * Example 1: Basic Monte Carlo simulation for AI emissions
 */
export function exampleBasicMonteCarlo() {
  console.log('=== Basic Monte Carlo Example ===');
  
  // Define emission function
  const aiEmissionFn = (params: Record<string, number>) => {
    return params.tokens * params.emissionFactor + params.overhead;
  };

  // Define parameter uncertainties
  const uncertainties = {
    tokens: {
      low: 900,
      high: 1100,
      distribution: 'normal' as const,
      params: { mean: 1000, std: 50 }
    },
    emissionFactor: {
      low: 0.001,
      high: 0.003,
      distribution: 'uniform' as const
    },
    overhead: {
      low: 0,
      high: 5,
      distribution: 'triangular' as const,
      params: { mode: 2 }
    }
  };

  // Run Monte Carlo simulation
  const result = monteCarlo(aiEmissionFn, uncertainties, 5000, 0.95);
  
  console.log('Monte Carlo Results:');
  console.log(`  Mean: ${result.mean.toFixed(3)} g CO2e`);
  console.log(`  Std Dev: ${result.std.toFixed(3)} g CO2e`);
  console.log(`  95% CI: [${result.confidenceInterval.low.toFixed(3)}, ${result.confidenceInterval.high.toFixed(3)}] g CO2e`);
  console.log(`  P90: ${result.percentiles.p90.toFixed(3)} g CO2e`);
  console.log('');

  return result;
}

/**
 * Example 2: Sensitivity analysis for AI model parameters
 */
export function exampleSensitivityAnalysis() {
  console.log('=== Sensitivity Analysis Example ===');
  
  const emissionFn = (params: Record<string, number>) => {
    // Complex AI emission model with multiple factors
    const baseEmission = params.tokens * params.emissionFactor;
    const scalingFactor = Math.pow(params.modelSize / 1000, 0.7);
    const efficiencyFactor = 1 / params.efficiency;
    
    return baseEmission * scalingFactor * efficiencyFactor + params.infrastructure;
  };

  const uncertainties = {
    tokens: { low: 500, high: 2000 },
    emissionFactor: { low: 0.0005, high: 0.005 },
    modelSize: { low: 1000, high: 100000 }, // parameters in millions
    efficiency: { low: 0.5, high: 1.5 },
    infrastructure: { low: 0, high: 10 }
  };

  const baseParams = {
    tokens: 1000,
    emissionFactor: 0.002,
    modelSize: 7000,
    efficiency: 1.0,
    infrastructure: 2
  };

  const results = sensitivityAnalysis(emissionFn, uncertainties, baseParams, {
    includeSobol: true,
    sobolSamples: 2000
  });

  console.log('Sensitivity Analysis Results (sorted by importance):');
  results.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.parameter}:`);
    console.log(`     Main Effect: ${(result.mainEffect * 100).toFixed(1)}%`);
    console.log(`     First-order Sobol: ${(result.firstOrderSobol * 100).toFixed(1)}%`);
    console.log(`     Total Sobol: ${(result.totalSobol * 100).toFixed(1)}%`);
    console.log(`     Partial Derivative: ${result.partialDerivative.toFixed(6)}`);
  });
  console.log('');

  return results;
}

/**
 * Example 3: Real-world AI emissions with uncertainty
 */
export function exampleAIEmissionsWithUncertainty() {
  console.log('=== AI Emissions with Uncertainty Example ===');
  
  // Calculate emissions for different models and confidence levels
  const models = ['gpt-3.5', 'gpt-4', 'claude-3', 'gemini-pro'];
  const confidenceLevels = [90, 95, 99] as const;
  
  models.forEach(model => {
    console.log(`\n${model.toUpperCase()} (1000 tokens):`);
    
    confidenceLevels.forEach(level => {
      const calculator = new EmissionsCalculator();
      const result = calculator.calculateAIEmissionsWithUncertainty(1000, model, {
        includeUncertainty: true,
        confidenceLevel: level,
        method: 'montecarlo',
        iterations: 2000
      });
      
      if (result.uncertainty) {
        console.log(`  ${level}% CI: [${result.uncertainty.low.toFixed(2)}, ${result.uncertainty.high.toFixed(2)}] g CO2e (mean: ${result.uncertainty.mean.toFixed(2)})`);
      }
    });
  });
  
  console.log('');
}

/**
 * Example 4: Uncertainty propagation through complex calculations
 */
export function exampleUncertaintyPropagation() {
  console.log('=== Uncertainty Propagation Example ===');
  
  // Complex emission calculation with multiple uncertainty sources
  const complexEmissionFn = (params: Record<string, number>) => {
    const computeEmissions = params.tokens * params.emissionFactor;
    const trainingAmortization = params.trainingCost / params.modelLifetime / params.queriesPerDay;
    const infrastructureOverhead = params.datacenterPUE * params.baseInfrastructure;
    
    return computeEmissions + trainingAmortization + infrastructureOverhead;
  };

  const inputUncertainties = {
    tokens: { 
      low: 900, 
      high: 1100,
      distribution: 'normal' as const,
      params: { mean: 1000, std: 50 }
    },
    emissionFactor: { 
      low: 0.0015, 
      high: 0.0025,
      distribution: 'uniform' as const
    },
    trainingCost: { 
      low: 1000000, 
      high: 5000000,
      distribution: 'lognormal' as const
    },
    modelLifetime: { 
      low: 365, 
      high: 1095 // 1-3 years in days
    },
    queriesPerDay: { 
      low: 1000000, 
      high: 10000000
    },
    datacenterPUE: { 
      low: 1.1, 
      high: 1.5
    },
    baseInfrastructure: { 
      low: 0.1, 
      high: 0.5
    }
  };

  // Compare linear vs Monte Carlo methods
  console.log('Linear Approximation:');
  const linearPropagator = propagateUncertainty(inputUncertainties, {
    method: 'linear',
    confidenceLevel: 0.95
  });
  const linearResult = linearPropagator(complexEmissionFn);
  console.log(`  Mean: ${linearResult.mean.toFixed(3)} g CO2e`);
  console.log(`  95% CI: [${linearResult.low.toFixed(3)}, ${linearResult.high.toFixed(3)}] g CO2e`);
  
  console.log('\nMonte Carlo Method:');
  const mcPropagator = propagateUncertainty(inputUncertainties, {
    method: 'montecarlo',
    confidenceLevel: 0.95,
    iterations: 5000
  });
  const mcResult = mcPropagator(complexEmissionFn);
  console.log(`  Mean: ${mcResult.mean.toFixed(3)} g CO2e`);
  console.log(`  95% CI: [${mcResult.low.toFixed(3)}, ${mcResult.high.toFixed(3)}] g CO2e`);
  console.log(`  Std Dev: ${mcResult.distribution.std.toFixed(3)} g CO2e`);
  
  console.log('');
  
  return { linear: linearResult, monteCarlo: mcResult };
}

/**
 * Example 5: Comparing uncertainty methods
 */
export function exampleCompareUncertaintyMethods() {
  console.log('=== Uncertainty Method Comparison ===');
  
  const emissionFn = (params: Record<string, number>) => {
    return params.base * params.multiplier + params.offset;
  };

  const uncertainties = {
    base: { low: 90, high: 110 },
    multiplier: { low: 0.8, high: 1.2 },
    offset: { low: -5, high: 5 }
  };

  // Test different sample sizes for Monte Carlo
  const sampleSizes = [100, 500, 1000, 5000, 10000];
  
  console.log('Monte Carlo convergence analysis:');
  sampleSizes.forEach(size => {
    const result = simpleMonteCarloRange(emissionFn, uncertainties, size, 0.95);
    const range = result.high - result.low;
    console.log(`  ${size} samples: mean=${result.mean.toFixed(2)}, range=${range.toFixed(2)}`);
  });
  
  console.log('');
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('🔬 Uncertainty Quantification Examples\n');
  
  try {
    exampleBasicMonteCarlo();
    exampleSensitivityAnalysis();
    exampleAIEmissionsWithUncertainty();
    exampleUncertaintyPropagation();
    exampleCompareUncertaintyMethods();
    
    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}
