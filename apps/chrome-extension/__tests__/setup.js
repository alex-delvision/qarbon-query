// Jest setup file for Chrome extension testing
require('jest-webextension-mock');

// Additional Chrome API mocks if needed
global.chrome = {
  ...global.chrome,
  runtime: {
    ...global.chrome.runtime,
    getURL: jest.fn((path) => `chrome-extension://test-extension-id/${path}`),
  },
  storage: {
    ...global.chrome.storage,
    local: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve()),
    },
    sync: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve()),
    },
  },
  tabs: {
    ...global.chrome.tabs,
    query: jest.fn(() => Promise.resolve([])),
    sendMessage: jest.fn(() => Promise.resolve()),
  },
};

// Mock fetch for API responses
global.fetch = jest.fn();

// Setup console mocks for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
