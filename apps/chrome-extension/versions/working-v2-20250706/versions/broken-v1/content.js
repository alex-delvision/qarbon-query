(function() {
  'use strict';
  
  // Skip if already loaded
  if (window.__qarbonLoaded) return;
  window.__qarbonLoaded = true;
  
  console.log('🌱 QarbonQuery Content Script Loading...');
  
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const url = args[0]?.url || args[0];
    
    // Detect AI endpoints
    const patterns = {
      claude: ['/completion', '/chat_conversations', '/append_message'],
      chatgpt: ['/backend-api/conversation'],
      gemini: ['generativelanguage.googleapis.com']
    };
    
    let platform = null;
    if (patterns.claude.some(p => url && url.includes(p))) platform = 'Claude';
    else if (patterns.chatgpt.some(p => url && url.includes(p))) platform = 'ChatGPT';
    else if (patterns.gemini.some(p => url && url.includes(p))) platform = 'Gemini';
    
    if (platform) {
      console.log(`🎯 ${platform} API detected!`);
      
      const response = await originalFetch.apply(this, args);
      
      // Handle SSE streams
      if (response.headers.get('content-type')?.includes('event-stream')) {
        console.log(`📡 ${platform} SSE Stream detected`);
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        
        const stream = new ReadableStream({
          async start(controller) {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullContent += decoder.decode(value);
                controller.enqueue(value);
              }
              
              const divisor = platform === 'Claude' ? 3.5 : 4;
              const tokens = Math.ceil(fullContent.length / divisor);
              const emissions = (tokens / 1000) * 0.002;
              
              const capture = {
                platform,
                timestamp: Date.now(),
                tokens,
                emissions,
                url
              };
              
              const existing = JSON.parse(localStorage.getItem('qarbon_sse_captures') || '[]');
              existing.push(capture);
              localStorage.setItem('qarbon_sse_captures', JSON.stringify(existing));
              
              console.log(`✅ Captured ${platform}: ${tokens} tokens, ${emissions.toFixed(4)} g CO₂e`);
            } catch (e) {
              console.error('Stream error:', e);
            }
            controller.close();
          }
        });
        
        return new Response(stream, {
          headers: response.headers,
          status: response.status,
          statusText: response.statusText
        });
      }
      
      return response;
    }
    
    return originalFetch.apply(this, args);
  };
  
  // Stats function for popup
  window.__qarbonGetStats = function() {
    const captures = JSON.parse(localStorage.getItem('qarbon_sse_captures') || '[]');
    const today = new Date().toDateString();
    const todayCaptures = captures.filter(c => new Date(c.timestamp).toDateString() === today);
    
    return {
      today: {
        captures: todayCaptures.length,
        emissions: todayCaptures.reduce((sum, c) => sum + (c.emissions || 0), 0),
        tokens: todayCaptures.reduce((sum, c) => sum + (c.tokens || 0), 0)
      },
      allTime: {
        captures: captures.length,
        emissions: captures.reduce((sum, c) => sum + (c.emissions || 0), 0)
      }
    };
  };
  
  console.log('✅ QarbonQuery Content Script Loaded!');
})();
