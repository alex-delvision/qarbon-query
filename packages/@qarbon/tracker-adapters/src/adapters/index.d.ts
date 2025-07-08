/**
 * Adapter exports
 *
 * This file will export all available tracker adapters
 */
export type {
  TrackerAdapter,
  EmissionAdapter,
  FormatConfidence,
} from '../UniversalTrackerRegistry.js';
export { JsonAdapter } from './JsonAdapter.js';
export { CsvAdapter, type ColumnMappingConfig } from './CsvAdapter.js';
export { XmlAdapter } from './XmlAdapter.js';
export { CodeCarbonAdapter } from './CodeCarbonAdapter.js';
export { AIImpactTrackerAdapter } from './AIImpactTrackerAdapter.js';
export {
  JSONSchemaAdapter,
  type JSONSchemaAdapterOptions,
} from './JSONSchemaAdapter.js';
export { FitAdapter } from './FitAdapter.js';
//# sourceMappingURL=index.d.ts.map
