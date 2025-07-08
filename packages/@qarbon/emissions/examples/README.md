# @qarbon/emissions Examples

This folder contains practical examples demonstrating how to use the `@qarbon/emissions` package for
various carbon emissions calculation scenarios.

## Getting Started

1. **Install dependencies** (from the package root):

   ```bash
   npm install
   ```

2. **Build the package**:

   ```bash
   npm run build
   ```

3. **Run any example**:
   ```bash
   node examples/csv-example.js
   ```

## Available Examples

### 📄 CSV Processing (`csv-example.js`)

Demonstrates how to process CSV emissions data using the CsvAdapter.

**Features:**

- Manual adapter configuration
- Auto-detection capabilities
- Data validation and normalization
- Regional grid intensity adjustments
- Uncertainty quantification

**Run:**

```bash
node examples/csv-example.js
```

**Sample output:**

```
🧮 CSV Emissions Processing Example
===================================

📄 Loaded CSV data:
   Headers: date, co2_kg, energy_kwh, power_w, duration_h, source, location, device_id
   Rows: 10

🔧 Method 1: Manual Adapter Configuration
------------------------------------------
✅ Validation result: PASSED
🔄 Normalized data sample: {"entries":[{"timestamp":"2023-07-15T10:30:00Z"...
```

### 📋 JSON Processing (`json-example.js`)

Shows how to handle JSON emissions data with nested properties and arrays.

**Features:**

- Nested JSON property mapping
- Array data processing
- Flat vs. structured JSON handling
- Batch processing for multiple measurements
- Performance comparison with original data

**Run:**

```bash
node examples/json-example.js
```

### 🌊 Webhook Streaming (`webhook-example.js`)

Demonstrates real-time processing of streaming emissions data from webhooks.

**Features:**

- NDJSON stream processing
- Server-Sent Events (SSE) handling
- Real-time data simulation
- Mock webhook server setup
- Auto-detection for webhook formats

**Run:**

```bash
node examples/webhook-example.js
```

### 🤖 AI Emissions Tracking (`ai-tracking.js`)

Comprehensive example for tracking AI model emissions with uncertainty analysis.

**Features:**

- Single AI inference calculations
- Batch processing for multiple models
- Model efficiency comparison
- User/task/model usage tracking
- Real-time monitoring simulation
- Monthly emissions estimation

**Run:**

```bash
node examples/ai-tracking.js
```

**Key insights:**

- Compare emissions across different AI models
- Track organizational AI carbon footprint
- Analyze usage patterns and efficiency

### ⚡ Batch Processing (`batch-processing.js`)

Advanced batch processing techniques for large-scale emissions calculations.

**Features:**

- Small and large batch processing
- Performance optimization with different batch sizes
- Mixed calculation type analysis
- Streaming batch processing simulation
- Memory-efficient processing for very large datasets
- Benchmarking utilities

**Run:**

```bash
node examples/batch-processing.js
```

**Performance insights:**

- Optimal batch sizes for different scenarios
- Throughput measurements
- Memory management techniques

## Sample Data Files

### `sample-data.csv`

Real-world CSV format with multiple emission sources:

```csv
date,co2_kg,energy_kwh,power_w,duration_h,source,location,device_id
2023-07-15T10:30:00Z,0.125,0.25,125,2,ml_training,datacenter_1,server_01
2023-07-15T12:30:00Z,0.089,0.18,90,2,web_server,datacenter_1,server_02
...
```

### `sample-data.json`

Structured JSON with nested metrics and metadata:

```json
{
  "measurements": [
    {
      "id": "measurement_001",
      "timestamp": "2023-07-15T10:30:00Z",
      "metrics": {
        "carbon": { "total_kg": 0.125, "intensity": 445.2 },
        "energy": { "consumption_kwh": 0.25, "power_w": 125 }
      },
      "metadata": {
        "source_system": "monitoring_platform",
        "device_id": "server_01",
        "location": "datacenter_west"
      }
    }
  ]
}
```

