console.log('🌱 QarbonQuery v2.5: Message-based tracking');

// Inject a script into the page context to intercept fetch
const script = document.createElement('script');
script.textContent = `
(function() {
  const originalFetch = window.fetch;
  const originalXHR = window.XMLHttpRequest.prototype.open;
  const originalXHRSend = window.XMLHttpRequest.prototype.send;
  
  // Override fetch
  window.fetch = async function(...args) {
    const url = args[0]?.url || args[0] || '';
    
    // Notify content script about AI requests
    if (url.includes('/conversation') || 
        url.includes('/completion') || 
        url.includes('/append_message')) {
      
      const response = await originalFetch.apply(this, args);
      const cloned = response.clone();
      const text = await cloned.text();
      
      window.postMessage({
        type: 'QARBON_TRACK',
        platform: url.includes('claude') ? 'Claude' : 'ChatGPT',
        size: text.length
      }, '*');
      
      return response;
    }
    
    // For Perplexity, just notify when we see activity
    if (window.location.hostname.includes('perplexity.ai') && 
        url.includes('https://') && 
        !url.includes('.css') && 
        !url.includes('.js')) {
      
      window.postMessage({
        type: 'QARBON_TRACK',
        platform: 'Perplexity',
        size: 8000 // Estimate
      }, '*');
    }
    
    return originalFetch.apply(this, args);
  };
  
  // Override XHR for Gemini
  window.XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._url = url;
    return originalXHR.apply(this, [method, url, ...rest]);
  };
  
  window.XMLHttpRequest.prototype.send = function(data) {
    if (this._url && this._url.includes('StreamGenerate')) {
      const xhr = this;
      this.addEventListener('load', function() {
        window.postMessage({
          type: 'QARBON_TRACK',
          platform: 'Gemini',
          size: xhr.responseText?.length || xhr.response?.length || 0
        }, '*');
      });
    }
    return originalXHRSend.apply(this, arguments);
  };
})();
`;

// Inject the script
document.documentElement.appendChild(script);
script.remove();

// Listen for messages from the injected script
window.addEventListener('message', event => {
  if (event.data.type === 'QARBON_TRACK') {
    const { platform, size } = event.data;

    // Calculate emissions
    const divisor = platform === 'Claude' ? 3.5 : 4;
    const tokens = size / divisor;
    const emissions = (tokens / 1000) * 0.002;

    // Store in localStorage
    const data = JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
    const today = new Date().toDateString();
    data[today] = (data[today] || 0) + emissions;
    localStorage.setItem('qarbon_emissions', JSON.stringify(data));

    console.log(
      `💚 ${platform}: ${emissions.toFixed(4)}g CO₂e (${tokens.toFixed(0)} tokens)`
    );
    console.log(`📊 Total today: ${data[today].toFixed(4)}g`);
  }
});

// Add test function to window
window.addEventListener('load', () => {
  const testScript = document.createElement('script');
  testScript.textContent = `
    window.qarbonTest = function() {
      return JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
    };
  `;
  document.documentElement.appendChild(testScript);
  testScript.remove();
});

console.log('✅ QarbonQuery ready - Using message passing for all platforms');
