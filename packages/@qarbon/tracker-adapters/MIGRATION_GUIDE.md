# Migration Guide: detectFormat API Changes

This guide covers the API changes introduced to the `detectFormat` method in
`@qarbon/tracker-adapters` and how to migrate your existing code.

## Overview

The `detectFormat` method has been enhanced with overloaded signatures to support both backward
compatibility and new confidence-based detection features.

## What Changed

### Before (Legacy API)

```typescript
// Simple string/null return
const format = registry.detectFormat(rawData); // string | null
```

### After (Enhanced API)

```typescript
// Legacy usage still works (backward compatible)
const format = registry.detectFormat(rawData); // string | null

// New enhanced detection with confidence scores
const buffer = Buffer.from(rawData);
const result = await registry.detectFormat(buffer); // Promise<FormatDetectionResult>
```

## API Signatures

### Legacy Signature (Unchanged)

```typescript
detectFormat(raw: unknown): string | null
```

- **Input**: Any raw data (`string`, `object`, `array`, etc.)
- **Output**: Synchronous `string | null`
- **Behavior**: Returns the first adapter that can handle the data, or `null`

### Enhanced Signature (New)

```typescript
detectFormat(input: Buffer | NodeJS.ReadableStream): Promise<FormatDetectionResult>
```

- **Input**: `Buffer` or `NodeJS.ReadableStream`
- **Output**: Asynchronous `Promise<FormatDetectionResult>`
- **Behavior**: Returns detailed confidence scores from all adapters

## Return Type Changes

### FormatDetectionResult Interface

```typescript
interface FormatDetectionResult {
  /** The adapter with the highest confidence score, or null if no adapter scored > 0 */
  bestMatch: string | null;

  /** All adapters ranked by confidence score (highest first) */
  confidenceScores: FormatConfidence[];
}

interface FormatConfidence {
  /** Name of the adapter */
  adapterName: string;

  /** Confidence score from 0.0 to 1.0 */
  score: number;

  /** Human-readable explanation of the score */
  evidence: string;
}
```

### Example Results

#### Successful Detection

```json
{
  "bestMatch": "json",
  "confidenceScores": [
    {
      "adapterName": "json",
      "score": 0.95,
      "evidence": "Valid JSON structure with emission fields"
    },
    {
      "adapterName": "csv",
      "score": 0.1,
      "evidence": "Could be CSV but lacks proper headers"
    },
    {
      "adapterName": "xml",
      "score": 0.0,
      "evidence": "No XML structure detected"
    }
  ]
}
```

#### Unrecognized Format

```json
{
  "bestMatch": null,
  "confidenceScores": [
    {
      "adapterName": "json",
      "score": 0.0,
      "evidence": "Invalid JSON syntax"
    },
    {
      "adapterName": "csv",
      "score": 0.0,
      "evidence": "No CSV structure detected"
    },
    {
      "adapterName": "xml",
      "score": 0.0,
      "evidence": "No XML structure detected"
    }
  ]
}
```

## Migration Steps

### Step 1: No Action Required for Legacy Usage

Your existing code continues to work without changes:

```typescript
// This still works exactly as before
const format = registry.detectFormat('{"test": true}'); // 'json'
const format2 = registry.detectFormat(['item1', 'item2']); // null
const format3 = registry.detectFormat({ emissions: 0.5 }); // 'json' or 'codecarbon'
```

### Step 2: Upgrade to Enhanced Detection (Optional)

To access confidence scores and parallel detection, convert your data to `Buffer`:

```typescript
// Before
const data = '{"emissions": 0.5, "duration": 3600}';
const format = registry.detectFormat(data);

// After
const buffer = Buffer.from('{"emissions": 0.5, "duration": 3600}');
const result = await registry.detectFormat(buffer);
const format = result.bestMatch; // Same as before
const confidence = result.confidenceScores[0].score; // New: confidence level
```

### Step 3: Handle Async/Await (If Using Enhanced API)

The enhanced API is asynchronous, so you'll need to handle promises:

