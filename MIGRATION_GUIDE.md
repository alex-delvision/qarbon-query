# Migration Guide - Qarbon Query Pipeline Architecture

## Overview
This guide helps you migrate from the legacy qarbon-query calculator APIs to the new enhanced pipeline architecture while maintaining full backward compatibility.

## Migration Phases

### Phase 1: No Changes Required (Current)
Your existing code continues to work unchanged. No migration needed.

```typescript
// ✅ This still works exactly as before
import { calculateAIEmissions } from '@qarbon/emissions';

const emission = calculateAIEmissions(1000, 'gpt-4');
console.log(emission); // Same EmissionData structure
```

### Phase 2: Optional Enhanced Features (Future)
You can gradually adopt new features while keeping legacy APIs.

```typescript
// ✅ Legacy API (still available)
import { calculateAIEmissions } from '@qarbon/emissions';
const emission = calculateAIEmissions(1000, 'gpt-4');

// ✨ Enhanced API (new capabilities)
import { calculateAIEmissionsEnhanced } from '@qarbon/emissions';
const result = await calculateAIEmissionsEnhanced(
  { tokens: 1000, model: 'gpt-4' },
  { useGrid: true, useUncertainty: true }
);
```

### Phase 3: Full Pipeline Integration (Optional)
Use the universal pipeline for maximum flexibility.

```typescript
import { pipeline } from '@qarbon/core';

// Process any input format
const result = await pipeline.process(csvData, {
  category: 'ai',
  useGrid: true,
  useOptimizations: true,
  useUncertainty: true
});
```

## API Comparison

### Legacy APIs (Unchanged)
```typescript
// AI Emissions
calculateAIEmissions(tokens: number, model: string): EmissionData

// Digital Emissions  
calculateDigitalEmissions(dataTransfer: number, timeSpent: number, deviceType?: string): EmissionData

// Transport Emissions
calculateTransportEmissions(distance: number, mode?: string): EmissionData

// Energy Emissions
calculateEnergyEmissions(consumption: number, source?: string): EmissionData
```

### Enhanced APIs (New)
```typescript
// Enhanced AI Emissions
calculateAIEmissionsEnhanced(input: any, options?: PipelineOptions): Promise<EmissionResult>

// Enhanced Digital Emissions
calculateDigitalEmissionsEnhanced(input: any, options?: PipelineOptions): Promise<EmissionResult>

// Enhanced Transport Emissions  
calculateTransportEmissionsEnhanced(input: any, options?: PipelineOptions): Promise<EmissionResult>

// Enhanced Energy Emissions
calculateEnergyEmissionsEnhanced(input: any, options?: PipelineOptions): Promise<EmissionResult>

// Universal Processing
processEmissions(input: any, options?: PipelineOptions): Promise<EmissionResult>
```

## Feature Comparison

| Feature | Legacy API | Enhanced API | Pipeline API |
|---------|------------|--------------|--------------|
| Input Format | Fixed parameters | Flexible objects | Any format via adapters |
| Grid Awareness | No | Optional | Yes |
| Uncertainty | Basic confidence | Quantified ranges | Monte Carlo simulation |
| Optimizations | None | Optional | Caching, batching |
| Adapters | No | Limited | Full adapter support |
| Result Type | EmissionData | EmissionResult | PipelineExecutionResult |

## Input Format Examples

### Legacy (Unchanged)
```typescript
const emission = calculateAIEmissions(1000, 'gpt-4');
```

### Enhanced (Flexible Input)
```typescript
// Object input
const result = await calculateAIEmissionsEnhanced({
  tokens: 1000,
  model: 'gpt-4',
  region: 'US-CA'
});

// With options
const result = await calculateAIEmissionsEnhanced(
  { tokens: 1000, model: 'gpt-4' },
  { useGrid: true, useUncertainty: true }
);
```

### Pipeline (Any Input Format)
```typescript
// JSON input
const jsonData = { tokens: 1000, model: 'gpt-4' };
const result = await pipeline.process(jsonData, { category: 'ai' });

// CSV input (via adapter)
const csvData = 'tokens,model\n1000,gpt-4\n2000,claude-3';
const result = await pipeline.process(csvData, { category: 'ai' });

// XML input (via adapter)
const xmlData = '<emission><tokens>1000</tokens><model>gpt-4</model></emission>';
const result = await pipeline.process(xmlData, { category: 'ai' });
```

## Result Structure Evolution

### Legacy Result (EmissionData)
```typescript
interface EmissionData {
  id: string;
  timestamp: string;
  source: string;
  amount: number;
  unit: 'kg' | 'g' | 'tonnes';
  category: 'transport' | 'energy' | 'digital' | 'ai' | 'other';
  confidence?: { low: number; high: number };
}
```

