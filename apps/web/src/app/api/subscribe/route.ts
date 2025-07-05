import { NextResponse } from 'next/server';
import { z } from 'zod';

// Define the schema for the email using zod
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(request: Request) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const { email } = emailSchema.parse(body);

    // Check if API key is available
    if (!process.env.CONVERTKIT_API_KEY || !process.env.CONVERTKIT_FORM_ID) {
      console.error('CONVERTKIT_API_KEY or CONVERTKIT_FORM_ID environment variable is not set');
      return NextResponse.json(
        { success: false, message: 'Newsletter service is not configured.' },
        { status: 500 }
      );
    }

    // Call ConvertKit API
    const response = await fetch(`https://api.convertkit.com/v3/forms/${process.env.CONVERTKIT_FORM_ID}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.CONVERTKIT_API_KEY,
        email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ConvertKit API error:', errorData);
      
      // Handle specific ConvertKit errors
      if (response.status === 422) {
        return NextResponse.json(
          { success: false, message: 'This email is already subscribed.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: false, message: 'Unable to subscribe at this time. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully subscribed! Thank you for joining our newsletter.' 
    });
    
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0].message },
        { status: 400 }
      );
    }
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: 'Invalid request format.' },
        { status: 400 }
      );
    }
    
    // Handle other errors
    console.error('Subscription error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
