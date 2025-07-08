console.log('🧪 QarbonQuery TEST MODE - Enhanced Detection');

// Track fetch
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const url = args[0]?.url || args[0] || '';

  // Log ALL requests, not just on specific domains
  if (url.toString().includes('http')) {
    console.log('🔍 Fetch:', url.toString().substring(0, 150));
  }

  // Look for potential API patterns
  if (
    url.includes('generate') ||
    url.includes('stream') ||
    url.includes('/v1/') ||
    url.includes('bard') ||
    url.includes('assistant')
  ) {
    console.log('⚡ POTENTIAL API:', url);
  }

  return originalFetch.apply(this, args);
};

// Track XMLHttpRequest
const XHR = XMLHttpRequest.prototype;
const originalOpen = XHR.open;
XHR.open = function (method, url) {
  if (url && url.includes('http')) {
    console.log('🔍 XHR:', method, url.substring(0, 150));
  }
  return originalOpen.apply(this, arguments);
};

// Track WebSocket
const originalWS = window.WebSocket;
window.WebSocket = function (url, protocols) {
  console.log('🔍 WebSocket:', url);
  return new originalWS(url, protocols);
};

console.log('✅ Enhanced detection ready - tracking Fetch, XHR, and WebSocket');
