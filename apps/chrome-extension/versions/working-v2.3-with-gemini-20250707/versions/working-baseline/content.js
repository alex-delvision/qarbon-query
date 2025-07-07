console.log('🌱 QarbonQuery Tracking Active');

// Intercept fetch for AI API calls
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const response = await originalFetch.apply(this, args);
  const url = args[0].toString();
  
  // Track Claude API calls
  if (url.includes('/api/append_message') || url.includes('/api/completion')) {
    console.log('📊 Claude API call detected');
    const cloned = response.clone();
    const text = await cloned.text();
    const tokens = text.length / 3.5; // Claude estimation
    const emissions = (tokens / 1000) * 0.002;
    
    // Store in localStorage
    const data = JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
    const today = new Date().toDateString();
    data[today] = (data[today] || 0) + emissions;
    localStorage.setItem('qarbon_emissions', JSON.stringify(data));
    console.log(`💚 Emissions tracked: ${emissions.toFixed(2)}g CO₂e`);
  }
  
  // Track ChatGPT API calls
  if (url.includes('/backend-api/conversation')) {
    console.log('📊 ChatGPT API call detected');
    const cloned = response.clone();
    const text = await cloned.text();
    const tokens = text.length / 4; // GPT estimation
    const emissions = (tokens / 1000) * 0.002;
    
    // Store in localStorage
    const data = JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
    const today = new Date().toDateString();
    data[today] = (data[today] || 0) + emissions;
    localStorage.setItem('qarbon_emissions', JSON.stringify(data));
    console.log(`💚 Emissions tracked: ${emissions.toFixed(2)}g CO₂e`);
  }
  
  return response;
};

// Make data accessible
window.getQarbonStats = function() {
  return JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
};
