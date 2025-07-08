console.log('🔍 QarbonQuery Enhanced Debug: Complete Perplexity Analysis');

// Store original functions
const originalFetch = window.fetch;
const originalXHR = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

let requestCounter = 0;

// Enhanced fetch logging
window.fetch = async function(...args) {
  const url = args[0]?.url || args[0] || '';
  const options = args[1] || {};
  
  // Detailed logging for Perplexity
  if (window.location.hostname.includes('perplexity.ai')) {
    requestCounter++;
    console.log(`🎯 Request #${requestCounter}:`, {
      url: url.toString(),
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body ? options.body.toString().substring(0, 200) : null,
      timestamp: new Date().toISOString()
    });
    
    // Check for specific patterns
    if (url.includes('search') || url.includes('query') || url.includes('ask')) {
      console.log('🚨 POTENTIAL AI ENDPOINT:', url);
    }
    
    try {
      const response = await originalFetch.apply(this, args);
      console.log(`✅ Response #${requestCounter}:`, {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        url: response.url
      });
      
      // Try to peek at response for AI content
      if (response.headers.get('content-type')?.includes('json')) {
        const cloned = response.clone();
        cloned.text().then(text => {
          if (text.length > 100) {
            console.log(`📊 Response preview #${requestCounter}:`, text.substring(0, 200) + '...');
          }
        }).catch(() => {});
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Request #${requestCounter} failed:`, error);
      throw error;
    }
  }
  
  // Normal pass-through for other sites
  return originalFetch.apply(this, args);
};

// XHR logging
XMLHttpRequest.prototype.open = function(method, url, ...rest) {
  if (window.location.hostname.includes('perplexity.ai')) {
    this._debugMethod = method;
    this._debugUrl = url;
    console.log('📡 XHR Open:', method, url);
  }
  return originalXHR.apply(this, [method, url, ...rest]);
};

XMLHttpRequest.prototype.send = function(data) {
  if (window.location.hostname.includes('perplexity.ai') && this._debugUrl) {
    console.log('📤 XHR Send:', this._debugMethod, this._debugUrl, data ? 'with data' : 'no data');
    
    this.addEventListener('load', function() {
      console.log('📥 XHR Response:', this._debugUrl, this.status, this.responseText.substring(0, 100));
    });
  }
  return originalXHRSend.apply(this, arguments);
};

console.log('🔍 Enhanced debug active - will log ALL Perplexity network activity');
