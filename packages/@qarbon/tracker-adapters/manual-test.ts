/**
 * Manual test for AIImpactTrackerAdapter confidence metadata
 * Run with: npx ts-node --esm manual-test.ts
 */

// Minimal EmissionAdapter interface for testing
interface EmissionAdapter {
  detect(raw: unknown): boolean;
  detectConfidence(input: Buffer | NodeJS.ReadableStream): FormatConfidence;
  ingest(raw: unknown): unknown;
}

interface FormatConfidence {
  adapterName: string;
  score: number;
  evidence: string;
}

// Simplified AIImpactTrackerData interface
interface AIImpactTrackerData {
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  timestamp: string | number;
  energyPerToken: number;
  emissions: number;
  confidence?: { low: number; high: number };
}

// Simplified AIImpactTrackerAdapter implementation
class AIImpactTrackerAdapter implements EmissionAdapter {
  detect(raw: unknown): boolean {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          return this.hasAIImpactTrackerFields(parsed);
        } catch {
          return false;
        }
      }
      return false;
    }

    if (typeof raw === 'object' && raw !== null) {
      return this.hasAIImpactTrackerFields(raw);
    }

    return false;
  }

  detectConfidence(input: Buffer | NodeJS.ReadableStream): FormatConfidence {
    // Simplified implementation for testing
    return {
      adapterName: 'AIImpactTrackerAdapter',
      score: 0.9,
      evidence: 'Testing confidence',
    };
  }

  ingest(raw: unknown): AIImpactTrackerData {
    let input: any;

    // Parse string input or use object directly
    if (typeof raw === 'string') {
      try {
        input = JSON.parse(raw);
      } catch (error) {
        throw new Error(
          `Failed to parse AI Impact Tracker JSON data: ${error}`
        );
      }
    } else if (typeof raw === 'object' && raw !== null) {
      input = raw;
    } else {
      throw new Error('AI Impact Tracker data must be a JSON string or object');
    }

    // Validate required fields exist
    if (!this.hasAIImpactTrackerFields(input)) {
      throw new Error(
        'AI Impact Tracker data must contain required fields: model, tokens.total, timestamp, energyPerToken'
      );
    }

    // Extract and validate model
    const model = input.model;
    if (typeof model !== 'string' || model.trim() === '') {
      throw new Error('AI Impact Tracker "model" must be a non-empty string');
    }

    // Extract and validate tokens
    const tokens = input.tokens;
    if (!tokens || typeof tokens !== 'object') {
      throw new Error('AI Impact Tracker "tokens" must be an object');
    }

    const tokensTotal = Number(tokens.total);
    if (isNaN(tokensTotal) || tokensTotal < 0) {
      throw new Error(
        'AI Impact Tracker "tokens.total" must be a valid non-negative number'
      );
    }

    // Extract prompt and completion tokens (optional but validate if present)
    const tokensPrompt =
      tokens.prompt !== undefined ? Number(tokens.prompt) : 0;
    const tokensCompletion =
      tokens.completion !== undefined ? Number(tokens.completion) : 0;

    if (
      tokens.prompt !== undefined &&
      (isNaN(tokensPrompt) || tokensPrompt < 0)
    ) {
      throw new Error(
        'AI Impact Tracker "tokens.prompt" must be a valid non-negative number'
      );
    }

    if (
      tokens.completion !== undefined &&
      (isNaN(tokensCompletion) || tokensCompletion < 0)
    ) {
      throw new Error(
        'AI Impact Tracker "tokens.completion" must be a valid non-negative number'
      );
    }

    // Extract and validate timestamp
    const timestamp = input.timestamp;
    if (
      timestamp === undefined ||
      timestamp === null ||
      (typeof timestamp !== 'string' && typeof timestamp !== 'number')
    ) {
      throw new Error(
        'AI Impact Tracker "timestamp" must be a string or number'
      );
    }

    // Extract and validate energyPerToken
    const energyPerToken = Number(input.energyPerToken);
    if (isNaN(energyPerToken) || energyPerToken < 0) {
      throw new Error(
        'AI Impact Tracker "energyPerToken" must be a valid non-negative number'
      );
    }

    // Extract or compute emissions
    let emissions: number;
    if (input.emissions !== undefined) {
      emissions = Number(input.emissions);
      if (isNaN(emissions) || emissions < 0) {
        throw new Error(
          'AI Impact Tracker "emissions" must be a valid non-negative number'
        );
      }
    } else {
      // Compute emissions as tokens.total * energyPerToken
      emissions = tokensTotal * energyPerToken;
    }

    // Extract or set default confidence metadata
    let confidence: { low: number; high: number } | undefined;
    if (input.confidence !== undefined) {
      // Validate existing confidence structure
      if (
        typeof input.confidence === 'object' &&
        input.confidence !== null &&
        'low' in input.confidence &&
        'high' in input.confidence
      ) {
        const confLow = Number(input.confidence.low);
        const confHigh = Number(input.confidence.high);

        if (isNaN(confLow) || isNaN(confHigh)) {
          throw new Error(
            'AI Impact Tracker "confidence.low" and "confidence.high" must be valid numbers'
          );
        }

        if (confLow > confHigh) {
          throw new Error(
            'AI Impact Tracker "confidence.low" must be less than or equal to "confidence.high"'
          );
        }

        confidence = { low: confLow, high: confHigh };
      } else {
        throw new Error(
          'AI Impact Tracker "confidence" must be an object with "low" and "high" properties'
        );
      }
    } else {
      // Set default confidence range (±20%)
      const margin = emissions * 0.2;
      confidence = {
        low: Math.max(0, emissions - margin),
        high: emissions + margin,
      };
    }

    // Return normalized object with camelCase properties
    const result: AIImpactTrackerData = {
      model: model.trim(),
      tokens: {
        prompt: tokensPrompt,
        completion: tokensCompletion,
        total: tokensTotal,
      },
      timestamp,
      energyPerToken,
      emissions,
    };

    // Only include confidence if it's defined
    if (confidence !== undefined) {
      result.confidence = confidence;
    }

    return result;
  }

  private hasAIImpactTrackerFields(data: unknown): data is {
    model: unknown;
    tokens: { total: unknown; prompt?: unknown; completion?: unknown };
    timestamp: unknown;
    energyPerToken: unknown;
    emissions?: unknown;
    confidence?: unknown;
  } {
    return (
      data &&
      typeof data === 'object' &&
      'model' in data &&
      'tokens' in data &&
      (data as any).tokens &&
      typeof (data as any).tokens === 'object' &&
      'total' in (data as any).tokens &&
      'timestamp' in data &&
      'energyPerToken' in data
    );
  }
}

