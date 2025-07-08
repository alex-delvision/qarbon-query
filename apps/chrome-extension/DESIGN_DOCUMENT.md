# QarbonQuery Chrome Extension - Design Specification Document

## Executive Summary

This document provides a comprehensive audit and design specification for the QarbonQuery Chrome
Extension v1.1.0, which tracks real-time carbon emissions from AI service usage. The extension
currently supports OpenAI, Anthropic, Google Gemini, AWS Bedrock, and web-based AI interfaces.

## Current Architecture Analysis

### Component Overview

```
QarbonQuery Chrome Extension
├── Background Script (Service Worker)
├── Content Scripts (Injection & API Monitoring)
├── Popup Interface (Real-time Dashboard)
├── Token Extraction Engine
└── Storage Management System
```

### File Structure Audit

**Core Scripts:**

- `background.ts` - Service worker for API interception and storage management
- `content.ts` - Content script for prompt capture and API monitoring
- `popup.ts` - Popup interface logic and real-time updates
- `tokenExtractors.ts` - Multi-provider token parsing utilities

**Configuration:**

- `manifest.json` - Extension permissions and configuration
- `dnr_rules.json` - Declarative net request rules for API interception
- `popup.html` - Popup UI structure with embedded CSS

**Supporting Files:**

- Test fixtures for OpenAI, Anthropic, Google, and Bedrock APIs
- Build and packaging scripts
- Type definitions and configurations

## Current Storage Schema Analysis

### Existing Storage Structure

```typescript
// Daily emissions data
qarbon_emissions_{YYYY-MM-DD}: EmissionEntry[] = [
  {
    id: string,                    // crypto.randomUUID()
    timestamp: number,             // Date.now()
    provider: string,              // 'openai' | 'anthropic' | 'google' | 'bedrock'
    model: string,                 // Model identifier
    tokens: {
      total: number,
      prompt: number,
      completion: number
    },
    emissions: number,             // grams CO₂e
    confidence: {
      low: number,
      high: number
    },
    url: string,                   // Source URL
    sessionId: string              // Session identifier
  }
]

// User queries tracking
qarbon_queries: {
  total: number,
  daily: Record<string, number>  // Date -> count mapping
}

// User settings
qarbon_settings: {
  trackingEnabled: boolean,
  displayUnits: 'g' | 'kg',
  notifications: boolean,
  dataRetentionDays: number,
  installedAt: number,
  version: string
}

// Prompt data (separate from emissions)
qarbon_prompts_{YYYY-MM-DD}: PromptEntry[] = [
  {
    id: string,
    platform: string,
    text: string,
    timestamp: string,
    model: string,
    url: string,
    storedAt: number
  }
]

// Aggregated data (placeholders for future use)
qarbon_aggregates_daily_{YYYY-MM-DD}: DailyAggregate
qarbon_aggregates_week_{YYYY-WNN}: WeeklyAggregate
qarbon_aggregates_month_{YYYY-MNN}: MonthlyAggregate
```

## Enhanced Storage Schema Design

### New Storage Fields for Enhanced Functionality

