#!/usr/bin/env node

/**
 * QarbonQuery Chrome Extension Loading Debug Script
 * Comprehensive analysis of extension loading issues
 */

const fs = require('fs');
const path = require('path');

const EXTENSION_DIR = path.join(__dirname, '../extension');

console.log('🔍 Debugging QarbonQuery Chrome Extension Loading Issues...\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let issues = [];

function check(description, testFn) {
  totalChecks++;
  try {
    const result = testFn();
    if (result.success) {
      console.log(`✅ ${description}`);
      passedChecks++;
    } else {
      console.log(`❌ ${description} - ${result.error}`);
      failedChecks++;
      issues.push({
        description,
        error: result.error,
        suggestion: result.suggestion,
      });
    }
  } catch (error) {
    console.log(`❌ ${description} - Exception: ${error.message}`);
    failedChecks++;
    issues.push({
      description,
      error: error.message,
      suggestion: 'Check code syntax and file access',
    });
  }
}

console.log('📂 Checking Extension Directory Structure...');

check('Extension directory exists', () => {
  if (fs.existsSync(EXTENSION_DIR)) {
    return { success: true };
  }
  return {
    success: false,
    error: 'Extension directory not found',
    suggestion: 'Run npm run build:extension',
  };
});

check('Manifest.json exists and is valid', () => {
  const manifestPath = path.join(EXTENSION_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return {
      success: false,
      error: 'manifest.json not found',
      suggestion: 'Copy manifest.json to extension directory',
    };
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.manifest_version !== 3) {
      return {
        success: false,
        error: `Wrong manifest version: ${manifest.manifest_version}`,
        suggestion: 'Update to manifest_version: 3',
      };
    }
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: 'Invalid JSON in manifest.json',
      suggestion: 'Fix JSON syntax errors',
    };
  }
});

check('Background script exists', () => {
  const backgroundPath = path.join(EXTENSION_DIR, 'background.js');
  if (!fs.existsSync(backgroundPath)) {
    return {
      success: false,
      error: 'background.js not found',
      suggestion: 'Check webpack build output',
    };
  }

  const stats = fs.statSync(backgroundPath);
  if (stats.size === 0) {
    return {
      success: false,
      error: 'background.js is empty',
      suggestion: 'Check TypeScript compilation',
    };
  }

  return { success: true };
});

check('Content script exists', () => {
  const contentPath = path.join(EXTENSION_DIR, 'content.js');
  if (!fs.existsSync(contentPath)) {
    return {
      success: false,
      error: 'content.js not found',
      suggestion: 'Check webpack build output',
    };
  }
  return { success: true };
});

check('DNR rules file exists and is valid', () => {
  const dnrPath = path.join(EXTENSION_DIR, 'dnr_rules.json');
  if (!fs.existsSync(dnrPath)) {
    return {
      success: false,
      error: 'dnr_rules.json not found',
      suggestion: 'Copy dnr_rules.json to extension directory',
    };
  }

  try {
    const rules = JSON.parse(fs.readFileSync(dnrPath, 'utf8'));
    if (!Array.isArray(rules) || rules.length === 0) {
      return {
        success: false,
        error: 'DNR rules array is empty or invalid',
        suggestion: 'Add valid DNR rules',
      };
    }
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: 'Invalid JSON in dnr_rules.json',
      suggestion: 'Fix JSON syntax',
    };
  }
});

console.log('\n🔍 Checking for Deprecated API Usage...');

check('Background script has no webRequest APIs', () => {
  const backgroundPath = path.join(EXTENSION_DIR, 'background.js');
  const content = fs.readFileSync(backgroundPath, 'utf8');

  const deprecatedAPIs = [
    'chrome.webRequest',
    'chrome.webRequestBlocking',
    'webRequestBlocking',
    'onBeforeRequest',
    'onBeforeSendHeaders',
    'onHeadersReceived',
  ];

  for (const api of deprecatedAPIs) {
    if (content.includes(api)) {
      return {
        success: false,
        error: `Contains deprecated API: ${api}`,
        suggestion:
          'Remove all webRequest API usage and use declarativeNetRequest',
      };
    }
  }

  return { success: true };
});

check('Content script has no webRequest APIs', () => {
  const contentPath = path.join(EXTENSION_DIR, 'content.js');
  const content = fs.readFileSync(contentPath, 'utf8');

  const deprecatedAPIs = ['chrome.webRequest', 'webRequestBlocking'];

  for (const api of deprecatedAPIs) {
    if (content.includes(api)) {
      return {
        success: false,
        error: `Contains deprecated API: ${api}`,
        suggestion: 'Remove webRequest usage from content script',
      };
    }
  }

  return { success: true };
});

console.log('\n🔧 Checking Manifest V3 Compliance...');

