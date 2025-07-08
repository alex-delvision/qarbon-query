console.log('🔍 Perplexity Debug Test - Minimal Interception');

// Store original fetch
const originalFetch = window.fetch;

// Only intercept if we're on Perplexity
if (window.location.hostname.includes('perplexity.ai')) {
  console.log('📍 On Perplexity - Setting up minimal interception');

  window.fetch = async function (...args) {
    const url = args[0]?.url || args[0] || '';

    // Log ALL fetch calls
    console.log('Fetch called:', url);

    // Only track the SSE endpoint, pass everything else through
    if (url.includes('/rest/sse/perplexity_ask')) {
      console.log('🎯 SSE endpoint detected!');

      // Try the absolute minimal tracking
      setTimeout(() => {
        console.log('💚 Perplexity query tracked (delayed)');
        const data = JSON.parse(
          localStorage.getItem('qarbon_emissions') || '{}'
        );
        const today = new Date().toDateString();
        data[today] = (data[today] || 0) + 0.004; // 2000 tokens estimate
        localStorage.setItem('qarbon_emissions', JSON.stringify(data));
      }, 100);
    }

    // Always pass through unchanged
    return originalFetch.apply(this, args);
  };

  // Also check if they're using EventSource for SSE
  const OriginalEventSource = window.EventSource;
  window.EventSource = function (url, config) {
    console.log('🔌 EventSource created:', url);
    return new OriginalEventSource(url, config);
  };
}

console.log('✅ Minimal Perplexity test ready');
