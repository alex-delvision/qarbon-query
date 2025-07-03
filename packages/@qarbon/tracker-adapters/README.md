# @qarbon/tracker-adapters

A TypeScript package providing a standardized interface for emission tracker adapters. This package
enables consistent integration of various carbon tracking devices and data sources through a unified
adapter pattern.

## Purpose

The `@qarbon/tracker-adapters` package defines the `EmissionAdapter` interface that allows different
emission tracking systems to be integrated seamlessly. Each adapter is responsible for:

- Validating raw tracker payloads
- Normalizing data into a consistent format
- Providing confidence scores for data compatibility
- Extracting source metadata from tracking devices

## Installation

```bash
npm install @qarbon/tracker-adapters
```

## Usage

### Basic Usage with UniversalTrackerRegistry

```typescript
import { UniversalTrackerRegistry, JsonAdapter } from '@qarbon/tracker-adapters';

// Create a registry with adapters
const reg = new UniversalTrackerRegistry({ json: new JsonAdapter() });

// Ingest JSON data
reg.ingest('{"foo":1}');
// Returns: { foo: 1 }

// Or use the default registry (includes JSON, CSV, XML adapters)
import { universalTrackerRegistry } from '@qarbon/tracker-adapters';
const result = universalTrackerRegistry.ingest('{"temperature": 23.5, "co2": 400}');
```

### Using Individual Adapters

```typescript
import { EmissionAdapter } from '@qarbon/tracker-adapters';

// Use an adapter
const adapter: EmissionAdapter = new MyCustomAdapter();
const isValid = await adapter.validate(rawData);
if (isValid) {
  const normalized = await adapter.normalize(rawData);
  const confidence = await adapter.getConfidence(rawData);
  const metadata = await adapter.getSourceMetadata(rawData);
}
```

## Implementing a New Adapter

To create a new emission tracker adapter, implement the `EmissionAdapter` interface:

### 1. Basic Structure

```typescript
import { EmissionAdapter } from '@qarbon/tracker-adapters';

interface MyTrackerData {
  // Define your raw data structure
  deviceId: string;
  timestamp: number;
  readings: number[];
}

interface MyNormalizedData {
  // Define your normalized data structure
  co2Equivalent: number;
  timestamp: Date;
  location?: string;
}

interface MyMetadata {
  deviceId: string;
  firmwareVersion?: string;
  calibrationDate?: Date;
}

export class MyTrackerAdapter
  implements EmissionAdapter<MyTrackerData, MyNormalizedData, MyMetadata> {
  // Implementation methods below
}
```

### 2. Required Methods

#### `validate(data: TInput): boolean | Promise<boolean>`

Validate that the incoming data matches your expected format:

```typescript
async validate(data: MyTrackerData): Promise<boolean> {
  try {
    return (
      typeof data.deviceId === 'string' &&
      typeof data.timestamp === 'number' &&
      Array.isArray(data.readings) &&
      data.readings.every(r => typeof r === 'number')
    );
  } catch {
    return false;
  }
}
```

#### `normalize(data: TInput): TNormalized | Promise<TNormalized>`

Convert raw data into your standardized format:

```typescript
async normalize(data: MyTrackerData): Promise<MyNormalizedData> {
  const avgReading = data.readings.reduce((a, b) => a + b, 0) / data.readings.length;

  return {
    co2Equivalent: avgReading * 2.4, // Apply conversion factor
    timestamp: new Date(data.timestamp),
    location: await this.getLocationFromDevice(data.deviceId)
  };
}
```

## Confidence Algorithm

The confidence algorithm in @qarbon/tracker-adapters determines how well an adapter can handle a
given data format. There are two main approaches used:

### 1. Simple Detection (Most Adapters)

Most adapters use a simple binary `detect(data: unknown): boolean` method that returns `true` if the
adapter can handle the data format, `false` otherwise. This is used by:

- **JsonAdapter**: Detects JSON strings (starting with `{` or `[`) or objects
- **CsvAdapter**: Detects comma-separated values with multiple lines
- **XmlAdapter**: Detects XML-like structures
- **CodeCarbonAdapter**: Detects objects with `duration_seconds` and `emissions_kg` fields
- **AIImpactTrackerAdapter**: Detects objects with required AI impact fields

### 2. Advanced Confidence Scoring (JSONSchemaAdapter)

