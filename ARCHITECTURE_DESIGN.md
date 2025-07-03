# Qarbon Query - Updated Architecture Design

## Overview
This document outlines the updated architecture for the qarbon-query system, incorporating new feature areas (adapters, grid manager, optimizations, uncertainty) while maintaining backward compatibility with existing APIs.

## Folder Structure

```
/packages
  /@qarbon
    /emissions                          # Core emissions calculation engine
      /src
        - calculator.ts                 # Main calculator implementations
        - index.ts                      # Public API exports
        - factors.ts                    # Emission factors and constants
        - methodologies.ts              # Calculation methodologies
        - compatibility.ts              # Legacy API compatibility wrappers
    
    /tracker-adapters                   # Input format adapters (existing)
      /src
        /adapters
          - AIImpactTrackerAdapter.ts
          - CodeCarbonAdapter.ts
          - CsvAdapter.ts
          - FitAdapter.ts
          - JSONSchemaAdapter.ts
          - JsonAdapter.ts
          - XmlAdapter.ts
        - UniversalTrackerRegistry.ts
        - index.ts
    
    /grid-manager                       # NEW: Grid electricity management
      /src
        - index.ts                      # Public API exports
        - gridCalculator.ts             # Grid-specific calculations
        - regionMapper.ts               # Regional grid mapping
        - carbonIntensity.ts            # Carbon intensity data
        - types.ts                      # Grid-related types
    
    /optimizations                      # NEW: Performance optimizations
      /src
        - index.ts                      # Public API exports
        - cacheManager.ts               # Caching strategies
        - batchProcessor.ts             # Batch processing
        - memoryOptimizer.ts            # Memory management
        - types.ts                      # Optimization types
    
    /uncertainty                        # NEW: Uncertainty quantification
      /src
        - index.ts                      # Public API exports
        - uncertaintyCalculator.ts      # Uncertainty calculations
        - confidenceRanges.ts           # Confidence interval calculations
        - monteCarloSimulation.ts       # Monte Carlo methods
        - types.ts                      # Uncertainty types
    
    /shared                            # Shared types and utilities (existing)
      /src
        - index.ts
        - types.ts                      # Core emission data types
        - utils.ts                      # Utility functions
        - pipeline.ts                   # NEW: Pipeline orchestration
    
    /core                              # NEW: Core pipeline orchestration
      /src
        - index.ts                      # Public API exports
        - pipeline.ts                  # Main pipeline orchestrator
        - dataFlow.ts                  # Data flow management
        - adapters.ts                  # Adapter integration
        - types.ts                     # Core pipeline types
```

## Data Flow Architecture

### High-Level UML Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Input Sources │    │    Adapters     │    │  Normalized     │
│                 │    │                 │    │  EmissionData   │
│ • JSON Files    │───▶│ • JsonAdapter   │───▶│                 │
│ • CSV Files     │    │ • CsvAdapter    │    │ • id: string    │
│ • XML Files     │    │ • XmlAdapter    │    │ • timestamp     │
│ • AI Impact     │    │ • AIImpactAdptr │    │ • source        │
│ • CodeCarbon    │    │ • CodeCarbonAdp │    │ • amount        │
│ • Custom APIs   │    │ • CustomAdapter │    │ • unit          │
└─────────────────┘    └─────────────────┘    │ • category      │
                                              │ • confidence    │
                                              └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Result      │    │  Calculator     │    │ Grid Manager    │
│                 │◀───│                 │◀───│                 │
│ • emissions[]   │    │ • Digital       │    │ • Region        │
│ • footprint     │    │ • Transport     │    │ • Carbon        │
│ • metadata      │    │ • Energy        │    │   Intensity     │
│ • uncertainty   │    │ • AI            │    │ • Time-based    │
│ • optimizations │    │ • Generic       │    │   Factors       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       ▲                        ▲                       ▲
       │                        │                       │
       │                        │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Optimizations  │    │   Uncertainty   │    │    Pipeline     │
│                 │    │                 │    │  Orchestrator   │
│ • Caching       │    │ • Confidence    │    │                 │
│ • Batch Proc.   │    │   Ranges        │    │ • Data Flow     │
│ • Memory Opt.   │    │ • Monte Carlo   │    │ • Error         │
│ • Perf. Tuning  │    │ • Error Prop.   │    │   Handling      │
└─────────────────┘    └─────────────────┘    │ • Validation    │
                                              └─────────────────┘
```

### Detailed Data Flow

1. **Input Processing**
   - Any input format → Universal Tracker Registry
   - Registry detects format with confidence scores
   - Appropriate adapter selected for normalization

2. **Normalization**
   - Selected adapter converts input to `EmissionData`
   - Validation ensures data integrity
   - Metadata preserved for traceability

3. **Calculation Pipeline**
   - Grid Manager provides regional carbon intensity
   - Calculator performs emission calculations
   - Uncertainty module calculates confidence ranges
   - Optimizations applied for performance

4. **Result Generation**
   - Comprehensive result with all metadata
   - Optional uncertainty quantification
   - Performance metrics included

## Core Types

### Enhanced EmissionData
```typescript
interface EmissionData {
  id: string;
  timestamp: string;
  source: string;
  amount: number;
  unit: 'kg' | 'g' | 'tonnes';
  category: 'transport' | 'energy' | 'digital' | 'ai' | 'other';
  confidence?: ConfidenceRange;
  region?: string;
  gridIntensity?: number;
  methodology?: string;
  uncertainty?: UncertaintyMetrics;
}
```

### Pipeline Configuration
```typescript
interface PipelineConfig {
  adapters: AdapterConfig[];
  gridManager: GridManagerConfig;
  optimizations: OptimizationConfig;
  uncertainty: UncertaintyConfig;
  compatibility: CompatibilityConfig;
}
```

## Compatibility Layer

### Existing API Preservation
All existing APIs continue to work unchanged:
- `calculateAIEmissions(tokens, model)`
- `calculateDigitalEmissions(dataTransfer, timeSpent, deviceType)`
- `calculateTransportEmissions(distance, mode)`
- `calculateEnergyEmissions(consumption, source)`

### Implementation Strategy
```typescript
// Legacy API wrapper
export function calculateAIEmissions(tokens: number, model: string): EmissionData {
  // Direct legacy path for backward compatibility
  return calculator.calculateAIEmissions(tokens, model);
}

// Enhanced API with adapter support
export function calculateAIEmissionsEnhanced(
  input: any,
  options?: PipelineOptions
): Promise<EmissionResult> {
  return pipeline.process(input, {
    category: 'ai',
    ...options
  });
}
```

## Migration Path

### Phase 1: Backward Compatibility (Immediate)
- All existing APIs continue to work
- No breaking changes
- Legacy tests pass unchanged

### Phase 2: Enhanced Features (Optional)
- New pipeline available through enhanced APIs
- Adapter-based input processing
- Grid-aware calculations
- Uncertainty quantification

### Phase 3: Full Migration (Future)
- Legacy APIs delegate to new pipeline
- Seamless feature enhancement
- Performance optimizations applied

## Benefits

1. **Extensibility**: Easy to add new input formats and calculation methods
2. **Maintainability**: Clear separation of concerns
3. **Performance**: Optimizations and caching built-in
4. **Reliability**: Uncertainty quantification and confidence metrics
5. **Compatibility**: Zero breaking changes for existing users
6. **Scalability**: Grid-aware calculations and batch processing

## Next Steps

1. Implement core pipeline orchestrator
2. Create grid manager package
3. Develop optimization framework
4. Build uncertainty quantification module
5. Add compatibility wrappers
6. Create migration guides and documentation
