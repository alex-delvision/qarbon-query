// Minimal background script for QarbonQuery
console.log('🌱 QarbonQuery Background Service Worker Starting...');

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('QarbonQuery installed/updated');
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EMISSIONS_UPDATE') {
    console.log('Emissions update received:', request.data);
    // Update badge with daily total
    if (request.data && request.data.daily) {
      const dailyTotal = Math.round(request.data.daily);
      chrome.action.setBadgeText({ text: dailyTotal + 'g' });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    }
  }
  return true;
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('QarbonQuery service worker started');
});

console.log('🌱 QarbonQuery Background Service Worker Ready');
