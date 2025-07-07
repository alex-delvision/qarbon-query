/**
 * QarbonQuery Chrome Extension Background Script
 * Manifest V3 Service Worker for Chrome Extension
 */

import { parseTokens } from './tokenExtractors';
// Import AI calculator (adjust import path as needed)
// Note: This import may need adjustment based on your project structure
// import { aiCalculator } from '@qarbon/emissions/ai';

// Temporary standalone AI calculator until import is resolved
const aiCalculator = {
  calculateTokenEmissions: (tokens: number, _model: string) => {
    // Simplified calculation - replace with actual implementation
    const baseEmission = tokens * 0.0001; // 0.1mg CO₂e per token
    return {
      amount: baseEmission,
      confidence: {
        low: baseEmission * 0.8,
        high: baseEmission * 1.2
      }
    };
  }
};

// Extension configuration
export const extensionConfig = {
  name: 'QarbonQuery Chrome Extension',
  version: '0.1.0',
};

// Throttled logging to prevent console spam
class ThrottledLogger {
  private lastLogTime = 0;
  private readonly throttleMs = 1000; // 1 second throttle

  log(message: string, ...args: any[]) {
    const now = Date.now();
    if (now - this.lastLogTime >= this.throttleMs) {
      console.log(message, ...args);
      this.lastLogTime = now;
    }
  }

  error(message: string, error?: any) {
    const now = Date.now();
    if (now - this.lastLogTime >= this.throttleMs) {
      console.error(message, error);
      this.lastLogTime = now;
    }
  }
}

const logger = new ThrottledLogger();

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

// Store pending prompts keyed by tabId to reconcile prompt text with token data when API stats arrive
const pendingPrompts = new Map<number, {
  promptText: string;
  timestamp: number;
  url: string;
}>();

// Store API request data for correlation (reserved for future use)
// const apiRequestData = new Map<string, {
//   tabId: number;
//   url: string;
//   provider: string;
//   timestamp: number;
// }>();

/**
 * Check if URL matches AI API patterns
 */
function isAIAPIRequest(url: string): boolean {
  return AI_PROVIDER_PATTERNS.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(url);
  });
}

/**
 * Identify AI provider from URL
 */
function identifyProvider(url: string): string | null {
  if (url.includes('openai.com')) return 'openai';
  if (url.includes('anthropic.com')) return 'anthropic';
  if (url.includes('googleapis.com')) return 'gemini';
  if (url.includes('amazonaws.com')) return 'bedrock';
  if (url.includes('claude.ai')) return 'claude';
  if (url.includes('bard.google.com') || url.includes('gemini.google.com')) return 'bard';
  return null;
}

/**
 * Provider-specific token extraction logic
 */
async function extractTokens(
  provider: string, 
  url: string, 
  responseBody: string
): Promise<{
  model: string;
  tokens: { total: number; prompt?: number; completion?: number };
  timestamp: string | number;
  energyPerToken: number;
  emissions?: number;
} | null> {
  
  const timestamp = Date.now();
  const energyPerToken = 0.001; // Default energy per token (placeholder)
  
  try {
    switch (provider) {
      case 'openai':
        return extractOpenAITokens(url, responseBody, timestamp, energyPerToken);
      
      case 'anthropic':
        return extractAnthropicTokens(url, responseBody, timestamp, energyPerToken);
      
      case 'gemini':
        return extractGeminiTokens(url, responseBody, timestamp, energyPerToken);
      
      case 'bedrock':
        return extractBedrockTokens(url, responseBody, timestamp, energyPerToken);
      
      case 'claude':
        return extractClaudeWebTokens(url, responseBody, timestamp, energyPerToken);
      
      case 'bard':
        return extractBardTokens(url, responseBody, timestamp, energyPerToken);
      
      default:
        logger.error('Unknown provider:', provider);
        return null;
    }
  } catch (error) {
    logger.error(`Error extracting tokens for ${provider}:`, error);
    return null;
  }
}

/**
 * Extract token data from OpenAI API requests
 */
function extractOpenAITokens(
  _url: string,
  responseBody: string,
  timestamp: number,
  energyPerToken: number
): any {
  try {
    if (!responseBody) {
      // Fallback if no response body available
      return {
        model: 'unknown',
        tokens: { total: 0, prompt: 0, completion: 0 },
        timestamp,
        energyPerToken
      };
    }

    // Parse JSON or handle streaming response
    let jsonData;
    try {
      jsonData = JSON.parse(responseBody);
    } catch {
      // Handle streaming response as string
      jsonData = responseBody;
    }
    
    const parsed = parseTokens(jsonData, 'openai');
    return {
      model: parsed.model,
      tokens: {
        total: parsed.tokens.total,
        prompt: parsed.tokens.prompt,
        completion: parsed.tokens.completion
      },
      timestamp,
      energyPerToken
    };
  } catch (error) {
    logger.error('Error parsing OpenAI response:', error);
    return {
      model: 'unknown',
      tokens: { total: 0, prompt: 0, completion: 0 },
      timestamp,
      energyPerToken
    };
  }
}

/**
 * Extract token data from Anthropic API requests
 */