The `JSONSchemaAdapter` implements a sophisticated confidence scoring algorithm that returns scores
from 0-1:

**Algorithm Steps:**

1. **Perfect Match (Confidence = 1.0)**: If data validates perfectly against any registered schema
2. **Partial Match Scoring**: For invalid data, calculate confidence based on:
   - **Required Properties**: +1 point for each present required property
   - **Type Errors**: +0.5 points for properties that exist but have wrong type/format
   - **Other Validation Errors**: +0.3 points for structural similarities
3. **Final Score**: `passedChecks / totalChecks` (clamped between 0-1)
4. **Detection Threshold**: Returns `true` if confidence > 0.2, allowing ingestion with warnings

**Example Implementation:**

```typescript
// For schemas requiring specific structure
const schema = {
  type: 'object',
  properties: {
    timestamp: { type: 'string', format: 'date-time' },
    emissions: { type: 'number' },
    model: { type: 'string' },
  },
  required: ['timestamp', 'emissions'],
};

// Perfect match (confidence = 1.0)
const perfectData = {
  timestamp: '2023-01-01T00:00:00Z',
  emissions: 0.5,
  model: 'gpt-4',
};

// Partial match (confidence ≈ 0.67)
const partialData = {
  timestamp: '2023-01-01T00:00:00Z', // ✓ Valid required field
  emissions: 'not-a-number', // ⚠ Wrong type but field exists (+0.5)
  // model missing but not required    // - No penalty
};

// Poor match (confidence ≈ 0.33)
const poorData = {
  timestamp: 'invalid-date', // ⚠ Wrong format (+0.5)
  // emissions missing                  // ✗ Required field missing
  extra: 'field',
};
```

**Usage in Registry:**

```typescript
import { JSONSchemaAdapter } from '@qarbon/tracker-adapters';

const schemas = {
  'emission-v1': {
    type: 'object',
    properties: {
      timestamp: { type: 'string', format: 'date-time' },
      emissions: { type: 'number' },
      source: { type: 'string' },
    },
    required: ['timestamp', 'emissions'],
  },
};

const adapter = new JSONSchemaAdapter({
  schemas,
  strict: false, // Allow partial matches
});

// Check confidence for data
const detected = adapter.detect(someData);
if (detected) {
  const result = adapter.ingest(someData);
  console.log(`Processed with confidence: ${result.confidence}`);
  console.log(`Using schema: ${result.schema}`);
}
```

#### `getConfidence(data: TInput): number | Promise<number>`

For custom adapters implementing confidence scoring:

```typescript
async getConfidence(data: MyTrackerData): Promise<number> {
  if (!await this.validate(data)) return 0;

  // Higher confidence for known device IDs or recent data
  const isKnownDevice = data.deviceId.startsWith('MYTRACKER_');
  const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000; // 24 hours

  let confidence = 0.5; // Base confidence
  if (isKnownDevice) confidence += 0.3;
  if (isRecent) confidence += 0.2;

  return Math.min(confidence, 1.0);
}
```

#### `getSourceMetadata(data: TInput): TMetadata | Promise<TMetadata>`

Extract metadata about the data source:

```typescript
async getSourceMetadata(data: MyTrackerData): Promise<MyMetadata> {
  return {
    deviceId: data.deviceId,
    firmwareVersion: await this.getFirmwareVersion(data.deviceId),
    calibrationDate: await this.getLastCalibration(data.deviceId)
  };
}
```

### 3. Complete Example

```typescript
import { EmissionAdapter } from '@qarbon/tracker-adapters';

export class MyTrackerAdapter
  implements EmissionAdapter<MyTrackerData, MyNormalizedData, MyMetadata>
{
  async validate(data: MyTrackerData): Promise<boolean> {
    // Implementation here
  }

  async normalize(data: MyTrackerData): Promise<MyNormalizedData> {
    // Implementation here
  }

  async getConfidence(data: MyTrackerData): Promise<number> {
    // Implementation here
  }

  async getSourceMetadata(data: MyTrackerData): Promise<MyMetadata> {
    // Implementation here
  }

  // Helper methods
  private async getLocationFromDevice(deviceId: string): Promise<string | undefined> {
    // Device-specific location lookup
  }

  private async getFirmwareVersion(deviceId: string): Promise<string | undefined> {
    // Device firmware version lookup
  }

  private async getLastCalibration(deviceId: string): Promise<Date | undefined> {
    // Last calibration date lookup
  }
}
```

