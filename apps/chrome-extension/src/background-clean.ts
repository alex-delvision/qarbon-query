/**
 * QarbonQuery Chrome Extension Background Script - CLEAN VERSION
 * Minimal Manifest V3 Service Worker
 */

console.log('🚀 QarbonQuery Extension Background Script loaded');

// Simple storage initialization
async function initializeStorage(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(['qarbon_settings']);

    if (!result.qarbon_settings) {
      await chrome.storage.local.set({
        qarbon_settings: {
          trackingEnabled: true,
          version: '0.1.2',
          installedAt: Date.now(),
        },
      });
      console.log('✅ Storage initialized');
    }
  } catch (error) {
    console.error('❌ Storage initialization error:', error);
  }
}

// Simple message handler
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  console.log('📨 Message received:', msg.type);

  if (msg.type === 'GET_STORAGE_DATA') {
    chrome.storage.local.get(null, result => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ data: result });
      }
    });
    return true;
  }

  if (msg.type === 'PROMPT_CAPTURE') {
    console.log('📝 Prompt captured:', msg.text?.substring(0, 50) + '...');
    // Store prompt data
    const timestamp = Date.now();
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `qarbon_prompts_${today}`;

    chrome.storage.local.get([storageKey], result => {
      const existing = result[storageKey] || [];
      existing.push({
        id: crypto.randomUUID(),
        text: msg.text,
        platform: msg.platform,
        model: msg.model,
        timestamp: timestamp,
        url: msg.url,
      });

      chrome.storage.local.set({ [storageKey]: existing }, () => {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError.message);
        } else {
          console.log('✅ Prompt data stored');
        }
      });
    });
    return;
  }

  if (msg.type === 'API_RESPONSE_CAPTURED') {
    console.log('🎯 API response captured for URL:', msg.url);
    // Simple mock data storage
    const timestamp = Date.now();
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `qarbon_test_${today}`;

    chrome.storage.local.get([storageKey], result => {
      const existing = result[storageKey] || [];
      existing.push({
        id: crypto.randomUUID(),
        url: msg.url,
        timestamp: timestamp,
        provider: 'test',
      });

      chrome.storage.local.set({ [storageKey]: existing }, () => {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError.message);
        } else {
          console.log('✅ Test data stored');
        }
      });
    });
    return;
  }

  return false;
});

// Initialize
initializeStorage();

console.log('✅ QarbonQuery Extension Background Script ready');