function extractAnthropicTokens(
  _url: string,
  responseBody: string,
  timestamp: number,
  energyPerToken: number
): any {
  try {
    if (!responseBody) {
      return {
        model: 'unknown',
        tokens: { total: 0, prompt: 0, completion: 0 },
        timestamp,
        energyPerToken
      };
    }

    // Parse JSON or handle streaming response
    let jsonData;
    try {
      jsonData = JSON.parse(responseBody);
    } catch {
      // Handle streaming response as string
      jsonData = responseBody;
    }
    
    const parsed = parseTokens(jsonData, 'anthropic');
    return {
      model: parsed.model,
      tokens: {
        total: parsed.tokens.total,
        prompt: parsed.tokens.prompt,
        completion: parsed.tokens.completion
      },
      timestamp,
      energyPerToken
    };
  } catch (error) {
    logger.error('Error parsing Anthropic response:', error);
    return {
      model: 'unknown',
      tokens: { total: 0, prompt: 0, completion: 0 },
      timestamp,
      energyPerToken
    };
  }
}

/**
 * Extract token data from Google Gemini API requests
 */
function extractGeminiTokens(
  _url: string,
  responseBody: string,
  timestamp: number,
  energyPerToken: number
): any {
  try {
    if (!responseBody) {
      return {
        model: 'unknown',
        tokens: { total: 0, prompt: 0, completion: 0 },
        timestamp,
        energyPerToken
      };
    }

    // Parse JSON or handle streaming response
    let jsonData;
    try {
      jsonData = JSON.parse(responseBody);
    } catch {
      // Handle streaming response as string
      jsonData = responseBody;
    }
    
    const parsed = parseTokens(jsonData, 'google');
    return {
      model: parsed.model,
      tokens: {
        total: parsed.tokens.total,
        prompt: parsed.tokens.prompt,
        completion: parsed.tokens.completion
      },
      timestamp,
      energyPerToken
    };
  } catch (error) {
    logger.error('Error parsing Google response:', error);
    return {
      model: 'unknown',
      tokens: { total: 0, prompt: 0, completion: 0 },
      timestamp,
      energyPerToken
    };
  }
}

/**
 * Extract token data from AWS Bedrock API requests
 */
function extractBedrockTokens(
  _url: string,
  responseBody: string,
  timestamp: number,
  energyPerToken: number
): any {
  try {
    if (!responseBody) {
      return {
        model: 'unknown',
        tokens: { total: 0, prompt: 0, completion: 0 },
        timestamp,
        energyPerToken
      };
    }

    // Parse JSON or handle streaming response
    let jsonData;
    try {
      jsonData = JSON.parse(responseBody);
    } catch {
      // Handle streaming response as string
      jsonData = responseBody;
    }
    
    const parsed = parseTokens(jsonData, 'bedrock');
    return {
      model: parsed.model,
      tokens: {
        total: parsed.tokens.total,
        prompt: parsed.tokens.prompt,
        completion: parsed.tokens.completion
      },
      timestamp,
      energyPerToken
    };
  } catch (error) {
    logger.error('Error parsing Bedrock response:', error);
    return {
      model: 'unknown',
      tokens: { total: 0, prompt: 0, completion: 0 },
      timestamp,
      energyPerToken
    };
  }
}

/**
 * Extract token data from Claude web interface
 */
function extractClaudeWebTokens(
  _url: string,
  responseBody: string,
  timestamp: number,
  energyPerToken: number
): any {
  try {
    if (!responseBody) {
      return {
        model: 'claude-web',
        tokens: { total: 0, prompt: 0, completion: 0 },
        timestamp,
        energyPerToken
      };
    }

    // Try to parse Claude web interface response
    // Web interfaces often use streaming format
    const parsed = parseTokens(responseBody, 'anthropic');
    return {
      model: parsed.model || 'claude-web',
      tokens: {
        total: parsed.tokens.total,
        prompt: parsed.tokens.prompt,
        completion: parsed.tokens.completion
      },
      timestamp,
      energyPerToken
    };
  } catch (error) {
    logger.error('Error parsing Claude web response:', error);
    // Fallback to estimation
    return {
      model: 'claude-web',
      tokens: { total: 95, prompt: 50, completion: 45 },
      timestamp,
      energyPerToken
    };
  }
}

/**
 * Extract token data from Bard/Gemini web interface
 */
function extractBardTokens(
  _url: string,
  responseBody: string,
  timestamp: number,
  energyPerToken: number
): any {
  try {
    if (!responseBody) {
      return {
        model: 'bard-web',
        tokens: { total: 0, prompt: 0, completion: 0 },
        timestamp,
        energyPerToken
      };
    }

    // Try to parse Bard/Gemini web interface response
    const parsed = parseTokens(responseBody, 'google');
    return {
      model: parsed.model || 'bard-web',
      tokens: {
        total: parsed.tokens.total,
        prompt: parsed.tokens.prompt,
        completion: parsed.tokens.completion
      },
      timestamp,
      energyPerToken
    };
  } catch (error) {
    logger.error('Error parsing Bard response:', error);
    // Fallback to estimation
    return {
      model: 'bard-web',
      tokens: { total: 85, prompt: 40, completion: 45 },
      timestamp,
      energyPerToken
    };
  }
}

/**
 * Store emission data in chrome.storage.local with proper QarbonQuery structure
 */
