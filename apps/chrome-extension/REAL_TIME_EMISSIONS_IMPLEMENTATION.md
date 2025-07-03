# Real-Time Emission Display Implementation

## Overview
This implementation adds real-time emission display functionality to the QarbonQuery Chrome Extension popup, listening for `AI_TOKENS` messages and displaying emissions with confidence intervals and color coding.

## Features Implemented

### 1. Message Listener Setup
- **Location**: `popup.ts` - `setupRealTimeListener()` function
- **Functionality**: Listens for `AI_TOKENS` messages from background script
- **Data Processed**: 
  - `emissions` (number) - CO₂e emissions in grams
  - `confidence` (object) - Contains `low` and `high` values for confidence interval

### 2. Real-Time Display Rendering
- **Format**: "x g CO₂e ± y g" where:
  - `x` = current emissions value
  - `y` = confidence range (calculated as `(high - low) / 2`)
- **Auto-hide**: Display automatically reverts to stored data after 5 seconds
- **Animation**: Pulse effect during real-time display

### 3. Color Coding System
Based on emission magnitude thresholds:

| Range | Color | CSS Class | Description |
|-------|-------|-----------|-------------|
| < 5g | Green (`#4ade80`) | `low-emission` | Very low impact |
| 5-25g | Yellow (`#fbbf24`) | `medium-emission` | Moderate impact |
| 25-50g | Orange (`#f97316`) | `high-emission` | High impact |
| > 50g | Red (`#ef4444`) | `very-high-emission` | Very high impact |

### 4. Visual Effects
- **Card Styling**: Background tint and border color changes based on emission level
- **Pulse Animation**: 2-second ease-in-out infinite pulse during real-time display
- **Footer Status**: Shows "Live emission detected" with blinking indicator during activity

### 5. Updated Background Script
- **Enhanced Message**: `emitTokenMessage()` now includes confidence data
- **Storage Migration**: Existing data migrated to include confidence intervals
- **Comprehensive Logging**: Detailed emission tracking with confidence ranges

## File Changes

### `popup.ts`
- Added real-time state management variables
- Implemented `setupRealTimeListener()` for AI_TOKENS message handling
- Added `updateRealTimeDisplay()` for visual updates
- Added `getEmissionColorClass()` for color coding
- Added `updateFooterStatus()` for activity indication

### `popup.html`
- Added comprehensive CSS for color coding and animations
- Enhanced footer with real-time activity indicator
- Added ID to footer for programmatic updates

### `background.ts`
- Updated `emitTokenMessage()` to include confidence data
- Enhanced storage migration to add confidence to existing entries

## Usage Instructions

### For Developers
1. **Testing**: Use the provided `test-real-time-emissions.js` script
2. **Integration**: AI_TOKENS messages automatically trigger display updates
3. **Customization**: Modify thresholds in `EMISSION_THRESHOLDS` object

### For Users
- Real-time emissions appear automatically when AI services are used
- Display shows current emission with confidence range
- Color indicates environmental impact level
- Footer shows live activity status

## Technical Implementation Details

### Message Flow
1. Background script detects AI API calls
2. Calculates emissions with confidence intervals
3. Sends AI_TOKENS message to popup
4. Popup receives message and updates display
5. Display auto-reverts after 5 seconds

### State Management
- `realTimeEmissions`: Current emission data and confidence
- `isRealTimeActive`: Boolean flag for display state
- Automatic cleanup after display timeout

### Error Handling
- Graceful fallback if Chrome runtime unavailable
- Validation of emission and confidence data
- Safe DOM manipulation with null checks

## Testing
Use the provided test script to simulate real-time emissions:
```javascript
// In background script console
testRealTimeEmissions()
```

This will cycle through different emission levels to demonstrate color coding and animations.

## Future Enhancements
- Configurable display duration
- Historical trend indicators
- Customizable color thresholds
- Sound notifications for high emissions
- Detailed breakdown of confidence factors
