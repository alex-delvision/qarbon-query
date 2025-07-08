import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Environment variables for email service configuration
const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;
const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID;
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (real) {
    return real;
  }
  
  return 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5; // Max 5 requests per 15 minutes per IP
  
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

async function subscribeToConvertKit(email: string) {
  if (!CONVERTKIT_API_KEY || !CONVERTKIT_FORM_ID) {
    throw new Error('ConvertKit configuration missing');
  }

  const response = await fetch(`https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: CONVERTKIT_API_KEY,
      email,
      tags: ['qarbon-query-website'],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ConvertKit error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

async function subscribeToMailchimp(email: string) {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID || !MAILCHIMP_SERVER_PREFIX) {
    throw new Error('Mailchimp configuration missing');
  }

  const response = await fetch(
    `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        tags: ['qarbon-query-website'],
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    // Handle case where email is already subscribed
    if (errorData.title === 'Member Exists') {
      return { message: 'Email already subscribed' };
    }
    throw new Error(`Mailchimp error: ${response.status} - ${errorData.detail || 'Unknown error'}`);
  }

  return await response.json();
}

export default async function handler(request: NextRequest) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405, headers: { 'Allow': 'POST' } }
    );
  }

  try {
    // Parse request body
    const body = await request.json();
    const { email, website } = body;

    // Honeypot check - if website field is filled, it's likely a bot
    if (website && website.trim() !== '') {
      console.warn('Honeypot triggered:', { email, website });
      // Return success to avoid revealing the honeypot to bots
      return NextResponse.json({ message: 'Subscription successful' });
    }

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Rate limiting
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Attempt to subscribe to email service
    let result;
    let service = 'none';

    try {
      // Try ConvertKit first
      if (CONVERTKIT_API_KEY && CONVERTKIT_FORM_ID) {
        result = await subscribeToConvertKit(email);
        service = 'convertkit';
      }
      // Fallback to Mailchimp if ConvertKit is not configured
      else if (MAILCHIMP_API_KEY && MAILCHIMP_AUDIENCE_ID && MAILCHIMP_SERVER_PREFIX) {
        result = await subscribeToMailchimp(email);
        service = 'mailchimp';
      }
      else {
        throw new Error('No email service configured');
      }

      console.warn(`Subscription successful via ${service}:`, { email, result });

      return NextResponse.json({
        message: 'Thank you for subscribing! You\'ll receive updates about Qarbon Query.',
        service,
      });

    } catch (subscriptionError) {
      console.error(`${service} subscription error:`, subscriptionError);

      // Try the other service as fallback
      try {
        if (service === 'convertkit' && MAILCHIMP_API_KEY && MAILCHIMP_AUDIENCE_ID && MAILCHIMP_SERVER_PREFIX) {
          result = await subscribeToMailchimp(email);
          service = 'mailchimp';
          console.warn(`Fallback subscription successful via ${service}:`, { email, result });
          
          return NextResponse.json({
            message: 'Thank you for subscribing! You\'ll receive updates about Qarbon Query.',
            service,
          });
        } else if (service === 'mailchimp' && CONVERTKIT_API_KEY && CONVERTKIT_FORM_ID) {
          result = await subscribeToConvertKit(email);
          service = 'convertkit';
          console.warn(`Fallback subscription successful via ${service}:`, { email, result });
          
          return NextResponse.json({
            message: 'Thank you for subscribing! You\'ll receive updates about Qarbon Query.',
            service,
          });
        }
      } catch (fallbackError) {
        console.error(`Fallback subscription error:`, fallbackError);
      }

      // If both services fail, return error
      return NextResponse.json(
        { error: 'Unable to process subscription. Please try again later.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