async function storeEmissionData(data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const storageKey = `qarbon_emissions_${today}`;
      
      // Get existing QarbonQuery data
      chrome.storage.local.get([storageKey, 'qarbon_settings', 'qarbon_queries'], (result: Record<string, any>) => {
        if (chrome.runtime.lastError) {
          logger.error('Storage get error:', chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        // Prepare emission data with proper structure
        const emissionEntry = {
          id: crypto.randomUUID(),
          timestamp: data.timestamp || Date.now(),
          provider: data.provider || 'unknown',
          model: data.model || 'unknown',
          tokens: data.tokens || { total: 0, prompt: 0, completion: 0 },
          emissions: data.emissions || 0,
          confidence: data.confidence || { low: 0, high: 0 },
          url: data.url || '',
          sessionId: data.sessionId || 'default'
        };
        
        // Get existing emissions for today
        const existingEmissions = result[storageKey] || [];
        existingEmissions.push(emissionEntry);
        
        // Update queries count
        const queriesData = result['qarbon_queries'] || { total: 0, daily: {} };
        queriesData.total = (queriesData.total || 0) + 1;
        if (!queriesData.daily) {
          queriesData.daily = {};
        }
        // Ensure daily is properly typed as a record
        const dailyQueries = queriesData.daily as Record<string, number>;
        if (today) {
          dailyQueries[today] = (dailyQueries[today] || 0) + 1;
        }
        queriesData.daily = dailyQueries;
        
        // Prepare update data
        const updateData: Record<string, any> = {
          [storageKey]: existingEmissions,
          'qarbon_queries': queriesData,
          'qarbon_last_updated': Date.now()
        };
        
        // Initialize settings if not exists
        if (!result['qarbon_settings']) {
          updateData['qarbon_settings'] = {
            trackingEnabled: true,
            displayUnits: 'kg',
            notifications: true,
            dataRetentionDays: 30
          };
        }
        
        chrome.storage.local.set(updateData, () => {
          if (chrome.runtime.lastError) {
            logger.error('Storage set error:', chrome.runtime.lastError.message);
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            // Invalidate cache after writing new emission data
            invalidateStorageCache(Object.keys(updateData));
            logger.log('Successfully stored emission data:', emissionEntry);
            resolve();
          }
        });
      });
    } catch (error) {
      logger.error('Error in storeEmissionData:', error);
      reject(error);
    }
  });
}

/**
 * Emit AI token data message for popup or dev logging
 */
async function emitTokenMessage(data: any): Promise<void> {
  try {
    // Send message to popup or content scripts for dev logging
    const message = {
      type: 'AI_TOKENS',
      data: {
        provider: data.provider || 'unknown',
        model: data.model || 'unknown',
        tokens: data.tokens || { total: 0, prompt: 0, completion: 0 },
        emissions: data.emissions || 0,
        confidence: data.confidence || { low: 0, high: 0 },
        timestamp: data.timestamp || Date.now(),
        energy: data.energy || 0
      }
    };

    // Emit to all contexts (popup, content scripts, etc.)
    chrome.runtime.sendMessage(message).catch((error) => {
      // Silently handle case where no receivers exist
      logger.log('No message receivers available:', error?.message);
    });

    // Also log for dev debugging
    logger.log('AI Token Data:', message.data);
  } catch (error) {
    logger.error('Error emitting token message:', error);
  }
}

// Session data management (commented out for build)
// let sessionData = {
//   startTime: Date.now(),
//   totalDataTransfer: 0,
//   activeTabs: new Set<number>()
// };

// Reset session data daily (commented out for build)
// setInterval(() => {
//   sessionData = {
//     startTime: Date.now(),
//     totalDataTransfer: 0,
//     activeTabs: new Set<number>()
//   };
// }, 24 * 60 * 60 * 1000); // 24 hours


// Storage cleanup and maintenance
async function initializeStorage(): Promise<void> {
  try {
    // Get all current storage data
    const allData = await new Promise<Record<string, any>>((resolve, reject) => {
      chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
    
    // Initialize default settings if not present
    if (!allData['qarbon_settings']) {
      const defaultSettings = {
        trackingEnabled: true,
        displayUnits: 'kg',
        notifications: true,
        dataRetentionDays: 30,
        installedAt: Date.now(),
        version: extensionConfig.version
      };
      
      await new Promise<void>((resolve, reject) => {
        chrome.storage.local.set({ 'qarbon_settings': defaultSettings }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            logger.log('Initialized default settings');
            resolve();
          }
        });
      });
    }
    
    // Migration logic: walk through existing keys and inject default confidence when missing
    await migrateStorageData(allData);
    
    // Initialize aggregated data placeholders for future alarms
    await initializeAggregatedPlaceholders();
    
    // Clean up old data based on retention policy
    await cleanupOldData();
    
  } catch (error) {
    logger.error('Error initializing storage:', error);
  }
}

/**
 * Migration logic to update existing storage entries with confidence data
 */
async function migrateStorageData(allData: Record<string, any>): Promise<void> {
  try {
    const updateData: Record<string, any> = {};
    let migratedCount = 0;
    
    // Walk through all storage keys
    for (const [key, value] of Object.entries(allData)) {
      // Process date-based emission keys (qarbon_emissions_YYYY-MM-DD)
      if (key.startsWith('qarbon_emissions_') && Array.isArray(value)) {
        const migratedEntries = value.map((entry: any) => {
          // Check if confidence is missing or incomplete
          if (!entry.confidence || typeof entry.confidence !== 'object' || 
              entry.confidence.low === undefined || entry.confidence.high === undefined) {
            
            // Provide default confidence based on emissions value or use fallback
            const defaultConfidence = {
              low: entry.emissions ? Math.max(0, entry.emissions * 0.8) : 0,
              high: entry.emissions ? entry.emissions * 1.2 : 0
            };
            
            migratedCount++;
            return {
              ...entry,
              confidence: defaultConfidence
            };
          }
          return entry;
        });
        
        // Only update if migrations were made
        if (migratedEntries.some((entry: any, index: number) => 
            entry.confidence !== value[index]?.confidence)) {
          updateData[key] = migratedEntries;
        }
      }
    }
    
    // Apply migrations if any were made
    if (Object.keys(updateData).length > 0) {
      await new Promise<void>((resolve, reject) => {
        chrome.storage.local.set(updateData, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            logger.log(`Successfully migrated ${migratedCount} emission entries with confidence data`);
            resolve();
          }
        });
      });
    }
    
  } catch (error) {
    logger.error('Error during storage migration:', error);
  }
}

