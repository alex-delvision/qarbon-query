# Enhanced Format Detection

The `detectFormat` method in `UniversalTrackerRegistry` has been enhanced to support
confidence-based detection with parallel execution while maintaining backward compatibility.

## Key Features

### 1. Parallel Execution

- All registered adapters now run their `detectConfidence` methods in parallel
- Significantly improves performance when multiple adapters are registered
- Uses `Promise.all()` to coordinate parallel execution

### 2. Confidence Scoring

- Each adapter returns a `FormatConfidence` object with:
  - `adapterName`: Name of the adapter (registry key)
  - `score`: Confidence score from 0.0 to 1.0
  - `evidence`: String describing why this score was assigned

### 3. Complete Results

- Returns both the best match and all confidence scores sorted by score
- Enables users to see how well each adapter matched the data
- Useful for debugging and understanding format detection decisions

### 4. Error Handling

- If an adapter throws an error during detection, it receives a score of 0.0
- Error information is included in the evidence field
- Other adapters continue to run normally

### 5. Backward Compatibility

- Legacy usage with simple data types (strings, objects) continues to work
- Returns synchronous results for non-Buffer/ReadableStream inputs
- New functionality requires Buffer or ReadableStream inputs

## Usage Examples

### Enhanced Detection (New)

```javascript
import { UniversalTrackerRegistry } from '@qarbon/tracker-adapters';

const registry = new UniversalTrackerRegistry({
  json: new JsonAdapter(),
  csv: new CsvAdapter(),
  xml: new XmlAdapter(),
});

// Buffer input - returns Promise<FormatDetectionResult>
const buffer = Buffer.from('{"emissions": 0.5, "duration": 3600}');
const result = await registry.detectFormat(buffer);

console.log('Best match:', result.bestMatch); // 'json'
console.log('All scores:');
result.confidenceScores.forEach(score => {
  console.log(`${score.adapterName}: ${score.score} - ${score.evidence}`);
});
// Output:
// json: 0.95 - Valid JSON syntax; Emission properties found; Multiple canonical property types
// csv: 0.0 - Insufficient rows for CSV
// xml: 0.0 - No XML tags found
```

### Legacy Detection (Backward Compatible)

```javascript
// String input - returns string | null synchronously
const format = registry.detectFormat('{"test": true}'); // 'json'
const csvFormat = registry.detectFormat('name,value\ntest,123'); // 'csv'
const unknown = registry.detectFormat('unknown format'); // null
```

## Return Types

### FormatDetectionResult

```typescript
interface FormatDetectionResult {
  bestMatch: string | null; // Registry key of best matching adapter
  confidenceScores: FormatConfidence[]; // All scores, sorted by confidence
}
```

### FormatConfidence

```typescript
interface FormatConfidence {
  adapterName: string; // Registry key (e.g., 'json', 'csv', 'xml')
  score: number; // Confidence score 0.0 to 1.0
  evidence: string; // Human-readable explanation
}
```

## Method Signatures

The `detectFormat` method now has overloaded signatures:

```typescript
// Legacy compatibility
detectFormat(raw: unknown): string | null;

// Enhanced functionality
detectFormat(input: Buffer | NodeJS.ReadableStream): Promise<FormatDetectionResult>;
```

## Performance Benefits

- **Parallel Execution**: All adapters run simultaneously instead of sequentially
- **Early Termination**: No longer stops at first match - evaluates all adapters
- **Better Decisions**: Can choose highest confidence match instead of first match
- **Debugging**: Full visibility into why detection decisions were made

## Migration Guide

### No Changes Required

Existing code using `detectFormat` with strings, objects, or arrays continues to work unchanged.

### To Use Enhanced Features

1. Convert your input to a Buffer:

   ```javascript
   const buffer = Buffer.from(yourStringData, 'utf8');
   const result = await registry.detectFormat(buffer);
   ```

2. Handle the Promise return:

   ```javascript
   // Old way
   const format = registry.detectFormat(data);

   // New way (for Buffer inputs)
   const result = await registry.detectFormat(buffer);
   const format = result.bestMatch;
   ```

3. Use confidence information:

   ```javascript
   const result = await registry.detectFormat(buffer);

   // Best match
   console.log('Detected format:', result.bestMatch);

   // All results with confidence
   result.confidenceScores.forEach(score => {
     console.log(`${score.adapterName}: ${score.score.toFixed(3)}`);
   });
   ```

## Error Handling

Individual adapter failures don't break the detection process:

```javascript
const result = await registry.detectFormat(buffer);

// Check for adapter errors
result.confidenceScores.forEach(score => {
  if (score.score === 0.0 && score.evidence.includes('Error during detection')) {
    console.warn(`Adapter ${score.adapterName} failed: ${score.evidence}`);
  }
});
```
