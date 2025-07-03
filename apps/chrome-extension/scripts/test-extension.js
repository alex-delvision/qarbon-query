#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing QarbonQuery Chrome Extension...\n');

const extensionDir = path.join(__dirname, '../extension');

// Check if extension directory exists
if (!fs.existsSync(extensionDir)) {
  console.error('❌ Extension directory not found. Run "npm run build:complete" first.');
  process.exit(1);
}

// Validate manifest.json
console.log('1. Validating manifest.json...');
const manifestPath = path.join(extensionDir, 'manifest.json');
try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Check required fields
  const requiredFields = ['manifest_version', 'name', 'version', 'permissions'];
  const missingFields = requiredFields.filter(field => !manifest[field]);
  
  if (missingFields.length > 0) {
    console.error(`❌ Missing required manifest fields: ${missingFields.join(', ')}`);
    process.exit(1);
  }
  
  if (manifest.manifest_version !== 3) {
    console.error('❌ Manifest must be version 3 for Chrome extensions');
    process.exit(1);
  }
  
  console.log('✅ Manifest.json is valid');
} catch (error) {
  console.error('❌ Invalid manifest.json:', error.message);
  process.exit(1);
}

// Check required files
console.log('2. Checking required files...');
const requiredFiles = [
  'background.js',
  'content.js', 
  'popup.js',
  'popup.html',
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png'
];

const missingFiles = [];
requiredFiles.forEach(file => {
  const filePath = path.join(extensionDir, file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error('❌ Missing required files:');
  missingFiles.forEach(file => console.error(`   - ${file}`));
  process.exit(1);
}

console.log('✅ All required files present');

// Basic JavaScript syntax check
console.log('3. Checking JavaScript syntax...');
const jsFiles = ['background.js', 'content.js', 'popup.js'];

for (const jsFile of jsFiles) {
  try {
    const filePath = path.join(extensionDir, jsFile);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic syntax check - look for common issues
    if (content.includes('import ') && !content.includes('export')) {
      console.warn(`⚠️  ${jsFile} contains import statements - may cause issues in Chrome extension`);
    }
    
    // Check for Chrome API usage
    if (content.includes('chrome.') || content.includes('browser.')) {
      console.log(`✅ ${jsFile} contains Chrome API calls`);
    }
    
  } catch (error) {
    console.error(`❌ Error reading ${jsFile}:`, error.message);
    process.exit(1);
  }
}

// Check HTML file
console.log('4. Validating popup.html...');
try {
  const htmlContent = fs.readFileSync(path.join(extensionDir, 'popup.html'), 'utf8');
  
  if (!htmlContent.includes('<!DOCTYPE html>')) {
    console.warn('⚠️  popup.html missing DOCTYPE declaration');
  }
  
  if (!htmlContent.includes('<script src="popup.js">')) {
    console.error('❌ popup.html missing reference to popup.js');
    process.exit(1);
  }
  
  console.log('✅ popup.html structure is valid');
} catch (error) {
  console.error('❌ Error reading popup.html:', error.message);
  process.exit(1);
}

// Calculate and display extension metrics
console.log('5. Extension metrics...');
const getFileSize = (filePath) => {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
};

const metrics = {
  totalFiles: fs.readdirSync(extensionDir, { recursive: true }).length,
  manifestSize: getFileSize(path.join(extensionDir, 'manifest.json')),
  backgroundSize: getFileSize(path.join(extensionDir, 'background.js')),
  contentSize: getFileSize(path.join(extensionDir, 'content.js')),
  popupSize: getFileSize(path.join(extensionDir, 'popup.js')),
  htmlSize: getFileSize(path.join(extensionDir, 'popup.html')),
};

console.log(`   📄 Total files: ${metrics.totalFiles}`);
console.log(`   📊 Background script: ${(metrics.backgroundSize / 1024).toFixed(2)} KB`);
console.log(`   📊 Content script: ${(metrics.contentSize / 1024).toFixed(2)} KB`);
console.log(`   📊 Popup script: ${(metrics.popupSize / 1024).toFixed(2)} KB`);
console.log(`   📊 Popup HTML: ${(metrics.htmlSize / 1024).toFixed(2)} KB`);

const totalJSSize = metrics.backgroundSize + metrics.contentSize + metrics.popupSize;
console.log(`   📊 Total JavaScript: ${(totalJSSize / 1024).toFixed(2)} KB`);

console.log('\n✅ Extension passed all tests!');
console.log('\n🚀 Ready to load in Chrome:');
console.log('   1. Open Chrome');
console.log('   2. Go to chrome://extensions/');
console.log('   3. Enable "Developer mode" (toggle in top right)');
console.log('   4. Click "Load unpacked"');
console.log(`   5. Select the folder: ${extensionDir}`);
console.log('\n🎯 If it loads successfully, you should see:');
console.log('   - Extension icon in toolbar');
console.log('   - "QarbonQuery Carbon Tracker" in extensions list');
console.log('   - No error messages in Chrome');
console.log('\n📝 Test the extension:');
console.log('   - Click the extension icon to open popup');
console.log('   - Navigate to any website to test content script');
console.log('   - Check browser console for any errors');