/**
 * Storage cache with TTL and invalidation
 */
class StorageCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  
  set(key: string, data: any, ttlMs: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  invalidate(keyPattern: string): void {
    const regex = new RegExp(keyPattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

// Global storage cache instance
const storageCache = new StorageCache();

/**
 * Memoized storage getter with cache invalidation
 */
async function getCachedStorageData(keys: string | string[]): Promise<Record<string, any>> {
  const keyArray = Array.isArray(keys) ? keys : [keys];
  const cacheKey = keyArray.sort().join(',');
  
  // Check cache first
  const cached = storageCache.get(cacheKey);
  if (cached) {
    logger.log(`Cache hit for keys: ${cacheKey}`);
    return cached;
  }
  
  // Fetch from storage
  const data = await new Promise<Record<string, any>>((resolve, reject) => {
    chrome.storage.local.get(keyArray, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
  
  // Cache the result with 2-minute TTL for aggregate data
  const ttl = keyArray.some(k => k.includes('aggregate')) ? 2 * 60 * 1000 : 30 * 1000;
  storageCache.set(cacheKey, data, ttl);
  
  logger.log(`Cache miss, fetched from storage: ${cacheKey}`);
  return data;
}

/**
 * Invalidate cache on write operations
 */
function invalidateStorageCache(updatedKeys: string[]): void {
  // Invalidate exact matches and pattern matches
  updatedKeys.forEach(key => {
    storageCache.invalidate(key);
    
    // Also invalidate related aggregation keys
    if (key.startsWith('qarbon_emissions_')) {
      const date = key.split('_').pop();
      if (date) {
        // Invalidate daily aggregates
        storageCache.invalidate(`qarbon_aggregates_daily_${date}`);
        
        // Invalidate weekly/monthly aggregates that might include this date
        const dateObj = new Date(date);
        const weekKey = getWeekKey(dateObj);
        const monthKey = getMonthKey(dateObj);
        storageCache.invalidate(`qarbon_aggregates_week_${weekKey}`);
        storageCache.invalidate(`qarbon_aggregates_month_${monthKey}`);
      }
    }
  });
  
  logger.log(`Invalidated cache for keys: ${updatedKeys.join(', ')}`);
}

/**
 * Initialize aggregated data placeholders and dedicated popup chart keys
 */
async function initializeAggregatedPlaceholders(): Promise<void> {
  try {
    const today = new Date();
    const currentWeek = getWeekKey(today);
    const currentMonth = getMonthKey(today);
    
    const aggregateKeys = {
      // Weekly aggregate for popup charts
      [`qarbon_aggregates_week_${currentWeek}`]: {
        period: 'week',
        startDate: getWeekStart(today).toISOString().split('T')[0],
        endDate: getWeekEnd(today).toISOString().split('T')[0],
        totalEmissions: 0,
        totalQueries: 0,
        confidence: { low: 0, high: 0 },
        providerBreakdown: {},
        modelBreakdown: {},
        lastUpdated: Date.now(),
        version: extensionConfig.version
      },
      // Monthly aggregate for popup charts
      [`qarbon_aggregates_month_${currentMonth}`]: {
        period: 'month',
        startDate: getMonthStart(today).toISOString().split('T')[0],
        endDate: getMonthEnd(today).toISOString().split('T')[0],
        totalEmissions: 0,
        totalQueries: 0,
        confidence: { low: 0, high: 0 },
        providerBreakdown: {},
        modelBreakdown: {},
        lastUpdated: Date.now(),
        version: extensionConfig.version
      },
      // Dedicated popup chart data keys
      'qarbon_popup_chart_week': {
        labels: [],
        emissions: [],
        queries: [],
        lastUpdated: Date.now()
      },
      'qarbon_popup_chart_month': {
        labels: [],
        emissions: [],
        queries: [],
        lastUpdated: Date.now()
      }
    };
    
    // Check if placeholders already exist
    const existingData = await getCachedStorageData(Object.keys(aggregateKeys));
    
    // Only create placeholders that don't exist
    const newPlaceholders: Record<string, any> = {};
    for (const [key, value] of Object.entries(aggregateKeys)) {
      if (!existingData[key]) {
        newPlaceholders[key] = value;
      }
    }
    
    if (Object.keys(newPlaceholders).length > 0) {
      await new Promise<void>((resolve, reject) => {
        chrome.storage.local.set(newPlaceholders, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            // Invalidate cache after write
            invalidateStorageCache(Object.keys(newPlaceholders));
            logger.log(`Initialized ${Object.keys(newPlaceholders).length} aggregate placeholders`);
            resolve();
          }
        });
      });
    }
    
  } catch (error) {
    logger.error('Error initializing aggregate placeholders:', error);
  }
}

/**
 * Helper functions for date calculations
 */
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}W${week.toString().padStart(2, '0')}`;
}

function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}M${month.toString().padStart(2, '0')}`;
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getWeekStart(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff));
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(new Date(date));
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getNextSunday(): number {
  const now = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(0, 0, 0, 0);
  return nextSunday.getTime();
}

function getNextMonthStart(): number {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  nextMonth.setHours(0, 0, 0, 0);
  return nextMonth.getTime();
}

async function cleanupOldData(): Promise<void> {
  try {
    // Get all storage data
    const allData = await new Promise<Record<string, any>>((resolve, reject) => {
      chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
    
    // Get retention policy
    const settings = allData['qarbon_settings'] || { dataRetentionDays: 30 };
    const retentionDays = settings.dataRetentionDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    // Find keys to remove
    const keysToRemove: string[] = [];
    
    Object.keys(allData).forEach(key => {
      if (key.startsWith('qarbon_emissions_') || key.startsWith('qarbon_prompts_')) {
        const dateStr = key.split('_').pop();
        if (dateStr && cutoffDateStr && dateStr < cutoffDateStr) {
          keysToRemove.push(key);
        }
      }
      // Clean up old aggregates past retention window
      if (key.startsWith('qarbon_aggregates_daily_')) {
        const dateStr = key.split('_').pop();
        if (dateStr && cutoffDateStr && dateStr < cutoffDateStr) {
          keysToRemove.push(key);
        }
      }
    });
    
    // Remove old data
    if (keysToRemove.length > 0) {
      await new Promise<void>((resolve, reject) => {
        chrome.storage.local.remove(keysToRemove, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            logger.log(`Cleaned up ${keysToRemove.length} old data entries`);
            resolve();
          }
        });
      });
    }
    
  } catch (error) {
    logger.error('Error cleaning up old data:', error);
  }
}

/**
 * Aggregate daily emissions data - reads today's emissions, sums totals & stores under qarbon_aggregates_daily
 */
async function aggregateDailyEmissions(): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const emissionsKey = `qarbon_emissions_${today}`;
    const aggregateKey = `qarbon_aggregates_daily_${today}`;
    
    // Get today's emissions data
    const todayData = await new Promise<Record<string, any>>((resolve, reject) => {
      chrome.storage.local.get([emissionsKey], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
    
    const emissions = todayData[emissionsKey] || [];
    
    if (emissions.length === 0) {
      logger.log('No emissions data found for today, skipping aggregation');
      return;
    }
    
    // Calculate totals
    let totalEmissions = 0;
    let totalTokens = 0;
    let totalQueries = emissions.length;
    let confidenceLow = 0;
    let confidenceHigh = 0;
    
    const providerCounts: Record<string, number> = {};
    const modelCounts: Record<string, number> = {};
    
    emissions.forEach((entry: any) => {
      totalEmissions += entry.emissions || 0;
      totalTokens += entry.tokens?.total || 0;
      
      // Aggregate confidence ranges
      if (entry.confidence) {
        confidenceLow += entry.confidence.low || 0;
        confidenceHigh += entry.confidence.high || 0;
      }
      
      // Count providers and models
      const provider = entry.provider || 'unknown';
      const model = entry.model || 'unknown';
      
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
      modelCounts[model] = (modelCounts[model] || 0) + 1;
    });
    
    // Create aggregate entry
    const aggregateData = {
      date: today,
      totalEmissions,
      totalTokens,
      totalQueries,
      confidence: {
        low: confidenceLow,
        high: confidenceHigh
      },
      providerBreakdown: providerCounts,
      modelBreakdown: modelCounts,
      aggregatedAt: Date.now(),
      version: extensionConfig.version
    };
    
    // Store aggregate data
    await new Promise<void>((resolve, reject) => {
      chrome.storage.local.set({ [aggregateKey]: aggregateData }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          logger.log(`Successfully aggregated daily emissions for ${today}:`, aggregateData);
          resolve();
        }
      });
    });
    
  } catch (error) {
    logger.error('Error aggregating daily emissions:', error);
  }
}

/**
 * Aggregate weekly emissions data across multiple days
 */
async function aggregateWeeklyEmissions(): Promise<void> {
  try {
    const today = new Date();
    const currentWeek = getWeekKey(today);
    const weekStart = getWeekStart(new Date(today));
    const weekEnd = getWeekEnd(new Date(today));
    
    // Generate list of dates in the current week
    const weekDates: string[] = [];
    for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (dateStr) {
        weekDates.push(dateStr);
      }
    }
    
    // Get emission data for all days in the week
    const emissionKeys = weekDates.map(date => `qarbon_emissions_${date}`);
    const weekData = await getCachedStorageData(emissionKeys);
    
    // Aggregate data across all days
    let totalEmissions = 0;
    let totalTokens = 0;
    let totalQueries = 0;
    let confidenceLow = 0;
    let confidenceHigh = 0;
    
    const providerBreakdown: Record<string, { emissions: number; queries: number }> = {};
    const modelBreakdown: Record<string, { emissions: number; queries: number }> = {};
    
    emissionKeys.forEach(key => {
      const dayEmissions = weekData[key] || [];
      dayEmissions.forEach((entry: any) => {
        totalEmissions += entry.emissions || 0;
        totalTokens += entry.tokens?.total || 0;
        totalQueries += 1;
        
        if (entry.confidence) {
          confidenceLow += entry.confidence.low || 0;
          confidenceHigh += entry.confidence.high || 0;
        }
        
        const provider = entry.provider || 'unknown';
        const model = entry.model || 'unknown';
        
        if (!providerBreakdown[provider]) {
          providerBreakdown[provider] = { emissions: 0, queries: 0 };
        }
        if (!modelBreakdown[model]) {
          modelBreakdown[model] = { emissions: 0, queries: 0 };
        }
        
        providerBreakdown[provider].emissions += entry.emissions || 0;
        providerBreakdown[provider].queries += 1;
        modelBreakdown[model].emissions += entry.emissions || 0;
        modelBreakdown[model].queries += 1;
      });
    });
    
    // Create weekly aggregate
    const weeklyAggregate = {
      period: 'week',
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      totalEmissions,
      totalTokens,
      totalQueries,
      confidence: { low: confidenceLow, high: confidenceHigh },
      providerBreakdown,
      modelBreakdown,
      lastUpdated: Date.now(),
      version: extensionConfig.version
    };
    
    const aggregateKey = `qarbon_aggregates_week_${currentWeek}`;
    
    await new Promise<void>((resolve, reject) => {
      chrome.storage.local.set({ [aggregateKey]: weeklyAggregate }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          // Invalidate cache
          invalidateStorageCache([aggregateKey]);
          logger.log(`Successfully aggregated weekly emissions for ${currentWeek}:`, weeklyAggregate);
          resolve();
        }
      });
    });
    
  } catch (error) {
    logger.error('Error aggregating weekly emissions:', error);
  }
}

