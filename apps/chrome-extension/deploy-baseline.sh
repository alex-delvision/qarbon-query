#!/bin/bash
echo "🚀 Deploying QarbonQuery Working Baseline v2"
echo "This will restore the last known working version"
echo ""

# Backup current
mkdir -p versions/backup-$(date +%Y%m%d-%H%M%S)
cp -r extension/* versions/backup-$(date +%Y%m%d-%H%M%S)/

# Restore working version
cp versions/working-v2-*/manifest.json extension/
cp versions/working-v2-*/content.js extension/
cp versions/working-v2-*/popup.html extension/
cp versions/working-v2-*/popup.js extension/

echo "✅ Working baseline restored!"
echo "📝 Remember to reload the extension in Chrome"
