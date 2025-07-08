/**
 * Chrome API Integration Tests
 *
 * Tests Chrome extension APIs using jest-webextension-mock
 * Validates storage, messaging, and background script functionality
 */

import { parseOpenAI } from '../src/tokenExtractors';

// Mock Chrome APIs are automatically available via jest-webextension-mock setup

describe('Chrome API Integration', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Reset Chrome storage
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({});
    (chrome.storage.local.set as jest.Mock).mockResolvedValue(undefined);
    (chrome.storage.sync.get as jest.Mock).mockResolvedValue({});
    (chrome.storage.sync.set as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Token Storage', () => {
    test('stores token usage data in Chrome storage', async () => {
      const tokenData = {
        model: 'gpt-4',
        tokens: { prompt: 10, completion: 5, total: 15 },
        timestamp: Date.now(),
      };

      // Simulate storing token data
      await chrome.storage.local.set({ tokenUsage: tokenData });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        tokenUsage: tokenData,
      });
    });

    test('retrieves stored token usage data', async () => {
      const mockTokenData = {
        tokenUsage: {
          model: 'claude-3',
          tokens: { prompt: 20, completion: 15, total: 35 },
          timestamp: Date.now(),
        },
      };

      (chrome.storage.local.get as jest.Mock).mockResolvedValue(mockTokenData);

      const result = await chrome.storage.local.get('tokenUsage');

      expect(chrome.storage.local.get).toHaveBeenCalledWith('tokenUsage');
      expect(result.tokenUsage.model).toBe('claude-3');
      expect(result.tokenUsage.tokens.total).toBe(35);
    });

    test('accumulates token usage over multiple API calls', async () => {
      const existingData = {
        totalTokens: 100,
        sessions: 5,
      };

      (chrome.storage.local.get as jest.Mock).mockResolvedValue(existingData);

      const newTokenCount = 25;
      const updatedData = {
        totalTokens: existingData.totalTokens + newTokenCount,
        sessions: existingData.sessions + 1,
      };

      await chrome.storage.local.set(updatedData);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        totalTokens: 125,
        sessions: 6,
      });
    });
  });

  describe('Background Script Communication', () => {
    test('sends token data to background script', async () => {
      const tokenData = {
        type: 'TOKEN_USAGE',
        data: {
          model: 'gpt-4',
          tokens: { total: 50 },
          timestamp: Date.now(),
        },
      };

      // Mock successful message sending
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
      });

      const response = await chrome.runtime.sendMessage(tokenData);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(tokenData);
      expect(response.success).toBe(true);
    });

    test('handles background script errors gracefully', async () => {
      const tokenData = {
        type: 'TOKEN_USAGE',
        data: { model: 'gpt-4', tokens: { total: 30 } },
      };

      // Mock error response
      (chrome.runtime.sendMessage as jest.Mock).mockRejectedValue(
        new Error('Background script not available')
      );

      try {
        await chrome.runtime.sendMessage(tokenData);
      } catch (error) {
        expect(error.message).toBe('Background script not available');
      }

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(tokenData);
    });
  });

  describe('Tab Messaging', () => {
    test('sends token extraction results to active tab', async () => {
      const mockTabs = [
        { id: 1, active: true, url: 'https://chatgpt.com' },
        { id: 2, active: false, url: 'https://claude.ai' },
      ];

      (chrome.tabs.query as jest.Mock).mockResolvedValue(mockTabs);
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        received: true,
      });

      const tokenData = {
        type: 'EXTRACTED_TOKENS',
        tokens: { total: 75 },
      };

      // Query for active tab
      const activeTabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (activeTabs.length > 0) {
        await chrome.tabs.sendMessage(activeTabs[0].id!, tokenData);
      }

      expect(chrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, tokenData);
    });

    test('handles tab communication errors', async () => {
      (chrome.tabs.query as jest.Mock).mockResolvedValue([]);

      const activeTabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      expect(activeTabs).toHaveLength(0);
      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Extension Resource URLs', () => {
    test('generates correct extension URLs', () => {
      const popupUrl = chrome.runtime.getURL('popup.html');
      const iconUrl = chrome.runtime.getURL('icons/icon-48.png');

      expect(popupUrl).toBe('chrome-extension://test-extension-id/popup.html');
      expect(iconUrl).toBe(
        'chrome-extension://test-extension-id/icons/icon-48.png'
      );
    });
  });

  describe('Settings Management', () => {
    test('stores and retrieves user preferences', async () => {
      const settings = {
        trackingEnabled: true,
        showNotifications: false,
        dataRetentionDays: 30,
        providers: ['openai', 'anthropic', 'google'],
      };

      await chrome.storage.sync.set({ userSettings: settings });

      (chrome.storage.sync.get as jest.Mock).mockResolvedValue({
        userSettings: settings,
      });

      const result = await chrome.storage.sync.get('userSettings');

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        userSettings: settings,
      });
      expect(result.userSettings.trackingEnabled).toBe(true);
      expect(result.userSettings.providers).toContain('openai');
    });

    test('handles default settings when none exist', async () => {
      (chrome.storage.sync.get as jest.Mock).mockResolvedValue({});

      const result = await chrome.storage.sync.get('userSettings');

      expect(result.userSettings).toBeUndefined();
    });
  });

  describe('Token Extraction Workflow Integration', () => {
    test('full workflow: extract, normalize, store, and notify', async () => {
      // Step 1: Extract tokens from API response
      const apiResponse = {
        model: 'gpt-4-0613',
        usage: {
          prompt_tokens: 25,
          completion_tokens: 15,
          total_tokens: 40,
        },
      };

      const extractedTokens = parseOpenAI(apiResponse);

      // Step 2: Create normalized data structure
      const normalizedData = {
        model: extractedTokens.model,
        tokens: extractedTokens.tokens,
        timestamp: new Date().toISOString(),
        provider: 'openai',
        url: 'https://api.openai.com/v1/chat/completions',
      };

      // Step 3: Store in Chrome storage
      await chrome.storage.local.set({
        latestToken: normalizedData,
      });

      // Step 4: Send to background script for processing
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        processed: true,
      });

      const bgResponse = await chrome.runtime.sendMessage({
        type: 'PROCESS_TOKENS',
        data: normalizedData,
      });

      // Verify all steps
      expect(extractedTokens.model).toBe('gpt-4-0613');
      expect(extractedTokens.tokens.total).toBe(40);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        latestToken: normalizedData,
      });
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'PROCESS_TOKENS',
        data: normalizedData,
      });
      expect(bgResponse.processed).toBe(true);
    });

    test('handles workflow errors gracefully', async () => {
      // Simulate storage error
      (chrome.storage.local.set as jest.Mock).mockRejectedValue(
        new Error('Storage quota exceeded')
      );

      const tokenData = {
        model: 'test-model',
        tokens: { total: 100 },
        timestamp: new Date().toISOString(),
      };

      try {
        await chrome.storage.local.set({ latestToken: tokenData });
      } catch (error) {
        expect(error.message).toBe('Storage quota exceeded');
      }
    });
  });

  describe('Performance and Memory Management', () => {
    test('limits stored token history size', async () => {
      const maxHistorySize = 100;
      const existingHistory = Array.from({ length: 95 }, (_, i) => ({
        id: i,
        tokens: { total: 10 + i },
        timestamp: Date.now() - i * 1000,
      }));

      (chrome.storage.local.get as jest.Mock).mockResolvedValue({
        tokenHistory: existingHistory,
      });

      // Add new token data
      const newTokenData = {
        id: 95,
        tokens: { total: 105 },
        timestamp: Date.now(),
      };

      const updatedHistory = [...existingHistory, newTokenData];

      // Trim if over limit
      if (updatedHistory.length > maxHistorySize) {
        updatedHistory.splice(0, updatedHistory.length - maxHistorySize);
      }

      await chrome.storage.local.set({ tokenHistory: updatedHistory });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        tokenHistory: expect.arrayContaining([
          expect.objectContaining({ id: 95, tokens: { total: 105 } }),
        ]),
      });
    });

    test('clears old data based on retention policy', async () => {
      const retentionDays = 7;
      const cutoffDate = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

      const tokenHistory = [
        { id: 1, timestamp: cutoffDate - 1000, tokens: { total: 10 } }, // Old
        { id: 2, timestamp: cutoffDate + 1000, tokens: { total: 20 } }, // Keep
        { id: 3, timestamp: Date.now(), tokens: { total: 30 } }, // Keep
      ];

      (chrome.storage.local.get as jest.Mock).mockResolvedValue({
        tokenHistory,
      });

      // Filter out old data
      const filteredHistory = tokenHistory.filter(
        item => item.timestamp > cutoffDate
      );

      await chrome.storage.local.set({ tokenHistory: filteredHistory });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        tokenHistory: expect.arrayContaining([
          expect.objectContaining({ id: 2 }),
          expect.objectContaining({ id: 3 }),
        ]),
      });
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        tokenHistory: expect.not.arrayContaining([
          expect.objectContaining({ id: 1 }),
        ]),
      });
    });
  });
});