```typescript
// Enhanced user settings with new features
qarbon_settings: {
  // Existing fields
  trackingEnabled: boolean,
  displayUnits: 'g' | 'kg',
  notifications: boolean,
  dataRetentionDays: number,
  installedAt: number,
  version: string,

  // NEW: Enhanced notification settings
  notificationSettings: {
    dailyThreshold: number,        // Alert when daily emissions exceed (grams)
    weeklyThreshold: number,       // Alert when weekly emissions exceed
    showRealTimeAlerts: boolean,   // Show immediate emission alerts
    quietHours: {
      enabled: boolean,
      start: string,               // "22:00"
      end: string                  // "08:00"
    }
  },

  // NEW: Display preferences
  displayPreferences: {
    theme: 'light' | 'dark' | 'auto',
    chartType: 'line' | 'bar' | 'donut',
    showConfidenceRanges: boolean,
    animationsEnabled: boolean,
    compactMode: boolean
  },

  // NEW: Privacy settings
  privacySettings: {
    collectPromptText: boolean,    // Whether to store prompt content
    shareAnonymousData: boolean,   // Opt-in for anonymous usage analytics
    dataExportFormat: 'json' | 'csv'
  },

  // NEW: Goal tracking
  goalSettings: {
    enabled: boolean,
    dailyLimit: number,            // grams CO₂e
    weeklyLimit: number,
    monthlyLimit: number,
    alertPercentage: number        // Alert at 80% of limit
  }
}

// NEW: Weekly aggregated data
qarbon_aggregates_week_{YYYY-WNN}: {
  period: 'week',
  startDate: string,              // ISO date string
  endDate: string,
  totalEmissions: number,         // grams CO₂e
  totalQueries: number,
  totalTokens: number,
  confidence: { low: number, high: number },
  providerBreakdown: Record<string, number>,
  modelBreakdown: Record<string, number>,
  dailyBreakdown: Record<string, number>,  // Date -> emissions
  averagePerQuery: number,
  lastUpdated: number,
  version: string
}

// NEW: Monthly aggregated data
qarbon_aggregates_month_{YYYY-MNN}: {
  period: 'month',
  startDate: string,
  endDate: string,
  totalEmissions: number,
  totalQueries: number,
  totalTokens: number,
  confidence: { low: number, high: number },
  providerBreakdown: Record<string, number>,
  modelBreakdown: Record<string, number>,
  weeklyBreakdown: Record<string, number>,  // Week -> emissions
  dailyAverage: number,
  queryEfficiency: number,        // emissions per query
  lastUpdated: number,
  version: string
}

// NEW: User achievements and insights
qarbon_achievements: {
  unlockedAchievements: string[], // Achievement IDs
  streaks: {
    currentEfficientDays: number,
    bestEfficientStreak: number,
    lastUpdate: number
  },
  insights: {
    mostEfficientModel: string,
    leastEfficientProvider: string,
    optimalUsageTime: string,      // Time of day with lowest emissions
    weeklyTrend: 'improving' | 'stable' | 'increasing'
  }
}

// NEW: App onboarding and tutorial state
qarbon_onboarding: {
  completedSteps: string[],       // Step IDs that user has completed
  skippedTutorial: boolean,
  firstInstallDate: number,
  hasSeenFeature: Record<string, boolean>, // Feature flags for new features
  tutorialProgress: {
    currentStep: number,
    totalSteps: number,
    lastActiveStep: string
  }
}
```

## Component Tree Architecture

### Current Components

```
Background Service Worker
├── API Interceptor
│   ├── OpenAI Handler
│   ├── Anthropic Handler
│   ├── Google Gemini Handler
│   └── AWS Bedrock Handler
├── Token Extraction Engine
├── Emissions Calculator (via @qarbon/emissions)
├── Storage Manager
│   ├── Daily Data Handler
│   ├── Aggregation Service
│   └── Cleanup Service
└── Message Router

Content Script
├── Platform Detector
├── Prompt Capture System
│   ├── ChatGPT Monitor
│   ├── Claude Monitor
│   ├── Gemini Monitor
│   └── Generic AI Monitor
├── API Response Interceptor
└── DOM Observer

Popup Interface
├── Emissions Display
├── Category Breakdown
├── Real-time Updates
├── Debug Panel
└── Action Buttons
```

### Enhanced Component Tree Design

```
QarbonQuery Extension
├── Core Engine (Background)
│   ├── API Monitoring Service
│   │   ├── Request Interceptor
│   │   ├── Response Parser
│   │   └── Provider Adapters
│   ├── Emissions Calculator
│   ├── Data Storage Service
│   │   ├── Real-time Storage
│   │   ├── Aggregation Engine
│   │   └── Export Service
│   ├── Analytics Service
│   │   ├── Usage Insights
│   │   ├── Trend Analysis
│   │   └── Achievement Tracker
│   └── Notification Manager
├── Content Integration (Content Scripts)
│   ├── Platform Detection
│   ├── Prompt Monitoring
│   ├── UI Injection Service
│   └── Real-time Feedback
├── User Interface (Popup)
│   ├── Dashboard Components
│   │   ├── Emissions Summary
│   │   ├── Real-time Display
│   │   ├── Trend Charts
│   │   └── Provider Breakdown
│   ├── Settings Panel
│   │   ├── Preferences Manager
│   │   ├── Goal Configuration
│   │   └── Privacy Controls
│   ├── Analytics Dashboard
│   │   ├── Historical Charts
│   │   ├── Efficiency Metrics
│   │   └── Achievement Display
│   └── Onboarding Flow
│       ├── Welcome Tutorial
│       ├── Feature Introduction
│       └── Setup Wizard
└── Extension Management
    ├── Configuration Manager
    ├── Update Service
    └── Error Reporting
```

## State Flow Analysis

### Current State Flow

