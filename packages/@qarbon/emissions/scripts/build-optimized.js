#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Enhanced build script with optimizations:
 * 1. Pre-compile factor data into optimized formats
 * 2. Generate Map-based lookups
 * 3. Tree-shake unused code
 * 4. Minify and optimize bundles
 * 5. Generate performance monitoring
 */

const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist');
const optimizedDir = path.join(srcDir, 'optimized');

function ensureDirectories() {
  if (!fs.existsSync(optimizedDir)) {
    fs.mkdirSync(optimizedDir, { recursive: true });
  }
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
}

function precompileFactorData() {
  console.log('🔧 Pre-compiling factor data...');

  // Read factor files
  const factorFiles = [
    'data/ai-factors.json',
    'data/cloud-factors.json',
    'data/crypto-factors.json',
    'data/grid-factors.json',
  ];

  const compiledFactors = {};

  factorFiles.forEach(file => {
    const filePath = path.join(srcDir, file);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const baseName = path.basename(file, '.json');
      compiledFactors[baseName] = data;
    }
  });

  // Generate optimized lookup maps
  const optimizedLookups = generateOptimizedLookups(compiledFactors);

  // Write optimized factor file
  const optimizedFactorsPath = path.join(optimizedDir, 'factors.ts');
  fs.writeFileSync(optimizedFactorsPath, optimizedLookups);

  console.log(`✅ Generated optimized factors: ${optimizedFactorsPath}`);
}

function generateOptimizedLookups(factors) {
  const template = `// Auto-generated optimized factor lookups
// Generated at: ${new Date().toISOString()}

export const OPTIMIZED_AI_FACTORS = new Map<string, any>([
${generateMapEntries(factors['ai-factors'] || {})}
]);

export const OPTIMIZED_CLOUD_FACTORS = new Map<string, any>([
${generateMapEntries(factors['cloud-factors'] || {})}
]);

export const OPTIMIZED_CRYPTO_FACTORS = new Map<string, any>([
${generateMapEntries(factors['crypto-factors'] || {})}
]);

export const OPTIMIZED_GRID_FACTORS = new Map<string, number>([
${generateMapEntries(factors['grid-factors'] || {})}
]);

// Pre-computed region multipliers for common regions
export const REGION_MULTIPLIERS = new Map<string, number>([
  ['us-east-1', 1.0],
  ['us-west-2', 0.3],
  ['eu-west-1', 0.6],
  ['eu-north-1', 0.1],
  ['ap-southeast-1', 1.4],
  ['ap-south-1', 1.8],
  ['ca-central-1', 0.2],
  ['us-west-1', 0.4],
  ['eu-central-1', 0.8],
  ['ap-northeast-1', 1.2]
]);

// Fast lookup functions
export function getOptimizedAIFactor(model: string): any | null {
  return OPTIMIZED_AI_FACTORS.get(model) || 
         OPTIMIZED_AI_FACTORS.get(model.toLowerCase()) || 
         null;
}

export function getOptimizedCloudFactor(instanceType: string): any | null {
  return OPTIMIZED_CLOUD_FACTORS.get(instanceType) || 
         OPTIMIZED_CLOUD_FACTORS.get(instanceType.toLowerCase()) || 
         null;
}

export function getOptimizedCryptoFactor(currency: string): any | null {
  return OPTIMIZED_CRYPTO_FACTORS.get(currency) || 
         OPTIMIZED_CRYPTO_FACTORS.get(currency.toLowerCase()) || 
         null;
}

export function getRegionMultiplier(region: string): number {
  return REGION_MULTIPLIERS.get(region) || 
         REGION_MULTIPLIERS.get(region.toLowerCase()) || 
         1.0;
}

// Batch calculation utilities
export function calculateBatchAI(inputs: Array<{tokens: number, model: string, region?: string}>): Float32Array {
  const results = new Float32Array(inputs.length);
  
  for (let i = 0; i < inputs.length; i++) {
    const { tokens, model, region = 'us-east-1' } = inputs[i];
    const factor = getOptimizedAIFactor(model);
    const regionMultiplier = getRegionMultiplier(region);
    
    if (factor) {
      results[i] = tokens * factor.co2PerToken * regionMultiplier;
    } else {
      results[i] = 0;
    }
  }
  
  return results;
}

export function calculateBatchCloud(inputs: Array<{hours: number, instanceType: string, region?: string}>): Float32Array {
  const results = new Float32Array(inputs.length);
  
  for (let i = 0; i < inputs.length; i++) {
    const { hours, instanceType, region = 'us-east-1' } = inputs[i];
    const factor = getOptimizedCloudFactor(instanceType);
    const regionMultiplier = getRegionMultiplier(region);
    
    if (factor) {
      results[i] = hours * factor.co2PerHour * regionMultiplier;
    } else {
      results[i] = 0;
    }
  }
  
  return results;
}
`;

  return template;
}

