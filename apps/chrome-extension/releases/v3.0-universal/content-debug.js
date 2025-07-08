console.log('🔍 QarbonQuery Debug Mode - Logging ALL Gemini requests');

// Log all XHR requests
const XHR = XMLHttpRequest.prototype;
const originalOpen = XHR.open;
const originalSend = XHR.send;

XHR.open = function (method, url, ...rest) {
  this._method = method;
  this._url = url;
  console.log(`📡 XHR ${method}:`, url);
  return originalOpen.apply(this, [method, url, ...rest]);
};

XHR.send = function (data) {
  if (this._url && this._url.includes('bard')) {
    console.log('🎯 BARD REQUEST FOUND:', this._method, this._url);
    console.log('Request data:', data);

    this.addEventListener('load', function () {
      console.log(
        '🎯 BARD RESPONSE:',
        this.responseText.substring(0, 200) + '...'
      );
    });
  }
  return originalSend.apply(this, arguments);
};

// Also log fetch
const originalFetch = window.fetch;
window.fetch = function (...args) {
  const url = args[0]?.url || args[0] || '';
  if (url.toString().includes('bard') || url.toString().includes('generate')) {
    console.log('🎯 FETCH:', url);
  }
  return originalFetch.apply(this, args);
};

console.log('✅ Debug mode active - Send a message to Gemini');