```
1. User interacts with AI service
2. Content script detects prompt submission
3. Content script captures prompt text and metadata
4. API request intercepted by background script via fetch/XHR monkey patching
5. Response captured and parsed for token usage
6. Emissions calculated using @qarbon/emissions library
7. Data stored in chrome.storage.local with date-based keys
8. Popup displays aggregated emissions data
9. Real-time updates sent to popup via chrome.runtime.sendMessage
```

### Enhanced State Flow Design

```
Initialization Flow:
1. Extension installed/updated
2. Initialize default settings and onboarding state
3. Create aggregation placeholders
4. Set up periodic cleanup and sync alarms

User Interaction Flow:
1. User accesses AI service
2. Content script detects platform and injects monitoring
3. Prompt capture with privacy filtering
4. Real-time feedback injection (optional)

API Monitoring Flow:
1. API request detected via DNR rules + monkey patching
2. Request/response data extracted
3. Provider-specific token parsing
4. Emissions calculation with confidence intervals
5. Real-time storage update
6. Trigger aggregation update
7. Check goal thresholds and send notifications
8. Update achievement progress

Data Aggregation Flow:
1. Daily emissions rollup (triggered by alarm)
2. Weekly/monthly aggregation computation
3. Trend analysis and insights generation
4. Cleanup of old data per retention policy

User Interface Flow:
1. Popup opened -> Load today's emissions
2. Real-time updates via message passing
3. Chart rendering with historical data
4. Settings changes trigger preference updates
5. Data export functionality

Onboarding Flow:
1. First-time user detection
2. Progressive feature introduction
3. Tutorial step completion tracking
4. Feature highlight system for updates
```

## UI Wireframes

### Popup Interface Wireframes

#### 1. Main Dashboard (Current State Enhanced)

```
┌─────────────────────────────────┐
│ 🌱 QarbonQuery        [⚙️] [📊] │
├─────────────────────────────────┤
│                                 │
│        🔥 15.2 g CO₂e          │
│         Today's Impact          │
│     ├─────────────────────┤    │
│     │ ▓▓▓▓▓░░░░░ 60%     │    │
│     │ Daily Goal: 25g    │    │
│     └─────────────────────┘    │
│                                 │
│ 📈 Trending Down (-12%)         │
│                                 │
│ Provider Breakdown:             │
│ • OpenAI      8.1g (53%)       │
│ • Anthropic   4.2g (28%)       │
│ • Google      2.9g (19%)       │
│                                 │
│ [View Details] [Quick Settings] │
└─────────────────────────────────┘
```

#### 2. Analytics Dashboard (New)

```
┌─────────────────────────────────┐
│ 📊 Analytics     [◀] [Today▼]  │
├─────────────────────────────────┤
│                                 │
│     Weekly Trend Chart          │
│ 30g │     ●                     │
│     │   ●   ●                   │
│ 20g │ ●       ●                 │
│     │           ●               │
│ 10g │             ●   ●         │
│     └─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬       │
│       M T W T F S S             │
│                                 │
│ 🎯 Insights:                    │
│ • Most efficient: Claude 3      │
│ • Peak usage: 2-4 PM           │
│ • Weekly saving: 23% ↓         │
│                                 │
│ 🏆 Achievements (3/12):         │
│ ✅ First Week    🔒 Eco Warrior │
│ ✅ Low Impact    🔒 Carbon Zero │
│                                 │
│ [Export Data] [Share Progress]  │
└─────────────────────────────────┘
```

#### 3. Settings Panel (Enhanced)

```
┌─────────────────────────────────┐
│ ⚙️ Settings           [◀] [✓]  │
├─────────────────────────────────┤
│                                 │
│ 🎯 Goals & Limits               │
│ Daily Limit:  [25] g CO₂e      │
│ Weekly Limit: [150] g CO₂e     │
│ Alert at:     [80]% of limit    │
│ [◯ Enabled  ● Disabled]        │
│                                 │
│ 🔔 Notifications                │
│ Real-time alerts [●]            │
│ Daily summaries  [●]            │
│ Achievement unlocks [●]         │
│                                 │
│ Quiet Hours: [22:00] - [08:00]  │
│                                 │
│ 🎨 Display                      │
│ Theme: [Auto ▼]                 │
│ Charts: [Line ▼]                │
│ Show confidence ranges [●]      │
│ Compact mode [○]                │
│                                 │
│ 🔒 Privacy                      │
│ Store prompt text [○]           │
│ Anonymous analytics [●]         │
│                                 │
│ [Reset All] [Export Settings]   │
└─────────────────────────────────┘
```

#### 4. Onboarding Flow (New)

