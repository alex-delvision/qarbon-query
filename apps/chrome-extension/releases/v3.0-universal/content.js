console.log(
  '🌱 QarbonQuery v2.8: Unified tracking with backward compatibility'
);

const originalFetch = window.fetch;
const originalXHR = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

// Helper to save emissions to BOTH localStorage and chrome.storage
function saveEmissions(platform, tokens) {
  const emissions = (tokens / 1000) * 0.002;

  // Save to localStorage (for immediate access)
  const data = JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
  const today = new Date().toDateString();
  data[today] = (data[today] || 0) + emissions;
  localStorage.setItem('qarbon_emissions', JSON.stringify(data));

  // Also sync to chrome.storage for background script
  chrome.runtime.sendMessage({
    type: 'SAVE_EMISSIONS',
    emissions: emissions,
  });

  console.log(
    `💚 ${platform}: ${emissions.toFixed(4)}g CO₂e (${tokens.toFixed(0)} tokens)`
  );
  console.log(`📊 Total today: ${data[today].toFixed(4)}g`);
}

// Check if on Perplexity - webRequest will handle it
if (window.location.hostname.includes('perplexity.ai')) {
  console.log('📍 On Perplexity - tracked via webRequest API');
} else {
  // Override fetch for ChatGPT and Claude
  window.fetch = async function (...args) {
    const url = args[0]?.url || args[0] || '';

    if (
      url.includes('/conversation') ||
      url.includes('/completion') ||
      url.includes('/append_message')
    ) {
      console.log('✅ AI endpoint:', url);

      try {
        const response = await originalFetch.apply(this, args);
        const cloned = response.clone();
        const text = await cloned.text();

        let platform = 'Unknown';
        if (url.includes('chatgpt') || url.includes('openai'))
          platform = 'ChatGPT';
        else if (url.includes('claude')) platform = 'Claude';

        const tokens = text.length / (platform === 'Claude' ? 3.5 : 4);
        saveEmissions(platform, tokens);

        return response;
      } catch (error) {
        console.error('❌ Error tracking:', error);
        return originalFetch.apply(this, args);
      }
    }

    return originalFetch.apply(this, args);
  };

  // Override XHR for Gemini
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._method = method;
    this._url = url;
    return originalXHR.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (data) {
    if (this._url && this._url.includes('StreamGenerate')) {
      console.log('✅ Gemini AI endpoint detected');

      this.addEventListener('load', function () {
        try {
          const responseText = this.responseText || this.response;
          const tokens = responseText.length / 4;
          saveEmissions('Gemini', tokens);
        } catch (error) {
          console.error('❌ Error tracking Gemini:', error);
        }
      });
    }

    return originalXHRSend.apply(this, arguments);
  };
}

// Test function
window.qarbonTest = function () {
  const localData = JSON.parse(
    localStorage.getItem('qarbon_emissions') || '{}'
  );
  const today = new Date().toDateString();
  return {
    todayEmissions: (localData[today] || 0).toFixed(4) + 'g',
    localStorage: localData,
    note: 'Check chrome.storage for Perplexity data',
  };
};

console.log('✅ QarbonQuery ready - All platforms supported with dual storage');
