console.log('🔍 Ultra-Minimal Perplexity Test');

// Only run on Perplexity
if (window.location.hostname.includes('perplexity.ai')) {
  console.log('📍 On Perplexity domain');
  
  // Track via URL monitoring (no fetch interception)
  const trackQuery = () => {
    if (window.location.pathname.includes('/search') || document.querySelector('[data-testid="search-button"]')) {
      console.log('💚 Perplexity search detected (URL/DOM method)');
      const data = JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
      const today = new Date().toDateString();
      data[today] = (data[today] || 0) + 0.004;
      localStorage.setItem('qarbon_emissions', JSON.stringify(data));
    }
  };
  
  // Monitor for search activity
  setInterval(trackQuery, 2000);
  
  // Also monitor for specific DOM changes
  const observer = new MutationObserver(() => {
    const searchResults = document.querySelector('[data-testid="search-results"]');
    if (searchResults && !searchResults.hasAttribute('data-tracked')) {
      console.log('💚 Search results appeared - tracking query');
      searchResults.setAttribute('data-tracked', 'true');
      
      const data = JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
      const today = new Date().toDateString();
      data[today] = (data[today] || 0) + 0.004;
      localStorage.setItem('qarbon_emissions', JSON.stringify(data));
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

console.log('✅ Ultra-minimal tracking ready');
