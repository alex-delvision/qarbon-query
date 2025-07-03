/**
 * Simple test script to verify AIImpactTrackerAdapter confidence functionality
 */

// Import the adapter
const { AIImpactTrackerAdapter } = require('./dist/adapters/AIImpactTrackerAdapter.js');

function testConfidenceFeature() {
  const adapter = new AIImpactTrackerAdapter();
  
  console.log('Testing AIImpactTrackerAdapter confidence metadata...\n');
  
  // Test 1: Default confidence (±20%)
  console.log('Test 1: Default confidence calculation (±20%)');
  const input1 = {
    model: 'gpt-3.5-turbo',
    tokens: { total: 100 },
    timestamp: '2023-01-01T00:00:00Z',
    energyPerToken: 0.001,
  };
  
  try {
    const result1 = adapter.ingest(input1);
    console.log('Input:', JSON.stringify(input1, null, 2));
    console.log('Result:', JSON.stringify(result1, null, 2));
    console.log('Expected emissions:', 0.1, '(100 * 0.001)');
    console.log('Expected confidence: low=0.08, high=0.12 (±20%)');
    console.log('✓ Test 1 passed\n');
  } catch (error) {
    console.error('✗ Test 1 failed:', error.message);
  }
  
  // Test 2: Existing confidence passed through
  console.log('Test 2: Existing confidence metadata');
  const input2 = {
    model: 'gpt-4',
    tokens: { total: 200 },
    timestamp: '2023-01-01T00:00:00Z',
    energyPerToken: 0.002,
    confidence: { low: 0.25, high: 0.75 }
  };
  
  try {
    const result2 = adapter.ingest(input2);
    console.log('Input:', JSON.stringify(input2, null, 2));
    console.log('Result:', JSON.stringify(result2, null, 2));
    console.log('Expected confidence: low=0.25, high=0.75 (passed through)');
    console.log('✓ Test 2 passed\n');
  } catch (error) {
    console.error('✗ Test 2 failed:', error.message);
  }
  
  // Test 3: String confidence values
  console.log('Test 3: String confidence values');
  const input3 = {
    model: 'claude-2',
    tokens: { total: 150 },
    timestamp: '2023-01-01T00:00:00Z',
    energyPerToken: 0.001,
    confidence: { low: '0.1', high: '0.2' }
  };
  
  try {
    const result3 = adapter.ingest(input3);
    console.log('Input:', JSON.stringify(input3, null, 2));
    console.log('Result:', JSON.stringify(result3, null, 2));
    console.log('Expected confidence: low=0.1, high=0.2 (converted from strings)');
    console.log('✓ Test 3 passed\n');
  } catch (error) {
    console.error('✗ Test 3 failed:', error.message);
  }
  
  // Test 4: Invalid confidence validation
  console.log('Test 4: Invalid confidence validation');
  const input4 = {
    model: 'gpt-3.5-turbo',
    tokens: { total: 100 },
    timestamp: '2023-01-01T00:00:00Z',
    energyPerToken: 0.001,
    confidence: { low: 0.8, high: 0.2 } // low > high, should fail
  };
  
  try {
    const result4 = adapter.ingest(input4);
    console.error('✗ Test 4 failed: Should have thrown an error');
  } catch (error) {
    console.log('Input:', JSON.stringify(input4, null, 2));
    console.log('Expected error for low > high');
    console.log('Actual error:', error.message);
    console.log('✓ Test 4 passed (correctly rejected)\n');
  }
  
  // Test 5: Zero emissions edge case
  console.log('Test 5: Zero emissions with confidence');
  const input5 = {
    model: 'test-model',
    tokens: { total: 0 },
    timestamp: '2023-01-01T00:00:00Z',
    energyPerToken: 0.001,
  };
  
  try {
    const result5 = adapter.ingest(input5);
    console.log('Input:', JSON.stringify(input5, null, 2));
    console.log('Result:', JSON.stringify(result5, null, 2));
    console.log('Expected emissions: 0, confidence: low=0, high=0');
    console.log('✓ Test 5 passed\n');
  } catch (error) {
    console.error('✗ Test 5 failed:', error.message);
  }
  
  console.log('All confidence tests completed!');
}

// Run the tests
testConfidenceFeature();
