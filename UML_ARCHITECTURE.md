# Qarbon Query - UML Architecture Diagrams

## High-Level Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           QARBON QUERY PIPELINE                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Input Layer   │    │  Adapter Layer  │    │ Normalization   │
│                 │    │                 │    │     Layer       │
│ • JSON Files    │───▶│ • JsonAdapter   │───▶│                 │
│ • CSV Files     │    │ • CsvAdapter    │    │ EmissionData[]  │
│ • XML Files     │    │ • XmlAdapter    │    │                 │
│ • AI APIs       │    │ • AIImpactAdptr │    │ • id: string    │
│ • CodeCarbon    │    │ • CodeCarbonAdp │    │ • timestamp     │
│ • Custom Data   │    │ • CustomAdapter │    │ • source        │
│ • Streams       │    │ • StreamAdapter │    │ • amount        │
└─────────────────┘    └─────────────────┘    │ • unit          │
                                              │ • category      │
                                              │ • confidence    │
                                              └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Grid Manager    │    │   Calculator    │    │ Optimization    │
│                 │◀───│     Layer       │───▶│     Layer       │
│ • Region Data   │    │                 │    │                 │
│ • Carbon        │    │ • Digital       │    │ • Caching       │
│   Intensity     │    │ • Transport     │    │ • Batch Proc.   │
│ • Time Zones    │    │ • Energy        │    │ • Memory Opt.   │
│ • Real-time     │    │ • AI            │    │ • Performance   │
│   Updates       │    │ • Generic       │    │   Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲                       │
                                │                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Uncertainty    │    │ Result Layer    │    │ Legacy APIs     │
│     Layer       │    │                 │    │                 │
│                 │───▶│ • EmissionResult│◀───│ • calculateAI   │
│ • Confidence    │    │ • Pipeline      │    │ • calculateDig. │
│   Intervals     │    │   Execution     │    │ • calculateTrn. │
│ • Monte Carlo   │    │   Result        │    │ • calculateEng. │
│ • Error Prop.   │    │ • Metadata      │    │ • Compatibility │
│ • Sensitivity   │    │ • Performance   │    │   Wrappers      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Detailed Class Diagram

