#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Bundle optimization script
 * - Minifies JSON data files
 * - Analyzes bundle sizes
 * - Provides optimization recommendations
 */

const distDir = path.join(__dirname, '..', 'dist');
const srcDir = path.join(__dirname, '..', 'src');

function minifyJsonData() {
  console.log('🗜️  Minifying JSON data files...');

  const dataFiles = [
    'data/ai-factors.json',
    'data/cloud-factors.json',
    'data/crypto-factors.json',
    'data/grid-factors.json',
  ];

  dataFiles.forEach(file => {
    const filePath = path.join(srcDir, file);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const minified = JSON.stringify(data, null, 0);

      // Create a backup of the original
      const backupPath = filePath + '.bak';
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
      }

      // Write minified version
      fs.writeFileSync(filePath, minified);

      const originalSize = fs.statSync(filePath + '.bak').size;
      const minifiedSize = fs.statSync(filePath).size;
      const savings = (
        ((originalSize - minifiedSize) / originalSize) *
        100
      ).toFixed(1);

      console.log(
        `  ${file}: ${originalSize} → ${minifiedSize} bytes (${savings}% reduction)`
      );
    }
  });
}

function analyzeBundleSizes() {
  console.log('📊 Analyzing bundle sizes...');

  if (!fs.existsSync(distDir)) {
    console.log('❌ dist directory not found. Run `npm run build` first.');
    return;
  }

  const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
  const results = [];

  files.forEach(file => {
    const filePath = path.join(distDir, file);
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath);
    const gzipped = gzipSync(content);

    results.push({
      file,
      size: stat.size,
      gzipped: gzipped.length,
      ratio: ((gzipped.length / stat.size) * 100).toFixed(1),
    });
  });

  // Sort by size (largest first)
  results.sort((a, b) => b.size - a.size);

  console.log('\n📦 Bundle sizes:');
  console.log(
    'File'.padEnd(25) + 'Size'.padEnd(10) + 'Gzipped'.padEnd(10) + 'Ratio'
  );
  console.log('-'.repeat(50));

  results.forEach(({ file, size, gzipped, ratio }) => {
    const sizeStr = (size / 1024).toFixed(1) + 'KB';
    const gzippedStr = (gzipped / 1024).toFixed(1) + 'KB';
    console.log(
      file.padEnd(25) + sizeStr.padEnd(10) + gzippedStr.padEnd(10) + ratio + '%'
    );
  });

  return results;
}

function generateOptimizationReport(results) {
  console.log('\n🚀 Optimization recommendations:');

  const mainBundle = results.find(r => r.file === 'index.js');
  const aiBundle = results.find(r => r.file === 'ai.js');
  const cloudBundle = results.find(r => r.file === 'cloud.js');
  const cryptoBundle = results.find(r => r.file === 'crypto.js');

  if (mainBundle && mainBundle.size > 500 * 1024) {
    console.log('⚠️  Main bundle is large (>500KB). Consider:');
    console.log(
      '   - Using specific entry points (ai.js, cloud.js, crypto.js)'
    );
    console.log('   - Lazy loading heavy features');
    console.log('   - Code splitting');
  }

  if (aiBundle && aiBundle.size < 50 * 1024) {
    console.log('✅ AI bundle is optimized (<50KB)');
  }

  if (cloudBundle && cloudBundle.size < 50 * 1024) {
    console.log('✅ Cloud bundle is optimized (<50KB)');
  }

  if (cryptoBundle && cryptoBundle.size < 50 * 1024) {
    console.log('✅ Crypto bundle is optimized (<50KB)');
  }

  const totalSize = results.reduce((sum, r) => sum + r.size, 0);
  const totalGzipped = results.reduce((sum, r) => sum + r.gzipped, 0);

  console.log(
    `\n📈 Total: ${(totalSize / 1024).toFixed(1)}KB (${(totalGzipped / 1024).toFixed(1)}KB gzipped)`
  );

  // Usage examples
  console.log('\n💡 Usage examples:');
  console.log('');
  console.log('// AI-only (smallest bundle)');
  console.log("import { aiCalculator } from 'qarbon-emissions/ai';");
  console.log('');
  console.log('// Cloud-only');
  console.log("import { cloudCalculator } from 'qarbon-emissions/cloud';");
  console.log('');
  console.log('// Crypto-only');
  console.log("import { cryptoCalculator } from 'qarbon-emissions/crypto';");
  console.log('');
  console.log('// Full bundle (when you need everything)');
  console.log("import { EmissionsCalculator } from 'qarbon-emissions';");
}

function createLazyLoadingExample() {
  const examplePath = path.join(__dirname, '..', 'examples', 'lazy-loading.js');
  const exampleDir = path.dirname(examplePath);

  if (!fs.existsSync(exampleDir)) {
    fs.mkdirSync(exampleDir, { recursive: true });
  }

  const content = `/**
 * Lazy Loading Example
 * Demonstrates how to load specific calculators only when needed
 */

class LazyEmissionsCalculator {
  constructor() {
    this.calculators = new Map();
  }
  
  async getAICalculator() {
    if (!this.calculators.has('ai')) {
      const { aiCalculator } = await import('qarbon-emissions/ai');
      this.calculators.set('ai', aiCalculator);
    }
    return this.calculators.get('ai');
  }
  
  async getCloudCalculator() {
    if (!this.calculators.has('cloud')) {
      const { cloudCalculator } = await import('qarbon-emissions/cloud');
      this.calculators.set('cloud', cloudCalculator);
    }
    return this.calculators.get('cloud');
  }
  
  async getCryptoCalculator() {
    if (!this.calculators.has('crypto')) {
      const { cryptoCalculator } = await import('qarbon-emissions/crypto');
      this.calculators.set('crypto', cryptoCalculator);
    }
    return this.calculators.get('crypto');
  }
  
  async calculateAI(tokens, model) {
    const calculator = await this.getAICalculator();
    return calculator.calculateTokenEmissions(tokens, model);
  }
  
  async calculateCloud(hours, instanceType, options) {
    const calculator = await this.getCloudCalculator();
    return calculator.calculateComputeEmissions(hours, instanceType, options);
  }
  
  async calculateCrypto(transactions, currency, options) {
    const calculator = await this.getCryptoCalculator();
    return calculator.calculateTransactionEmissions(transactions, currency, options);
  }
}

// Usage example
const calculator = new LazyEmissionsCalculator();

// Only loads the AI bundle when needed
const aiEmission = await calculator.calculateAI(1000, 'gpt-4');
console.log('AI Emission:', aiEmission);

// Only loads the cloud bundle when needed
const cloudEmission = await calculator.calculateCloud(5, 't3.micro', { region: 'us-west-2' });
console.log('Cloud Emission:', cloudEmission);

export { LazyEmissionsCalculator };
`;

  fs.writeFileSync(examplePath, content);
  console.log(`\n📝 Created lazy loading example: ${examplePath}`);
}

function main() {
  console.log('🔧 Optimizing qarbon-emissions bundle...');

  // Step 1: Minify JSON data
  minifyJsonData();

  // Step 2: Analyze bundle sizes
  const results = analyzeBundleSizes();

  if (results && results.length > 0) {
    // Step 3: Generate optimization report
    generateOptimizationReport(results);

    // Step 4: Create lazy loading example
    createLazyLoadingExample();
  }

  console.log('\n✅ Bundle optimization complete!');
}

if (process.argv[1] === __filename) {
  main();
}

export { minifyJsonData, analyzeBundleSizes, generateOptimizationReport };