## Best Practices

- **Error Handling**: Always handle errors gracefully in your methods
- **Async Operations**: Use async/await for I/O operations like API calls or database queries
- **Type Safety**: Define clear TypeScript interfaces for your data structures
- **Confidence Scoring**: Be conservative with confidence scores; prefer lower scores when uncertain
- **Validation**: Implement thorough validation to prevent runtime errors
- **Testing**: Write comprehensive tests for all adapter methods

## Universal Tracker Registry

The package also includes a `UniversalTrackerRegistry` that provides automatic format detection and
data ingestion for JSON, CSV, XML, and CodeCarbon formats:

```typescript
import { universalTrackerRegistry } from '@qarbon/tracker-adapters';

// Legacy format detection (synchronous)
const format = universalTrackerRegistry.detectFormat('{"test": true}'); // 'json'

// Enhanced format detection with confidence scores (asynchronous)
const buffer = Buffer.from('{"emissions": 0.5, "duration": 3600}');
const detectionResult = await universalTrackerRegistry.detectFormat(buffer);
console.log('Best match:', detectionResult.bestMatch); // 'json'
console.log('Confidence scores:', detectionResult.confidenceScores);
// [
//   { adapterName: 'json', score: 0.95, evidence: 'Valid JSON with emission fields' },
//   { adapterName: 'csv', score: 0.1, evidence: 'Could be CSV but lacks proper structure' }
// ]

// Ingest data
const parsed = universalTrackerRegistry.ingest('{"test": true}'); // { test: true }

// Register custom adapter
universalTrackerRegistry.registerAdapter('custom', new CustomAdapter());
```

### Creating Custom Format Adapters

To add a custom adapter to the `UniversalTrackerRegistry`, implement the `EmissionAdapter`
interface:

```typescript
import { EmissionAdapter, UniversalTrackerRegistry } from '@qarbon/tracker-adapters';

class CustomFormatAdapter implements EmissionAdapter {
  detect(raw: unknown): boolean {
    // Return true if this adapter can handle the data
    return typeof raw === 'string' && raw.startsWith('CUSTOM:');
  }

  ingest(raw: unknown): any {
    // Parse and return the data
    if (typeof raw === 'string') {
      return { custom: raw.slice(7) }; // Remove 'CUSTOM:' prefix
    }
    throw new Error('Invalid custom format');
  }
}

// Register the custom adapter
const registry = new UniversalTrackerRegistry();
registry.registerAdapter('custom', new CustomFormatAdapter());

// Or initialize with custom adapters
const registryWithCustom = new UniversalTrackerRegistry({
  json: new JsonAdapter(),
  custom: new CustomFormatAdapter(),
});

// Use the custom adapter
const result = registry.ingest('CUSTOM:my-data'); // { custom: 'my-data' }
```

#### Advanced Custom Adapter Example

For more complex data formats, you might need additional processing:

```typescript
class AdvancedCustomAdapter implements EmissionAdapter {
  private readonly pattern = /^SENSOR\[(\w+)\]:(.+)$/;

  detect(raw: unknown): boolean {
    return typeof raw === 'string' && this.pattern.test(raw);
  }

  ingest(raw: unknown): any {
    if (typeof raw !== 'string') {
      throw new Error('Expected string input');
    }

    const match = raw.match(this.pattern);
    if (!match) {
      throw new Error('Invalid sensor data format');
    }

    const [, sensorType, data] = match;
    const values = data.split(',').map(v => parseFloat(v.trim()));

    return {
      sensorType,
      values,
      timestamp: Date.now(),
      processed: true,
    };
  }
}

// Usage
const registry = new UniversalTrackerRegistry({
  sensor: new AdvancedCustomAdapter(),
});

const result2 = registry.ingest('SENSOR[temperature]:23.5,24.1,23.8');
// Returns: { sensorType: 'temperature', values: [23.5, 24.1, 23.8], timestamp: ..., processed: true }
```

## Supported Data Formats

The Universal Tracker Registry includes built-in adapters for the following formats:

### CSV Format with Flexible Column Mapping

The CSV adapter features intelligent column mapping that automatically recognizes common aliases for
emission tracking fields. This allows seamless integration with various CSV data sources without
manual configuration.

**Recognized Column Aliases:**

