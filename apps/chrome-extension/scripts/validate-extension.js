#!/usr/bin/env node

/**
 * QarbonQuery Chrome Extension Validation Script
 * Checks for Manifest V3 compliance and common issues
 */

const fs = require('fs');
const path = require('path');

const EXTENSION_DIR = path.join(__dirname, '../extension');

console.log('🔍 Validating QarbonQuery Chrome Extension for Manifest V3 compliance...\n');

// Check if extension directory exists
if (!fs.existsSync(EXTENSION_DIR)) {
  console.error('❌ Extension directory not found:', EXTENSION_DIR);
  process.exit(1);
}

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  issues: []
};

function addResult(type, title, message, severity = 'info') {
  const result = { type, title, message, severity };
  results.issues.push(result);
  
  const icon = {
    'pass': '✅',
    'fail': '❌',
    'warning': '⚠️',
    'info': 'ℹ️'
  }[type] || 'ℹ️';
  
  console.log(`${icon} ${title}: ${message}`);
  
  if (type === 'pass') results.passed++;
  else if (type === 'fail') results.failed++;
  else if (type === 'warning') results.warnings++;
}

// 1. Validate manifest.json
console.log('📋 Checking manifest.json...');
const manifestPath = path.join(EXTENSION_DIR, 'manifest.json');

if (!fs.existsSync(manifestPath)) {
  addResult('fail', 'Manifest missing', 'manifest.json not found');
} else {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check manifest version
    if (manifest.manifest_version === 3) {
      addResult('pass', 'Manifest version', 'Using Manifest V3');
    } else {
      addResult('fail', 'Manifest version', `Using Manifest V${manifest.manifest_version}, should be 3`);
    }
    
    // Check for deprecated permissions
    const deprecatedPermissions = ['webRequest', 'webRequestBlocking', 'background'];
    const currentPermissions = manifest.permissions || [];
    
    deprecatedPermissions.forEach(perm => {
      if (currentPermissions.includes(perm)) {
        addResult('fail', 'Deprecated permission', `${perm} is deprecated in Manifest V3`);
      }
    });
    
    // Check for required V3 features
    if (manifest.background && manifest.background.service_worker) {
      addResult('pass', 'Service worker', 'Using service_worker instead of background scripts');
    } else if (manifest.background && manifest.background.scripts) {
      addResult('fail', 'Background scripts', 'Using deprecated background.scripts, should use service_worker');
    }
    
    if (manifest.action) {
      addResult('pass', 'Action API', 'Using action instead of browser_action');
    } else if (manifest.browser_action) {
      addResult('fail', 'Browser action', 'Using deprecated browser_action, should use action');
    }
    
    // Check declarativeNetRequest setup
    if (manifest.permissions.includes('declarativeNetRequest')) {
      addResult('pass', 'DNR permission', 'Has declarativeNetRequest permission');
      
      if (manifest.declarative_net_request && manifest.declarative_net_request.rule_resources) {
        addResult('pass', 'DNR rules', 'Has declarative_net_request rule_resources');
      } else {
        addResult('warning', 'DNR rules', 'Missing declarative_net_request.rule_resources');
      }
    } else {
      addResult('warning', 'DNR permission', 'Missing declarativeNetRequest permission');
    }
    
    // Check host permissions
    if (manifest.host_permissions && manifest.host_permissions.length > 0) {
      addResult('pass', 'Host permissions', 'Using host_permissions (V3 format)');
    } else {
      addResult('warning', 'Host permissions', 'No host_permissions defined');
    }
    
  } catch (error) {
    addResult('fail', 'Manifest parsing', `Failed to parse manifest.json: ${error.message}`);
  }
}

// 2. Check required files
console.log('\n📁 Checking required files...');
const requiredFiles = [
  'background.js',
  'content.js', 
  'popup.js',
  'popup.html',
  'dnr_rules.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(EXTENSION_DIR, file))) {
    addResult('pass', 'Required file', `${file} exists`);
  } else {
    addResult('fail', 'Required file', `${file} missing`);
  }
});

