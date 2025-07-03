/**
 * @qarbon/tracker-adapters
 *
 * Main entry point for the tracker adapters package.
 * Exports UniversalTrackerRegistry, EmissionAdapter, and default adapters.
 */

// Export the core registry and adapter interfaces
export {
  UniversalTrackerRegistry,
  universalTrackerRegistry,
} from './UniversalTrackerRegistry.js';

export type {
  TrackerAdapter,
  EmissionAdapter,
  FormatConfidence,
  FormatDetectionResult,
  DetectionResult,
} from './UniversalTrackerRegistry.js';

// Export all default emission adapters
export {
  JsonAdapter,
  CsvAdapter,
  XmlAdapter,
  type ColumnMappingConfig,
} from './adapters/index.js';

// Re-export adapter types for convenience
export type {
  TrackerAdapter as ITrackerAdapter,
  EmissionAdapter as IEmissionAdapter,
  FormatConfidence as IFormatConfidence,
  DetectionResult as IDetectionResult,
} from './UniversalTrackerRegistry.js';

// Export performance optimization components
export { OptimizedUniversalTrackerRegistry } from './OptimizedUniversalTrackerRegistry.js';
export { BenchmarkSuite } from './performance/BenchmarkSuite.js';
export { SignatureCache } from './performance/SignatureCache.js';
export type {
  OptimizationConfig,
  AdapterTiming,
  OptimizedDetectionResult,
} from './OptimizedUniversalTrackerRegistry.js';
export type {
  BenchmarkMetrics,
  BenchmarkResult,
  DatasetConfig,
} from './performance/BenchmarkSuite.js';
export type {
  CacheEntry,
  CacheStats,
  CacheConfig,
} from './performance/SignatureCache.js';
