#!/bin/bash
echo "🔍 QarbonQuery Debug Mode Switcher"
echo ""

case "$1" in
  "final")
    cp extension/content-v2.3.1-final.js extension/content.js
    echo "✅ Switched to Final v2.3.1 (proper Perplexity SSE handling)"
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
    echo "📋 Available scripts:"
    ls -1 extension/content*.js | grep -E "(debug|final|backup)"
    ;;
  "production")
    if [ -f extension/content-v2.3.1-final.js ]; then
      cp extension/content-v2.3.1-final.js extension/content.js
      echo "✅ Switched to Production mode (v2.3.1 Final)"
    elif [ -f extension/content-backup.js ]; then
      cp extension/content-backup.js extension/content.js
      echo "✅ Switched to Production mode (v2.3 backup)"
    else
      echo "❌ No production version found."
    fi
    ;;
  *)
    echo "Usage: ./switch-debug.sh [final|perplexity|enhanced|websocket|current|production]"
    echo ""
    echo "Available modes:"
    echo "  final      - v2.3.1 Final with proper Perplexity SSE handling ⭐"
    echo "  perplexity - Log only Perplexity requests (safe)"
    echo "  enhanced   - Log all network activity on Perplexity"
    echo "  websocket  - Log Fetch + WebSocket activity (comprehensive)"
    echo "  current    - Show current active debug mode"
    echo "  production - Restore latest production version"
    ;;
esac

if [ "$1" != "current" ] && [ "$1" != "" ]; then
  echo ""
  echo "🔄 Remember to reload the extension in Chrome!"
fi
