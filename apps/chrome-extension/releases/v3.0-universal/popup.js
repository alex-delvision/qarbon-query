console.log('🌱 QarbonQuery Popup Loading...');

async function updateEmissions() {
  try {
    // Get all tabs to read localStorage
    const tabs = await chrome.tabs.query({});
    let combinedData = {};
    
    // Collect data from all tabs' localStorage
    for (const tab of tabs) {
      if (tab.url && (tab.url.includes('claude.ai') || 
                      tab.url.includes('chatgpt.com') || 
                      tab.url.includes('chat.openai.com') ||
                      tab.url.includes('gemini.google.com'))) {
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              return JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
            }
          });
          
          if (results && results[0] && results[0].result) {
            const tabData = results[0].result;
            // Merge data
            for (const [date, emissions] of Object.entries(tabData)) {
              combinedData[date] = (combinedData[date] || 0) + emissions;
            }
          }
        } catch (e) {
          // Tab might be closed or inaccessible
        }
      }
    }
    
    // Also get Perplexity data from chrome.storage
    chrome.runtime.sendMessage({ type: 'GET_EMISSIONS' }, (storageData) => {
      if (storageData) {
        // Merge chrome.storage data with localStorage data
        for (const [date, emissions] of Object.entries(storageData)) {
          combinedData[date] = (combinedData[date] || 0) + emissions;
        }
      }
      
      // Calculate totals
      const today = new Date().toDateString();
      const todayEmissions = combinedData[today] || 0;
      
      let weekTotal = 0;
      const now = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        weekTotal += combinedData[date.toDateString()] || 0;
      }
      
      // Update UI
      document.getElementById('today').textContent = todayEmissions.toFixed(2) + 'g';
      document.getElementById('week').textContent = weekTotal.toFixed(2) + 'g';
      
      console.log('📊 Combined data:', combinedData);
    });
    
    // Update platform indicator
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const url = new URL(tabs[0].url);
      const hostname = url.hostname;
      
      const supported = [
        'claude.ai',
        'chat.openai.com',
        'chatgpt.com',
        'gemini.google.com',
        'perplexity.ai',
        'www.perplexity.ai'
      ];
      
      const indicator = document.querySelector('.platform-indicator');
      if (indicator) {
        if (supported.some(domain => hostname.includes(domain))) {
          indicator.innerHTML = '✅ Platform supported';
          indicator.style.color = '#4CAF50';
        } else {
          indicator.innerHTML = '❌ Platform not supported';
          indicator.style.color = '#f44336';
        }
      }
    });
  } catch (error) {
    console.error('Error updating emissions:', error);
  }
}

// Update on load
updateEmissions();

// Update every 2 seconds
setInterval(updateEmissions, 2000);
