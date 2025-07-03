/**
 * @qarbon/tracker-adapters
 *
 * Main entry point for the tracker adapters package.
 * Exports UniversalTrackerRegistry, EmissionAdapter, and default adapters.
 */
// Export the core registry and adapter interfaces
export { UniversalTrackerRegistry, universalTrackerRegistry, } from './UniversalTrackerRegistry.js';
// Export all default emission adapters
export { JsonAdapter, CsvAdapter, XmlAdapter, } from './adapters/index.js';
// Export performance optimization components
export { OptimizedUniversalTrackerRegistry } from './OptimizedUniversalTrackerRegistry.js';
export { BenchmarkSuite } from './performance/BenchmarkSuite.js';
export { SignatureCache } from './performance/SignatureCache.js';
//# sourceMappingURL=index.js.map