/**
 * Aggregate monthly emissions data across multiple days
 */
async function aggregateMonthlyEmissions(): Promise<void> {
  try {
    const today = new Date();
    const currentMonth = getMonthKey(today);
    const monthStart = getMonthStart(today);
    const monthEnd = getMonthEnd(today);
    
    // Generate list of dates in the current month
    const monthDates: string[] = [];
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (dateStr) {
        monthDates.push(dateStr);
      }
    }
    
    // Get emission data for all days in the month
    const emissionKeys = monthDates.map(date => `qarbon_emissions_${date}`);
    const monthData = await getCachedStorageData(emissionKeys);
    
    // Aggregate data across all days
    let totalEmissions = 0;
    let totalTokens = 0;
    let totalQueries = 0;
    let confidenceLow = 0;
    let confidenceHigh = 0;
    
    const providerBreakdown: Record<string, { emissions: number; queries: number }> = {};
    const modelBreakdown: Record<string, { emissions: number; queries: number }> = {};
    
    emissionKeys.forEach(key => {
      const dayEmissions = monthData[key] || [];
      dayEmissions.forEach((entry: any) => {
        totalEmissions += entry.emissions || 0;
        totalTokens += entry.tokens?.total || 0;
        totalQueries += 1;
        
        if (entry.confidence) {
          confidenceLow += entry.confidence.low || 0;
          confidenceHigh += entry.confidence.high || 0;
        }
        
        const provider = entry.provider || 'unknown';
        const model = entry.model || 'unknown';
        
        if (!providerBreakdown[provider]) {
          providerBreakdown[provider] = { emissions: 0, queries: 0 };
        }
        if (!modelBreakdown[model]) {
          modelBreakdown[model] = { emissions: 0, queries: 0 };
        }
        
        providerBreakdown[provider].emissions += entry.emissions || 0;
        providerBreakdown[provider].queries += 1;
        modelBreakdown[model].emissions += entry.emissions || 0;
        modelBreakdown[model].queries += 1;
      });
    });
    
    // Create monthly aggregate
    const monthlyAggregate = {
      period: 'month',
      startDate: monthStart.toISOString().split('T')[0],
      endDate: monthEnd.toISOString().split('T')[0],
      totalEmissions,
      totalTokens,
      totalQueries,
      confidence: { low: confidenceLow, high: confidenceHigh },
      providerBreakdown,
      modelBreakdown,
      lastUpdated: Date.now(),
      version: extensionConfig.version
    };
    
    const aggregateKey = `qarbon_aggregates_month_${currentMonth}`;
    
    await new Promise<void>((resolve, reject) => {
      chrome.storage.local.set({ [aggregateKey]: monthlyAggregate }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          // Invalidate cache
          invalidateStorageCache([aggregateKey]);
          logger.log(`Successfully aggregated monthly emissions for ${currentMonth}:`, monthlyAggregate);
          resolve();
        }
      });
    });
    
  } catch (error) {
    logger.error('Error aggregating monthly emissions:', error);
  }
}

