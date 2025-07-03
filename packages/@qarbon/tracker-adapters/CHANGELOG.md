# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Enhanced Format Detection API**: Added overloaded `detectFormat` method with confidence-based
  detection for `Buffer` and `ReadableStream` inputs. The enhanced API provides detailed confidence
  scores from all adapters running in parallel, while maintaining full backward compatibility with
  the existing string/object-based detection.

#### New Enhanced Detection Features

- **Confidence Scoring**: Get detailed confidence scores (0.0-1.0) from all adapters with
  human-readable evidence
- **Parallel Detection**: All adapters run simultaneously for better performance
- **Stream Support**: Direct support for `NodeJS.ReadableStream` inputs for efficient file
  processing
- **Better Debugging**: Understand exactly why detection succeeded or failed
- **Backward Compatibility**: Existing `detectFormat(unknown)` usage continues to work unchanged

#### API Signatures

```typescript
// Legacy API (unchanged)
detectFormat(raw: unknown): string | null

// Enhanced API (new)
detectFormat(input: Buffer | NodeJS.ReadableStream): Promise<FormatDetectionResult>

interface FormatDetectionResult {
  bestMatch: string | null;
  confidenceScores: FormatConfidence[];
}

interface FormatConfidence {
  adapterName: string;
  score: number; // 0.0 to 1.0
  evidence: string;
}
```

#### Usage Examples

```typescript
// Legacy usage (still works)
const format = registry.detectFormat('{"test": true}'); // 'json'

// Enhanced usage with confidence scores
const buffer = Buffer.from('{"emissions": 0.5}');
const result = await registry.detectFormat(buffer);
console.log(result.bestMatch); // 'json'
console.log(result.confidenceScores[0]); // { adapterName: 'json', score: 0.95, evidence: '...' }

// Stream processing
const stream = createReadStream('data.json');
const streamResult = await registry.detectFormat(stream);
```

#### Migration Guide

A comprehensive migration guide is available in `MIGRATION_GUIDE.md`. Key points:

- **No breaking changes**: Existing code continues to work without modification
- **Gradual adoption**: Use enhanced API only when you need confidence scores or stream support
- **Type safety**: Full TypeScript support for new interfaces
- **Error handling**: Enhanced error reporting with detailed evidence

See `MIGRATION_GUIDE.md` for complete migration instructions and examples.

- **Flexible Column Mapping for CSV Adapter**: Added comprehensive column mapping capability that
  automatically recognizes common aliases for emission tracking fields. The `CsvAdapter` now
  supports multiple column name variations without requiring manual configuration.

#### Recognized Column Aliases

**Timestamp fields:**

- `timestamp`, `time`, `date`, `created_at`, `datetime`, `start_time`, `end_time`

**Model fields:**

- `model`, `model_name`, `ai_model`, `llm_model`, `model_type`, `engine`

**Duration fields:**

- `duration`, `duration_seconds`, `time_seconds`, `execution_time`, `runtime`, `elapsed_time`,
  `process_time`

**Emissions fields:**

- `emissions`, `co2`, `carbon_emissions`, `co2_emissions`, `emissions_kg`, `carbon_footprint`,
  `co2_equivalent`

#### Features

- Automatic header detection with case-insensitive matching
- Configurable custom column mappings via constructor
- Runtime column mapping management with `addColumnMapping()`, `setColumnMapping()`,
  `getColumnMapping()`, and `resetColumnMapping()` methods
- Seamless integration with existing CSV processing workflow
- Backward compatibility with existing CSV data formats

#### Example Usage

```typescript
import { CsvAdapter } from '@qarbon/tracker-adapters';

// Basic usage - automatic alias recognition
const adapter = new CsvAdapter();
const csv = `time,ai_model,runtime,co2
2023-01-01T00:00:00Z,gpt-4,15.2,0.002
2023-01-01T00:01:00Z,claude-3,12.8,0.0018`;

const result = adapter.ingest(csv);
// Returns normalized data with standard field names:
// [
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
```

### Changed

- CSV adapter now returns normalized objects with standard field names (`timestamp`, `model`,
  `durationSeconds`, `emissionsKg`) when emission-related columns are detected
- Enhanced numeric value parsing with safe conversion and validation

### Fixed

- Improved CSV parsing reliability with better quoted value handling
- Enhanced error handling for invalid numeric values in emission data
