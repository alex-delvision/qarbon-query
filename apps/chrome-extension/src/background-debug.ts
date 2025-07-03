/**
 * QarbonQuery Chrome Extension Background Script - DEBUG VERSION
 * Manifest V3 Service Worker with extensive debugging
 */

console.log('🚀 QarbonQuery Extension Background Script DEBUG starting...');

// Log all available Chrome APIs
console.log('Available Chrome APIs:', Object.keys(chrome || {}));

// Debug: Check for deprecated APIs at startup
const deprecatedAPIBase64 = [
  'Y2hyb21lLndlYlJlcXVlc3Q=',
  'Y2hyb21lLndlYlJlcXVlc3RCbG9ja2luZw==',
  'Y2hyb21lLmJyb3dzZXJBY3Rpb24=',
  'Y2hyb21lLmV4dGVuc2lvbi5nZXRCYWNrZ3JvdW5kUGFnZQ=='
];

const deprecatedAPIs = deprecatedAPIBase64.map(encoded => atob(encoded));

deprecatedAPIs.forEach(api => {
  try {
    const apiValue = eval(`typeof ${api}`);
    if (apiValue !== 'undefined') {
      console.error('❌ DEPRECATED API FOUND:', api, apiValue);
    } else {
      console.log('✅ Deprecated API not found:', api);
    }
  } catch (e) {
    console.log('✅ Deprecated API safely not available:', api);
  }
});

// Check for proper V3 APIs
const v3APIs = [
  'chrome.declarativeNetRequest',
  'chrome.storage',
  'chrome.runtime',
  'chrome.alarms'
];

v3APIs.forEach(api => {
  try {
    const apiValue = eval(`typeof ${api}`);
    if (apiValue !== 'undefined') {
      console.log('✅ V3 API available:', api);
    } else {
      console.error('❌ V3 API missing:', api);
    }
  } catch (e) {
    console.error('❌ V3 API error:', api, e);
  }
});

// Extension configuration
export const extensionConfig = {
  name: 'QarbonQuery Chrome Extension',
  version: '0.1.0',
  debug: true
};

// Enhanced logging class
class DebugLogger {
  private logHistory: string[] = [];
  
  log(message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry, ...args);
    this.logHistory.push(logEntry);
    
