# Call-to-Action Section

This document describes the sticky call-to-action band implemented for the Qarbon Query landing
page.

## Overview

The CallToAction component creates a sticky gradient band at the bottom of the page containing:

1. **Chrome Extension Button** (Primary CTA)
2. **NPM Install Command** with copy-to-clipboard functionality
3. **Newsletter Signup Form** with anti-spam protection

## Component Features

### 1. Chrome Extension Button

- Primary call-to-action with prominent styling
- Opens Chrome Web Store in new tab
- Hover effects with scaling animation
- Fully responsive design

### 2. NPM Install Command

- Styled as a code block: `npm i @qarbon/emissions`
- One-click copy-to-clipboard functionality
- Visual feedback on successful copy
- Terminal-like dark theme

### 3. Newsletter Signup Form

- Email validation
- Honeypot anti-spam field
- Loading states during submission
- Success/error message handling
- Rate limiting protection

## API Endpoint

### `/api/subscribe`

Vercel Edge Function that handles newsletter subscriptions with support for both ConvertKit and
Mailchimp.

#### Features:

- **Multiple Provider Support**: ConvertKit (primary) with Mailchimp fallback
- **Anti-Spam Protection**: Honeypot field + rate limiting (5 requests per 15 minutes per IP)
- **Email Validation**: Server-side email format validation
- **Error Handling**: Graceful fallback between providers
- **Security**: Input sanitization and request validation

#### Request Format:

```json
{
  \"email\": \"user@example.com\",
  \"website\": \"\" // Honeypot field - should be empty
}
```

#### Response Format:

```json
{
  \"message\": \"Thank you for subscribing! You'll receive updates about Qarbon Query.\",
  \"service\": \"convertkit\" // or \"mailchimp\"
}
```

#### Error Responses:

- `400`: Invalid email or missing email field
- `405`: Method not allowed (only POST accepted)
- `429`: Rate limit exceeded
- `500`: Server error or provider failure

## Environment Variables

Configure at least one email service provider:

### ConvertKit (Recommended)

```env
CONVERTKIT_API_KEY=your_api_secret
CONVERTKIT_FORM_ID=your_form_id
```

### Mailchimp (Alternative/Fallback)

```env
MAILCHIMP_API_KEY=your_api_key
MAILCHIMP_AUDIENCE_ID=your_audience_id
MAILCHIMP_SERVER_PREFIX=us1
```

## Setup Instructions

1. **Choose an Email Provider**: ConvertKit or Mailchimp (or both for redundancy)

2. **Get API Credentials**:
   - **ConvertKit**: Settings > Advanced > API Keys
   - **Mailchimp**: Account > Extras > API Keys

3. **Configure Environment Variables**: Copy `.env.example` to `.env.local` and fill in your
   credentials

4. **Deploy**: The API endpoint will automatically work with Vercel's Edge Runtime

## Security Features

### Rate Limiting

- 5 requests per IP address per 15-minute window
- In-memory store (consider Redis for production scaling)

### Honeypot Protection

- Hidden `website` field that should remain empty
- Bots that fill this field are silently rejected

### Input Validation

- Server-side email format validation
- Request method validation (POST only)
- Content-type validation

### Privacy

- No personal data stored on the server
- Immediate forwarding to email service providers
- No tracking or analytics collection

## Usage

```tsx
import { CallToAction } from '@/components/CallToAction';

// Add to your page
<CallToAction />;
```

The component is automatically responsive and will adapt to different screen sizes:

- **Desktop**: 3-column layout
- **Tablet**: 2-column layout with stacked newsletter form
- **Mobile**: Single column with stacked elements

## Styling

The component uses Tailwind CSS classes and can be customized via:

- Custom CSS classes in `globals.css`
- Tailwind utilities passed via the `className` prop
- CSS variables for theme customization

## Accessibility

- Semantic HTML with proper form labels
- Screen reader support with `sr-only` labels
- Focus management with visible focus indicators
- Keyboard navigation support
- ARIA attributes for form validation

## Browser Support

- Modern browsers with JavaScript enabled
- Clipboard API support for copy functionality
- Graceful degradation for older browsers

## Performance

- Edge runtime for minimal latency
- Optimized bundle size with tree shaking
- Minimal JavaScript footprint
- CSS animations for smooth interactions