/**
 * Update dedicated popup chart data for faster chart rendering
 */
async function updatePopupChartData(): Promise<void> {
  try {
    // Update weekly chart data
    const weekLabels: string[] = [];
    const weekEmissions: number[] = [];
    const weekQueries: number[] = [];
    
    // Get last 7 days
    const today = new Date();
    const weekDates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      if (dateStr) {
        weekDates.push(dateStr);
        weekLabels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      }
    }
    
    const weekKeys = weekDates.map(date => `qarbon_emissions_${date}`);
    const weekData = await getCachedStorageData(weekKeys);
    
    weekDates.forEach(date => {
      const dayEmissions = weekData[`qarbon_emissions_${date}`] || [];
      let dayTotal = 0;
      let dayQueries = dayEmissions.length;
      
      dayEmissions.forEach((entry: any) => {
        dayTotal += entry.emissions || 0;
      });
      
      weekEmissions.push(dayTotal);
      weekQueries.push(dayQueries);
    });
    
    // Update monthly chart data
    const monthLabels: string[] = [];
    const monthEmissions: number[] = [];
    const monthQueries: number[] = [];
    
    // Get last 30 days
    const monthDates: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      if (dateStr) {
        monthDates.push(dateStr);
        monthLabels.push(date.toLocaleDateString('en-US', { day: 'numeric' }));
      }
    }
    
    const monthKeys = monthDates.map(date => `qarbon_emissions_${date}`);
    const monthData = await getCachedStorageData(monthKeys);
    
    monthDates.forEach(date => {
      const dayEmissions = monthData[`qarbon_emissions_${date}`] || [];
      let dayTotal = 0;
      let dayQueries = dayEmissions.length;
      
      dayEmissions.forEach((entry: any) => {
        dayTotal += entry.emissions || 0;
      });
      
      monthEmissions.push(dayTotal);
      monthQueries.push(dayQueries);
    });
    
    // Store optimized chart data
    const chartData = {
      'qarbon_popup_chart_week': {
        labels: weekLabels,
        emissions: weekEmissions,
        queries: weekQueries,
        lastUpdated: Date.now()
      },
      'qarbon_popup_chart_month': {
        labels: monthLabels,
        emissions: monthEmissions,
        queries: monthQueries,
        lastUpdated: Date.now()
      }
    };
    
    await new Promise<void>((resolve, reject) => {
      chrome.storage.local.set(chartData, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          // Invalidate cache
          invalidateStorageCache(Object.keys(chartData));
          logger.log('Successfully updated popup chart data');
          resolve();
        }
      });
    });
    
  } catch (error) {
    logger.error('Error updating popup chart data:', error);
  }
}