// 3. Check DNR rules
console.log('\n🌐 Checking DNR rules...');
const dnrRulesPath = path.join(EXTENSION_DIR, 'dnr_rules.json');

if (fs.existsSync(dnrRulesPath)) {
  try {
    const rules = JSON.parse(fs.readFileSync(dnrRulesPath, 'utf8'));
    
    if (Array.isArray(rules) && rules.length > 0) {
      addResult('pass', 'DNR rules', `${rules.length} rules defined`);
      
      // Check rule structure
      let validRules = 0;
      rules.forEach((rule, index) => {
        if (rule.id && rule.action && rule.condition) {
          validRules++;
        } else {
          addResult('warning', 'DNR rule structure', `Rule ${index + 1} missing required fields`);
        }
      });
      
      if (validRules === rules.length) {
        addResult('pass', 'DNR rule structure', 'All rules have required fields');
      }
      
    } else {
      addResult('warning', 'DNR rules', 'No rules defined in dnr_rules.json');
    }
    
  } catch (error) {
    addResult('fail', 'DNR rules parsing', `Failed to parse dnr_rules.json: ${error.message}`);
  }
} else {
  addResult('fail', 'DNR rules', 'dnr_rules.json not found');
}

// 4. Check for deprecated API usage in JavaScript files
console.log('\n💻 Checking JavaScript files for deprecated APIs...');
const jsFiles = ['background.js', 'content.js', 'popup.js'];

const deprecatedAPIs = [
  'chrome.webRequest',
  'chrome.webRequestBlocking', 
  'chrome.extension.',
  'chrome.tabs.executeScript',
  'chrome.tabs.insertCSS',
  'chrome.browserAction',
  'chrome.pageAction'
];

jsFiles.forEach(jsFile => {
  const filePath = path.join(EXTENSION_DIR, jsFile);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    deprecatedAPIs.forEach(api => {
      if (content.includes(api)) {
        addResult('fail', 'Deprecated API', `${jsFile} uses deprecated ${api}`);
      }
    });
    
    // Check for proper V3 APIs
    if (jsFile === 'background.js') {
      if (content.includes('chrome.storage.local')) {
        addResult('pass', 'Storage API', 'Uses chrome.storage.local');
      }
      
      if (content.includes('chrome.runtime.onMessage')) {
        addResult('pass', 'Messaging API', 'Uses chrome.runtime.onMessage');
      }
      
      if (content.includes('chrome.declarativeNetRequest')) {
        addResult('pass', 'DNR API', 'Uses chrome.declarativeNetRequest');
      }
    }
  }
});

// 5. Check icons
console.log('\n🎨 Checking icons...');
const iconSizes = [16, 32, 48, 128];
const iconsDir = path.join(EXTENSION_DIR, 'icons');

if (fs.existsSync(iconsDir)) {
  addResult('pass', 'Icons directory', 'icons directory exists');
  
  iconSizes.forEach(size => {
    const iconFile = `icon${size}.png`;
    if (fs.existsSync(path.join(iconsDir, iconFile))) {
      addResult('pass', 'Icon file', `${iconFile} exists`);
    } else {
      addResult('warning', 'Icon file', `${iconFile} missing`);
    }
  });
} else {
  addResult('warning', 'Icons directory', 'icons directory missing');
}

// Summary
console.log('\n📊 Validation Summary:');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);

if (results.failed === 0) {
  console.log('\n🎉 Extension passed Manifest V3 compliance check!');
  
  if (results.warnings > 0) {
    console.log('💡 Consider addressing the warnings above for optimal performance.');
  }
  
  console.log('\n📦 Extension ready for loading in Chrome:');
  console.log(`   Directory: ${EXTENSION_DIR}`);
  console.log('   Steps:');
  console.log('   1. Open Chrome and go to chrome://extensions/');
  console.log('   2. Enable "Developer mode"');
  console.log('   3. Click "Load unpacked"');
  console.log(`   4. Select the directory: ${EXTENSION_DIR}`);
  
  process.exit(0);
} else {
  console.log('\n❌ Extension failed validation. Please fix the issues above.');
  process.exit(1);
}