```typescript
// Async function context
async function detectWithConfidence(data: string) {
  const buffer = Buffer.from(data);
  const result = await registry.detectFormat(buffer);

  console.log(`Best match: ${result.bestMatch}`);
  console.log(`Confidence: ${result.confidenceScores[0]?.score || 0}`);

  return result.bestMatch;
}

// Promise-based usage
function detectWithPromise(data: string) {
  const buffer = Buffer.from(data);
  return registry.detectFormat(buffer).then(result => {
    console.log(`Best match: ${result.bestMatch}`);
    return result.bestMatch;
  });
}
```

## Use Cases for Enhanced API

### 1. Confidence-Based Decisions

```typescript
const buffer = Buffer.from(uncertainData);
const result = await registry.detectFormat(buffer);

if (result.bestMatch && result.confidenceScores[0].score > 0.8) {
  console.log(`High confidence detection: ${result.bestMatch}`);
  const parsed = registry.ingest(uncertainData);
} else if (result.bestMatch) {
  console.warn(
    `Low confidence detection: ${result.bestMatch} (${result.confidenceScores[0].score})`
  );
  // Maybe ask user for confirmation
} else {
  console.error('No format detected');
  // Handle unknown format
}
```

### 2. Debugging Detection Issues

```typescript
const buffer = Buffer.from(problematicData);
const result = await registry.detectFormat(buffer);

console.log('Detection results:');
result.confidenceScores.forEach(score => {
  console.log(`  ${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`);
});

if (!result.bestMatch) {
  console.log('Why detection failed:');
  console.log(result.confidenceScores.map(s => s.evidence).join('; '));
}
```

### 3. Multiple Format Support

```typescript
const buffer = Buffer.from(ambiguousData);
const result = await registry.detectFormat(buffer);

// Consider multiple high-scoring adapters
const highConfidenceAdapters = result.confidenceScores
  .filter(score => score.score > 0.7)
  .map(score => score.adapterName);

if (highConfidenceAdapters.length > 1) {
  console.log(`Multiple possible formats: ${highConfidenceAdapters.join(', ')}`);
  // Let user choose or use business logic to decide
}
```

## Working with Streams

The enhanced API also supports `ReadableStream` inputs:

```typescript
import { createReadStream } from 'fs';

async function detectFileFormat(filePath: string) {
  const stream = createReadStream(filePath);
  const result = await registry.detectFormat(stream);

  console.log(`File format: ${result.bestMatch}`);
  console.log(`Confidence: ${result.confidenceScores[0]?.score || 0}`);

  return result;
}
```

## TypeScript Integration

Update your type definitions if using TypeScript:

```typescript
import {
  UniversalTrackerRegistry,
  FormatDetectionResult,
  FormatConfidence,
} from '@qarbon/tracker-adapters';

// Type-safe usage
async function typedDetection(
  registry: UniversalTrackerRegistry,
  data: Buffer
): Promise<string | null> {
  const result: FormatDetectionResult = await registry.detectFormat(data);

  // Access with full type safety
  const bestAdapter: string | null = result.bestMatch;
  const scores: FormatConfidence[] = result.confidenceScores;

  return bestAdapter;
}
```

## Performance Considerations

### Legacy API

- **Pros**: Synchronous, faster for simple use cases
- **Cons**: First-match only, no confidence information

### Enhanced API

- **Pros**: Parallel detection, confidence scores, stream support
- **Cons**: Asynchronous, slightly more overhead

### When to Use Which

**Use Legacy API when:**

- You just need a quick format check
- You're working with simple string/object data
- You don't need confidence information
- You prefer synchronous operations

**Use Enhanced API when:**

- You need confidence scores for decision making
- You're working with file streams or large buffers
- You want to debug detection issues
- You need to handle ambiguous formats

## Error Handling

### Legacy API Errors

```typescript
try {
  const format = registry.detectFormat(data);
  if (!format) {
    console.log('Unknown format');
  }
} catch (error) {
  console.error('Detection failed:', error);
}
```

### Enhanced API Errors

```typescript
try {
  const result = await registry.detectFormat(buffer);
  if (!result.bestMatch) {
    console.log('No format detected');
    console.log(
      'Reasons:',
      result.confidenceScores.map(s => s.evidence)
    );
  }
} catch (error) {
  console.error('Detection failed:', error);
}
```

## Common Migration Patterns

### Pattern 1: Simple Wrapper Function

```typescript
// Maintain legacy interface while using enhanced features internally
async function detectFormatWithConfidence(data: string): Promise<{
  format: string | null;
  confidence: number;
}> {
  const buffer = Buffer.from(data);
  const result = await registry.detectFormat(buffer);

  return {
    format: result.bestMatch,
    confidence: result.confidenceScores[0]?.score || 0,
  };
}
```

### Pattern 2: Gradual Migration

```typescript
// Support both APIs during transition period
function detectFormat(data: string | Buffer): string | null | Promise<FormatDetectionResult> {
  if (typeof data === 'string') {
    // Use legacy API for strings
    return registry.detectFormat(data);
  } else {
    // Use enhanced API for buffers
    return registry.detectFormat(data);
  }
}
```

### Pattern 3: Confidence Threshold

```typescript
async function detectWithMinConfidence(
  data: Buffer,
  minConfidence: number = 0.5
): Promise<string | null> {
  const result = await registry.detectFormat(data);

  const topScore = result.confidenceScores[0];
  if (topScore && topScore.score >= minConfidence) {
    return topScore.adapterName;
  }

  return null; // Below threshold
}
```

## Testing Migration

### Test Legacy Compatibility

```typescript
import { describe, it, expect } from 'vitest';

describe('Legacy API compatibility', () => {
  it('should detect JSON format', () => {
    const format = registry.detectFormat('{"test": true}');
    expect(format).toBe('json');
  });

  it('should return null for unknown format', () => {
    const format = registry.detectFormat('unknown data');
    expect(format).toBeNull();
  });
});
```

### Test Enhanced API

```typescript
describe('Enhanced API functionality', () => {
  it('should provide confidence scores', async () => {
    const buffer = Buffer.from('{"emissions": 0.5}');
    const result = await registry.detectFormat(buffer);

    expect(result.bestMatch).toBe('json');
    expect(result.confidenceScores).toHaveLength(6); // Number of adapters
    expect(result.confidenceScores[0].score).toBeGreaterThan(0.5);
  });

  it('should handle unrecognized formats', async () => {
    const buffer = Buffer.from('random data');
    const result = await registry.detectFormat(buffer);

    expect(result.bestMatch).toBeNull();
    expect(result.confidenceScores.every(s => s.score === 0)).toBe(true);
  });
});
```

## Troubleshooting

### Common Issues

1. **TypeError: Cannot await non-Promise**

   ```typescript
   // Wrong: trying to await legacy API
   const result = await registry.detectFormat('string data'); // Error!

   // Right: use Buffer for enhanced API
   const buffer = Buffer.from('string data');
   const result = await registry.detectFormat(buffer); // Works!
   ```

2. **Missing confidence scores**

   ```typescript
   // Make sure you're using the enhanced API
   const result = await registry.detectFormat(Buffer.from(data));
   console.log(result.confidenceScores); // Available

   // Not available in legacy API
   const format = registry.detectFormat(data);
   console.log(format.confidenceScores); // undefined
   ```

3. **Stream handling errors**
   ```typescript
   // Make sure stream is readable
   const stream = createReadStream('file.json');
   stream.on('error', console.error);
   const result = await registry.detectFormat(stream);
   ```

## Summary

The `detectFormat` API changes provide:

✅ **Full backward compatibility** - existing code works unchanged  
✅ **Enhanced confidence scoring** - know how certain the detection is  
✅ **Parallel detection** - all adapters run simultaneously  
✅ **Stream support** - work with large files efficiently  
✅ **Better debugging** - understand why detection succeeded or failed

The migration is optional and can be done gradually. Start using the enhanced API when you need the
additional features, but keep using the legacy API for simple use cases.