function testConfidenceFeature() {
  const adapter = new AIImpactTrackerAdapter();

  console.log('🧪 Testing AIImpactTrackerAdapter confidence metadata...\n');

  // Test 1: Default confidence (±20%)
  console.log('📋 Test 1: Default confidence calculation (±20%)');
  const input1 = {
    model: 'gpt-3.5-turbo',
    tokens: { total: 100 },
    timestamp: '2023-01-01T00:00:00Z',
    energyPerToken: 0.001,
  };

  try {
    const result1 = adapter.ingest(input1);
    console.log('   Input:', JSON.stringify(input1, null, 2));
    console.log('   Result:', JSON.stringify(result1, null, 2));
    console.log('   Expected emissions:', 0.1, '(100 * 0.001)');
    console.log('   Expected confidence: low=0.08, high=0.12 (±20%)');

    // Validate results
    if (
      result1.emissions === 0.1 &&
      result1.confidence?.low === 0.08 &&
      result1.confidence?.high === 0.12
    ) {
      console.log('   ✅ Test 1 PASSED\n');
    } else {
      console.log('   ❌ Test 1 FAILED - confidence values incorrect\n');
    }
  } catch (error) {
    console.error('   ❌ Test 1 FAILED:', error.message);
  }

  // Test 2: Existing confidence passed through
  console.log('📋 Test 2: Existing confidence metadata');
  const input2 = {
    model: 'gpt-4',
    tokens: { total: 200 },
    timestamp: '2023-01-01T00:00:00Z',
    energyPerToken: 0.002,
    confidence: { low: 0.25, high: 0.75 },
  };

  try {
    const result2 = adapter.ingest(input2);
    console.log('   Input:', JSON.stringify(input2, null, 2));
    console.log('   Result:', JSON.stringify(result2, null, 2));
    console.log('   Expected confidence: low=0.25, high=0.75 (passed through)');

    // Validate results
    if (result2.confidence?.low === 0.25 && result2.confidence?.high === 0.75) {
      console.log('   ✅ Test 2 PASSED\n');
    } else {
      console.log(
        '   ❌ Test 2 FAILED - confidence not passed through correctly\n'
      );
    }
  } catch (error) {
    console.error('   ❌ Test 2 FAILED:', error.message);
  }

  // Test 3: String confidence values
  console.log('📋 Test 3: String confidence values');
  const input3 = {
    model: 'claude-2',
    tokens: { total: 150 },
    timestamp: '2023-01-01T00:00:00Z',
    energyPerToken: 0.001,
    confidence: { low: '0.1', high: '0.2' },
  };

  try {
    const result3 = adapter.ingest(input3);
    console.log('   Input:', JSON.stringify(input3, null, 2));
    console.log('   Result:', JSON.stringify(result3, null, 2));
    console.log(
      '   Expected confidence: low=0.1, high=0.2 (converted from strings)'
    );

    // Validate results
    if (result3.confidence?.low === 0.1 && result3.confidence?.high === 0.2) {
      console.log('   ✅ Test 3 PASSED\n');
    } else {
      console.log('   ❌ Test 3 FAILED - string conversion failed\n');
    }
  } catch (error) {
    console.error('   ❌ Test 3 FAILED:', error.message);
  }

  // Test 4: Invalid confidence validation
  console.log('📋 Test 4: Invalid confidence validation');
  const input4 = {
    model: 'gpt-3.5-turbo',
    tokens: { total: 100 },
    timestamp: '2023-01-01T00:00:00Z',
    energyPerToken: 0.001,
    confidence: { low: 0.8, high: 0.2 }, // low > high, should fail
  };

  try {
    const result4 = adapter.ingest(input4);
    console.error('   ❌ Test 4 FAILED: Should have thrown an error');
  } catch (error) {
    console.log('   Input:', JSON.stringify(input4, null, 2));
    console.log('   Expected error for low > high');
    console.log('   Actual error:', error.message);
    if (error.message.includes('confidence.low')) {
      console.log('   ✅ Test 4 PASSED (correctly rejected)\n');
    } else {
      console.log('   ❌ Test 4 FAILED - wrong error message\n');
    }
  }

  // Test 5: Zero emissions edge case
  console.log('📋 Test 5: Zero emissions with confidence');
  const input5 = {
    model: 'test-model',
    tokens: { total: 0 },
    timestamp: '2023-01-01T00:00:00Z',
    energyPerToken: 0.001,
  };

  try {
    const result5 = adapter.ingest(input5);
    console.log('   Input:', JSON.stringify(input5, null, 2));
    console.log('   Result:', JSON.stringify(result5, null, 2));
    console.log('   Expected emissions: 0, confidence: low=0, high=0');

    // Validate results
    if (
      result5.emissions === 0 &&
      result5.confidence?.low === 0 &&
      result5.confidence?.high === 0
    ) {
      console.log('   ✅ Test 5 PASSED\n');
    } else {
      console.log('   ❌ Test 5 FAILED - zero case handling incorrect\n');
    }
  } catch (error) {
    console.error('   ❌ Test 5 FAILED:', error.message);
  }

  console.log('🎯 All confidence tests completed!');
}

// Run the tests
testConfidenceFeature();
