console.log('🌱 QarbonQuery v2.3: Now with Gemini support');

const originalFetch = window.fetch;
const originalXHR = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

// Override fetch for ChatGPT, Claude, and Perplexity
window.fetch = async function (...args) {
  const url = args[0]?.url || args[0] || '';

  // Check if it's an AI endpoint
  if (
    url.includes('/conversation') ||
    url.includes('/completion') ||
    url.includes('/append_message') ||
    url.includes('/rest/sse/perplexity_ask')
  ) {
    console.log('✅ AI endpoint:', url);

    try {
      const response = await originalFetch.apply(this, args);
      const cloned = response.clone();
      const text = await cloned.text();

      // Detect platform
      let platform = 'Unknown';
      if (url.includes('chatgpt') || url.includes('openai'))
        platform = 'ChatGPT';
      else if (url.includes('claude')) platform = 'Claude';
      else if (url.includes('perplexity')) platform = 'Perplexity';

      const tokens = text.length / (platform === 'Claude' ? 3.5 : 4);
      const emissions = (tokens / 1000) * 0.002;

      // Store emissions
      const data = JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
      const today = new Date().toDateString();
      data[today] = (data[today] || 0) + emissions;
      localStorage.setItem('qarbon_emissions', JSON.stringify(data));

      console.log(
        `💚 ${platform}: ${emissions.toFixed(4)}g CO₂e (${tokens.toFixed(0)} tokens)`
      );
      console.log(`📊 Total today: ${data[today].toFixed(4)}g`);

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
  // Check if it's Gemini's StreamGenerate endpoint
  if (this._url && this._url.includes('StreamGenerate')) {
    console.log('✅ Gemini AI endpoint detected');

    this.addEventListener('load', function () {
      try {
        const responseText = this.responseText || this.response;
        const tokens = responseText.length / 4;
        const emissions = (tokens / 1000) * 0.002;

        const data = JSON.parse(
          localStorage.getItem('qarbon_emissions') || '{}'
        );
        const today = new Date().toDateString();
        data[today] = (data[today] || 0) + emissions;
        localStorage.setItem('qarbon_emissions', JSON.stringify(data));

        console.log(
          `💚 Gemini: ${emissions.toFixed(4)}g CO₂e (${tokens.toFixed(0)} tokens)`
        );
        console.log(`📊 Total today: ${data[today].toFixed(4)}g`);
      } catch (error) {
        console.error('❌ Error tracking Gemini:', error);
      }
    });
  }

  return originalXHRSend.apply(this, arguments);
};

// Test function
window.qarbonTest = function () {
  const data = JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
  const today = new Date().toDateString();
  return {
    todayEmissions: (data[today] || 0).toFixed(4) + 'g',
    allData: data,
  };
};

console.log(
  '✅ QarbonQuery ready - Tracking: ChatGPT, Claude, Gemini, Perplexity'
);
