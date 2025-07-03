/**
 * Adapter exports
 *
 * This file will export all available tracker adapters
 */

// Export base adapter interfaces
export type {
  TrackerAdapter,
  EmissionAdapter,
  FormatConfidence,
} from '../UniversalTrackerRegistry.js';

// Export emission adapters
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

// Future tracker adapter exports will be added here:
// export { GoogleAnalyticsAdapter } from './GoogleAnalyticsAdapter';
// export { MixpanelAdapter } from './MixpanelAdapter';
// export { SegmentAdapter } from './SegmentAdapter';
// export { CustomAdapter } from './CustomAdapter';
