# Analytics Setup and Usage

This directory contains the analytics wrapper for QarbonQuery, providing safe tracking with both Google Analytics 4 and Vercel Analytics.

## Features

- ✅ **SSR-safe**: All tracking functions safely noop during server-side rendering
- ✅ **Environment-based**: Uses `NEXT_PUBLIC_GA_ID` environment variable
- ✅ **Event tracking**: Pre-built functions for key events
- ✅ **Privacy-focused**: Includes IP anonymization and cookie settings
- ✅ **TypeScript support**: Full type definitions for gtag

## Setup

### 1. Environment Variables

Add your Google Analytics 4 Measurement ID to your environment variables:

```bash
# .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 2. Layout Integration

The analytics scripts are automatically loaded in `app/layout.tsx` when `NEXT_PUBLIC_GA_ID` is present.

### 3. Event Tracking

Import and use the tracking functions in your components:

```tsx
import { 
  trackExtensionInstallClick, 
  trackNpmCopyClick, 
  trackNewsletterSubmitted 
} from '@/lib/analytics';

// In your component
const handleExtensionInstall = () => {
  trackExtensionInstallClick('chrome');
  // Your install logic here
};
```

## Available Functions

### Core Event Tracking

- `trackExtensionInstallClick(extensionType: string)` - Track extension install button clicks
- `trackNpmCopyClick(packageName: string)` - Track NPM copy button clicks  
- `trackNewsletterSubmitted(source: string, email?: string)` - Track newsletter subscriptions

### Generic Tracking

- `trackEvent(action, category, label?, value?)` - Generic event tracking
- `trackPageView(url, title)` - Manual page view tracking
- `trackConversion(name, value?, currency?)` - Conversion tracking

### Utilities

- `isAnalyticsReady()` - Check if analytics is properly initialized
- `setAnalyticsEnabled(enabled)` - Enable/disable tracking (GDPR compliance)

## Event Details

### extension_install_click
```javascript
{
  event: 'extension_install_click',
  extension_type: 'chrome' | 'firefox' | 'edge',
  event_category: 'user_engagement'
}
```

### npm_copy_click
```javascript
{
  event: 'npm_copy_click',
  package_name: 'qarbon-query',
  event_category: 'user_engagement'
}
```

### newsletter_submitted
```javascript
{
  event: 'newsletter_submitted',
  source: 'header' | 'footer' | 'modal' | 'unknown',
  event_category: 'conversion',
  email_provided: boolean
}
```

## Privacy & GDPR

The analytics wrapper includes privacy-focused defaults:

- IP anonymization enabled
- Secure cookie settings
- Option to disable tracking entirely
- No PII tracking by default

## Usage Examples

### Extension Install Button
```tsx
<button onClick={() => trackExtensionInstallClick('chrome')}>
  Install Chrome Extension
</button>
```

### NPM Copy Button
```tsx
const handleCopyNpm = async () => {
  trackNpmCopyClick('qarbon-query');
  await navigator.clipboard.writeText('npm install qarbon-query');
};
```

### Newsletter Form
```tsx
const handleSubmit = (email: string) => {
  trackNewsletterSubmitted('header', email);
  // Submit to newsletter service
};
```

## Vercel Analytics

Vercel Analytics is automatically enabled when deployed to Vercel. No additional configuration is needed.

## Testing

To test analytics in development:

1. Set `NEXT_PUBLIC_GA_ID` in your `.env.local`
2. Open browser developer tools
3. Check the Network tab for gtag requests
4. Use `isAnalyticsReady()` to verify initialization

## Troubleshooting

### Analytics not working?

1. Verify `NEXT_PUBLIC_GA_ID` is set correctly
2. Check browser console for errors
3. Ensure you're testing in a browser (not SSR)
4. Verify the GA4 property is properly configured

### Events not showing in GA4?

1. GA4 events may take 24-48 hours to appear
2. Use GA4 DebugView for real-time testing
3. Check that event names match GA4 conventions

## Best Practices

1. Always track user actions that indicate engagement
2. Use descriptive event labels and categories
3. Respect user privacy preferences
4. Test tracking in development before deploying
5. Keep event names consistent across your application
