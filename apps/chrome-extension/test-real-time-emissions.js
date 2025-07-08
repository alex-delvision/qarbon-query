/**
 * Test script for real-time emission display
 * Run this in the extension's background script console to test
 */

// Test function to emit AI_TOKENS message with emissions and confidence data
function testRealTimeEmissions() {
  const testData = [
    {
      emissions: 2.5,
      confidence: { low: 2.0, high: 3.0 },
      provider: 'openai',
      model: 'gpt-3.5-turbo',
    },
    {
      emissions: 15.2,
      confidence: { low: 12.1, high: 18.3 },
      provider: 'anthropic',
      model: 'claude-3-haiku',
    },
    {
      emissions: 35.8,
      confidence: { low: 30.2, high: 41.4 },
      provider: 'openai',
      model: 'gpt-4',
    },
    {
      emissions: 65.5,
      confidence: { low: 58.9, high: 72.1 },
      provider: 'anthropic',
      model: 'claude-3-opus',
    },
  ];

  console.log('Testing real-time emission display...');

  testData.forEach((data, index) => {
    setTimeout(() => {
      const message = {
        type: 'AI_TOKENS',
        data: {
          provider: data.provider,
          model: data.model,
          tokens: { total: 100, prompt: 50, completion: 50 },
          emissions: data.emissions,
          confidence: data.confidence,
          timestamp: Date.now(),
          energy: data.emissions * 0.001,
        },
      };

      // Send to all contexts (popup, content scripts, etc.)
      chrome.runtime.sendMessage(message).catch(error => {
        console.log('No message receivers available:', error?.message);
      });

      console.log(`Test ${index + 1}: Sent emission data:`, {
        emissions: data.emissions,
        confidence: data.confidence,
        colorLevel: getColorLevel(data.emissions),
      });
    }, index * 6000); // 6 second intervals to see each display change
  });
}

// Helper function to show expected color levels
function getColorLevel(emissions) {
  if (emissions < 5) return 'LOW (green)';
  if (emissions < 25) return 'MEDIUM (yellow)';
  if (emissions < 50) return 'HIGH (orange)';
  return 'VERY HIGH (red)';
}

// Auto-run test when script is loaded
console.log(
  'Real-time emission test script loaded. Run testRealTimeEmissions() to test.'
);
console.log(
  'Make sure the popup is open to see the real-time display in action.'
);

// Export for manual testing
if (typeof window !== 'undefined') {
  window.testRealTimeEmissions = testRealTimeEmissions;
}
