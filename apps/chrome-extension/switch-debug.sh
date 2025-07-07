#!/bin/bash
echo "🔍 QarbonQuery Debug Mode Switcher"
echo ""

case "$1" in
  "all")
    cp extension/content-v2.4-all-platforms.js extension/content.js
    echo "✅ Switched to v2.4 All Platforms (including Perplexity estimation) ⭐"
    ;;
  "perplexity-test")
    cp extension/content-perplexity-test.js extension/content.js
    echo "✅ Switched to Perplexity Test (minimal fetch interception)"
    ;;
  "perplexity-ultra")
    cp extension/content-perplexity-ultra-minimal.js extension/content.js
    echo "✅ Switched to Ultra-Minimal Perplexity (DOM-based tracking)"
    ;;
  "clean")
    cp extension/content-v2.3.3-clean.js extension/content.js
    echo "✅ Switched to Clean v2.3.3 (3 platforms: ChatGPT, Claude, Gemini)"
    ;;
  "simple")
    cp extension/content-v2.3.2-simple.js extension/content.js
    echo "✅ Switched to Simple v2.3.2 (4 platforms with Perplexity estimation)"
    ;;
  "final")
    cp extension/content-v2.3.1-final.js extension/content.js
    echo "✅ Switched to Final v2.3.1 (4 platforms with complex SSE)"
    ;;
  "perplexity")
    cp extension/content-debug-perplexity.js extension/content.js
    echo "✅ Switched to Perplexity-only debug mode"
    ;;
  "enhanced")
    cp extension/content-debug-enhanced.js extension/content.js
    echo "✅ Switched to Enhanced debug mode (all network activity)"
    ;;
  "websocket")
    cp extension/content-debug-websocket.js extension/content.js
    echo "✅ Switched to WebSocket debug mode (Fetch + WebSocket)"
    ;;
  "current")
    echo "📄 Current content.js:"
    head -1 extension/content.js
    echo ""
    echo "📋 Available versions:"
    ls -1 extension/content*.js | grep -E "(all|clean|simple|final|test|ultra|debug|backup)"
    ;;
  "production")
    if [ -f extension/content-v2.4-all-platforms.js ]; then
      cp extension/content-v2.4-all-platforms.js extension/content.js
      echo "✅ Switched to Production mode (v2.4 All Platforms - LATEST)"
    elif [ -f extension/content-v2.3.3-clean.js ]; then
      cp extension/content-v2.3.3-clean.js extension/content.js
      echo "✅ Switched to Production mode (v2.3.3 Clean - STABLE)"
    else
      echo "❌ No production version found."
    fi
    ;;
  *)
    echo "Usage: ./switch-debug.sh [MODE]"
    echo ""
    echo "🚀 Production Modes:"
    echo "  all        - v2.4 All Platforms (ChatGPT, Claude, Gemini, Perplexity) ⭐"
    echo "  clean      - v2.3.3 Clean: 3 platforms (MOST STABLE)"
    echo "  simple     - v2.3.2 Simple: 4 platforms with estimation"
    echo "  final      - v2.3.1 Final: 4 platforms with complex SSE"
    echo ""
    echo "🧪 Perplexity Test Modes:"
    echo "  perplexity-test  - Minimal fetch interception test"
    echo "  perplexity-ultra - DOM-based tracking (no fetch modification)"
    echo ""
    echo "🔍 Debug Modes:"
    echo "  perplexity - Debug: Log only Perplexity requests"
    echo "  enhanced   - Debug: Log all network activity"
    echo "  websocket  - Debug: Log Fetch + WebSocket activity"
    echo ""
    echo "ℹ️  Utility:"
    echo "  current    - Show current active version"
    echo "  production - Restore latest production version"
    ;;
esac

if [ "$1" != "current" ] && [ "$1" != "" ]; then
  echo ""
  echo "🔄 Remember to reload the extension in Chrome!"
fi
