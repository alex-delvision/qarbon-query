# QarbonQuery Working Baseline v2

## Status: ✅ FULLY WORKING

- Date: January 2025
- Platforms: Claude.ai, ChatGPT
- Features: Basic emission tracking with popup display

## What Works:

- ✅ Auto-injection on Claude and ChatGPT
- ✅ Fetch interception for API calls
- ✅ Emission calculation (tokens → CO₂e)
- ✅ Daily/weekly totals in popup
- ✅ Real-time updates (2-second refresh)

## Key Files:

- `manifest.json` - Chrome extension manifest v3
- `content.js` - Emission tracking script
- `popup.html` - Simple UI (Today/Week display)
- `popup.js` - Data aggregation from all tabs

## Storage Keys:

- `qarbon_emissions` - Daily emission data by date

## To Restore:

Copy all files to extension directory and reload in Chrome