- **Timestamp fields**: `timestamp`, `time`, `date`, `created_at`, `datetime`, `start_time`,
  `end_time`
- **Model fields**: `model`, `model_name`, `ai_model`, `llm_model`, `model_type`, `engine`
- **Duration fields**: `duration`, `duration_seconds`, `time_seconds`, `execution_time`, `runtime`,
  `elapsed_time`, `process_time`
- **Emissions fields**: `emissions`, `co2`, `carbon_emissions`, `co2_emissions`, `emissions_kg`,
  `carbon_footprint`, `co2_equivalent`

**Key Features:**

- Case-insensitive header matching
- Automatic numeric conversion for duration and emissions fields
- Configurable custom column mappings
- Runtime mapping configuration
- Backward compatibility with existing CSV formats

**Example Usage:**

```typescript
import { CsvAdapter, ColumnMappingConfig } from '@qarbon/tracker-adapters';

// Define custom mapping configuration using the interface
const customMapping: Partial<ColumnMappingConfig> = {
  timestamp: ['event_time', 'occurrence_time'],
  model: ['ml_model', 'algorithm'],
  duration: ['exec_time', 'processing_duration'],
  emissions: ['carbon_output', 'co2_produced'],
};

// Basic usage with automatic alias recognition
const adapter = new CsvAdapter();
const csv = `time,ai_model,runtime,co2
2023-01-01T00:00:00Z,gpt-4,15.2,0.002
2023-01-01T00:01:00Z,claude-3,12.8,0.0018`;

const result = adapter.ingest(csv);
// Returns: [
//   { timestamp: "2023-01-01T00:00:00Z", model: "gpt-4", durationSeconds: 15.2, emissionsKg: 0.002 },
//   { timestamp: "2023-01-01T00:01:00Z", model: "claude-3", durationSeconds: 12.8, emissionsKg: 0.0018 }
// ]

// Custom mappings via constructor
const customAdapter = new CsvAdapter({
  timestamp: ['event_time'],
  model: ['ml_model'],
  duration: ['exec_time'],
  emissions: ['carbon_output'],
});

// Runtime mapping configuration
adapter.addColumnMapping('emissions', ['custom_co2_field']);
adapter.setColumnMapping({ timestamp: ['custom_timestamp'] });
const mapping = adapter.getColumnMapping();
adapter.resetColumnMapping(); // Reset to defaults
```

**CSV Processing Behavior:**

- When emission-related columns are detected, returns normalized objects with standard field names
- When no emission columns are found, falls back to legacy key-value pair format
- Handles quoted CSV values and missing data gracefully
- Safely converts numeric strings with validation

### CodeCarbon Format

