import type { EmissionData, CarbonFootprint, EmissionUnit } from './types';

/**
 * Format emission amounts with proper units
 */
export const formatEmissions = (amount: number, unit: EmissionUnit): string => {
  return `${amount.toFixed(2)} ${unit} CO₂e`;
};

/**
 * Calculate total emissions from array
 */
export const calculateTotal = (emissions: EmissionData[]): number => {
  return emissions.reduce((total, emission) => total + emission.amount, 0);
};

/**
 * Group emissions by category
 */
export const groupByCategory = (
  emissions: EmissionData[]
): Record<string, number> => {
  return emissions.reduce(
    (acc, emission) => {
      acc[emission.category] = (acc[emission.category] || 0) + emission.amount;
      return acc;
    },
    {} as Record<string, number>
  );
};

/**
 * Convert emission units
 */
export const convertUnits = (
  amount: number,
  from: EmissionUnit,
  to: EmissionUnit
): number => {
  const toGrams = (value: number, unit: EmissionUnit): number => {
    switch (unit) {
      case 'g':
        return value;
      case 'kg':
        return value * 1000;
      case 'tonnes':
        return value * 1000000;
      default:
        return value;
    }
  };

  const fromGrams = (value: number, unit: EmissionUnit): number => {
    switch (unit) {
      case 'g':
        return value;
      case 'kg':
        return value / 1000;
      case 'tonnes':
        return value / 1000000;
      default:
        return value;
    }
  };

  const inGrams = toGrams(amount, from);
  return fromGrams(inGrams, to);
};

/**
 * Generate carbon footprint summary
 */
export const generateFootprint = (
  emissions: EmissionData[]
): CarbonFootprint => {
  return {
    total: calculateTotal(emissions),
    breakdown: groupByCategory(emissions),
    period: 'monthly', // Default period
  };
};
