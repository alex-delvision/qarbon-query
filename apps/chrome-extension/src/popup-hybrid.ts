/**
 * Hybrid Popup Script - Works with or without Chrome APIs
 */

async function updateEmissionDisplay() {
  let stats = { today: { emissions: 0 }, week: { emissions: 0 } };
  
  try {
    // Try Chrome storage first
    const stored = await chrome.storage.local.get(['currentDayEmissions', 'weeklyEmissions']);
    if (stored.currentDayEmissions) {
      stats.today.emissions = stored.currentDayEmissions;
      stats.week.emissions = stored.weeklyEmissions || 0;
    }
  } catch (e) {
    console.log('Chrome storage failed, using fallback');
  }
  
  // If no data from Chrome storage, try direct localStorage read
  if (stats.today.emissions === 0) {
    try {
      // Execute script in the active tab to read localStorage
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Read stats from content script's localStorage
            if (typeof (window as any).__qarbonGetStats === 'function') {
              return (window as any).__qarbonGetStats();
            }
            
            // Fallback: read directly
            const stats = JSON.parse(localStorage.getItem('qarbon_stats') || '{}');
            const today = new Date().toDateString();
            return {
              today: stats[today] || { emissions: 0 },
              week: { emissions: 0 }
            };
          }
        });
        
        if (results?.[0]?.result) {
          stats = results[0].result;
        }
      }
    } catch (e) {
      console.log('Failed to read from tab:', e);
    }
  }
  
  // Update UI
  document.getElementById('emissions-today')!.textContent = 
    `${stats.today.emissions.toFixed(2)} g CO₂e`;
  
  document.getElementById('emissions-week')!.textContent = 
    `${stats.week.emissions.toFixed(2)} g CO₂e`;
}

// Update every second
setInterval(updateEmissionDisplay, 1000);
updateEmissionDisplay();
