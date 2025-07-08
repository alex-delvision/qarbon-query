#!/usr/bin/env node

/**
 * QarbonQuery Chrome Extension Functionality Test
 * Tests core functionality for Manifest V3 compliance
 */

const fs = require('fs');
const path = require('path');

const EXTENSION_DIR = path.join(__dirname, '../extension');

console.log('🧪 Testing QarbonQuery Chrome Extension Core Functionality...\n');

let testsPassed = 0;
let testsFailed = 0;

function test(description, testFn) {
  try {
    const result = testFn();
    if (result) {
      console.log(`✅ ${description}`);
      testsPassed++;
    } else {
      console.log(`❌ ${description} - Failed`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
    testsFailed++;
  }
}

// Test 1: Manifest structure
test('Manifest has correct Manifest V3 structure', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(EXTENSION_DIR, 'manifest.json'), 'utf8')
  );

  return (
    manifest.manifest_version === 3 &&
    manifest.background?.service_worker === 'background.js' &&
    manifest.action &&
    manifest.permissions.includes('declarativeNetRequest') &&
    manifest.host_permissions.length > 0
  );
});

// Test 2: Background script structure
test('Background script uses V3 APIs only', () => {
  const backgroundJs = fs.readFileSync(
    path.join(EXTENSION_DIR, 'background.js'),
    'utf8'
  );

  // Should NOT contain deprecated APIs
  const hasDeprecatedAPIs = [
    'chrome.webRequest',
    'chrome.browserAction',
    'chrome.extension.getBackgroundPage',
  ].some(api => backgroundJs.includes(api));

  // Should contain V3 APIs
  const hasV3APIs = ['chrome.storage.local', 'chrome.runtime.onMessage'].every(
    api => backgroundJs.includes(api)
  );

  return !hasDeprecatedAPIs && hasV3APIs;
});

// Test 3: Content script structure
test('Content script uses proper V3 patterns', () => {
  const contentJs = fs.readFileSync(
    path.join(EXTENSION_DIR, 'content.js'),
    'utf8'
  );

  // Should use chrome.runtime.sendMessage for communication
  const usesProperMessaging = contentJs.includes('chrome.runtime.sendMessage');

  // Should not use deprecated APIs
  const hasDeprecatedAPIs = [
    'chrome.extension.sendMessage',
    'chrome.extension.getBackgroundPage',
  ].some(api => contentJs.includes(api));

  return usesProperMessaging && !hasDeprecatedAPIs;
});

// Test 4: DNR rules validation
test('DNR rules are properly structured', () => {
  const rules = JSON.parse(
    fs.readFileSync(path.join(EXTENSION_DIR, 'dnr_rules.json'), 'utf8')
  );

  return (
    Array.isArray(rules) &&
    rules.length > 0 &&
    rules.every(rule => rule.id && rule.action && rule.condition)
  );
});

// Test 5: Popup script validation
test('Popup script uses proper storage APIs', () => {
  const popupJs = fs.readFileSync(path.join(EXTENSION_DIR, 'popup.js'), 'utf8');

  return (
    popupJs.includes('chrome.storage.local') &&
    popupJs.includes('chrome.runtime.sendMessage')
  );
});

// Test 6: Check for proper error handling
test('Scripts include proper error handling', () => {
  const backgroundJs = fs.readFileSync(
    path.join(EXTENSION_DIR, 'background.js'),
    'utf8'
  );
  const contentJs = fs.readFileSync(
    path.join(EXTENSION_DIR, 'content.js'),
    'utf8'
  );

  const hasErrorHandling = [backgroundJs, contentJs].every(
    script =>
      script.includes('try') &&
      script.includes('catch') &&
      script.includes('chrome.runtime.lastError')
  );

  return hasErrorHandling;
});

// Test 7: Storage structure validation
test('Uses proper QarbonQuery storage keys', () => {
  const backgroundJs = fs.readFileSync(
    path.join(EXTENSION_DIR, 'background.js'),
    'utf8'
  );

  const hasProperKeys = [
    'qarbon_emissions_',
    'qarbon_queries',
    'qarbon_settings',
  ].every(key => backgroundJs.includes(key));

  return hasProperKeys;
});

// Test 8: Message handling validation
test('Implements proper message handling patterns', () => {
  const backgroundJs = fs.readFileSync(
    path.join(EXTENSION_DIR, 'background.js'),
    'utf8'
  );

  const hasProperMessageHandling = [
    'PROMPT_CAPTURE',
    'API_RESPONSE_CAPTURED',
    'GET_STORAGE_DATA',
    'CLEAR_STORAGE_DATA',
  ].every(msgType => backgroundJs.includes(msgType));

  return hasProperMessageHandling;
});

// Test 9: AI provider support
test('Supports all major AI providers', () => {
  const backgroundJs = fs.readFileSync(
    path.join(EXTENSION_DIR, 'background.js'),
    'utf8'
  );
  const dnrRules = JSON.parse(
    fs.readFileSync(path.join(EXTENSION_DIR, 'dnr_rules.json'), 'utf8')
  );

  const supportedProviders = [
    'openai',
    'anthropic',
    'gemini',
    'bedrock',
    'claude',
  ];
  const hasProviderSupport = supportedProviders.every(provider =>
    backgroundJs.includes(provider)
  );

  const hasProviderRules = [
    'api.openai.com',
    'api.anthropic.com',
    'generativelanguage.googleapis.com',
    'bedrock',
    'claude.ai',
  ].every(pattern =>
    dnrRules.some(rule => rule.condition.urlFilter.includes(pattern))
  );

  return hasProviderSupport && hasProviderRules;
});

// Test 10: Icon files exist
test('All required icon files exist', () => {
  const iconSizes = [16, 32, 48, 128];
  return iconSizes.every(size =>
    fs.existsSync(path.join(EXTENSION_DIR, 'icons', `icon${size}.png`))
  );
});

console.log('\n📊 Test Summary:');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 All functionality tests passed!');
  console.log(
    '✨ Extension is ready for Chrome with full Manifest V3 compliance.'
  );
  console.log('\n📋 Manual Testing Checklist:');
  console.log('□ Load extension in Chrome (chrome://extensions/)');
  console.log('□ Check console for any errors during loading');
  console.log('□ Test popup opens without errors');
  console.log('□ Visit ChatGPT/Claude/Gemini and verify prompt capture');
  console.log('□ Check chrome.storage in DevTools for data persistence');
  console.log('□ Verify token tracking and emission calculations');

  process.exit(0);
} else {
  console.log(
    '\n❌ Some functionality tests failed. Please review and fix issues.'
  );
  process.exit(1);
}