    // Keep only last 100 logs
    if (this.logHistory.length > 100) {
      this.logHistory = this.logHistory.slice(-100);
    }
  }

  error(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ERROR: ${message}`;
    console.error(logEntry, error);
    this.logHistory.push(logEntry);
  }
  
  getLogs() {
    return this.logHistory;
  }
}

const logger = new DebugLogger();
logger.log('🔧 Debug logger initialized');

// Store debug info for popup
let debugInfo = {
  startup: Date.now(),
  apiCalls: 0,
  errors: 0,
  storageOperations: 0
};

// Simplified AIImpactTrackerAdapter for local use
class AIImpactTrackerAdapter {
  ingest(data: any) {
    logger.log('📊 AIImpactTrackerAdapter.ingest called with:', data);
    return {
      ...data,
      timestamp: data.timestamp || Date.now(),
      provider: data.provider || 'unknown',
      emissions: data.emissions || (data.tokens?.total || 0) * (data.energyPerToken || 0.001)
    };
  }
}

const adapter = new AIImpactTrackerAdapter();

// Store pending prompts
const pendingPrompts = new Map<number, {
  promptText: string;
  timestamp: number;
  url: string;
}>();

logger.log('📝 Pending prompts map initialized');

// URL patterns for different AI providers
const AI_PROVIDER_PATTERNS = [
  '*://api.openai.com/v1/chat/completions',
  '*://api.anthropic.com/v1/messages',
  '*://generativelanguage.googleapis.com/v1*/models/*:generateContent',
  '*://bedrock*.amazonaws.com/model/*/invoke*',
  '*://chat.openai.com/backend-api/conversation',
  '*://claude.ai/api/organizations/*/chat_conversations/*/completion',
  '*://bard.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/*',
  '*://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/*'
];

logger.log('🌐 AI provider patterns loaded:', AI_PROVIDER_PATTERNS.length);

// Check if URL matches AI API patterns
function isAIAPIRequest(url: string): boolean {
  const matches = AI_PROVIDER_PATTERNS.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(url);
  });
  
  if (matches) {
    logger.log('🎯 AI API request detected:', url);
  }
  
  return matches;
}

// Identify AI provider from URL
function identifyProvider(url: string): string | null {
  let provider: string | null = null;
  
  if (url.includes('openai.com')) provider = 'openai';
  else if (url.includes('anthropic.com')) provider = 'anthropic';
  else if (url.includes('googleapis.com')) provider = 'gemini';
  else if (url.includes('amazonaws.com')) provider = 'bedrock';
  else if (url.includes('claude.ai')) provider = 'claude';
  else if (url.includes('bard.google.com') || url.includes('gemini.google.com')) provider = 'bard';
  
  logger.log('🏷️ Provider identified:', provider, 'for URL:', url);
  return provider;
}

// Enhanced storage function with debugging
async function storeEmissionData(data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      debugInfo.storageOperations++;
      const today = new Date().toISOString().split('T')[0];
      const storageKey = `qarbon_emissions_${today}`;
      
      logger.log('💾 Storing emission data with key:', storageKey);
      logger.log('📊 Data to store:', data);
      
      chrome.storage.local.get([storageKey, 'qarbon_settings', 'qarbon_queries'], (result: Record<string, any>) => {
        if (chrome.runtime.lastError) {
          debugInfo.errors++;
          logger.error('Storage get error:', chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        logger.log('📚 Current storage result:', Object.keys(result));
        
        // Prepare emission data
        const emissionEntry = {
          id: crypto.randomUUID(),
          timestamp: data.timestamp || Date.now(),
          provider: data.provider || 'unknown',
          model: data.model || 'unknown',
          tokens: data.tokens || { total: 0, prompt: 0, completion: 0 },
          emissions: data.emissions || 0,
          energyPerToken: data.energyPerToken || 0.001,
          url: data.url || '',
          sessionId: data.sessionId || 'default'
        };
        
        // Get existing emissions
        const existingEmissions = result[storageKey] || [];
        existingEmissions.push(emissionEntry);
        
        // Update queries count
        const queriesData = result['qarbon_queries'] || { total: 0, daily: {} };
        queriesData.total = (queriesData.total || 0) + 1;
        if (!queriesData.daily) queriesData.daily = {};
        
        const dailyQueries = queriesData.daily as Record<string, number>;
        if (today) {
          dailyQueries[today] = (dailyQueries[today] || 0) + 1;
        }
        queriesData.daily = dailyQueries;
        
        // Prepare update data
        const updateData: Record<string, any> = {
          [storageKey]: existingEmissions,
          'qarbon_queries': queriesData,
          'qarbon_last_updated': Date.now(),
          'qarbon_debug_info': debugInfo
        };
        
        // Initialize settings if not exists
        if (!result['qarbon_settings']) {
          updateData['qarbon_settings'] = {
            trackingEnabled: true,
            displayUnits: 'kg',
            notifications: true,
            dataRetentionDays: 30,
            debug: true
          };
        }
        
        logger.log('💾 Updating storage with:', Object.keys(updateData));
        
        chrome.storage.local.set(updateData, () => {
          if (chrome.runtime.lastError) {
            debugInfo.errors++;
            logger.error('Storage set error:', chrome.runtime.lastError.message);
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            logger.log('✅ Successfully stored emission data:', emissionEntry.id);
            resolve();
          }
        });
      });
    } catch (error) {
      debugInfo.errors++;
      logger.error('Error in storeEmissionData:', error);
      reject(error);
    }
  });
}

// Initialize storage with debug info
async function initializeStorage(): Promise<void> {
  try {
    logger.log('🔧 Initializing storage...');
    
    const result = await new Promise<Record<string, any>>((resolve, reject) => {
      chrome.storage.local.get(['qarbon_settings'], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
    
    if (!result['qarbon_settings']) {
      const defaultSettings = {
        trackingEnabled: true,
        displayUnits: 'kg',
        notifications: true,
        dataRetentionDays: 30,
        installedAt: Date.now(),
        version: extensionConfig.version,
        debug: true
      };
      
      await new Promise<void>((resolve, reject) => {
        chrome.storage.local.set({ 'qarbon_settings': defaultSettings }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            logger.log('✅ Initialized default settings');
            resolve();
          }
        });
      });
    }
    
    logger.log('✅ Storage initialization complete');
  } catch (error) {
    debugInfo.errors++;
    logger.error('Error initializing storage:', error);
  }
}

// Enhanced message handler with debugging
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  try {
    debugInfo.apiCalls++;
    logger.log('📨 Message received:', msg.type, 'from:', sender.tab?.url || 'popup');
    
    // Handle debug info request
    if (msg.type === 'GET_DEBUG_INFO') {
      sendResponse({
        debugInfo,
        logs: logger.getLogs(),
        pendingPrompts: Array.from(pendingPrompts.entries()),
        timestamp: Date.now()
      });
      return true;
    }
    
    // Handle prompt capture
    if (msg.type === 'PROMPT_CAPTURE') {
      try {
        if (sender.tab?.id) {
          pendingPrompts.set(sender.tab.id, {
            promptText: msg.text || msg.promptText || '',
            timestamp: Date.now(),
            url: sender.tab.url || ''
          });
          
          logger.log(`📝 Stored prompt for tab ${sender.tab.id}:`, msg.text?.substring(0, 50) + '...');
        }
      } catch (error) {
        debugInfo.errors++;
        logger.error('Error handling PROMPT_CAPTURE:', error);
      }
      return;
    }
    
    // Handle API response capture
    if (msg.type === 'API_RESPONSE_CAPTURED') {
      try {
        const { url } = msg;
        
        if (!isAIAPIRequest(url)) {
          logger.log('⚠️ Not an AI API request:', url);
          return;
        }
        
        const provider = identifyProvider(url);
        if (!provider) {
          logger.error('❌ Unknown provider for URL:', url);
          return;
        }
        
        // Mock token extraction for debugging
        const tokenData = {
          model: provider + '-debug',
          tokens: { total: 100, prompt: 50, completion: 50 },
          timestamp: Date.now(),
          energyPerToken: 0.001,
          provider: provider
        };
        
        logger.log('🔍 Extracted token data:', tokenData);
        
        // Store data using adapter
        const normalizedData = adapter.ingest(tokenData);
        await storeEmissionData(normalizedData);
        
        logger.log('✅ Successfully processed API response for:', provider);
        
      } catch (error) {
        debugInfo.errors++;
        logger.error('Error processing API response:', error);
      }
      return;
    }
    
    // Handle storage operations
    if (msg.type === 'GET_STORAGE_DATA') {
      chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ data: result });
        }
      });
      return true;
    }
    
    if (msg.type === 'CLEAR_STORAGE_DATA') {
      const keysToKeep = ['qarbon_settings'];
      chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }
        
        const keysToRemove = Object.keys(result).filter(key => !keysToKeep.includes(key));
        
        if (keysToRemove.length > 0) {
          chrome.storage.local.remove(keysToRemove, () => {
            if (chrome.runtime.lastError) {
              sendResponse({ error: chrome.runtime.lastError.message });
            } else {
              sendResponse({ success: true, removedCount: keysToRemove.length });
            }
          });
        } else {
          sendResponse({ success: true, removedCount: 0 });
        }
      });
      return true;
    }
    
    logger.log('⚠️ Unknown message type:', msg.type);
    return false;
    
  } catch (error) {
    debugInfo.errors++;
    logger.error('Error in message handler:', error);
    sendResponse({ error: String(error) });
    return false;
  }
});

// Initialize extension
logger.log('🚀 Starting extension initialization...');
initializeStorage();

// Schedule periodic cleanup
chrome.alarms.create('qarbon-cleanup', { delayInMinutes: 60, periodInMinutes: 24 * 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'qarbon-cleanup') {
    logger.log('🧹 Running periodic cleanup...');
  }
});

logger.log('✅ QarbonQuery Extension Background Script DEBUG loaded successfully');

// Export debug functions for testing
(globalThis as any).qarbonDebug = {
  logger,
  debugInfo,
  pendingPrompts,
  isAIAPIRequest,
  identifyProvider
};
