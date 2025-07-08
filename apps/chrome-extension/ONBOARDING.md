# QarbonQuery Chrome Extension - Onboarding System

## Overview

The onboarding system provides a comprehensive first-time user experience with:

1. **3-slide carousel onboarding page** - Interactive welcome flow
2. **Automatic onboarding trigger** - Opens on first install
3. **Custom tooltip tour** - Guides users through the popup interface

## Files Created/Modified

### 1. onboarding.html

- **Location**: `src/onboarding.html`
- **Purpose**: 3-slide carousel introducing QarbonQuery
- **Features**:
  - Slide 1: "What is QarbonQuery?" - Overview and key features
  - Slide 2: "How Does It Work?" - Technical explanation and benefits
  - Slide 3: "Tips for Success" - Best practices and usage tips
  - Responsive design with animations
  - Keyboard navigation support
  - Skip button for advanced users

### 2. background.ts - Install Event Handler

- **Added**: `chrome.runtime.onInstalled` listener
- **Function**:
  - Detects new installations
  - Checks `qarbon_onboarded` storage flag
  - Opens onboarding tab if user hasn't been onboarded
  - Logs installation/update events

### 3. popup.html - Tooltip IDs

- **Added**: IDs for tooltip guidance
  - `qarbon-tabs` - Tab navigation bar
  - `qarbon-chart` - 14-day trend chart section
  - `data-tooltip="settings"` - Settings button

### 4. popup.ts - Custom Tooltip Tour

- **Added**: `TooltipTour` class
- **Features**:
  - Lightweight custom implementation (no external dependencies)
  - 3-step guided tour of popup interface
  - Highlights elements with visual overlays
  - Modal-style presentation with overlay
  - Previous/Next navigation
  - Automatic cleanup and state management

### 5. manifest.json - Resource Declaration

- **Added**: `onboarding.html` to `web_accessible_resources`
- **Purpose**: Allows Chrome to load the onboarding page

## User Flow

### First Install

1. User installs QarbonQuery extension
2. `chrome.runtime.onInstalled` fires with reason='install'
3. Background script checks for `qarbon_onboarded` flag
4. If not onboarded, opens `onboarding.html` in new tab
5. User proceeds through 3-slide carousel
6. On completion, sets `qarbon_onboarded=true` in storage
7. Onboarding tab closes automatically

### First Popup Open

1. User clicks extension icon for first time
2. Popup opens normally
3. `TooltipTour` checks `qarbon_onboarded` flag
4. If user hasn't been onboarded via carousel, shows tooltip tour
5. 3-step tour guides through: tabs → chart → settings
6. On completion, sets `qarbon_onboarded=true` in storage

## Technical Details

### Storage Management

- **Key**: `qarbon_onboarded`
- **Value**: `true` (boolean)
- **Scope**: `chrome.storage.local`
- **Purpose**: Prevents onboarding from showing multiple times

### Carousel Implementation

- Pure HTML/CSS/JavaScript (no frameworks)
- Smooth slide transitions with CSS transforms
- Progress dots navigation
- Keyboard support (arrow keys, Enter)
- Mobile-responsive design

### Tooltip Tour Implementation

- Custom lightweight alternative to Shepherd.js
- Dynamic element highlighting with overlays
- Positioned tooltips with viewport edge detection
- Event delegation for button interactions
- Automatic cleanup to prevent memory leaks

### Styling Features

- Gradient background design
- Smooth animations and transitions
- Feature cards with hover effects
- Progressive disclosure of information
- Color-coded visual hierarchy

## Customization Options

### Adding New Slides

1. Add new slide HTML in `onboarding.html`
2. Update `totalSlides` in JavaScript
3. Add corresponding progress dot
4. Update navigation logic if needed

### Modifying Tooltip Tour

1. Edit `TooltipTour` constructor in `popup.ts`
2. Add/remove steps using `addStep()` method
3. Ensure target elements have proper IDs in `popup.html`

### Styling Changes

1. Modify CSS in `onboarding.html` `<style>` section
2. Update responsive breakpoints as needed
3. Adjust animations and transitions

## Browser Compatibility

- Chrome Manifest V3 compatible
- Modern CSS features (CSS Grid, Flexbox)
- ES6+ JavaScript features
- Requires Chrome 88+ for full feature support

## Accessibility

- Keyboard navigation support
- ARIA labels and semantic HTML
- High contrast design elements
- Focus management in modal contexts
- Screen reader friendly content structure

## Performance

- Minimal external dependencies
- Efficient DOM manipulation
- CSS-based animations for smooth performance
- Lazy initialization to avoid popup slowdown
- Automatic cleanup to prevent memory leaks
