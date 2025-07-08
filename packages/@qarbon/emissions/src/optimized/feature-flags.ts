// Auto-generated feature flags
// Generated at: 2025-07-04T12:25:23.229Z

export interface FeatureFlags {
  useOptimizedLookups: boolean;
  useBatchCalculations: boolean;
  useWebAssembly: boolean;
  useWorkerThreads: boolean;
  useStreamingCalculator: boolean;
  enablePerformanceMonitoring: boolean;
  enableCaching: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  useOptimizedLookups: true,
  useBatchCalculations: true,
  useWebAssembly: typeof WebAssembly !== 'undefined',
  useWorkerThreads:
    typeof Worker !== 'undefined' && typeof window === 'undefined',
  useStreamingCalculator: true,
  enablePerformanceMonitoring: process.env.NODE_ENV === 'development',
  enableCaching: true,
};

export class FeatureFlagManager {
  private flags: FeatureFlags;

  constructor(customFlags: Partial<FeatureFlags> = {}) {
    this.flags = { ...DEFAULT_FEATURE_FLAGS, ...customFlags };
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }

  enable(flag: keyof FeatureFlags): void {
    this.flags[flag] = true;
  }

  disable(flag: keyof FeatureFlags): void {
    this.flags[flag] = false;
  }

  getAll(): FeatureFlags {
    return { ...this.flags };
  }

  reset(): void {
    this.flags = { ...DEFAULT_FEATURE_FLAGS };
  }
}

export const featureFlags = new FeatureFlagManager();