Supports emission data from the [CodeCarbon](https://github.com/mlco2/codecarbon) library, which
tracks carbon emissions from compute workloads.

**Format Requirements:**

- Must contain `duration_seconds` field (numeric)
- Must contain `emissions_kg` field (numeric)
- Can be provided as JSON string or JavaScript object
- Additional fields are ignored during normalization

**Example Input:**

```typescript
// As JavaScript object
const codeCarbonData = {
  duration_seconds: 10.5,
  emissions_kg: 0.001234,
  timestamp: '2023-12-01T10:30:00Z', // additional fields ignored
  project_name: 'ml-training',
};

// As JSON string
const codeCarbonJson = '{"duration_seconds": 15.2, "emissions_kg": 0.002567}';
```

**Normalized Output:**

```typescript
// Both inputs above normalize to:
{
  durationSeconds: 10.5,  // converted to camelCase
  emissionsKg: 0.001234   // converted to camelCase
}

// JSON string example normalizes to:
{
  durationSeconds: 15.2,
  emissionsKg: 0.002567
}
```

**Usage:**

```typescript
import { universalTrackerRegistry } from '@qarbon/tracker-adapters';

// Detect CodeCarbon format
const format = universalTrackerRegistry.detectFormat({
  duration_seconds: 10.5,
  emissions_kg: 0.001234,
}); // Returns: 'codecarbon'

// Process CodeCarbon data
const result = universalTrackerRegistry.ingest({
  duration_seconds: 10.5,
  emissions_kg: 0.001234,
  extra_metadata: 'ignored',
});
// Returns: { durationSeconds: 10.5, emissionsKg: 0.001234 }
```

## Testing

The package includes comprehensive unit tests using Vitest.

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

The test suite covers all the key functionality:

✅ **registering new adapter works** - Tests that new adapters can be registered and are properly
stored  
✅ **detectFormat returns correct key** - Tests format detection for JSON/CSV/XML strings  
✅ **ingest returns parsed object** - Tests that data is properly parsed and returned  
✅ **unknown format throws or returns fallback** - Tests error handling and custom fallback
behavior  
✅ **mocks for adapters in tests** - Demonstrates how to mock adapters for testing

### Testing Your Own Adapters

When testing custom adapters, you can use the provided mock utilities:

```typescript
import { vi } from 'vitest';
import { UniversalTrackerRegistry } from '@qarbon/tracker-adapters';

// Mock an adapter
class MockAdapter implements EmissionAdapter {
  detect = vi.fn().mockReturnValue(true);
  ingest = vi.fn().mockReturnValue({ mocked: true });
}

// Test with registry
const registry = new UniversalTrackerRegistry({ mock: new MockAdapter() });
const result = registry.ingest('test-data');
expect(result).toEqual({ mocked: true });
```

### Custom Fallback Behavior

Extend the registry to customize unknown format handling:

```typescript
class FallbackRegistry extends UniversalTrackerRegistry {
  protected processUnknown(raw: unknown): any {
    return { unknown: true, raw: raw };
  }
}

const registry = new FallbackRegistry();
const result = registry.ingest('unknown-format'); // { unknown: true, raw: 'unknown-format' }
```

## API Migration Guide

### `detectFormat` Method Changes

The `detectFormat` method has been enhanced with overloaded signatures to support both legacy usage
and new confidence-based detection:

#### Legacy API (Backward Compatible)

```typescript
// Returns string | null synchronously
const format = registry.detectFormat('{"test": true}'); // 'json' | null
const format2 = registry.detectFormat(['item1', 'item2']); // null (unknown)
```

#### Enhanced API (New)

```typescript
// Returns Promise<FormatDetectionResult> for Buffer/ReadableStream
const buffer = Buffer.from('{"emissions": 0.5}');
const result = await registry.detectFormat(buffer);
// {
//   bestMatch: 'json',
//   confidenceScores: [
//     { adapterName: 'json', score: 0.95, evidence: 'Valid JSON structure' },
//     { adapterName: 'csv', score: 0.1, evidence: 'Could be CSV but lacks headers' }
//   ]
// }

// For unrecognized formats:
const unknownResult = await registry.detectFormat(Buffer.from('random data'));
// {
//   bestMatch: null,
//   confidenceScores: [
//     { adapterName: 'json', score: 0.0, evidence: 'Invalid JSON syntax' },
//     { adapterName: 'csv', score: 0.0, evidence: 'No CSV structure detected' }
//   ]
// }
```

#### Migration Steps

1. **No action required for legacy usage**: Existing code using `detectFormat(string | object)`
   continues to work unchanged.

2. **For new confidence-based detection**: Convert your data to `Buffer` and await the result:

   ```typescript
   // Before (legacy)
   const format = registry.detectFormat(jsonString);

   // After (enhanced)
   const buffer = Buffer.from(jsonString);
   const result = await registry.detectFormat(buffer);
   const format = result.bestMatch;
   ```

3. **Access confidence scores**: Use the new API to get detailed confidence information:
   ```typescript
   const result = await registry.detectFormat(buffer);
   result.confidenceScores.forEach(score => {
     console.log(`${score.adapterName}: ${score.score} - ${score.evidence}`);
   });
   ```

#### Breaking Changes

- **None for existing code**: The legacy API remains fully functional
- **New requirement**: Enhanced detection requires `Buffer` or `ReadableStream` input
- **Return type**: Enhanced API returns `Promise<FormatDetectionResult>` instead of `string | null`

#### Type Definitions

```typescript
interface FormatDetectionResult {
  bestMatch: string | null;
  confidenceScores: FormatConfidence[];
}

interface FormatConfidence {
  adapterName: string;
  score: number; // 0.0 to 1.0
  evidence: string;
}

// Method overloads
detectFormat(raw: unknown): string | null;
detectFormat(input: Buffer | NodeJS.ReadableStream): Promise<FormatDetectionResult>;
```

## Contributing

When adding new adapters to this ecosystem:

1. Follow the interface contract strictly
2. Include comprehensive tests
3. Document any device-specific requirements
4. Provide example usage in your adapter's documentation