/**
 * Sync data to cloud - stub for future cloud backup functionality
 */
async function syncDataToCloud(): Promise<void> {
  try {
    // Stub implementation - placeholder for future cloud backup
    logger.log('Cloud sync triggered (stub implementation)');
    
    // Get recent data to sync (last 7 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    const allData = await new Promise<Record<string, any>>((resolve, reject) => {
      chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
    
    const syncData: Record<string, any> = {};
    
    // Collect recent emissions and aggregates
    Object.keys(allData).forEach(key => {
      if (key.startsWith('qarbon_emissions_') || key.startsWith('qarbon_aggregates_daily_')) {
        const dateStr = key.split('_').pop();
        if (dateStr && cutoffDateStr && dateStr >= cutoffDateStr) {
          syncData[key] = allData[key];
        }
      }
    });
    
    // Include settings and metadata
    if (allData['qarbon_settings']) {
      syncData['qarbon_settings'] = allData['qarbon_settings'];
    }
    if (allData['qarbon_queries']) {
      syncData['qarbon_queries'] = allData['qarbon_queries'];
    }
    
    // Future implementation would send syncData to cloud service
    // For now, just log the data that would be synced
    logger.log(`Cloud sync prepared ${Object.keys(syncData).length} data entries for sync`);
    
    // Store last sync timestamp
    await new Promise<void>((resolve, reject) => {
      chrome.storage.local.set({ 'qarbon_last_sync': Date.now() }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
    
  } catch (error) {
    logger.error('Error in cloud sync:', error);
  }
}

// Comprehensive message handler for all message types
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  // Handle prompt capture from content script
  if (msg.type === 'PROMPT_CAPTURE') {
    try {
      // Store pending prompt keyed by tabId to reconcile with token data when API stats arrive
      if (sender.tab?.id) {
        pendingPrompts.set(sender.tab.id, {
          promptText: msg.promptText || '',
          timestamp: Date.now(),
          url: sender.tab.url || ''
        });
        
        logger.log(`Stored prompt for tab ${sender.tab.id}:`, msg.promptText?.substring(0, 100) + '...');
      }
    } catch (error) {
      logger.error('Error handling PROMPT_CAPTURE message:', error);
    }
    return; // No response needed
  }
  
  // Handle API response data from content script
  if (msg.type === 'API_RESPONSE_CAPTURED') {
    try {
      const { url, responseBody } = msg;
      
      // Check if this is an AI API request
      if (!isAIAPIRequest(url)) {
        return;
      }

      const provider = identifyProvider(url);
      if (!provider) {
        logger.error('Unknown AI provider for URL:', url);
        return;
      }

      // Extract tokens from response
      const tokenData = await extractTokens(provider, url, responseBody);
      
      if (!tokenData) {
        logger.error('Failed to extract token data for provider:', provider);
        return;
      }

      // Calculate emissions
      const emissionEntry = aiCalculator.calculateTokenEmissions(tokenData.tokens.total, tokenData.model);

      // Merge emission entry into existing data
      const normalizedData = {
        ...tokenData,
        emissions: emissionEntry.amount,
        confidence: emissionEntry.confidence
      };

      // Store in chrome.storage.local under date keys
      await storeEmissionData(normalizedData);
      
      // Emit message for popup or dev logging
      await emitTokenMessage(normalizedData);
      
      logger.log('Successfully processed and stored API response data for:', provider);
      
    } catch (error) {
      logger.error('Error processing API response:', error);
    }
    return; // No response needed
  }
  
  // Handle storage operations from popup
  if (msg.type === 'GET_STORAGE_DATA') {
    chrome.storage.local.get(null, (result) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ data: result });
      }
    });
    return true; // Keep message channel open for async response
  }
  
  if (msg.type === 'CLEAR_STORAGE_DATA') {
    const keysToKeep = ['qarbon_settings']; // Keep settings
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
    return true; // Keep message channel open for async response
  }
  
  // For unknown message types, return false to indicate no response
  return false;
});

// Handle extension install event
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Check if user has already been onboarded
    chrome.storage.local.get(['qarbon_onboarded'], (result) => {
      if (!result.qarbon_onboarded) {
        // Open onboarding tab
        chrome.tabs.create({
          url: chrome.runtime.getURL('onboarding.html')
        });
        logger.log('Opening onboarding for new install');
      }
    });
  } else if (details.reason === 'update') {
    logger.log('Extension updated to version:', extensionConfig.version);
  }
  
  // Inject content script into any existing AI tabs on install/update
  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      if (tab.url && ['claude.ai', 'chatgpt.com', 'chat.openai.com', 'gemini.google.com', 'bard.google.com'].some(site => tab.url.includes(site))) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }).then(() => {
          console.log(`Content script injected into existing tab: ${tab.url}`);
        }).catch(() => {});
      }
    });
  });
});

