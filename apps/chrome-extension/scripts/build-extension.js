#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏗️  Building QarbonQuery Chrome Extension...\n');

// Step 1: Clean previous builds
console.log('1. Cleaning previous builds...');
execSync('rm -rf extension dist', { stdio: 'inherit' });

// Step 2: Build TypeScript with webpack
console.log('2. Building JavaScript bundle...');
execSync('webpack --mode=production', { stdio: 'inherit' });

// Step 3: Copy static assets
console.log('3. Copying static assets...');
const extensionDir = path.join(__dirname, '../extension');

// Copy manifest.json
fs.copyFileSync(
  path.join(__dirname, '../src/manifest.json'),
  path.join(extensionDir, 'manifest.json')
);

// Copy popup.html
fs.copyFileSync(
  path.join(__dirname, '../src/popup.html'),
  path.join(extensionDir, 'popup.html')
);

// Copy icons directory
const copyDirectory = (src, dest) => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
};

copyDirectory(
  path.join(__dirname, '../src/icons'),
  path.join(extensionDir, 'icons')
);

// Step 4: Validate extension structure
console.log('4. Validating extension structure...');
const requiredFiles = [
  'manifest.json',
  'popup.html',
  'background.js',
  'content.js',
  'popup.js',
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

// Step 5: Display success message
console.log('\n✅ Extension build complete!');
console.log('\n📁 Extension files are ready in: ./extension/');
console.log('\n🔧 To load in Chrome:');
console.log('   1. Open Chrome and go to chrome://extensions/');
console.log('   2. Enable "Developer mode" (top right)');
console.log('   3. Click "Load unpacked" and select the ./extension/ folder');
console.log('\n📊 Extension size:');

// Calculate extension size
const getDirectorySize = (dirPath) => {
  let totalSize = 0;
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  });
  
  return totalSize;
};

const extensionSize = getDirectorySize(extensionDir);
const sizeInKB = (extensionSize / 1024).toFixed(2);
console.log(`   Total size: ${sizeInKB} KB`);

console.log('\n🎉 Ready to test!');