check('Manifest uses service_worker (not background scripts)', () => {
  const manifestPath = path.join(EXTENSION_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  if (manifest.background?.scripts) {
    return {
      success: false,
      error: 'Uses deprecated background.scripts',
      suggestion: 'Use background.service_worker',
    };
  }

  if (!manifest.background?.service_worker) {
    return {
      success: false,
      error: 'Missing background.service_worker',
      suggestion: 'Add background.service_worker field',
    };
  }

  return { success: true };
});

check('Manifest uses action (not browser_action)', () => {
  const manifestPath = path.join(EXTENSION_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  if (manifest.browser_action) {
    return {
      success: false,
      error: 'Uses deprecated browser_action',
      suggestion: 'Change to action',
    };
  }

  if (!manifest.action) {
    return {
      success: false,
      error: 'Missing action field',
      suggestion: 'Add action field for popup',
    };
  }

  return { success: true };
});

check('Manifest has proper V3 permissions', () => {
  const manifestPath = path.join(EXTENSION_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const permissions = manifest.permissions || [];
  const badPermissions = permissions.filter(
    p => p === 'webRequest' || p === 'webRequestBlocking' || p === 'background'
  );

  if (badPermissions.length > 0) {
    return {
      success: false,
      error: `Contains deprecated permissions: ${badPermissions.join(', ')}`,
      suggestion: 'Remove deprecated permissions from manifest.json',
    };
  }

  const requiredPermissions = ['declarativeNetRequest', 'storage'];
  const missingPermissions = requiredPermissions.filter(
    p => !permissions.includes(p)
  );

  if (missingPermissions.length > 0) {
    return {
      success: false,
      error: `Missing required permissions: ${missingPermissions.join(', ')}`,
      suggestion: 'Add required V3 permissions',
    };
  }

  return { success: true };
});

console.log('\n💾 Checking Storage Implementation...');

check('Background script uses chrome.storage.local', () => {
  const backgroundPath = path.join(EXTENSION_DIR, 'background.js');
  const content = fs.readFileSync(backgroundPath, 'utf8');

  if (!content.includes('chrome.storage.local')) {
    return {
      success: false,
      error: 'No chrome.storage.local usage found',
      suggestion: 'Implement chrome.storage.local for data persistence',
    };
  }

  return { success: true };
});

check('Content script uses proper messaging', () => {
  const contentPath = path.join(EXTENSION_DIR, 'content.js');
  const content = fs.readFileSync(contentPath, 'utf8');

  if (!content.includes('chrome.runtime.sendMessage')) {
    return {
      success: false,
      error: 'No chrome.runtime.sendMessage usage found',
      suggestion: 'Use chrome.runtime.sendMessage for V3 messaging',
    };
  }

  return { success: true };
});

console.log('\n🌐 Checking DNR Rules Configuration...');

check('DNR rules have proper structure', () => {
  const dnrPath = path.join(EXTENSION_DIR, 'dnr_rules.json');
  const rules = JSON.parse(fs.readFileSync(dnrPath, 'utf8'));

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (!rule.id || !rule.action || !rule.condition) {
      return {
        success: false,
        error: `Rule ${i + 1} missing required fields (id, action, condition)`,
        suggestion: 'Fix DNR rule structure',
      };
    }
  }

  return { success: true };
});

check('DNR rules use modifyHeaders action', () => {
  const dnrPath = path.join(EXTENSION_DIR, 'dnr_rules.json');
  const rules = JSON.parse(fs.readFileSync(dnrPath, 'utf8'));

  const nonModifyHeadersRules = rules.filter(
    rule => rule.action?.type !== 'modifyHeaders'
  );

  if (nonModifyHeadersRules.length > 0) {
    return {
      success: false,
      error: `${nonModifyHeadersRules.length} rules not using modifyHeaders`,
      suggestion: 'Use modifyHeaders action for V3 compatibility',
    };
  }

  return { success: true };
});

console.log('\n🎯 Checking AI Provider Support...');

check('DNR rules cover major AI providers', () => {
  const dnrPath = path.join(EXTENSION_DIR, 'dnr_rules.json');
  const rules = JSON.parse(fs.readFileSync(dnrPath, 'utf8'));

  const expectedProviders = [
    'api.openai.com',
    'api.anthropic.com',
    'generativelanguage.googleapis.com',
    'bedrock',
    'claude.ai',
  ];

  const coveredProviders = expectedProviders.filter(provider =>
    rules.some(rule => rule.condition?.urlFilter?.includes(provider))
  );

  if (coveredProviders.length < expectedProviders.length) {
    const missing = expectedProviders.filter(
      p => !coveredProviders.includes(p)
    );
    return {
      success: false,
      error: `Missing DNR rules for: ${missing.join(', ')}`,
      suggestion: 'Add DNR rules for all AI providers',
    };
  }

  return { success: true };
});

console.log('\n📊 Results Summary:');
console.log(`✅ Passed: ${passedChecks}/${totalChecks}`);
console.log(`❌ Failed: ${failedChecks}/${totalChecks}`);

if (issues.length > 0) {
  console.log('\n🔧 Issues Found:');
  issues.forEach((issue, index) => {
    console.log(`\n${index + 1}. ${issue.description}`);
    console.log(`   Error: ${issue.error}`);
    console.log(`   Suggestion: ${issue.suggestion}`);
  });
}

console.log('\n📋 Manual Loading Test Instructions:');
console.log('1. Open Chrome and go to chrome://extensions/');
console.log('2. Enable "Developer mode" (top right toggle)');
console.log('3. Click "Load unpacked"');
console.log(`4. Select directory: ${EXTENSION_DIR}`);
console.log('5. Check for any error messages');
console.log('6. Look in Chrome DevTools console for any warnings');

console.log('\n🧪 Storage Test Instructions:');
console.log('1. Open any webpage');
console.log('2. Open Chrome DevTools (F12)');
console.log('3. Go to Application tab → Storage → Extension storage');
console.log('4. Look for your extension and check if storage keys exist');

console.log('\n📱 API Test Instructions:');
console.log('1. Visit chat.openai.com or claude.ai');
console.log('2. Send a test message');
console.log('3. Check extension popup for captured data');
console.log('4. Check Chrome DevTools console for debug logs');

if (failedChecks === 0) {
  console.log(
    '\n🎉 All checks passed! Extension should load without webRequestBlocking errors.'
  );
  process.exit(0);
} else {
  console.log(
    '\n⚠️ Issues found that may cause loading problems. Fix the issues above.'
  );
  process.exit(1);
}
