# Newsletter Subscription API

This API endpoint handles email subscriptions to your newsletter using ConvertKit.

## Setup

1. **Environment Variables**: Add your ConvertKit API key and form ID to your environment variables:
   ```bash
   CONVERTKIT_API_KEY=your_convertkit_api_key_here
   CONVERTKIT_FORM_ID=your_convertkit_form_id_here
   ```

   You can find these in your ConvertKit account:
   - API Key: Settings > Advanced > API Keys
   - Form ID: Create a form and get the ID from the form settings or URL

## Usage

### POST `/api/subscribe`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed! Thank you for joining our newsletter."
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Please enter a valid email address"
}
```

### Status Codes

- `200` - Success
- `400` - Invalid email or already subscribed
- `500` - Server error or ConvertKit API error

## Frontend Integration

The API is already integrated with the `CallToAction` component using `react-hot-toast` for user feedback:

```typescript
import toast from 'react-hot-toast';

const handleSubmit = async (email: string) => {
  try {
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      toast.success(data.message);
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error('Something went wrong. Please try again.');
  }
};
```

## Features

- ✅ Email validation using Zod
- ✅ ConvertKit API integration
- ✅ Proper error handling
- ✅ Toast notifications with react-hot-toast
- ✅ Honeypot spam protection
- ✅ Environment variable validation
