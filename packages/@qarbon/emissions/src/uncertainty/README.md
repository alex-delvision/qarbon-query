# Uncertainty Quantification Module

This module provides comprehensive uncertainty quantification capabilities for AI emissions calculations, including Monte Carlo simulation, sensitivity analysis, and uncertainty propagation.

## Features

### 🎲 Monte Carlo Simulation
- Support for multiple probability distributions (uniform, normal, lognormal, triangular)
- Configurable sample sizes and confidence intervals
- Full distribution statistics including percentiles and confidence intervals

### 📊 Sensitivity Analysis
- Partial derivative-based sensitivity coefficients
- Sobol indices for global sensitivity analysis
- Parameter importance ranking

### 🔄 Uncertainty Propagation
- Linear approximation methods for fast calculations
- Monte Carlo-based propagation for complex models
- Confidence interval conversion between different levels

## Quick Start

### Basic Monte Carlo Simulation

```typescript
import { monteCarlo } from '@qarbon/emissions/uncertainty';

const emissionFn = (params: Record<string, number>) => {
  return params.tokens * params.emissionFactor;
};

const uncertainties = {
  tokens: { low: 900, high: 1100 },
  emissionFactor: { low: 0.001, high: 0.003 }
};

const result = monteCarlo(emissionFn, uncertainties, 10000, 0.95);
console.log(`Mean: ${result.mean} ± ${result.std}`);
console.log(`95% CI: [${result.confidenceInterval.low}, ${result.confidenceInterval.high}]`);
```

### AI Emissions with Uncertainty

```typescript
import { calculateAIEmissionsWithUncertainty } from '@qarbon/emissions';

const result = calculateAIEmissionsWithUncertainty(1000, 'gpt-4', {
  includeUncertainty: true,
  confidenceLevel: 95,
  method: 'montecarlo',
  iterations: 5000
});

console.log(`Base emission: ${result.amount} g CO2e`);
if (result.uncertainty) {
  console.log(`95% CI: [${result.uncertainty.low}, ${result.uncertainty.high}] g CO2e`);
}
```

### Sensitivity Analysis

```typescript
import { sensitivityAnalysis } from '@qarbon/emissions/uncertainty';

const emissionFn = (params: Record<string, number>) => {
  return params.tokens * params.emissionFactor + params.overhead;
};

const uncertainties = {
  tokens: { low: 900, high: 1100 },
  emissionFactor: { low: 0.001, high: 0.003 },
  overhead: { low: 0, high: 10 }
};

const results = sensitivityAnalysis(emissionFn, uncertainties);
results.forEach(result => {
  console.log(`${result.parameter}: ${(result.mainEffect * 100).toFixed(1)}% influence`);
});
```

## API Reference

### `monteCarlo(emissionFn, params, iterations, ciLevel)`

Performs Monte Carlo simulation for uncertainty quantification.

**Parameters:**
- `emissionFn`: Function that calculates emissions given parameters
- `params`: Parameter uncertainties with ranges and distributions
- `iterations`: Number of Monte Carlo iterations (default: 10000)
- `ciLevel`: Confidence interval level (0.90, 0.95, 0.99, default: 0.95)

**Returns:** `DistributionStats` with mean, std, percentiles, and confidence intervals

### `sensitivityAnalysis(emissionFn, params, baseParams?, options?)`

Performs sensitivity analysis using partial derivatives and Sobol indices.

**Parameters:**
- `emissionFn`: Function that calculates emissions given parameters
- `params`: Parameter uncertainties
- `baseParams`: Base parameter values for derivative calculation (optional)
- `options`: Analysis options including Sobol analysis settings

**Returns:** Array of `SensitivityResult` sorted by importance

### `propagateUncertainty(inputUncertainties, options?)`

Creates an uncertainty propagation function for complex calculations.

**Parameters:**
- `inputUncertainties`: Parameter uncertainties
- `options`: Method settings (linear vs montecarlo, confidence level, iterations)

**Returns:** Function that takes an emission function and returns uncertainty results

### `calculateAIEmissionsWithUncertainty(tokens, model, options?)`

Enhanced AI emissions calculation with optional uncertainty quantification.

**Parameters:**
- `tokens`: Number of tokens processed
- `model`: AI model name
- `options`: Uncertainty options including method and confidence level

**Returns:** Emission data with optional uncertainty bounds

## Probability Distributions

The module supports several probability distributions for parameter uncertainties:

### Uniform Distribution
```typescript
{
  low: 0.8,
  high: 1.2,
  distribution: 'uniform'
}
```

### Normal Distribution
```typescript
{
  low: 0.8,
  high: 1.2,
  distribution: 'normal',
  params: { mean: 1.0, std: 0.1 }
}
```

### Lognormal Distribution
```typescript
{
  low: 0.8,
  high: 1.2,
  distribution: 'lognormal',
  params: { mean: 0, std: 0.1 }
}
```

### Triangular Distribution
```typescript
{
  low: 0.8,
  high: 1.2,
  distribution: 'triangular',
  params: { mode: 1.0 }
}
```

## Confidence Levels

The module supports standard confidence levels:
- **90%**: Z-score = 1.645
- **95%**: Z-score = 1.96 (default)
- **99%**: Z-score = 2.576

Confidence intervals can be converted between different levels using the `adjustConfidenceInterval` function.

## Methods Comparison

### Linear Approximation
- **Pros**: Fast, deterministic, good for small uncertainties
- **Cons**: Less accurate for large uncertainties or non-linear models
- **Use case**: Quick estimates, linear models

### Monte Carlo Simulation  
- **Pros**: Accurate for any model complexity, handles non-linear relationships
- **Cons**: Slower, requires more computation
- **Use case**: Complex models, high accuracy requirements

## Best Practices

1. **Sample Size**: Use at least 1000 iterations for Monte Carlo, 5000+ for production
2. **Convergence**: Check that results stabilize with increasing sample size
3. **Distribution Choice**: Use appropriate distributions based on parameter nature
4. **Sensitivity Analysis**: Run sensitivity analysis to identify most important parameters
5. **Validation**: Compare linear and Monte Carlo methods for verification

## Integration with AI Emissions Calculator

The uncertainty module is fully integrated with the AI emissions calculator. Simply use `calculateAIEmissionsWithUncertainty` instead of the standard `calculateAIEmissions` function to get uncertainty bounds.

```typescript
// Standard calculation
const basic = calculateAIEmissions(1000, 'gpt-4');

// With uncertainty quantification
const withUncertainty = calculateAIEmissionsWithUncertainty(1000, 'gpt-4', {
  includeUncertainty: true,
  confidenceLevel: 95
});
```

The module automatically uses confidence intervals from emission factors when available, or applies typical model uncertainties (±25%) when not specified.

## Examples

See `example.ts` for comprehensive usage examples including:
- Basic Monte Carlo simulation
- Sensitivity analysis for complex models
- Real-world AI emissions with uncertainty
- Uncertainty propagation through complex calculations
- Method comparison and convergence analysis
