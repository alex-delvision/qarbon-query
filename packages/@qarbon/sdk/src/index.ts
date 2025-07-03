/**
 * @qarbon/sdk - Main SDK for QarbonQuery integration
 */

export * from './client';
// export * from './hooks'; // Temporarily disabled for build
export * from './config';

// Re-export commonly used types
export type {
  EmissionData,
  CarbonFootprint,
  EmissionResult,
} from '@qarbon/shared';
export { EmissionsCalculator } from '@qarbon/emissions';

// Legacy export
export const QarbonSDK = { init: () => 'TODO' };
