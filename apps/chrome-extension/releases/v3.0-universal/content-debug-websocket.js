console.log('🔍 QarbonQuery Debug: Full WebSocket + Fetch Analysis');

const originalFetch = window.fetch;
const OriginalWebSocket = window.WebSocket;
let wsConnections = new Map();
let wsMessageCount = 0;

// Enhanced fetch debugging (same as before)
window.fetch = async function(...args) {
  const url = args[0]?.url || args[0] || '';
  
  if (window.location.hostname.includes('perplexity.ai')) {
    console.log('📍 Perplexity fetch:', {
      url: url.toString().substring(0, 100),
      method: args[1]?.method || 'GET',
      headers: args[1]?.headers,
      hasBody: !!args[1]?.body
    });
    
    try {
      const response = await originalFetch.apply(this, args);
      console.log('✅ Response:', response.status, response.headers.get('content-type'));
      return response;
    } catch (error) {
      console.error('❌ Fetch failed:', error);
      throw error;
    }
  }
  
  return originalFetch.apply(this, args);
};

// Enhanced WebSocket debugging
window.WebSocket = function(url, protocols) {
  console.log('🔌 WebSocket connection attempt:', {
    url: url,
    protocols: protocols,
    timestamp: new Date().toISOString()
  });
  
  const ws = new OriginalWebSocket(url, protocols);
  const wsId = Math.random().toString(36).substr(2, 9);
  wsConnections.set(wsId, { url, connected: false });
  
  ws.addEventListener('open', function(event) {
    wsConnections.get(wsId).connected = true;
    console.log('✅ WebSocket opened:', wsId, url);
  });
  
  ws.addEventListener('message', function(event) {
    wsMessageCount++;
    const data = event.data;
    
    console.log(`📨 WebSocket message #${wsMessageCount} (${wsId}):`, {
      url: url,
      dataType: typeof data,
      dataLength: data.length,
      preview: data.toString().substring(0, 200),
      timestamp: new Date().toISOString()
    });
    
    // Check for AI response patterns
    if (data.includes('response') || data.includes('answer') || data.includes('text')) {
      console.log('🚨 POTENTIAL AI RESPONSE:', data.substring(0, 300));
    }
  });
  
  ws.addEventListener('close', function(event) {
    console.log('❌ WebSocket closed:', wsId, event.code, event.reason);
    wsConnections.delete(wsId);
  });
  
  ws.addEventListener('error', function(event) {
    console.error('💥 WebSocket error:', wsId, event);
  });
  
  return ws;
};

// Helper function to get WebSocket status
window.getWSStatus = function() {
  return {
    activeConnections: wsConnections.size,
    totalMessages: wsMessageCount,
    connections: Array.from(wsConnections.entries())
  };
};

console.log('🔍 Enhanced WebSocket + Fetch debugging active');
console.log('💡 Use getWSStatus() to check WebSocket activity');
