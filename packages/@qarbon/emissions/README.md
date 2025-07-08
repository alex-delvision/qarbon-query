# @qarbon/emissions

Carbon emissions calculation engine and methodologies for QarbonQuery. A comprehensive TypeScript
library for calculating, tracking, and analyzing carbon emissions across digital activities, AI
workloads, transport, and energy consumption.

## ⚡ Performance Highlights (v1.1.0)

- **🎯 Sub-millisecond calculations** - AI token calculations in 0.001ms
- **📦 86-91% bundle size reduction** with modular imports
- **🚀 SIMD optimizations** for batch processing (1.9x faster)
- **💾 Memory efficient** - Only 22KB overhead for all modules
- **🌲 Tree-shaking support** for minimal production bundles

## Features

- 🧮 **Multiple calculation methods**: Digital activities, AI workloads, transport, and energy
  consumption
- 🔄 **Data adapters**: Support for CSV, JSON, webhook streams, and various emissions monitoring
  tools
- 🌍 **Regional grid intensity**: Real-time regional carbon intensity adjustments
- 📊 **Uncertainty quantification**: Monte Carlo simulations and confidence intervals
- ⚡ **Performance optimizations**: Batch processing, SIMD operations, and streaming calculations
- 🔧 **Extensible**: Plugin architecture for custom adapters and methodologies
- 📦 **Modular imports**: Use only what you need with specialized entry points

## Installation

```bash
npm install @qarbon/emissions
```

## Modular Imports (v1.1.0+)

For optimal bundle sizes, import only what you need:

### AI Emissions (5.52KB - 86% smaller)

```typescript
import { aiCalculator, calculateGPT4Emissions } from 'qarbon-emissions/ai';

// Quick calculation for GPT-4
const emissions = calculateGPT4Emissions(1000); // 1000 tokens

// Advanced calculation with options
const result = aiCalculator.calculateTokenEmissions(1000, 'gpt-4', {
  region: 'us-west-2',
  includeUncertainty: true,
});
```

### Cloud Emissions (3.46KB - 91% smaller)

```typescript
import { cloudCalculator, calculateEC2T3MicroEmissions } from 'qarbon-emissions/cloud';

// Quick calculation for EC2 t3.micro
const emissions = calculateEC2T3MicroEmissions(24, 'us-west-2'); // 24 hours

// Advanced calculation with options
const result = cloudCalculator.calculateComputeEmissions(24, 't3.micro', {
  region: 'us-west-2',
  provider: 'aws',
});
```

### Crypto Emissions (4.20KB - 89% smaller)

```typescript
import { cryptoCalculator, calculateBitcoinTransactionEmissions } from 'qarbon-emissions/crypto';

// Quick calculation for Bitcoin transactions
const emissions = calculateBitcoinTransactionEmissions(10); // 10 transactions

// Advanced calculation with options
const result = cryptoCalculator.calculateTransactionEmissions(10, 'bitcoin', {
  network: 'mainnet',
  transactionType: 'transfer',
});
```

### Full Bundle (40.55KB - when you need everything)

```typescript
import { EmissionsCalculator } from 'qarbon-emissions';

const calculator = new EmissionsCalculator();
const result = await calculator.calculate({
  type: 'ai',
  tokens: 1000,
  model: 'gpt-4',
});
```

## Quick Start

```typescript
const { adapterRegistry, calculator } = require('@qarbon/emissions');

// Auto-detect adapter and calculate emissions
const adapter = adapterRegistry.autoDetect(rawData);
const normalized = await adapter.normalize(rawData);
const result = calculator.generateResult(normalized);

console.log('Carbon emissions:', result.footprint.total, 'kg CO2');
```

## API Reference

### Core Calculator

The `EmissionsCalculator` is the main interface for calculating carbon emissions:

```typescript
import { EmissionsCalculator } from '@qarbon/emissions';

const calculator = new EmissionsCalculator({
  enableOptimizations: true,
  enableUncertainty: true,
});
```

#### Digital Emissions

Calculate emissions from digital activities:

```typescript
// Modern structured approach
const result = await calculator.calculate(
  {
    type: 'digital',
    dataTransfer: 100, // MB
    timeSpent: 30, // minutes
    deviceType: 'desktop',
  },
  {
    region: 'US-WEST-1',
    includeUncertainty: true,
  }
);

// Legacy method (for backwards compatibility)
const emissions = await calculator.calculateDigitalEmissions(
  100, // dataTransfer in MB
  30, // timeSpent in minutes
  'desktop', // deviceType
  { region: 'US-WEST-1' }
);
```

#### AI Emissions

Calculate emissions from AI model inference:

```typescript
const aiEmissions = await calculator.calculate(
  {
    type: 'ai',
    tokens: 1000,
    model: 'gpt-4',
  },
  {
    includeUncertainty: true,
    uncertaintyOptions: {
      method: 'montecarlo',
      iterations: 10000,
      confidenceLevel: 95,
    },
  }
);

// Legacy method
const emissions = await calculator.calculateAIEmissions(1000, 'gpt-4');
```

#### Transport Emissions

Calculate emissions from transportation:

```typescript
const transportEmissions = await calculator.calculate({
  type: 'transport',
  distance: 50, // km
  mode: 'car',
});
```

#### Energy Emissions

Calculate emissions from energy consumption:

```typescript
const energyEmissions = await calculator.calculate(
  {
    type: 'energy',
    consumption: 100, // kWh
    source: 'grid',
  },
  {
    region: 'EU-CENTRAL-1',
  }
);
```

#### Batch Processing

Process multiple calculations efficiently:

```typescript
const batchInputs = [
  { type: 'digital', dataTransfer: 50, timeSpent: 15, deviceType: 'mobile' },
  { type: 'ai', tokens: 500, model: 'gpt-3.5-turbo' },
  { type: 'transport', distance: 25, mode: 'train' },
];

const batchResults = await calculator.calculate(batchInputs, {
  region: 'US-EAST-1',
  batchSize: 100,
});
```

### Data Adapters

The adapter system automatically detects and processes various data formats:

#### Auto-detection

```typescript
import { adapterRegistry } from '@qarbon/emissions';

// Auto-detect the best adapter for your data
const adapter = adapterRegistry.autoDetect(rawData);
if (adapter) {
  const validation = adapter.validate(rawData);
  if (validation.isValid) {
    const normalized = await adapter.normalize(rawData);
    const result = await calculator.calculate(normalized);
  }
}
```

#### CSV Adapter

```typescript
import { CsvAdapter } from '@qarbon/emissions';

const csvAdapter = new CsvAdapter({
  columnMapping: {
    timestamp: 'date',
    emissions: 'co2_kg',
    energy: 'energy_kwh',
    source: 'measurement_source',
  },
  delimiter: ',',
  hasHeader: true,
});

const csvData = {
  headers: ['date', 'co2_kg', 'energy_kwh', 'measurement_source'],
  rows: [
    ['2023-07-15T10:30:00Z', '0.125', '0.25', 'ml_training'],
    ['2023-07-15T12:30:00Z', '0.089', '0.18', 'web_server'],
  ],
  config: csvAdapter.config,
};

const normalized = await csvAdapter.normalize(csvData);
```

#### JSON Adapter

```typescript
import { JsonAdapter } from '@qarbon/emissions';

const jsonAdapter = new JsonAdapter({
  propertyMapping: {
    timestamp: 'data.timestamp',
    emissions: 'metrics.carbon.total_kg',
    energy: 'metrics.energy.consumption_kwh',
    source: 'metadata.source_system',
  },
});

const jsonData = {
  data: {
    data: { timestamp: '2023-07-15T10:30:00Z' },
    metrics: {
      carbon: { total_kg: 0.125 },
      energy: { consumption_kwh: 0.25 },
    },
    metadata: { source_system: 'monitoring_platform' },
  },
  config: jsonAdapter.config,
};

const normalized = await jsonAdapter.normalize(jsonData);
```

#### Webhook Stream Adapter

