#!/bin/bash
echo "🔍 QarbonQuery Debug Mode Switcher"
echo ""

case "$1" in
  "simple")
    cp extension/content-v2.3.2-simple.js extension/content.js
    echo "✅ Switched to Simple v2.3.2 (request-time Perplexity tracking) ⭐"
    ;;
  "final")
    cp extension/content-v2.3.1-final.js extension/content.js
    echo "✅ Switched to Final v2.3.1 (complex SSE handling)"
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
    ls -1 extension/content*.js | grep -E "(simple|final|debug|backup)"
    ;;
  "production")
    if [ -f extension/content-v2.3.2-simple.js ]; then
      cp extension/content-v2.3.2-simple.js extension/content.js
      echo "✅ Switched to Production mode (v2.3.2 Simple - RECOMMENDED)"
    elif [ -f extension/content-v2.3.1-final.js ]; then
      cp extension/content-v2.3.1-final.js extension/content.js
      echo "✅ Switched to Production mode (v2.3.1 Final)"
    else
      echo "❌ No production version found."
    fi
    ;;
  *)
    echo "Usage: ./switch-debug.sh [simple|final|perplexity|enhanced|websocket|current|production]"
    echo ""
    echo "Available modes:"
    echo "  simple     - v2.3.2 Simple Perplexity tracking (RECOMMENDED) ⭐"
    echo "  final      - v2.3.1 Complex SSE handling"
    echo "  perplexity - Log only Perplexity requests (debug)"
    echo "  enhanced   - Log all network activity (debug)"
    echo "  websocket  - Log Fetch + WebSocket activity (debug)"
    echo "  current    - Show current active version"
    echo "  production - Restore latest production version"
    ;;
esac

if [ "$1" != "current" ] && [ "$1" != "" ]; then
  echo ""
  echo "🔄 Remember to reload the extension in Chrome!"
fi
