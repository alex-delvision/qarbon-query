/**
 * @qarbon/emissions - Carbon emissions calculation engine
 */

export * from './calculator';
export * from './methodologies';
export * from './factors';
export * from './compatibility';
export * from './grid';
export * from './optimizations';
export * from './uncertainty';

// Legacy export for backwards compatibility
export const calculateEmissions = () => 'TODO';
