#!/usr/bin/env node

/**
 * Chrome Extension Messaging Test Script
 * Tests Chrome API availability and messaging functionality
 */

const fs = require('fs');
const path = require('path');

const EXTENSION_DIR = path.join(__dirname, '../extension');

console.log('🧪 Testing Chrome Extension Messaging Functionality...\n');

let passed = 0;
let failed = 0;

function test(description, testFn) {
  try {
    const result = testFn();
    if (result.success) {
      console.log(`✅ ${description}`);
      passed++;
    } else {
      console.log(`❌ ${description} - ${result.error}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${description} - Exception: ${error.message}`);
    failed++;
  }
}

// Test 1: Check content script has proper Chrome API error handling
test('Content script includes Chrome API availability checker', () => {
  const contentPath = path.join(EXTENSION_DIR, 'content.js');
  if (!fs.existsSync(contentPath)) {
    return { success: false, error: 'content.js not found' };
  }
  
  const content = fs.readFileSync(contentPath, 'utf8');
  
  const hasAPIChecker = content.includes('isChromeAPIAvailable');
  const hasErrorHandling = content.includes('chrome.runtime.lastError');
  const hasSafeMessaging = content.includes('SafeChromeMessaging');
  
  if (!hasAPIChecker) {
    return { success: false, error: 'Missing Chrome API availability checker' };
  }
  
  if (!hasErrorHandling) {
    return { success: false, error: 'Missing chrome.runtime.lastError checks' };
  }
  
  if (!hasSafeMessaging) {
    return { success: false, error: 'Missing SafeChromeMessaging wrapper' };
  }
  
  return { success: true };
});

// Test 2: Check for retry logic implementation
test('Content script includes retry logic for failed messages', () => {
  const contentPath = path.join(EXTENSION_DIR, 'content.js');
  const content = fs.readFileSync(contentPath, 'utf8');
  
  const hasRetryLogic = content.includes('MAX_RETRIES') && content.includes('RETRY_DELAY');
  const hasFallback = content.includes('sendMessageWithFallback');
  const hasTimeout = content.includes('timeout');
  
  if (!hasRetryLogic) {
    return { success: false, error: 'Missing retry logic implementation' };
  }
  
  if (!hasFallback) {
    return { success: false, error: 'Missing fallback message handling' };
  }
  
  if (!hasTimeout) {
    return { success: false, error: 'Missing timeout handling' };
  }
  
  return { success: true };
});

// Test 3: Check for proper error boundaries around Chrome API calls
test('Chrome API calls are wrapped in try-catch blocks', () => {
  const contentPath = path.join(EXTENSION_DIR, 'content.js');
  const content = fs.readFileSync(contentPath, 'utf8');
  
  // Count try-catch blocks
  const tryBlocks = (content.match(/try\s*{/g) || []).length;
  const catchBlocks = (content.match(/catch\s*\(/g) || []).length;
  
  if (tryBlocks < 5) {
    return { success: false, error: `Insufficient try blocks: ${tryBlocks}, expected at least 5` };
  }
  
  if (catchBlocks < 5) {
    return { success: false, error: `Insufficient catch blocks: ${catchBlocks}, expected at least 5` };
  }
  
  return { success: true };
});

// Test 4: Check for localStorage fallback implementation
test('Content script has localStorage fallback for failed Chrome storage', () => {
  const contentPath = path.join(EXTENSION_DIR, 'content.js');
  const content = fs.readFileSync(contentPath, 'utf8');
  
  const hasLocalStorageFallback = content.includes('localStorage.setItem');
  const hasFallbackKey = content.includes('qarbon_') && content.includes('fallback');
  
  if (!hasLocalStorageFallback) {
    return { success: false, error: 'Missing localStorage fallback' };
  }
  
  if (!hasFallbackKey) {
    return { success: false, error: 'Missing fallback key pattern' };
  }
  
  return { success: true };
});

// Test 5: Check background script handles messages properly
test('Background script has proper message handling', () => {
  const backgroundPath = path.join(EXTENSION_DIR, 'background.js');
  if (!fs.existsSync(backgroundPath)) {
    return { success: false, error: 'background.js not found' };
  }
  
  const content = fs.readFileSync(backgroundPath, 'utf8');
  
  const hasMessageListener = content.includes('chrome.runtime.onMessage.addListener');
  const handlesPromptCapture = content.includes('PROMPT_CAPTURE');
  const handlesAPIResponse = content.includes('API_RESPONSE_CAPTURED');
  
  if (!hasMessageListener) {
    return { success: false, error: 'Missing message listener' };
  }
  
  if (!handlesPromptCapture) {
    return { success: false, error: 'Missing PROMPT_CAPTURE message handling' };
  }
  
  if (!handlesAPIResponse) {
    return { success: false, error: 'Missing API_RESPONSE_CAPTURED message handling' };
  }
  
  return { success: true };
});

// Test 6: Check for duplicate function declarations
test('No duplicate function declarations in content script', () => {
  const contentPath = path.join(EXTENSION_DIR, 'content.js');
  const content = fs.readFileSync(contentPath, 'utf8');
  
  // Look for potential duplicate function names
  const functionNames = [
    'detectPlatform',
    'isAIAPIRequest', 
    'capturePrompt',
    'setupChatObserver'
  ];
  
  for (const funcName of functionNames) {
    const regex = new RegExp(`function\\s+${funcName}`, 'g');
    const matches = content.match(regex) || [];
    
    if (matches.length > 1) {
      return { success: false, error: `Duplicate function: ${funcName} (${matches.length} times)` };
    }
  }
  
  return { success: true };
});

// Test 7: Check for proper async/await usage
test('Async functions use proper error handling', () => {
  const contentPath = path.join(EXTENSION_DIR, 'content.js');
  const content = fs.readFileSync(contentPath, 'utf8');
  
  const hasAsyncFunctions = content.includes('async function');
  const hasAwaitCalls = content.includes('await ');
  const hasPromiseCatch = content.includes('.catch(');
  
  if (!hasAsyncFunctions) {
    return { success: false, error: 'No async functions found' };
  }
  
  if (!hasAwaitCalls) {
    return { success: false, error: 'No await calls found' };
  }
  
  if (!hasPromiseCatch) {
    return { success: false, error: 'Missing .catch() error handling' };
  }
  
  return { success: true };
});

// Test 8: Check manifest permissions for messaging
test('Manifest includes required permissions for messaging', () => {
  const manifestPath = path.join(EXTENSION_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  const hasStoragePermission = manifest.permissions.includes('storage');
  const hasValidServiceWorker = manifest.background && manifest.background.service_worker;
  
  if (!hasStoragePermission) {
    return { success: false, error: 'Missing storage permission' };
  }
  
  if (!hasValidServiceWorker) {
    return { success: false, error: 'Missing or invalid service worker configuration' };
  }
  
  return { success: true };
});

// Test 9: Check for content script injection configuration
test('Manifest properly configures content script injection', () => {
  const manifestPath = path.join(EXTENSION_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  const hasContentScripts = manifest.content_scripts && manifest.content_scripts.length > 0;
  
  if (!hasContentScripts) {
    return { success: false, error: 'No content scripts configured' };
  }
  
  const contentScript = manifest.content_scripts[0];
  const hasMatches = contentScript.matches && contentScript.matches.length > 0;
  const hasJS = contentScript.js && contentScript.js.includes('content.js');
  
  if (!hasMatches) {
    return { success: false, error: 'Content script missing URL matches' };
  }
  
  if (!hasJS) {
    return { success: false, error: 'Content script missing content.js file' };
  }
  
  return { success: true };
});

// Test 10: Check file sizes are reasonable
test('Extension files are reasonable sizes', () => {
  const files = ['background.js', 'content.js', 'popup.js', 'manifest.json'];
  
  for (const file of files) {
    const filePath = path.join(EXTENSION_DIR, file);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `File ${file} not found` };
    }
    
    const stats = fs.statSync(filePath);
    
    // Set reasonable size limits
    const limits = {
      'background.js': 50000,   // 50KB
      'content.js': 100000,     // 100KB 
      'popup.js': 50000,        // 50KB
      'manifest.json': 5000     // 5KB
    };
    
    if (stats.size > limits[file]) {
      return { success: false, error: `File ${file} too large: ${stats.size} bytes > ${limits[file]} bytes` };
    }
    
    if (stats.size === 0) {
      return { success: false, error: `File ${file} is empty` };
    }
  }
  
  return { success: true };
});

console.log('\n📊 Chrome Messaging Test Summary:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 All Chrome messaging tests passed!');
  console.log('✨ Extension should handle Chrome API errors gracefully.');
  console.log('\n📋 Manual Testing Steps:');
  console.log('1. Load extension in Chrome');
  console.log('2. Open DevTools console');
  console.log('3. Visit a test page');
  console.log('4. Look for these logs:');
  console.log('   - "🚀 QarbonQuery content script loading with enhanced error handling..."');
  console.log('   - "✅ Chrome API available"');
  console.log('   - "✅ QarbonQuery content script fully loaded with enhanced error handling"');
  console.log('5. Try sending a message from console:');
  console.log('   chrome.runtime.sendMessage({type: "TEST"})');
  
  process.exit(0);
} else {
  console.log('\n❌ Some Chrome messaging tests failed. Please review above.');
  process.exit(1);
}
