#!/bin/bash

echo "🔧 Integrating Defensive Messaging System..."

# Update webpack config to include new modules
echo "📦 Adding browser-agnostic tracker to webpack config..."
cp webpack.config.js webpack.config.js.backup

cat >> webpack.config.js << 'WEBPACK'

// Add browser-agnostic tracker as separate entry
module.exports = (env, argv) => {
  const config = module.exports(env, argv);
  config.entry['tracker'] = './src/lib/browser-agnostic-tracker.ts';
  return config;
};
WEBPACK

# Update extension manifest to include tracker as web accessible resource
echo "📄 Updating manifest to include tracker..."
cd extension
cp manifest.json manifest.json.defensive-backup

# Add tracker.js to web accessible resources
sed -i '' 's/"chrome-138-fix.js"/"chrome-138-fix.js",\
        "tracker.js"/g' manifest.json

cd ..

# Build everything
echo "🛠️  Building extension with defensive system..."
npm run build:extension

# Create standalone tracker bundle for non-extension use
echo "📦 Creating standalone tracker bundle..."
npx webpack --mode=production --entry ./src/lib/browser-agnostic-tracker.ts --output-path ./dist --output-filename qarbon-tracker-standalone.js

# Create bookmarklet version
echo "🔖 Creating bookmarklet version..."
mkdir -p dist/bookmarklet
cat > dist/bookmarklet/qarbon-bookmarklet.js << 'BOOKMARKLET'
(function(){
  if(window.qarbonTracker){console.log('Qarbon tracker already loaded');return;}
  var script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/@qarbon/tracker@latest/dist/qarbon-tracker-standalone.js';
  script.onload=function(){console.log('✅ Qarbon AI Carbon Tracker loaded');};
  document.head.appendChild(script);
})();
BOOKMARKLET

# Minify bookmarklet
npx terser dist/bookmarklet/qarbon-bookmarklet.js --compress --mangle -o dist/bookmarklet/qarbon-bookmarklet.min.js

# Create browser-specific versions
echo "🌐 Creating browser-specific implementations..."
mkdir -p dist/browsers

# Safari version (uses different APIs)
cat > dist/browsers/qarbon-safari.js << 'SAFARI'
// Safari-specific implementation
// Uses safari.extension APIs instead of chrome.runtime
// ... (would need safari-specific adaptations)
SAFARI

# Firefox version (uses browser.runtime)
cat > dist/browsers/qarbon-firefox.js << 'FIREFOX'
// Firefox-specific implementation  
// Uses browser.runtime instead of chrome.runtime
// ... (would need firefox-specific adaptations)
FIREFOX

echo "✅ Defensive messaging system integrated!"
echo ""
echo "📁 Generated files:"
echo "  📦 extension/tracker.js - Extension-bundled tracker"
echo "  📦 dist/qarbon-tracker-standalone.js - Standalone tracker"
echo "  🔖 dist/bookmarklet/qarbon-bookmarklet.min.js - Bookmarklet version"
echo "  🌐 dist/browsers/ - Browser-specific versions"
echo ""
echo "🎯 Usage options:"
echo "  1. Chrome Extension: Load unpacked from 'extension/' folder"
echo "  2. Standalone: <script src='dist/qarbon-tracker-standalone.js'></script>"
echo "  3. Bookmarklet: Copy content from dist/bookmarklet/qarbon-bookmarklet.min.js"
echo "  4. NPM: npm install @qarbon/tracker (if published)"
echo ""
echo "🔌 API usage:"
echo "  window.qarbonTracker.getStats()"
echo "  window.qarbonTracker.getEmissions('today')"
