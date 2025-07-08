console.log('🔍 QarbonQuery Debug: Perplexity Issue Investigation');

const originalFetch = window.fetch;

// Only log Perplexity requests, don't modify them
window.fetch = async function (...args) {
  const url = args[0]?.url || args[0] || '';

  // If it's Perplexity, just log and pass through
  if (window.location.hostname.includes('perplexity.ai')) {
    console.log('📍 Perplexity fetch:', {
      url: url.toString().substring(0, 100),
      method: args[1]?.method || 'GET',
      headers: args[1]?.headers,
      hasBody: !!args[1]?.body,
    });

    // Pass through WITHOUT modification
    try {
      const response = await originalFetch.apply(this, args);
      console.log(
        '✅ Response:',
        response.status,
        response.headers.get('content-type')
      );
      return response;
    } catch (error) {
      console.error('❌ Fetch failed:', error);
      throw error;
    }
  }

  // For other sites, use our normal tracking
  if (
    url.includes('/conversation') ||
    url.includes('/completion') ||
    url.includes('/append_message')
  ) {
    // Normal tracking code...
    return originalFetch.apply(this, args);
  }

  return originalFetch.apply(this, args);
};

console.log('✅ Debug mode: Logging Perplexity requests only');
