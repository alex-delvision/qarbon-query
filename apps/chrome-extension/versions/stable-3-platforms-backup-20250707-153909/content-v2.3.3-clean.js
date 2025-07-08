console.log('🌱 QarbonQuery v2.3.3: Excluding Perplexity for now');

const originalFetch = window.fetch;
const originalXHR = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

// Override fetch - but SKIP Perplexity entirely
window.fetch = async function (...args) {
  const url = args[0]?.url || args[0] || '';

  // If we're on Perplexity, don't intercept AT ALL
  if (window.location.hostname.includes('perplexity.ai')) {
    return originalFetch.apply(this, args);
  }

  // Regular handling for ChatGPT and Claude
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
      const emissions = (tokens / 1000) * 0.002;

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

// XHR for Gemini only
XMLHttpRequest.prototype.open = function (method, url, ...rest) {
  // Skip if on Perplexity
  if (window.location.hostname.includes('perplexity.ai')) {
    return originalXHR.apply(this, [method, url, ...rest]);
  }

  this._method = method;
  this._url = url;
  return originalXHR.apply(this, [method, url, ...rest]);
};

XMLHttpRequest.prototype.send = function (data) {
  // Skip if on Perplexity
  if (window.location.hostname.includes('perplexity.ai')) {
    return originalXHRSend.apply(this, arguments);
  }

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
    note: 'Perplexity tracking disabled due to compatibility issues',
  };
};

console.log(
  '✅ QarbonQuery ready - ChatGPT, Claude, Gemini (Perplexity disabled)'
);