// Initialize storage when service worker starts
initializeStorage();

// Schedule periodic cleanup (once per day)
chrome.alarms.create('qarbon-cleanup', { delayInMinutes: 60, periodInMinutes: 24 * 60 });

// Schedule daily aggregation alarm
chrome.alarms.create('qarbon-daily-aggregate', { when: Date.now() + 5 * 60 * 1000, periodInMinutes: 1440 });

// Schedule weekly aggregation alarm (every Sunday at midnight)
const weeklyAlarmTime = getNextSunday();
chrome.alarms.create('qarbon-weekly-aggregate', { when: weeklyAlarmTime, periodInMinutes: 7 * 1440 });

// Schedule monthly aggregation alarm (first day of each month)
const monthlyAlarmTime = getNextMonthStart();
chrome.alarms.create('qarbon-monthly-aggregate', { when: monthlyAlarmTime, periodInMinutes: 30 * 1440 });

// Schedule popup chart update alarm (every 15 minutes)
chrome.alarms.create('qarbon-chart-update', { delayInMinutes: 15, periodInMinutes: 15 });

// Schedule sync alarm stub for future cloud backup
chrome.alarms.create('qarbon-sync', { delayInMinutes: 30, periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'qarbon-cleanup') {
    cleanupOldData();
  } else if (alarm.name === 'qarbon-daily-aggregate') {
    aggregateDailyEmissions();
  } else if (alarm.name === 'qarbon-weekly-aggregate') {
    aggregateWeeklyEmissions();
  } else if (alarm.name === 'qarbon-monthly-aggregate') {
    aggregateMonthlyEmissions();
  } else if (alarm.name === 'qarbon-chart-update') {
    updatePopupChartData();
  } else if (alarm.name === 'qarbon-sync') {
    syncDataToCloud();
  }
});

// Badge color mapping based on emission levels
const BADGE_COLORS = {
  green: '#4CAF50',   // Low emissions (0-5g)
  yellow: '#FFC107',  // Medium emissions (5-15g)
  orange: '#FF9800',  // High emissions (15-30g)
  red: '#F44336'      // Very high emissions (30g+)
};

/**
 * Calculate today's total emissions from storage
 */
async function calculateTodayEmissions(): Promise<{ total: number; color: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `qarbon_emissions_${today}`;
    
    const result = await new Promise<Record<string, any>>((resolve, reject) => {
      chrome.storage.local.get([storageKey], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
    
    const emissions = result[storageKey] || [];
    let total = 0;
    
    emissions.forEach((entry: any) => {
      total += entry.emissions || 0;
    });
    
    // Convert to grams and determine color
    const totalGrams = total * 1000; // Convert kg to grams
    let color: string;
    
    if (totalGrams < 5) {
      color = BADGE_COLORS.green;
    } else if (totalGrams < 15) {
      color = BADGE_COLORS.yellow;
    } else if (totalGrams < 30) {
      color = BADGE_COLORS.orange;
    } else {
      color = BADGE_COLORS.red;
    }
    
    return { total: totalGrams, color };
  } catch (error) {
    logger.error('Error calculating today emissions:', error);
    return { total: 0, color: BADGE_COLORS.green };
  }
}

/**
 * Update Chrome action badge with emission data
 */
async function updateBadge(): Promise<void> {
  try {
    const { total, color } = await calculateTodayEmissions();
    
    // Format badge text
    let badgeText = '';
    if (total > 0) {
      if (total < 1) {
        badgeText = '<1g';
      } else if (total < 1000) {
        badgeText = `${Math.round(total)}g`;
      } else {
        badgeText = `${Math.round(total / 1000)}kg`;
      }
    }
    
    // Update badge
    await chrome.action.setBadgeText({ text: badgeText });
    await chrome.action.setBadgeBackgroundColor({ color });
    
    logger.log(`Badge updated: ${badgeText} (${color})`);
  } catch (error) {
    logger.error('Error updating badge:', error);
  }
}

/**
 * Handle Chrome action click to open popup
 */
chrome.action.onClicked.addListener(async (_tab) => {
  try {
    // Open popup programmatically
    await chrome.action.openPopup();
    logger.log('Popup opened via action click');
  } catch (error) {
    // Fallback: If popup fails to open, log the error
    logger.error('Failed to open popup:', error);
    
    // Alternative: Create a new tab or window if needed
    // chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
  }
});

/**
 * Watch for storage changes and update badge in real-time
 */
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'local') return;
  
  // Check if any emission data changed
  const today = new Date().toISOString().split('T')[0];
  const todayKey = `qarbon_emissions_${today}`;
  
  if (changes[todayKey]) {
    logger.log('Emission data changed, updating badge');
    updateBadge();
  }
});

/**
 * Listen for real-time messages that might affect emissions
 */
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === 'AI_TOKENS' || message.type === 'EMISSION_UPDATED') {
    // Update badge when new emissions are recorded
    updateBadge();
  }
});

// Auto-inject content script on all AI sites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const aiSites = ['claude.ai', 'chatgpt.com', 'chat.openai.com', 'gemini.google.com', 'bard.google.com'];
    
    if (aiSites.some(site => tab.url.includes(site))) {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      }).then(() => {
        console.log(`Content script injected into ${tab.url}`);
      }).catch(err => {
        console.error('Failed to inject content script:', err);
      });
    }
  }
});


// Initialize badge on startup
updateBadge();

console.log('QarbonQuery Extension Background Script loaded');