function generateMapEntries(obj, indent = '  ') {
  return Object.entries(obj)
    .map(([key, value]) => {
      const serializedValue = JSON.stringify(value);
      return `${indent}['${key}', ${serializedValue}]`;
    })
    .join(',\n');
}

function generateFeatureFlagModule() {
  console.log('🚩 Generating feature flags...');

  const featureFlagsPath = path.join(optimizedDir, 'feature-flags.ts');
  const content = `// Auto-generated feature flags
// Generated at: ${new Date().toISOString()}

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
  useWorkerThreads: typeof Worker !== 'undefined' && typeof window === 'undefined',
  useStreamingCalculator: true,
  enablePerformanceMonitoring: process.env.NODE_ENV === 'development',
  enableCaching: true
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
`;

  fs.writeFileSync(featureFlagsPath, content);
  console.log(`✅ Generated feature flags: ${featureFlagsPath}`);
}

function generatePerformanceModule() {
  console.log('📊 Generating performance monitoring...');

  const performancePath = path.join(optimizedDir, 'performance.ts');
  const content = `// Auto-generated performance monitoring
// Generated at: ${new Date().toISOString()}

export interface PerformanceMetrics {
  calculationTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  batchSize: number;
  throughput: number;
}

export class PerformanceTracker {
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();
  
  startOperation(operationId: string): void {
    this.startTimes.set(operationId, performance.now());
  }
  
  endOperation(operationId: string): number {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) {
      throw new Error(\`Operation \${operationId} was not started\`);
    }
    
    const duration = performance.now() - startTime;
    this.recordMetric(\`\${operationId}_duration\`, duration);
    this.startTimes.delete(operationId);
    
    return duration;
  }
  
  recordMetric(metricName: string, value: number): void {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    this.metrics.get(metricName)!.push(value);
  }
  
  getMetrics(metricName: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(metricName);
    if (!values || values.length === 0) {
      return null;
    }
    
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }
  
  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [name] of this.metrics) {
      result[name] = this.getMetrics(name);
    }
    return result;
  }
  
  clear(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }
  
  getReport(): string {
    const metrics = this.getAllMetrics();
    const report = ['Performance Report', '='.repeat(50)];
    
    for (const [name, stats] of Object.entries(metrics)) {
      if (stats) {
        report.push(\`\${name}:\`);
        report.push(\`  Average: \${stats.avg.toFixed(2)}ms\`);
        report.push(\`  Min: \${stats.min.toFixed(2)}ms\`);
        report.push(\`  Max: \${stats.max.toFixed(2)}ms\`);
        report.push(\`  Count: \${stats.count}\`);
        report.push('');
      }
    }
    
    return report.join('\\n');
  }
}

export const performanceTracker = new PerformanceTracker();

// Performance monitoring decorators
export function measurePerformance(operationName: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      const operationId = \`\${operationName}_\${Date.now()}\`;
      performanceTracker.startOperation(operationId);
      
      try {
        const result = originalMethod.apply(this, args);
        
        if (result instanceof Promise) {
          return result.finally(() => {
            performanceTracker.endOperation(operationId);
          });
        } else {
          performanceTracker.endOperation(operationId);
          return result;
        }
      } catch (error) {
        performanceTracker.endOperation(operationId);
        throw error;
      }
    };
    
    return descriptor;
  };
}
`;

  fs.writeFileSync(performancePath, content);
  console.log(`✅ Generated performance monitoring: ${performancePath}`);
}