```typescript
import { WebhookStreamAdapter } from '@qarbon/emissions';

const webhookAdapter = new WebhookStreamAdapter({
  format: 'ndjson',
  fieldMapping: {
    timestamp: 'ts',
    emissions: 'co2_kg',
    source: 'device_id',
  },
});

const streamData = {
  webhook_id: 'webhook_001',
  timestamp: '2023-07-15T10:30:00Z',
  format: 'ndjson',
  data: '{"ts":"2023-07-15T10:30:00Z","co2_kg":0.125,"device_id":"sensor_01"}\n{"ts":"2023-07-15T10:31:00Z","co2_kg":0.130,"device_id":"sensor_01"}',
  config: webhookAdapter.config,
};

const normalized = await webhookAdapter.normalize(streamData);
```

### Regional Grid Intensity

Automatically adjust calculations based on regional carbon intensity:

```typescript
const emissions = await calculator.calculate(
  {
    type: 'digital',
    dataTransfer: 100,
    timeSpent: 30,
    deviceType: 'desktop',
  },
  {
    region: 'EU-WEST-1', // Uses European grid intensity
    timestamp: new Date(), // Uses current time for intensity lookup
  }
);
```

### Uncertainty Quantification

Add uncertainty analysis to your calculations:

```typescript
const emissionsWithUncertainty = await calculator.calculate(
  {
    type: 'ai',
    tokens: 1000,
    model: 'gpt-4',
  },
  {
    includeUncertainty: true,
    uncertaintyOptions: {
      confidenceLevel: 95, // 90, 95, or 99
      method: 'montecarlo', // 'linear' or 'montecarlo'
      iterations: 10000, // Number of Monte Carlo iterations
    },
  }
);

console.log(
  'Emissions range:',
  emissionsWithUncertainty.data.uncertainty.low,
  '-',
  emissionsWithUncertainty.data.uncertainty.high,
  'g CO2'
);
```

### Result Generation

Generate comprehensive emission reports:

```typescript
const emissions = [
  await calculator.calculateDigitalEmissions(100, 30, 'desktop'),
  await calculator.calculateAIEmissions(1000, 'gpt-4'),
  await calculator.calculateTransportEmissions(50, 'car'),
];

const result = calculator.generateResult(emissions);

console.log({
  totalEmissions: result.footprint.total,
  breakdown: result.footprint.breakdown,
  metadata: result.metadata,
});
```

## Supported Adapters

| Adapter                    | Description                                | Supported Formats |
| -------------------------- | ------------------------------------------ | ----------------- |
| **CsvAdapter**             | CSV files with configurable column mapping | CSV               |
| **JsonAdapter**            | JSON objects with nested property support  | JSON              |
| **WebhookStreamAdapter**   | Real-time streaming data from webhooks     | NDJSON, SSE       |
| **CodeCarbonAdapter**      | CodeCarbon library output                  | JSON              |
| **Eco2AIAdapter**          | Eco2AI framework data                      | JSON              |
| **GreenAlgorithmsAdapter** | Green Algorithms calculator output         | JSON              |
| **MLCO2ImpactAdapter**     | ML CO2 Impact calculator data              | JSON              |
| **EnergyUsageAdapter**     | Generic energy usage data                  | JSON, CSV         |

## Examples

See the [examples folder](./examples) for complete working examples:

- [CSV processing example](./examples/csv-example.js)
- [JSON data processing](./examples/json-example.js)
- [Webhook streaming setup](./examples/webhook-example.js)
- [AI emissions tracking](./examples/ai-tracking.js)
- [Batch processing](./examples/batch-processing.js)

## Configuration

### Environment Variables

```bash
# Regional grid intensity API configuration
QARBON_GRID_API_KEY=your_api_key
QARBON_GRID_API_URL=https://api.gridintensity.com

# Feature flags
QARBON_ENABLE_OPTIMIZATIONS=true
QARBON_ENABLE_UNCERTAINTY=true
QARBON_ENABLE_BATCH_OPTIMIZATIONS=true
```