```
┌─────────────────────────────────┐
│ Welcome to QarbonQuery! (1/4)   │
├─────────────────────────────────┤
│                                 │
│        🌱                       │
│    Track your AI                │
│   carbon footprint              │
│    in real-time                 │
│                                 │
│ ● Monitor emissions from:       │
│   • ChatGPT & GPT-4            │
│   • Claude & Claude 3          │
│   • Gemini & Bard              │
│   • And more AI services       │
│                                 │
│ [Skip Tour]        [Continue ▶] │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Set Your Goals (2/4)            │
├─────────────────────────────────┤
│                                 │
│ 🎯 Choose your daily limit:     │
│                                 │
│ [◯] Conservative (15g CO₂e)     │
│ [●] Balanced (25g CO₂e)         │
│ [◯] High Usage (50g CO₂e)       │
│ [◯] Custom: [___] g             │
│                                 │
│ This helps track your progress   │
│ and sends helpful reminders.    │
│                                 │
│ 💡 Average AI user: ~20g/day    │
│                                 │
│ [◀ Back]           [Continue ▶] │
└─────────────────────────────────┘
```

### Chart Component Wireframes

#### 1. Line Chart (Weekly Trends)

```
┌─────────────────────────────────┐
│ Weekly Emissions Trend          │
├─────────────────────────────────┤
│                                 │
│ 40g │                          │
│     │     ●━━●                  │
│ 30g │   ●       ●               │
│     │ ●           ●━━●          │
│ 20g │                 ●━━●      │
│     │                     ●     │
│ 10g │                           │
│     └┬───┬───┬───┬───┬───┬───┬   │
│      Mon Tue Wed Thu Fri Sat Sun │
│                                 │
│ ● Current Week                  │
│ ○ Previous Week (dotted)        │
└─────────────────────────────────┘
```

#### 2. Provider Breakdown (Donut Chart)

```
┌─────────────────────────────────┐
│ Provider Breakdown              │
├─────────────────────────────────┤
│                                 │
│         ╭─────╮                 │
│       ╭─╯ 45% ╰─╮               │
│      ╱  OpenAI   ╲              │
│     ╱      ●      ╲             │
│    ╱  28%     17% ╲             │
│   ╱ Anthropic  ╱─╲ ╲            │
│   ╲          ╱ G ╲╱             │
│    ╲        ╱  o  ╲             │
│     ╲      ╱  o  ╱              │
│      ╲    ╱  g  ╱               │
│       ╰──╱  l  ╱                │
│         ╱  e  ╱                 │
│        ╱  10% ╱                 │
│       ╰───────╯                 │
│                                 │
│ Total: 24.3g CO₂e today        │
└─────────────────────────────────┘
```

## Implementation Roadmap

### Phase 1: Enhanced Storage & Analytics (Week 1-2)

- Implement weekly/monthly aggregation storage
- Add goal tracking and achievement system
- Create analytics insights generation
- Enhance settings schema with new preferences

### Phase 2: UI/UX Improvements (Week 3-4)

- Redesign popup with tabbed interface
- Implement chart components (Chart.js or similar)
- Add real-time visual feedback
- Create settings panel with advanced options

### Phase 3: Onboarding & Features (Week 5-6)

- Build progressive onboarding flow
- Implement goal setting and notifications
- Add data export functionality
- Create achievement and insight system

### Phase 4: Polish & Optimization (Week 7-8)

- Performance optimization
- Enhanced error handling
- Accessibility improvements
- Documentation and testing

## Technical Considerations

### Performance Optimization

- Implement data pagination for large datasets
- Use background alarms for expensive aggregation operations
- Cache frequently accessed data in memory
- Lazy load chart components

### Privacy & Security

- Implement optional prompt text storage with user consent
- Add data anonymization for analytics
- Provide clear data retention controls
- Support data export and deletion

### Compatibility

- Maintain backward compatibility with existing storage schema
- Implement migration system for schema updates
- Support multiple browser APIs as available
- Graceful degradation for missing features

### Testing Strategy

- Unit tests for token extraction and calculations
- Integration tests for storage operations
- UI testing for popup components
- End-to-end testing with mock AI services

## Conclusion

This design specification provides a comprehensive roadmap for enhancing the QarbonQuery Chrome
Extension with improved analytics, user experience, and goal tracking capabilities while maintaining
the robust foundation of the current system. The phased implementation approach ensures minimal
disruption to existing functionality while delivering meaningful improvements to user engagement and
carbon awareness.
