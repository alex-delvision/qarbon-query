/**
 * Core emission data structure
 */
export interface EmissionData {
  id: string;
  timestamp: string;
  source: string;
  amount: number;
  unit: 'kg' | 'g' | 'tonnes';
  category: 'transport' | 'energy' | 'digital' | 'ai' | 'other';
  confidence?: { low: number; high: number };
}

/**
 * Carbon footprint summary
 */
export interface CarbonFootprint {
  total: number;
  breakdown: Record<string, number>;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

/**
 * Emission calculation result
 */
export interface EmissionResult {
  emissions: EmissionData[];
  footprint: CarbonFootprint;
  metadata: {
    calculatedAt: string;
    methodology: string;
    confidence: number;
  };
}

// Type exports
export type EmissionCategory = 'transport' | 'energy' | 'digital' | 'ai' | 'other';
export type EmissionUnit = 'kg' | 'g' | 'tonnes';
export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';