## Running Multiple Examples

To run all examples in sequence:

```bash
# Run individual examples
node examples/csv-example.js
node examples/json-example.js
node examples/webhook-example.js
node examples/ai-tracking.js
node examples/batch-processing.js
```

Or create a simple script to run them all:

```javascript
// run-all-examples.js
async function runAllExamples() {
  console.log('🚀 Running all @qarbon/emissions examples...\n');

  const examples = [
    './csv-example.js',
    './json-example.js',
    './webhook-example.js',
    './ai-tracking.js',
    './batch-processing.js',
  ];

  for (const example of examples) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Running: ${example}`);
    console.log('='.repeat(50));

    try {
      await require(example);
    } catch (error) {
      console.error(`❌ Error in ${example}:`, error.message);
    }
  }

  console.log('\n✅ All examples completed!');
}

runAllExamples().catch(console.error);
```

## Common Patterns

### Basic Usage Pattern

```javascript
const { EmissionsCalculator, adapterRegistry } = require('@qarbon/emissions');

// 1. Create calculator
const calculator = new EmissionsCalculator({
  enableOptimizations: true,
  enableUncertainty: true,
});

// 2. Calculate emissions
const result = await calculator.calculate({
  type: 'digital',
  dataTransfer: 100,
  timeSpent: 30,
  deviceType: 'desktop',
});

console.log(`Emissions: ${result.data.amount} ${result.data.unit} CO2`);
```

### Adapter Pattern

```javascript
const { CsvAdapter, adapterRegistry } = require('@qarbon/emissions');

// 1. Create and configure adapter
const adapter = new CsvAdapter({
  columnMapping: {
    /* mappings */
  },
});

// 2. Validate and normalize data
const validation = adapter.validate(data);
if (validation.isValid) {
  const normalized = await adapter.normalize(data);
  // Use normalized data...
}
```

### Batch Processing Pattern

```javascript
// 1. Prepare batch data
const batchInputs = [
  { type: 'digital', dataTransfer: 50, timeSpent: 15 },
  { type: 'ai', tokens: 1000, model: 'gpt-4' },
  // ... more inputs
];

// 2. Process in batch
const results = await calculator.calculate(batchInputs, {
  batchSize: 50,
  region: 'US-WEST-1',
});
```

## Environment Configuration

Some examples may require environment variables:

```bash
# Optional: Regional grid intensity API
export QARBON_GRID_API_KEY=your_api_key
export QARBON_GRID_API_URL=https://api.gridintensity.com

# Optional: Feature flags
export QARBON_ENABLE_OPTIMIZATIONS=true
export QARBON_ENABLE_UNCERTAINTY=true
```

## Troubleshooting

### Common Issues

1. **Module not found errors**:

   ```bash
   # Make sure you've built the package
   npm run build
   ```

2. **Performance issues with large datasets**:
   - Use appropriate batch sizes (50-200 items)
   - Enable optimizations
   - Disable uncertainty for faster processing

3. **Memory issues**:
   - Process data in chunks for very large datasets
   - Use streaming patterns for real-time data

### Getting Help

- Check the main [README.md](../README.md) for API documentation
- Review the source code for detailed implementation examples
- File issues on the project repository for bugs or feature requests

## Contributing

To add new examples:

1. Create a new `.js` file in this directory
2. Follow the established pattern with clear console output
3. Include comprehensive comments explaining the concepts
4. Add an entry to this README with description and run instructions
5. Test the example thoroughly before submitting

Example template:

```javascript
/**
 * Your Example Name
 *
 * Description of what this example demonstrates.
 */

const { EmissionsCalculator } = require('@qarbon/emissions');

async function demonstrateYourFeature() {
  console.log('🎯 Your Example Name');
  console.log('===================\n');

  // Your example code here...

  console.log('\n✅ Example complete!');
}

if (require.main === module) {
  demonstrateYourFeature().catch(console.error);
}

module.exports = { demonstrateYourFeature };
```
