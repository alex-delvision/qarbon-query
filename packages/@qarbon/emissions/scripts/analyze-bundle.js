#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 * Analyzes current package size and generates optimization report
 */

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const webpack = require('webpack');
const path = require('path');
const fs = require('fs');

const config = {
  mode: 'production',
  entry: {
    main: './dist/index.js',
    calculator: './dist/calculator.js',
    factors: './dist/factors.js',
    adapters: './dist/adapters/index.js',
    optimizations: './dist/optimizations/index.js',
    uncertainty: './dist/uncertainty/index.js',
    grid: './dist/grid/index.js',
  },
  output: {
    path: path.resolve(__dirname, '../analysis'),
    filename: '[name].bundle.js',
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-report.html',
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
    }),
  ],
};

function analyzeCurrentSize() {
  console.log('📊 Analyzing current package size...');

  const distPath = path.resolve(__dirname, '../dist');
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  let totalSize = 0;
  const fileSizes = {};

  function analyzeDirectory(dir, prefix = '') {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        analyzeDirectory(filePath, prefix + file + '/');
      } else {
        const size = stat.size;
        totalSize += size;
        fileSizes[prefix + file] = size;
      }
    });
  }

  analyzeDirectory(distPath);

  console.log(`\n📦 Total package size: ${(totalSize / 1024).toFixed(1)} KB`);

  // Sort by size
  const sortedFiles = Object.entries(fileSizes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20); // Top 20 largest files

  console.log('\n🔍 Largest files:');
  sortedFiles.forEach(([file, size]) => {
    console.log(`  ${file}: ${(size / 1024).toFixed(1)} KB`);
  });

  // Analyze by category
  const categories = {
    'TypeScript declarations': [],
    'JavaScript files': [],
    'Source maps': [],
    Documentation: [],
    Other: [],
  };

  Object.entries(fileSizes).forEach(([file, size]) => {
    if (file.endsWith('.d.ts')) {
      categories['TypeScript declarations'].push([file, size]);
    } else if (file.endsWith('.js')) {
      categories['JavaScript files'].push([file, size]);
    } else if (file.endsWith('.map')) {
      categories['Source maps'].push([file, size]);
    } else if (file.includes('docs/') || file.endsWith('.html')) {
      categories['Documentation'].push([file, size]);
    } else {
      categories['Other'].push([file, size]);
    }
  });

  console.log('\n📂 Size by category:');
  Object.entries(categories).forEach(([category, files]) => {
    const categorySize = files.reduce((sum, [, size]) => sum + size, 0);
    if (categorySize > 0) {
      console.log(
        `  ${category}: ${(categorySize / 1024).toFixed(1)} KB (${files.length} files)`
      );
    }
  });

  return { totalSize, fileSizes, categories };
}

async function runWebpackAnalysis() {
  console.log('\n🔍 Running webpack bundle analysis...');

  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err || stats.hasErrors()) {
        console.error(
          '❌ Webpack analysis failed:',
          err || stats.toJson().errors
        );
        reject(err || new Error('Webpack errors'));
        return;
      }

      console.log('✅ Bundle analysis complete');
      console.log(
        `📄 Report generated: ${path.resolve(__dirname, '../analysis/bundle-report.html')}`
      );
      resolve(stats);
    });
  });
}

function generateOptimizationReport(analysis) {
  console.log('\n💡 Optimization Recommendations:');

  const { totalSize, fileSizes, categories } = analysis;

  // Check if documentation is too large
  const docsSize = categories['Documentation'].reduce(
    (sum, [, size]) => sum + size,
    0
  );
  if (docsSize > 200 * 1024) {
    // > 200KB
    console.log(
      '  📚 Consider excluding documentation from npm package (use .npmignore)'
    );
  }

  // Check if source maps are too large
  const mapsSize = categories['Source maps'].reduce(
    (sum, [, size]) => sum + size,
    0
  );
  if (mapsSize > 300 * 1024) {
    // > 300KB
    console.log('  🗺️  Consider excluding source maps from production builds');
  }

  // Check for large individual files
  const largeFiles = Object.entries(fileSizes).filter(
    ([, size]) => size > 50 * 1024
  );
  if (largeFiles.length > 0) {
    console.log('  📄 Large files found (>50KB):');
    largeFiles.forEach(([file, size]) => {
      console.log(`    - ${file}: ${(size / 1024).toFixed(1)} KB`);
    });
  }

  // Estimate potential savings
  let potentialSavings = 0;

  // Exclude docs from package
  potentialSavings += docsSize;

  // Exclude source maps
  potentialSavings += mapsSize;

  // Minify JSON files
  const jsonFiles = Object.entries(fileSizes).filter(([file]) =>
    file.endsWith('.json')
  );
  potentialSavings += jsonFiles.reduce((sum, [, size]) => sum + size * 0.3, 0); // ~30% savings

  console.log(
    `\n📉 Potential size reduction: ${(potentialSavings / 1024).toFixed(1)} KB (${((potentialSavings / totalSize) * 100).toFixed(1)}%)`
  );
  console.log(
    `🎯 Optimized size estimate: ${((totalSize - potentialSavings) / 1024).toFixed(1)} KB`
  );
}

async function main() {
  try {
    console.log('🚀 Starting bundle size analysis...\n');

    const analysis = analyzeCurrentSize();
    generateOptimizationReport(analysis);

    // Run webpack analysis if webpack is available
    try {
      await runWebpackAnalysis();
    } catch (error) {
      console.warn(
        '⚠️  Webpack analysis skipped (build files may not be in expected format)'
      );
    }

    console.log('\n✅ Analysis complete!');
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzeCurrentSize, generateOptimizationReport };