```typescript
@startuml
!include <std/stdlib>

package "Input Layer" {
  interface InputSource {
    +getData(): Promise<any>
    +getFormat(): string
    +getMetadata(): Record<string, any>
  }
  
  class FileInput implements InputSource
  class StreamInput implements InputSource  
  class APIInput implements InputSource
}

package "Adapter Layer" {
  interface EmissionAdapter {
    +detect(raw: unknown): boolean
    +detectConfidence(input: Buffer): FormatConfidence
    +ingest(raw: unknown): unknown
  }
  
  class JsonAdapter implements EmissionAdapter
  class CsvAdapter implements EmissionAdapter
  class XmlAdapter implements EmissionAdapter
  class AIImpactTrackerAdapter implements EmissionAdapter
  class CodeCarbonAdapter implements EmissionAdapter
  
  class UniversalTrackerRegistry {
    -adapters: Map<string, EmissionAdapter>
    +registerAdapter(name: string, adapter: EmissionAdapter): void
    +detectFormat(input: any): Promise<FormatDetectionResult>
    +ingest(raw: unknown): unknown
  }
}

package "Core Types" {
  interface EmissionData {
    +id: string
    +timestamp: string
    +source: string
    +amount: number
    +unit: EmissionUnit
    +category: EmissionCategory
    +confidence?: ConfidenceRange
    +region?: string
    +gridIntensity?: number
  }
  
  interface EmissionResult {
    +emissions: EmissionData[]
    +footprint: CarbonFootprint
    +metadata: ResultMetadata
  }
  
  interface PipelineExecutionResult extends EmissionResult {
    +stages: PipelineStageResult[]
    +totalDuration: number
    +optimizations?: OptimizationMetrics
    +uncertainty?: UncertaintyMetrics
  }
}

package "Calculator Layer" {
  class EmissionsCalculator {
    +calculateDigitalEmissions(dataTransfer: number, timeSpent: number, deviceType: string): EmissionData
    +calculateTransportEmissions(distance: number, mode: string): EmissionData
    +calculateEnergyEmissions(consumption: number, source: string): EmissionData
    +calculateAIEmissions(tokens: number, model: string): EmissionData
    +generateResult(emissions: EmissionData[]): EmissionResult
  }
}

package "Grid Manager" {
  interface GridManager {
    +getRegionData(region: string): Promise<RegionData>
    +getCarbonIntensity(region: string, timestamp: Date): Promise<number>
    +enhanceWithGridData(data: EmissionData[]): Promise<EmissionData[]>
  }
  
  class GridCalculator implements GridManager {
    -regionCache: Map<string, RegionData>
    -intensityCache: Map<string, number>
    +updateRegionData(): Promise<void>
    +calculateTimeBasedIntensity(): number
  }
}

package "Optimization Layer" {
  interface OptimizationManager {
    +applyCaching(data: any): any
    +batchProcess(items: any[]): Promise<any[]>
    +optimizeMemory(): void
    +getMetrics(): OptimizationMetrics
  }
  
  class CacheManager {
    -cache: Map<string, any>
    -maxSize: number
    +get(key: string): any
    +set(key: string, value: any): void
    +clear(): void
  }
  
  class BatchProcessor {
    -batchSize: number
    +addToBatch(item: any): void
    +processBatch(): Promise<any[]>
    +flush(): Promise<void>
  }
}

package "Uncertainty Layer" {
  interface UncertaintyCalculator {
    +calculateConfidenceInterval(data: EmissionData[]): ConfidenceInterval
    +runMonteCarloSimulation(data: EmissionData[], samples: number): UncertaintyMetrics
    +propagateErrors(stages: PipelineStageResult[]): ErrorPropagation
  }
  
  class MonteCarloSimulation {
    -samples: number
    -confidenceLevel: number
    +simulate(data: EmissionData[]): SimulationResult
    +generateDistribution(): number[]
  }
}

package "Core Pipeline" {
  class Pipeline implements PipelineProcessor {
    -config: PipelineConfig
    -stageResults: PipelineStageResult[]
    +process(input: any, options: PipelineOptions): Promise<PipelineExecutionResult>
    +configure(config: Partial<PipelineConfig>): void
    +getStageResults(): PipelineStageResult[]
    -adaptInput(input: any): Promise<EmissionData[]>
    -enhanceWithGrid(data: EmissionData[]): Promise<EmissionData[]>
    -calculateEmissions(data: EmissionData[]): Promise<EmissionResult>
    -calculateUncertainty(result: EmissionResult): Promise<EmissionResult>
    -applyOptimizations(result: EmissionResult): Promise<PipelineExecutionResult>
  }
  
  interface PipelineProcessor {
    +process(input: any, options?: PipelineOptions): Promise<PipelineExecutionResult>
    +configure(config: Partial<PipelineConfig>): void
    +getStageResults(): PipelineStageResult[]
  }
}

package "Compatibility Layer" {
  class CompatibilityWrapper {
    +calculateAIEmissions(tokens: number, model: string): EmissionData
    +calculateAIEmissionsEnhanced(input: any, options: PipelineOptions): Promise<EmissionResult>
    +calculateDigitalEmissions(dataTransfer: number, timeSpent: number, deviceType: string): EmissionData
    +calculateDigitalEmissionsEnhanced(input: any, options: PipelineOptions): Promise<EmissionResult>
    +calculateTransportEmissions(distance: number, mode: string): EmissionData
    +calculateTransportEmissionsEnhanced(input: any, options: PipelineOptions): Promise<EmissionResult>
    +calculateEnergyEmissions(consumption: number, source: string): EmissionData
    +calculateEnergyEmissionsEnhanced(input: any, options: PipelineOptions): Promise<EmissionResult>
    +processEmissions(input: any, options: PipelineOptions): Promise<EmissionResult>
    +isEnhancedPipelineAvailable(): Promise<boolean>
  }
}

' Relationships
UniversalTrackerRegistry *-- EmissionAdapter
Pipeline --> UniversalTrackerRegistry
Pipeline --> EmissionsCalculator
Pipeline --> GridManager
Pipeline --> OptimizationManager
Pipeline --> UncertaintyCalculator
CompatibilityWrapper --> Pipeline
CompatibilityWrapper --> EmissionsCalculator
GridCalculator --> CacheManager
OptimizationManager --> CacheManager
OptimizationManager --> BatchProcessor
UncertaintyCalculator --> MonteCarloSimulation

@enduml
```

## Sequence Diagram - Data Processing Flow

```typescript
@startuml
actor User
participant "Compatibility" as Compat
participant "Pipeline" as Pipeline
participant "Registry" as Registry
participant "Adapter" as Adapter
participant "Calculator" as Calc
participant "GridManager" as Grid
participant "Uncertainty" as Uncertain
participant "Optimization" as Opt

User -> Compat: calculateAIEmissionsEnhanced(input, options)
activate Compat

Compat -> Pipeline: process(input, options)
activate Pipeline

Pipeline -> Registry: detectFormat(input)
activate Registry
Registry -> Adapter: detectConfidence(input)
activate Adapter
Adapter --> Registry: FormatConfidence
deactivate Adapter
Registry --> Pipeline: FormatDetectionResult
deactivate Registry

Pipeline -> Registry: ingest(input)
activate Registry
Registry -> Adapter: ingest(input)
activate Adapter
Adapter --> Registry: normalized data
deactivate Adapter
Registry --> Pipeline: EmissionData[]
deactivate Registry

opt Grid Enhancement Enabled
    Pipeline -> Grid: enhanceWithGridData(data)
    activate Grid
    Grid --> Pipeline: enhanced EmissionData[]
    deactivate Grid
end

Pipeline -> Calc: generateResult(data)
activate Calc
Calc --> Pipeline: EmissionResult
deactivate Calc

opt Uncertainty Enabled
    Pipeline -> Uncertain: calculateUncertainty(result)
    activate Uncertain
    Uncertain --> Pipeline: enhanced EmissionResult
    deactivate Uncertain
end

opt Optimizations Enabled
    Pipeline -> Opt: applyOptimizations(result)
    activate Opt
    Opt --> Pipeline: PipelineExecutionResult
    deactivate Opt
end

Pipeline --> Compat: PipelineExecutionResult
deactivate Pipeline

Compat --> User: EmissionResult
deactivate Compat

@enduml
```

