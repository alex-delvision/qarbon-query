# DetectionResult API Contract

The `DetectionResult` interface provides a comprehensive detection result containing the primary
adapter recommendation, ranked confidence scores, and optional reason for unrecognized scenarios.

## TypeScript/JavaScript Interface

```typescript
export interface DetectionResult {
  /** The primary recommended adapter, or null if no suitable adapter found */
  primaryAdapter: string | null;
  /** All adapters ranked by confidence score in descending order */
  rankedConfidences: FormatConfidence[];
  /** Optional reason why no adapter was recognized (only present when primaryAdapter is null) */
  unrecognizedReason?: string;
}
```

## JSON API Contract

### Successful Detection

```json
{
  "primaryAdapter": "json",
  "rankedConfidences": [
    {
      "adapterName": "json",
      "score": 0.95,
      "evidence": "Valid JSON structure with emission fields"
    },
    {
      "adapterName": "csv",
      "score": 0.15,
      "evidence": "Could be CSV but missing proper headers"
    },
    {
      "adapterName": "xml",
      "score": 0.0,
      "evidence": "No XML structure detected"
    }
  ]
}
```

### Unrecognized Format (0-score scenario)

```json
{
  "primaryAdapter": null,
  "rankedConfidences": [
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
  ],
  "unrecognizedReason": "No adapters detected valid format"
}
```

## Kotlin API Signature

```kotlin
/**
 * Enhanced detection result containing primary adapter recommendation,
 * ranked confidence scores, and optional reason for unrecognized scenarios.
 */
data class DetectionResult(
    val primaryAdapter: String?,
    val rankedConfidences: List<FormatConfidence>,
    val unrecognizedReason: String? = null
)

// Usage example
val result = DetectionResult(
    primaryAdapter = "json",
    rankedConfidences = listOf(
        FormatConfidence("json", 0.95, "Valid JSON structure with emission fields"),
        FormatConfidence("csv", 0.15, "Could be CSV but missing proper headers")
    ),
    unrecognizedReason = null
)
```

## Java API Signature

```java
import javax.annotation.Nullable;
import javax.annotation.Nonnull;
import java.util.List;
import java.util.Collections;

/**
 * Enhanced detection result containing primary adapter recommendation,
 * ranked confidence scores, and optional reason for unrecognized scenarios.
 */
public class DetectionResult {
    @Nullable public final String primaryAdapter;
    @Nonnull public final List<FormatConfidence> rankedConfidences;
    @Nullable public final String unrecognizedReason;

    public DetectionResult(
        @Nullable String primaryAdapter,
        @Nonnull List<FormatConfidence> rankedConfidences,
        @Nullable String unrecognizedReason
    ) {
        this.primaryAdapter = primaryAdapter;
        this.rankedConfidences = Collections.unmodifiableList(rankedConfidences);
        this.unrecognizedReason = unrecognizedReason;
    }

    // Convenience constructor for successful detection
    public DetectionResult(
        @Nonnull String primaryAdapter,
        @Nonnull List<FormatConfidence> rankedConfidences
    ) {
        this(primaryAdapter, rankedConfidences, null);
    }

    // Convenience constructor for unrecognized format
    public static DetectionResult unrecognized(
        @Nonnull List<FormatConfidence> rankedConfidences,
        @Nonnull String reason
    ) {
        return new DetectionResult(null, rankedConfidences, reason);
    }

    // Getters
    @Nullable
    public String getPrimaryAdapter() {
        return primaryAdapter;
    }

    @Nonnull
    public List<FormatConfidence> getRankedConfidences() {
        return rankedConfidences;
    }

    @Nullable
    public String getUnrecognizedReason() {
        return unrecognizedReason;
    }

    // Utility methods
    public boolean isRecognized() {
        return primaryAdapter != null;
    }

    public boolean hasHighConfidence() {
        return !rankedConfidences.isEmpty() && rankedConfidences.get(0).getScore() >= 0.8;
    }
}
```

## Usage Examples

### TypeScript/JavaScript

```typescript
import { DetectionResult, FormatConfidence } from '@qarbon/tracker-adapters';

// Successful detection
const successResult: DetectionResult = {
  primaryAdapter: 'json',
  rankedConfidences: [
    { adapterName: 'json', score: 0.95, evidence: 'Valid JSON structure' },
    { adapterName: 'csv', score: 0.15, evidence: 'Could be CSV but missing headers' },
  ],
};

// Unrecognized format
const failureResult: DetectionResult = {
  primaryAdapter: null,
  rankedConfidences: [
    { adapterName: 'json', score: 0.0, evidence: 'Invalid JSON syntax' },
    { adapterName: 'csv', score: 0.0, evidence: 'No CSV structure detected' },
  ],
  unrecognizedReason: 'No adapters detected valid format',
};
```

### Kotlin

```kotlin
// Successful detection
val successResult = DetectionResult(
    primaryAdapter = "json",
    rankedConfidences = listOf(
        FormatConfidence("json", 0.95, "Valid JSON structure"),
        FormatConfidence("csv", 0.15, "Could be CSV but missing headers")
    )
)

// Unrecognized format
val failureResult = DetectionResult(
    primaryAdapter = null,
    rankedConfidences = listOf(
        FormatConfidence("json", 0.0, "Invalid JSON syntax"),
        FormatConfidence("csv", 0.0, "No CSV structure detected")
    ),
    unrecognizedReason = "No adapters detected valid format"
)
```

### Java

```java
// Successful detection
DetectionResult successResult = new DetectionResult(
    "json",
    Arrays.asList(
        new FormatConfidence("json", 0.95, "Valid JSON structure"),
        new FormatConfidence("csv", 0.15, "Could be CSV but missing headers")
    )
);

// Unrecognized format
DetectionResult failureResult = DetectionResult.unrecognized(
    Arrays.asList(
        new FormatConfidence("json", 0.0, "Invalid JSON syntax"),
        new FormatConfidence("csv", 0.0, "No CSV structure detected")
    ),
    "No adapters detected valid format"
);

// Check if recognized
if (successResult.isRecognized()) {
    System.out.println("Primary adapter: " + successResult.getPrimaryAdapter());
}
```

## Validation Rules

1. **primaryAdapter**: Must be `null` when no adapter has a score > 0, otherwise should be the
   adapter name with the highest score
2. **rankedConfidences**: Must contain at least one entry, sorted by score in descending order
3. **unrecognizedReason**: Must be present when `primaryAdapter` is `null`, should be absent when
   `primaryAdapter` is not `null`
4. **scores**: Must be between 0.0 and 1.0 inclusive
5. **adapterName**: Must be a valid registered adapter name

## Error Handling

When adapter detection fails:

- Set `primaryAdapter` to `null`
- Include all zero-score confidence results in `rankedConfidences`
- Provide a descriptive `unrecognizedReason`
- Common reasons include:
  - "No adapters detected valid format"
  - "Input format corrupted or incomplete"
  - "Unsupported file format"
  - "Error during format detection"