### Enhanced Result (EmissionResult)
```typescript
interface EmissionResult {
  emissions: EmissionData[];
  footprint: CarbonFootprint;
  metadata: {
    calculatedAt: string;
    methodology: string;
    confidence: number;
    pipelineVersion?: string;
    enhancedPipeline?: boolean;
  };
}
```

### Pipeline Result (PipelineExecutionResult)
```typescript
interface PipelineExecutionResult extends EmissionResult {
  stages: PipelineStageResult[];
  totalDuration: number;
  optimizations?: OptimizationMetrics;
  uncertainty?: UncertaintyMetrics;
}
```

## Migration Strategies

### Strategy 1: Gradual Enhancement
Replace legacy calls one by one with enhanced versions:

```typescript
// Before
const emission = calculateAIEmissions(1000, 'gpt-4');

// After (enhanced features)
const result = await calculateAIEmissionsEnhanced(
  { tokens: 1000, model: 'gpt-4' },
  { useGrid: true }
);

// Access same data
const emission = result.emissions[0]; // Same structure
```

### Strategy 2: Adapter Integration
Add adapter support for new input formats:

```typescript
// Process CSV files
import { pipeline } from '@qarbon/core';

const csvContent = await fs.readFile('emissions.csv', 'utf8');
const result = await pipeline.process(csvContent, {
  category: 'ai',
  useOptimizations: true
});
```

### Strategy 3: Full Pipeline Adoption
Use pipeline for all emission calculations:

```typescript
import { pipeline } from '@qarbon/core';

// Configure pipeline once
pipeline.configure({
  gridManager: { enabled: true, defaultRegion: 'US-CA' },
  optimizations: { enabled: true, caching: true },
  uncertainty: { enabled: true, confidenceLevel: 0.95 }
});

// Process any input
const result = await pipeline.process(input, { category: 'ai' });
```

## Breaking Changes
**None.** All existing APIs remain unchanged and will continue to work.

## Feature Detection
Check if enhanced features are available:

```typescript
import { isEnhancedPipelineAvailable } from '@qarbon/emissions';

if (await isEnhancedPipelineAvailable()) {
  // Use enhanced APIs
  const result = await calculateAIEmissionsEnhanced(input, options);
} else {
  // Fallback to legacy
  const emission = calculateAIEmissions(tokens, model);
}
```

## Best Practices

### 1. Start with Enhanced APIs
For new code, prefer enhanced APIs for additional features:
```typescript
// Preferred for new code
const result = await calculateAIEmissionsEnhanced(input, options);
```

### 2. Use Pipeline for Multiple Formats
When dealing with various input formats:
```typescript
const result = await pipeline.process(unknownFormatData);
```

### 3. Enable Grid Awareness for Energy
For energy calculations, enable grid features:
```typescript
const result = await calculateEnergyEmissionsEnhanced(input, {
  useGrid: true,
  region: 'US-CA'
});
```

### 4. Add Uncertainty for Critical Applications
For applications requiring uncertainty quantification:
```typescript
const result = await pipeline.process(input, {
  useUncertainty: true,
  useGrid: true
});
```

## Error Handling

### Legacy APIs
```typescript
try {
  const emission = calculateAIEmissions(1000, 'unknown-model');
} catch (error) {
  console.error('Calculation failed:', error);
}
```

### Enhanced APIs
```typescript
try {
  const result = await calculateAIEmissionsEnhanced(input, options);
} catch (error) {
  console.error('Enhanced calculation failed:', error);
  // Fallback to legacy if needed
}
```

### Pipeline APIs
```typescript
try {
  const result = await pipeline.process(input, options);
  
  // Check for stage-level errors
  const errors = result.stages
    .filter(stage => stage.errors?.length > 0)
    .flatMap(stage => stage.errors);
    
  if (errors.length > 0) {
    console.warn('Pipeline stage warnings:', errors);
  }
} catch (error) {
  console.error('Pipeline processing failed:', error);
}
```

## Performance Considerations

### Legacy APIs
- Synchronous operation
- No caching
- Single calculation per call

### Enhanced APIs
- Asynchronous operation
- Optional caching
- Batch processing available

### Pipeline APIs
- Full optimization support
- Intelligent caching
- Batch processing
- Memory optimization

## Timeline

- **Phase 1 (Now)**: Legacy APIs continue unchanged
- **Phase 2 (Next Release)**: Enhanced APIs available
- **Phase 3 (Future)**: Full pipeline features
- **Long Term**: Legacy APIs remain supported indefinitely

## Support

For migration questions or issues:
1. Check existing documentation
2. Review test examples
3. Open GitHub issue
4. Contact support team

The migration is designed to be **zero-risk** with **maximum benefit** - you can adopt new features at your own pace while existing code continues to work unchanged.
