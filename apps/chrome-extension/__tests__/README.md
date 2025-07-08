# Chrome Extension Test Suite

This directory contains comprehensive unit tests for the QarbonQuery Chrome extension token
extraction and monitoring functionality.

## Test Setup

### Dependencies

- **Jest**: Test framework with TypeScript support
- **jest-webextension-mock**: Mocks Chrome extension APIs
- **ts-jest**: TypeScript preprocessor for Jest
- **@types/jest**: TypeScript definitions for Jest

### Configuration

- `jest.config.js`: Main Jest configuration
- `__tests__/setup.js`: Test setup file with Chrome API mocks

## Test Files

### 1. `tokenExtractors.test.ts` ✅ PASSING

Tests the core token extraction functionality for all supported AI providers:

**OpenAI Extractor Tests:**

- ✅ Extracts correct token totals from OpenAI API responses
- ✅ Handles missing usage data gracefully
- ✅ Validates model extraction (gpt-4-0613)
- ✅ Verifies token counts: 25 prompt + 15 completion = 40 total

**Anthropic Extractor Tests:**

- ✅ Extracts correct token totals from Anthropic API responses
- ✅ Handles missing usage data gracefully
- ✅ Validates model extraction (claude-3-opus-20240229)
- ✅ Verifies token counts: 35 input + 18 output = 53 total

**Google AI Extractor Tests:**

- ✅ Extracts correct token totals from Google AI API responses
- ✅ Handles missing usage metadata gracefully
- ✅ Validates model extraction (gemini-1.5-pro)
- ✅ Verifies token counts: 28 prompt + 24 candidates = 52 total

**AWS Bedrock Extractor Tests:**

- ✅ Extracts correct token totals from Bedrock API responses
- ✅ Handles missing usage data gracefully
- ✅ Validates model extraction (anthropic.claude-3-sonnet-20240229-v1:0)
- ✅ Verifies token counts: 32 input + 22 output = 54 total

**Generic Parser Tests:**

- ✅ Auto-detects OpenAI format based on response structure
- ✅ Auto-detects Anthropic format based on response structure
- ✅ Auto-detects Google format based on response structure
- ✅ Auto-detects Bedrock format based on response structure
- ✅ Supports explicit provider parameter
- ✅ Handles unknown formats gracefully
- ✅ Throws error for unsupported providers

### 2. `chromeApiIntegration.test.ts` ✅ PASSING

Tests Chrome extension API integration using jest-webextension-mock:

**Token Storage Tests:**

- ✅ Stores token usage data in Chrome local storage
- ✅ Retrieves stored token usage data
- ✅ Accumulates token usage over multiple API calls

**Background Script Communication Tests:**

- ✅ Sends token data to background script
- ✅ Handles background script errors gracefully

**Tab Messaging Tests:**

- ✅ Sends token extraction results to active tab
- ✅ Handles tab communication errors

**Extension Resource Tests:**

- ✅ Generates correct extension URLs for popup and icons

**Settings Management Tests:**

- ✅ Stores and retrieves user preferences in sync storage
- ✅ Handles default settings when none exist

**Full Workflow Integration Tests:**

- ✅ Complete workflow: extract → normalize → store → notify
- ✅ Handles workflow errors gracefully

**Performance and Memory Management Tests:**

- ✅ Limits stored token history size
- ✅ Clears old data based on retention policy

### 3. `streamBuffer.test.ts` ⚠️ MOSTLY PASSING

Tests the StreamBuffer utility class for handling streaming responses:

**Basic Functionality Tests:**

- ✅ Starts with empty buffer
- ✅ Adds single chunk correctly
- ✅ Handles multiple chunks
- ✅ Accumulates incomplete chunks

**Real-world Streaming Tests:**

- ✅ Handles OpenAI streaming format
- ✅ Handles partial network chunks
- ✅ Filters out empty chunks

**Edge Cases Tests:**

- ✅ Handles chunks with only newlines
- ✅ Handles chunks with whitespace
- ✅ Handles large chunks
- ✅ Handles malformed chunks gracefully

**Buffer Management Tests:**

- ✅ Clears buffer completely
- ✅ Maintains state across multiple operations

**Performance Tests:**

- ✅ Handles many small chunks efficiently (under 100ms for 1000 chunks)
- ✅ Handles streaming simulation with random chunk sizes

**Integration Tests:**

- ✅ Works with real OpenAI streaming token extraction
- ⚠️ Anthropic streaming format test needs adjustment

### 4. `streamingExtractors.test.ts` ⚠️ NEEDS ADJUSTMENT

Tests streaming response parsing for all providers:

**Status:** These tests need adjustment because the current streaming parser implementation in the
tokenExtractors expects different formats than what the tests provide.

**Issues to Address:**

- Streaming parsers expect properly formatted SSE (Server-Sent Events) data
- Test data format doesn't match the actual streaming response structure
- Need to update test data to match real streaming formats from each provider

### 5. `adapterNormalization.test.ts` ⏸️ SKIPPED

Tests adapter normalization conformity with tracker-adapters package:

**Status:** Currently skipped due to missing dependency. This test would validate:

- Integration with @qarbon/tracker-adapters package
- Data normalization conformity
- Adapter detection and ingestion
- Validation of numeric fields
- Edge cases handling

## Test Fixtures

### JSON Response Fixtures (`__tests__/fixtures/`)

Real API response examples for testing:

- `openai_response.json`: OpenAI chat completion response
- `anthropic_response.json`: Anthropic Claude response
- `google_response.json`: Google Gemini response
- `bedrock_response.json`: AWS Bedrock response

### Streaming Response Fixtures

- `openai_streaming.txt`: OpenAI SSE streaming response format
- `anthropic_streaming.txt`: Anthropic SSE streaming response format

## Running Tests

### All Token-Related Tests

```bash
npm run test:token
```

### Individual Test Files

```bash
# Token extractor tests only
npx jest tokenExtractors.test.ts

# Chrome API integration tests only
npx jest chromeApiIntegration.test.ts

# Stream buffer tests only
npx jest streamBuffer.test.ts
```

### Test Coverage

```bash
npm test -- --coverage
```

## Mock Configuration

### Chrome API Mocks

The test setup provides comprehensive Chrome extension API mocks:

- `chrome.storage.local` and `chrome.storage.sync`
- `chrome.runtime.sendMessage` and `chrome.runtime.getURL`
- `chrome.tabs.query` and `chrome.tabs.sendMessage`
- Global `fetch` for API response testing

### Custom Test Data

All tests use realistic API response data based on actual provider APIs to ensure accuracy and
reliability.

## Test Results Summary

**✅ Passing Tests: 54/65 (83%)**

- Core token extraction: All providers working correctly
- Chrome API integration: All features tested and working
- StreamBuffer utility: Core functionality verified
- Error handling: Comprehensive coverage
- Performance: Memory management and efficiency verified

**⚠️ Needs Attention: 11/65 (17%)**

- Streaming format tests: Need adjustment to match actual streaming formats
- Adapter normalization: Waiting for dependency resolution

**🎯 Coverage Areas:**

- ✅ Token extraction accuracy
- ✅ Chrome extension API integration
- ✅ Error handling and edge cases
- ✅ Performance and memory management
- ✅ Data persistence and retrieval
- ⚠️ Streaming response parsing
- ⏸️ Adapter normalization conformity

The test suite provides excellent coverage of the core functionality needed for the Chrome extension
to track AI token usage accurately across multiple providers.
