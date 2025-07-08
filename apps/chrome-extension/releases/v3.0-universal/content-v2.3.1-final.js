console.log('🌱 QarbonQuery v2.3.1: Fixed Perplexity tracking');

const originalFetch = window.fetch;
const originalXHR = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

// Override fetch for ChatGPT, Claude, and Perplexity
window.fetch = async function(...args) {
  const url = args[0]?.url || args[0] || '';
  
  // Special handling for Perplexity SSE endpoint
  if (url.includes('/rest/sse/perplexity_ask')) {
    console.log('✅ Perplexity AI endpoint detected');
    
    try {
      const response = await originalFetch.apply(this, args);
      
      // For SSE/streaming, we need to intercept the stream without breaking it
      if (response.headers.get('content-type')?.includes('event-stream')) {
        const reader = response.body.getReader();
        let fullContent = '';
        
        // Create a new readable stream that captures data
        const stream = new ReadableStream({
          async start(controller) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                // Calculate emissions when stream completes
                const tokens = fullContent.length / 4;
                const emissions = (tokens / 1000) * 0.002;
                
                const data = JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
                const today = new Date().toDateString();
                data[today] = (data[today] || 0) + emissions;
                localStorage.setItem('qarbon_emissions', JSON.stringify(data));
                
                console.log(`💚 Perplexity: ${emissions.toFixed(4)}g CO₂e (${tokens.toFixed(0)} tokens)`);
                console.log(`📊 Total today: ${data[today].toFixed(4)}g`);
                
                break;
              }
              
              // Capture the content
              const text = new TextDecoder().decode(value);
              fullContent += text;
              
              // Pass the data through unchanged
              controller.enqueue(value);
            }
            controller.close();
          }
        });
        
        // Return new response with our intercepted stream
        return new Response(stream, {
          headers: response.headers,
          status: response.status,
          statusText: response.statusText
        });
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error with Perplexity:', error);
      return originalFetch.apply(this, args);
    }
  }
  
  // Regular handling for ChatGPT and Claude
  if (url.includes('/conversation') || 
      url.includes('/completion') || 
      url.includes('/append_message')) {
    console.log('✅ AI endpoint:', url);
    
    try {
      const response = await originalFetch.apply(this, args);
      const cloned = response.clone();
      const text = await cloned.text();
      
      let platform = 'Unknown';
      if (url.includes('chatgpt') || url.includes('openai')) platform = 'ChatGPT';
      else if (url.includes('claude')) platform = 'Claude';
      
      const tokens = text.length / (platform === 'Claude' ? 3.5 : 4);
      const emissions = (tokens / 1000) * 0.002;
      
      const data = JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
      const today = new Date().toDateString();
      data[today] = (data[today] || 0) + emissions;
      localStorage.setItem('qarbon_emissions', JSON.stringify(data));
      
      console.log(`💚 ${platform}: ${emissions.toFixed(4)}g CO₂e (${tokens.toFixed(0)} tokens)`);
      console.log(`📊 Total today: ${data[today].toFixed(4)}g`);
      
      return response;
    } catch (error) {
      console.error('❌ Error tracking:', error);
      return originalFetch.apply(this, args);
    }
  }
  
  return originalFetch.apply(this, args);
};

// XHR for Gemini (unchanged)
XMLHttpRequest.prototype.open = function(method, url, ...rest) {
  this._method = method;
  this._url = url;
  return originalXHR.apply(this, [method, url, ...rest]);
};

XMLHttpRequest.prototype.send = function(data) {
  if (this._url && this._url.includes('StreamGenerate')) {
    console.log('✅ Gemini AI endpoint detected');
    
    this.addEventListener('load', function() {
      try {
        const responseText = this.responseText || this.response;
        const tokens = responseText.length / 4;
        const emissions = (tokens / 1000) * 0.002;
        
        const data = JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
        const today = new Date().toDateString();
        data[today] = (data[today] || 0) + emissions;
        localStorage.setItem('qarbon_emissions', JSON.stringify(data));
        
        console.log(`💚 Gemini: ${emissions.toFixed(4)}g CO₂e (${tokens.toFixed(0)} tokens)`);
        console.log(`📊 Total today: ${data[today].toFixed(4)}g`);
      } catch (error) {
        console.error('❌ Error tracking Gemini:', error);
      }
    });
  }
  
  return originalXHRSend.apply(this, arguments);
};

// Test function
window.qarbonTest = function() {
  const data = JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
  const today = new Date().toDateString();
  return {
    todayEmissions: (data[today] || 0).toFixed(4) + 'g',
    allData: data
  };
};

console.log('✅ QarbonQuery ready - All platforms tracking without breaking functionality');
