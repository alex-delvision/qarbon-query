console.log('🌱 QarbonQuery Popup Loading...');

// Function to get emissions from all tabs
async function updateEmissions() {
  try {
    // Get all tabs
    const tabs = await chrome.tabs.query({});
    
    let totalToday = 0;
    let totalWeek = 0;
    
    // Check each tab for emissions data
    for (const tab of tabs) {
      if (tab.url && (tab.url.includes('claude.ai') || tab.url.includes('chatgpt.com'))) {
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              const data = JSON.parse(localStorage.getItem('qarbon_emissions') || '{}');
              const today = new Date().toDateString();
              
              // Calculate week total
              let weekTotal = 0;
              const now = new Date();
              for (let i = 0; i < 7; i++) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                weekTotal += data[date.toDateString()] || 0;
              }
              
              return {
                today: data[today] || 0,
                week: weekTotal
              };
            }
          });
          
          if (results && results[0] && results[0].result) {
            totalToday += results[0].result.today;
            totalWeek += results[0].result.week;
          }
        } catch (e) {
          console.log('Could not access tab:', tab.url);
        }
      }
    }
    
    // Update UI
    document.getElementById('today').textContent = totalToday.toFixed(2) + 'g';
    document.getElementById('week').textContent = totalWeek.toFixed(2) + 'g';
    
    console.log('✅ Updated:', totalToday.toFixed(4) + 'g today,', totalWeek.toFixed(4) + 'g this week');
  } catch (error) {
    console.error('Error updating emissions:', error);
  }
}

// Update on load
updateEmissions();

// Update every 2 seconds
setInterval(updateEmissions, 2000);
