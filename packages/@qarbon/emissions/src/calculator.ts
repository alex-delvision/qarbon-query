// Local type definitions to avoid dependency issues in tests
interface EmissionData {
  id: string;
  timestamp: string;
  source: string;
  amount: number;
  unit: 'kg' | 'g' | 'tonnes';
  category: 'transport' | 'energy' | 'digital' | 'ai' | 'other';
  confidence?: { low: number; high: number };
}

interface EmissionResult {
  emissions: EmissionData[];
  footprint: any;
  metadata: {
    calculatedAt: string;
    methodology: string;
    confidence: number;
  };
}

// Import generateFootprint from shared package, will be mocked in tests
let generateFootprint: any;
try {
  const shared = require('@qarbon/shared');
  generateFootprint = shared.generateFootprint;
} catch {
  // Fallback for tests
  generateFootprint = () => ({ total: 0, breakdown: {}, period: 'monthly' });
}
import { getEmissionFactor, getAIFactor } from './factors';

/**
 * Main emissions calculator class
 */
export class EmissionsCalculator {
  /**
   * Calculate emissions for digital activities
   */
  calculateDigitalEmissions(
    dataTransfer: number, // in MB
    timeSpent: number, // in minutes
    deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop'
  ): EmissionData {
    const factor = getEmissionFactor('digital', deviceType);
    const amount =
      dataTransfer * factor.dataFactor + timeSpent * factor.timeFactor;

    return {
      id: `digital_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: `${deviceType}_usage`,
      amount: Math.round(amount * 100) / 100,
      unit: 'g',
      category: 'digital',
    };
  }

  /**
   * Calculate transport emissions
   */
  calculateTransportEmissions(
    distance: number, // in km
    mode: 'car' | 'train' | 'plane' | 'bus' = 'car'
  ): EmissionData {
    const factor = getEmissionFactor('transport', mode);
    const amount = distance * factor.perKm;

    return {
      id: `transport_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: `${mode}_travel`,
      amount: Math.round(amount * 100) / 100,
      unit: 'kg',
      category: 'transport',
    };
  }

  /**
   * Calculate energy emissions
   */
  calculateEnergyEmissions(
    consumption: number, // in kWh
    source: 'grid' | 'renewable' | 'fossil' = 'grid'
  ): EmissionData {
    const factor = getEmissionFactor('energy', source);
    const amount = consumption * factor.perKwh;

    return {
      id: `energy_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: `${source}_energy`,
      amount: Math.round(amount * 100) / 100,
      unit: 'kg',
      category: 'energy',
    };
  }

  /**
   * Calculate AI emissions
   */
  calculateAIEmissions(
    tokens: number,
    model: string
  ): EmissionData {
    const factor = getAIFactor(model);
    if (!factor) {
      throw new Error(`Unknown AI model: ${model}`);
    }

    // Compute amount: tokens * factor.co2PerToken (fallback to factor.co2PerQuery if tokens==0)
    const amount = tokens > 0 
      ? tokens * factor.co2PerToken
      : factor.co2PerQuery || 0;

    return {
      id: `ai_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: `${model}_inference`,
      amount: Math.round(amount * 100) / 100,
      unit: 'g',
      category: 'ai',
      confidence: factor.confidence,
    };
  }

  /**
   * Generate comprehensive emission result
   */
  generateResult(emissions: EmissionData[]): EmissionResult {
    return {
      emissions,
      footprint: generateFootprint(emissions),
      metadata: {
        calculatedAt: new Date().toISOString(),
        methodology: 'qarbon-v1',
        confidence: 0.85,
      },
    };
  }
}

// Default instance
export const calculator = new EmissionsCalculator();