function updateOptimizedEntryPoints() {
  console.log('🔄 Updating optimized entry points...');

  // Check if optimized imports already exist and add them if needed
  const optimizedImports = `import { getOptimizedAIFactor, calculateBatchAI, getRegionMultiplier } from './optimized/factors';
import { featureFlags } from './optimized/feature-flags';
import { performanceTracker, measurePerformance } from './optimized/performance';
`;

  ['ai', 'cloud', 'crypto'].forEach(type => {
    const entryPath = path.join(srcDir, `${type}.ts`);
    if (fs.existsSync(entryPath)) {
      let content = fs.readFileSync(entryPath, 'utf8');

      // Check if optimized imports already exist
      if (!content.includes('./optimized/factors')) {
        // Find the best place to insert the imports
        const importIndex = content.indexOf('import { get');
        if (importIndex !== -1) {
          content =
            content.slice(0, importIndex) +
            optimizedImports +
            '\n' +
            content.slice(importIndex);
        } else {
          // Insert at the beginning if no other imports found
          content = optimizedImports + '\n' + content;
        }

        fs.writeFileSync(entryPath, content);
      }
    }
  });

  console.log('✅ Updated entry points with optimized imports');
}

function runRollupBuild() {
  console.log('📦 Running Rollup build...');

  try {
    execSync('npm run build:rollup', { stdio: 'inherit' });
    console.log('✅ Rollup build completed');
  } catch (error) {
    console.error('❌ Rollup build failed:', error.message);
    process.exit(1);
  }
}

function generateBuildMetadata() {
  console.log('📝 Generating build metadata...');

  const metadata = {
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    optimizations: {
      precompiledFactors: true,
      mapBasedLookups: true,
      batchCalculations: true,
      featureFlags: true,
      performanceMonitoring: true,
    },
    bundleSizes: {},
  };

  // Calculate bundle sizes
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
    files.forEach(file => {
      const filePath = path.join(distDir, file);
      const stats = fs.statSync(filePath);
      metadata.bundleSizes[file] = {
        size: stats.size,
        sizeKB: Math.round((stats.size / 1024) * 100) / 100,
      };
    });
  }

  const metadataPath = path.join(distDir, 'build-metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  console.log(`✅ Generated build metadata: ${metadataPath}`);
  return metadata;
}

function printBuildSummary(metadata) {
  console.log('\\n🎉 Build Summary:');
  console.log('='.repeat(50));
  console.log(`Build Time: ${metadata.buildTime}`);
  console.log(`Node Version: ${metadata.nodeVersion}`);
  console.log(`Platform: ${metadata.platform} (${metadata.arch})`);
  console.log('\\nOptimizations Enabled:');
  Object.entries(metadata.optimizations).forEach(([key, value]) => {
    console.log(`  ${key}: ${value ? '✅' : '❌'}`);
  });
  console.log('\\nBundle Sizes:');
  Object.entries(metadata.bundleSizes).forEach(([file, info]) => {
    console.log(`  ${file}: ${info.sizeKB}KB`);
  });
  console.log('\\n🚀 Ready for production!');
}

function main() {
  console.log('🚀 Starting optimized build process...');

  // Step 1: Ensure directories exist
  ensureDirectories();

  // Step 2: Pre-compile factor data
  precompileFactorData();

  // Step 3: Generate feature flags
  generateFeatureFlagModule();

  // Step 4: Generate performance monitoring
  generatePerformanceModule();

  // Step 5: Update entry points with optimizations
  updateOptimizedEntryPoints();

  // Step 6: Run TypeScript compilation
  console.log('🔧 Compiling TypeScript...');
  try {
    execSync('npm run build:types', { stdio: 'inherit' });
    console.log('✅ TypeScript compilation completed');
  } catch (error) {
    console.error('❌ TypeScript compilation failed:', error.message);
    process.exit(1);
  }

  // Step 7: Run Rollup build
  runRollupBuild();

  // Step 8: Generate build metadata
  const metadata = generateBuildMetadata();

  // Step 9: Print summary
  printBuildSummary(metadata);
}

if (process.argv[1] === __filename) {
  main();
}

export {
  precompileFactorData,
  generateOptimizedLookups,
  generateFeatureFlagModule,
  generatePerformanceModule,
  generateBuildMetadata,
};
