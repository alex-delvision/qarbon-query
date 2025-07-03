/**
 * Sensitivity analysis implementation using partial derivatives and Sobol indices
 */

import { SensitivityResult, ParameterUncertainty, EmissionFunction } from './types';
import { RandomSampler } from './monteCarlo';

/**
 * Calculate partial derivatives using finite differences
 */
function calculatePartialDerivative(
  emissionFn: EmissionFunction,
  params: Record<string, number>,
  paramName: string,
  h: number = 0.01
): number {
  const baseValue = emissionFn(params);
  
  const perturbedParams = { ...params };
  perturbedParams[paramName] += h;
  const perturbedValue = emissionFn(perturbedParams);
  
  return (perturbedValue - baseValue) / h;
}

/**
 * Calculate Sobol indices using the Saltelli method
 */
function calculateSobolIndices(
  emissionFn: EmissionFunction,
  params: ParameterUncertainty,
  paramName: string,
  n: number = 1000
): { firstOrder: number; total: number } {
  const paramNames = Object.keys(params);
  const k = paramNames.length;
  
  // Generate two independent matrices A and B
  const matrixA: number[][] = [];
  const matrixB: number[][] = [];
  
  for (let i = 0; i < n; i++) {
    const rowA: number[] = [];
    const rowB: number[] = [];
    
    for (const name of paramNames) {
      const range = params[name];
      const samplesA = RandomSampler.fromUncertaintyRange(range, 1, i * 1000 + name.length);
      const samplesB = RandomSampler.fromUncertaintyRange(range, 1, i * 2000 + name.length);
      
      rowA.push(samplesA[0]);
      rowB.push(samplesB[0]);
    }
    
    matrixA.push(rowA);
    matrixB.push(rowB);
  }
  
  // Calculate function evaluations
  const yA: number[] = [];
  const yB: number[] = [];
  const yABi: number[] = [];
  const yBAi: number[] = [];
  
  const paramIndex = paramNames.indexOf(paramName);
  
  for (let i = 0; i < n; i++) {
    // Create parameter objects
    const paramsA: Record<string, number> = {};
    const paramsB: Record<string, number> = {};
    const paramsABi: Record<string, number> = {};
    const paramsBAi: Record<string, number> = {};
    
    for (let j = 0; j < k; j++) {
      const name = paramNames[j];
      paramsA[name] = matrixA[i][j];
      paramsB[name] = matrixB[i][j];
      
      // ABi: A with column i from B
      paramsABi[name] = j === paramIndex ? matrixB[i][j] : matrixA[i][j];
      
      // BAi: B with column i from A
      paramsBAi[name] = j === paramIndex ? matrixA[i][j] : matrixB[i][j];
    }
    
    try {
      yA.push(emissionFn(paramsA));
      yB.push(emissionFn(paramsB));
      yABi.push(emissionFn(paramsABi));
      yBAi.push(emissionFn(paramsBAi));
    } catch (error) {
      // Handle invalid evaluations
      yA.push(0);
      yB.push(0);
      yABi.push(0);
      yBAi.push(0);
    }
  }
  
  // Calculate variance estimates
  const yTotal = [...yA, ...yB];
  const meanY = yTotal.reduce((sum, y) => sum + y, 0) / yTotal.length;
  const varY = yTotal.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0) / (yTotal.length - 1);
  
  // First-order Sobol index
  const viEstimate = yA.reduce((sum, yAi, i) => sum + yAi * (yABi[i] - yB[i]), 0) / n;
  const firstOrderSobol = viEstimate / varY;
  
  // Total Sobol index
  const vtiEstimate = yA.reduce((sum, yAi, i) => sum + Math.pow(yAi - yBAi[i], 2), 0) / (2 * n);
  const totalSobol = vtiEstimate / varY;
  
  return {
    firstOrder: Math.max(0, Math.min(1, firstOrderSobol)),
    total: Math.max(0, Math.min(1, totalSobol)),
  };
}

/**
 * Perform sensitivity analysis using partial derivatives and Sobol indices
 * 
 * @param emissionFn - Function that calculates emissions given parameters
 * @param params - Parameter uncertainties
 * @param baseParams - Base parameter values for derivative calculation
 * @param options - Analysis options
 * @returns Sensitivity results for each parameter
 */
export function sensitivityAnalysis(
  emissionFn: EmissionFunction,
  params: ParameterUncertainty,
  baseParams?: Record<string, number>,
  options: {
    includeSobol?: boolean;
    sobolSamples?: number;
    derivativeStep?: number;
  } = {}
): SensitivityResult[] {
  const { includeSobol = true, sobolSamples = 1000, derivativeStep = 0.01 } = options;
  
  const paramNames = Object.keys(params);
  const results: SensitivityResult[] = [];
  
  // Calculate base parameter values if not provided
  const baseParamValues = baseParams || {};
  for (const paramName of paramNames) {
    if (!(paramName in baseParamValues)) {
      const range = params[paramName];
      baseParamValues[paramName] = (range.low + range.high) / 2;
    }
  }
  
  // Calculate base emission for normalization
  const baseEmission = emissionFn(baseParamValues);
  
  for (const paramName of paramNames) {
    const range = params[paramName];
    const paramRange = range.high - range.low;
    
    // Calculate partial derivative
    const partialDerivative = calculatePartialDerivative(
      emissionFn,
      baseParamValues,
      paramName,
      derivativeStep
    );
    
    // Calculate main effect (normalized sensitivity)
    const mainEffect = Math.abs(partialDerivative * paramRange) / Math.abs(baseEmission);
    
    // Calculate Sobol indices if requested
    let firstOrderSobol = 0;
    let totalSobol = 0;
    
    if (includeSobol) {
      try {
        const sobolResult = calculateSobolIndices(emissionFn, params, paramName, sobolSamples);
        firstOrderSobol = sobolResult.firstOrder;
        totalSobol = sobolResult.total;
      } catch (error) {
        console.warn(`Failed to calculate Sobol indices for parameter ${paramName}:`, error);
      }
    }
    
    results.push({
      parameter: paramName,
      mainEffect,
      totalEffect: totalSobol,
      firstOrderSobol,
      totalSobol,
      partialDerivative,
    });
  }
  
  // Sort by importance (total effect or main effect)
  results.sort((a, b) => {
    const aImportance = includeSobol ? a.totalEffect : a.mainEffect;
    const bImportance = includeSobol ? b.totalEffect : b.mainEffect;
    return bImportance - aImportance;
  });
  
  return results;
}

/**
 * Simplified sensitivity analysis using only partial derivatives
 */
export function simpleSensitivityAnalysis(
  emissionFn: EmissionFunction,
  params: ParameterUncertainty,
  baseParams?: Record<string, number>
): SensitivityResult[] {
  return sensitivityAnalysis(emissionFn, params, baseParams, {
    includeSobol: false,
  });
}

/**
 * Calculate local sensitivity coefficients
 */
export function calculateLocalSensitivity(
  emissionFn: EmissionFunction,
  params: Record<string, number>,
  paramName: string,
  relativeChange: number = 0.01
): number {
  const baseValue = emissionFn(params);
  const originalValue = params[paramName];
  const perturbation = originalValue * relativeChange;
  
  const perturbedParams = { ...params };
  perturbedParams[paramName] = originalValue + perturbation;
  
  const perturbedValue = emissionFn(perturbedParams);
  
  // Return relative sensitivity coefficient
  return ((perturbedValue - baseValue) / baseValue) / relativeChange;
}
