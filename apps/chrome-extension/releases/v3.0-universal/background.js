console.log('🌱 QarbonQuery Background Service - WebRequest Handler v2');

// Track request sizes for Perplexity
const perplexityRequests = new Map();

// Listen for Perplexity API requests with broader patterns
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Log ALL Perplexity requests to see what we're missing
    if (details.url.includes('perplexity.ai')) {
      console.log('🔍 Perplexity request:', details.url, details.method);
    }
    
    // Track potential API calls (broader patterns)
    if (details.url.includes('perplexity.ai') && 
        (details.url.includes('/api/') || 
         details.url.includes('/backend/') ||
         details.url.includes('/socket/') ||
         details.url.includes('/_next/') ||
         details.method === 'POST')) {
      
      console.log('📍 Tracking Perplexity request:', details.requestId, details.url);
      perplexityRequests.set(details.requestId, {
        url: details.url,
        timestamp: Date.now(),
        method: details.method
      });
    }
  },
  { urls: ["*://*.perplexity.ai/*"] },
  ["requestBody"]
);

// Listen for response completion
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (perplexityRequests.has(details.requestId)) {
      console.log('✅ Perplexity response completed:', details.url);
      
      // Track if it looks like an AI response
      if (details.url.includes('perplexity.ai') && 
          (details.statusCode === 200 || details.statusCode === 206)) {
        
        // Estimate tokens based on typical response
        const estimatedTokens = 2000;
        const emissions = (estimatedTokens / 1000) * 0.002;
        
        // Get current data from storage
        chrome.storage.local.get(['emissions'], (result) => {
          const data = result.emissions || {};
          const today = new Date().toDateString();
          data[today] = (data[today] || 0) + emissions;
          
          // Save back to storage
          chrome.storage.local.set({ emissions: data }, () => {
            console.log(`💚 Perplexity tracked: ${emissions.toFixed(4)}g CO₂e`);
            console.log('📊 Updated storage:', data);
          });
        });
        
        // Clean up
        perplexityRequests.delete(details.requestId);
      }
    }
  },
  { urls: ["*://*.perplexity.ai/*"] }
);

// Also listen for WebSocket connections (Perplexity might use these)
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.url.startsWith('wss://') && details.url.includes('perplexity')) {
      console.log('🔌 Perplexity WebSocket detected:', details.url);
      
      // Track WebSocket as a query
      const estimatedTokens = 2000;
      const emissions = (estimatedTokens / 1000) * 0.002;
      
      chrome.storage.local.get(['emissions'], (result) => {
        const data = result.emissions || {};
        const today = new Date().toDateString();
        data[today] = (data[today] || 0) + emissions;
        
        chrome.storage.local.set({ emissions: data }, () => {
          console.log(`💚 Perplexity WebSocket tracked: ${emissions.toFixed(4)}g CO₂e`);
        });
      });
    }
  },
  { urls: ["wss://*.perplexity.ai/*", "ws://*.perplexity.ai/*"] }
);

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_EMISSIONS') {
    chrome.storage.local.get(['emissions'], (result) => {
      sendResponse(result.emissions || {});
    });
    return true;
  }
  
  if (request.type === 'SAVE_EMISSIONS') {
    chrome.storage.local.get(['emissions'], (result) => {
      const data = result.emissions || {};
      const today = new Date().toDateString();
      data[today] = (data[today] || 0) + request.emissions;
      
      chrome.storage.local.set({ emissions: data }, () => {
        console.log('💾 Saved emissions from content script:', request.emissions);
        sendResponse({ success: true });
      });
    });
    return true;
  }
});

console.log('✅ Background service ready - logging all Perplexity requests');
