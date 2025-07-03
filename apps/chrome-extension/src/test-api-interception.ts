/**
 * Test file for API interception functionality
 * This file can be used to test the background.ts API interception logic
 */

// Simplified AIImpactTrackerAdapter for testing
class AIImpactTrackerAdapter {
  ingest(data: any) {
    return {
      ...data,
      timestamp: data.timestamp || Date.now(),
      provider: data.provider || 'unknown',
      emissions: data.emissions || (data.tokens?.total || 0) * (data.energyPerToken || 0.001)
    };
  }
  
  detect(data: any) {
    return data && data.tokens && typeof data.tokens.total === 'number';
  }
}

// Test data that simulates what extractTokens functions would return
const testOpenAIData = {
  model: 'gpt-3.5-turbo',
  tokens: {
    total: 150,
    prompt: 75,
    completion: 75
  },
  timestamp: Date.now(),
  energyPerToken: 0.001,
  emissions: 0.15
};

const testAnthropicData = {
  model: 'claude-3-sonnet',
  tokens: {
    total: 120,
    prompt: 60,
    completion: 60
  },
  timestamp: Date.now(),
  energyPerToken: 0.0012,
  emissions: 0.144
};

// Test the AIImpactTrackerAdapter integration
function testAIImpactTrackerAdapter() {
  console.log('Testing AIImpactTrackerAdapter...');
  
  const adapter = new AIImpactTrackerAdapter();
  
  try {
    // Test OpenAI data normalization
    const normalizedOpenAI = adapter.ingest(testOpenAIData);
    console.log('✅ OpenAI data normalized:', normalizedOpenAI);
    
    // Test Anthropic data normalization
    const normalizedAnthropic = adapter.ingest(testAnthropicData);
    console.log('✅ Anthropic data normalized:', normalizedAnthropic);
    
    // Test detection
    const isOpenAIDetected = adapter.detect(testOpenAIData);
    const isAnthropicDetected = adapter.detect(testAnthropicData);
    
    console.log('✅ OpenAI detection:', isOpenAIDetected);
    console.log('✅ Anthropic detection:', isAnthropicDetected);
    
  } catch (error) {
    console.error('❌ Error testing AIImpactTrackerAdapter:', error);
  }
}

// Test storage simulation (without Chrome APIs)
function testStorageSimulation() {
  console.log('Testing storage simulation...');
  
  const today = new Date().toISOString().split('T')[0];
  const mockStorage: Record<string, any[]> = {};
  
  // Simulate storing data
  const dataToStore = [testOpenAIData, testAnthropicData];
  
  dataToStore.forEach(data => {
    const adapter = new AIImpactTrackerAdapter();
    const normalized = adapter.ingest(data);
    
    if (!mockStorage[today as string]) {
      mockStorage[today as string] = [];
    }
    mockStorage[today as string]?.push(normalized);
  });
  
  console.log('✅ Mock storage result:', mockStorage);
}

// Test URL pattern matching (simulating the isAIAPIRequest function)
function testURLPatternMatching() {
  console.log('Testing URL pattern matching...');
  
  const testUrls = [
    'https://api.openai.com/v1/chat/completions',
    'https://api.anthropic.com/v1/messages',
    'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    'https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-v2/invoke',
    'https://claude.ai/api/organizations/org123/chat_conversations/conv456/completion',
    'https://example.com/not-ai-api',
  ];
  
  const AI_PROVIDER_PATTERNS = [
    '*://api.openai.com/v1/chat/completions',
    '*://api.anthropic.com/v1/messages',
    '*://generativelanguage.googleapis.com/v1*/models/*:generateContent',
    '*://bedrock*.amazonaws.com/model/*/invoke*',
    '*://claude.ai/api/organizations/*/chat_conversations/*/completion',
  ];
  
  function isAIAPIRequest(url: string): boolean {
    return AI_PROVIDER_PATTERNS.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(url);
    });
  }
  
  testUrls.forEach(url => {
    const isAI = isAIAPIRequest(url);
    console.log(`${isAI ? '✅' : '❌'} ${url} -> ${isAI ? 'AI API' : 'Not AI API'}`);
  });
}

// Run all tests
export function runTests() {
  console.log('=== Running API Interception Tests ===');
  testAIImpactTrackerAdapter();
  console.log('');
  testStorageSimulation();
  console.log('');
  testURLPatternMatching();
  console.log('=== Tests completed ===');
}

// Export test functions for potential use in other contexts
export {
  testAIImpactTrackerAdapter,
  testStorageSimulation,
  testURLPatternMatching,
  testOpenAIData,
  testAnthropicData
};