## Component Interaction Diagram

```typescript
@startuml
!include <C4/C4_Component>

Container_Boundary(qarbon, "Qarbon Query System") {
    Component(core, "Core Pipeline", "TypeScript", "Orchestrates data flow through pipeline stages")
    Component(adapters, "Tracker Adapters", "TypeScript", "Converts various input formats to normalized data")
    Component(calculator, "Emissions Calculator", "TypeScript", "Performs emission calculations")
    Component(grid, "Grid Manager", "TypeScript", "Provides grid electricity data and regional factors")
    Component(optimization, "Optimization Layer", "TypeScript", "Handles caching, batching, and performance")
    Component(uncertainty, "Uncertainty Layer", "TypeScript", "Quantifies confidence and error propagation")
    Component(compatibility, "Compatibility Layer", "TypeScript", "Maintains backward compatibility")
    Component(shared, "Shared Types", "TypeScript", "Common data structures and utilities")
}

Container_Boundary(external, "External Systems") {
    Component(files, "File System", "OS", "CSV, JSON, XML files")
    Component(apis, "External APIs", "HTTP", "AI platforms, carbon tracking services")
    Component(streams, "Data Streams", "Network", "Real-time emission data")
    Component(grids, "Grid APIs", "HTTP", "Regional grid data providers")
}

Container_Boundary(clients, "Client Applications") {
    Component(legacy, "Legacy Applications", "Various", "Existing applications using old APIs")
    Component(enhanced, "Enhanced Applications", "Various", "New applications using pipeline features")
    Component(enterprise, "Enterprise Systems", "Various", "Large-scale emission tracking")
}

' Relationships
Rel(legacy, compatibility, "Uses legacy APIs")
Rel(enhanced, core, "Uses pipeline APIs")
Rel(enterprise, core, "Uses batch processing")

Rel(compatibility, calculator, "Delegates to legacy calculator")
Rel(compatibility, core, "Delegates to enhanced pipeline")

Rel(core, adapters, "Uses for format detection and conversion")
Rel(core, calculator, "Uses for emission calculations")
Rel(core, grid, "Uses for grid-aware calculations")
Rel(core, optimization, "Uses for performance improvements")
Rel(core, uncertainty, "Uses for uncertainty quantification")

Rel(adapters, files, "Reads various file formats")
Rel(adapters, apis, "Integrates with external APIs")
Rel(adapters, streams, "Processes real-time data")

Rel(grid, grids, "Fetches regional grid data")
Rel(calculator, shared, "Uses common types")
Rel(adapters, shared, "Uses common types")

@enduml
```

## State Diagram - Pipeline Processing

```typescript
@startuml
[*] --> Idle

Idle --> InputDetection : process(input, options)
InputDetection --> FormatDetection : input received
FormatDetection --> AdapterSelection : format detected
FormatDetection --> Error : no suitable adapter
AdapterSelection --> DataNormalization : adapter selected
DataNormalization --> GridEnhancement : data normalized
DataNormalization --> Error : normalization failed

GridEnhancement --> EmissionCalculation : grid data applied
GridEnhancement --> EmissionCalculation : grid disabled

EmissionCalculation --> UncertaintyCalculation : calculations complete
EmissionCalculation --> Error : calculation failed

UncertaintyCalculation --> OptimizationApplication : uncertainty calculated
UncertaintyCalculation --> OptimizationApplication : uncertainty disabled

OptimizationApplication --> ResultGeneration : optimizations applied
OptimizationApplication --> ResultGeneration : optimizations disabled

ResultGeneration --> Complete : result generated
ResultGeneration --> Error : result generation failed

Complete --> [*] : return result
Error --> [*] : throw error

state InputDetection {
    [*] --> ValidatingInput
    ValidatingInput --> InputValidated : valid
    ValidatingInput --> InputRejected : invalid
}

state FormatDetection {
    [*] --> RunningDetectors
    RunningDetectors --> CalculatingConfidence
    CalculatingConfidence --> RankingAdapters
    RankingAdapters --> SelectingBestMatch
}

state DataNormalization {
    [*] --> IngestingData
    IngestingData --> ValidatingStructure
    ValidatingStructure --> ApplyingDefaults
    ApplyingDefaults --> NormalizationComplete
}

@enduml
```

This comprehensive UML documentation provides:

1. **High-Level Data Flow**: Visual representation of data movement through the system
2. **Detailed Class Diagram**: Complete class structure with relationships
3. **Sequence Diagram**: Step-by-step processing flow
4. **Component Interaction**: System architecture and dependencies
5. **State Diagram**: Pipeline processing states and transitions

The diagrams show how the new architecture maintains backward compatibility while enabling enhanced features through the pipeline system.
