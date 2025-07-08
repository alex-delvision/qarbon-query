console.log('🌱 QarbonQuery Step 2: Emission Calculation');

const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const url = args[0]?.url || args[0] || '';
  
  // Check if it's an AI endpoint
  if (url.includes('/conversation') || 
      url.includes('/completion') || 
      url.includes('/append_message')) {
    console.log('✅ AI endpoint:', url);
    
    try {
      // Call original fetch
      const response = await originalFetch.apply(this, args);
      
      // Clone to read response size
      const cloned = response.clone();
      const text = await cloned.text();
      
      // Simple emission calculation
      const platform = url.includes('chatgpt') ? 'ChatGPT' : 'Claude';
      const tokens = text.length / (platform === 'Claude' ? 3.5 : 4);
      const emissions = (tokens / 1000) * 0.002;
      
      // Store emissions with timestamp
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

// Test functions
window.qarbonTest = function() {
  const data = JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
  const today = new Date().toDateString();
  return {
    todayEmissions: (data[today] || 0).toFixed(4) + 'g',
    allData: data
  };
};

console.log('✅ Emission calculation ready');