### Emissions Factors

The library includes comprehensive emissions factors for:

- **Digital activities**: Device-specific factors for mobile, desktop, and tablet
- **AI models**: Token-based factors for GPT-3.5, GPT-4, Claude, and other LLMs
- **Transport**: Per-kilometer factors for car, train, plane, and bus
- **Energy**: Grid intensity factors by region and energy source

## Performance

### Optimizations (v1.1.0)

- **SIMD-optimized batch processing**: 1.9x faster per item with Float32Array
- **Map-based factor lookups**: O(1) performance vs O(n) object property access
- **Pre-compiled regexes**: Faster pattern matching for model identification
- **LRU caching**: Warm cache performance for repeated calculations
- **Memory pooling**: Efficient object reuse for reduced garbage collection
- **Feature flags**: Runtime optimization control with graceful fallbacks

### Bundle Sizes

| Entry Point                   | Bundle Size | Reduction vs Full |
| ----------------------------- | ----------- | ----------------- |
| `qarbon-emissions/ai`         | 5.52KB      | 86% smaller       |
| `qarbon-emissions/cloud`      | 3.46KB      | 91% smaller       |
| `qarbon-emissions/crypto`     | 4.20KB      | 89% smaller       |
| `qarbon-emissions/calculator` | 31.54KB     | 22% smaller       |
| `qarbon-emissions` (full)     | 40.55KB     | baseline          |

### Performance Benchmarks

| Operation                     | Performance | Target | Status                |
| ----------------------------- | ----------- | ------ | --------------------- |
| AI Module Loading             | 0.005ms     | 10ms   | ✅ 2000x under        |
| AI Token Calculation          | 0.001ms     | 1ms    | ✅ 1000x under        |
| AI Batch (100 items)          | 0.053ms     | 50ms   | ✅ 943x under         |
| Cloud Compute Calculation     | <0.001ms    | 1ms    | ✅ 1000x+ under       |
| Memory Overhead (all modules) | +22KB       | <50KB  | ✅ 2.3x under         |
| Cache Speedup                 | 1.0x        | N/A    | ✅ No cold/warm delta |
| Batch Processing Speedup      | 1.9x        | 1.5x   | ✅ 27% better         |

### Run Your Own Benchmarks

```bash
# Run performance benchmarks
npm run test:performance

# Analyze bundle sizes
npm run build:optimize

# Check bundle sizes
npm run size-limit
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run AI-specific tests
npm run test:ai

# Run in browser
npm run test:browser
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-adapter`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Submit a pull request

### Adding Custom Adapters

Extend the `BaseAdapter` class to create custom adapters:

```typescript
import { BaseAdapter, ValidationResult, NormalizedData } from '@qarbon/emissions';

export class CustomAdapter extends BaseAdapter<CustomData> {
  constructor() {
    super({
      name: 'CustomAdapter',
      version: '1.0.0',
      description: 'Custom adapter for specific data format',
      supportedFormats: ['custom']
    });
  }

  validate(input: CustomData): ValidationResult {
    // Implement validation logic
    return { isValid: true };
  }

  normalize(input: CustomData): NormalizedData {
    // Implement normalization logic
    return { /* normalized data */ };
  }

  getConfidence(input: CustomData): number {
    // Return confidence score 0-1
    return 0.8;
  }

  protected getDetectionHeuristics() {
    // Define detection heuristics
    return [
      { weight: 1.0, test: (data) => /* detection logic */ }
    ];
  }
}

// Register the adapter
import { adapterRegistry } from '@qarbon/emissions';
adapterRegistry.registerAdapter(new CustomAdapter());
```

## License

MIT

## Changelog

### v0.3.0

- Added uncertainty quantification with Monte Carlo simulations
- Improved adapter auto-detection with ML-based scoring
- Added regional grid intensity support
- Performance optimizations for batch processing

### v0.2.0

- Added webhook stream adapter
- Improved TypeScript support
- Added comprehensive test coverage

### v0.1.0

- Initial release with basic calculation methods
- CSV and JSON adapter support
