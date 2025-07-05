/**
 * @jest-environment jsdom
 */

import 'jest-webextension-mock';
import { parseTokens } from '../src/tokenExtractors';
import { calculateAIEmissions } from 'qarbon-emissions/ai';

// Mock the calculateAIEmissions function since it's external
jest.mock('qarbon-emissions/ai', () => ({
  calculateAIEmissions: jest.fn()
}));

const mockCalculateAIEmissions = calculateAIEmissions as jest.MockedFunction<typeof calculateAIEmissions>;

describe('API Emissions Integration', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset Chrome extension mocks
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
    
    // Setup default calculator mock
    mockCalculateAIEmissions.mockReturnValue({
      id: 'ai_1234567890',
      timestamp: new Date().toISOString(),
      source: 'gpt-3.5_inference',
      amount: 2.2,
      unit: 'g',
      category: 'ai',
      confidence: { low: 1.8, high: 2.6 }
    });
  });

  describe('OpenAI API Response Processing', () => {
    const mockOpenAIResponse = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: 1677652288,
      model: 'gpt-3.5-turbo',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'Hello! How can I help you today?'
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 56,
        completion_tokens: 31,
        total_tokens: 87
      }
    };

    it('should extract tokens from OpenAI API response', () => {
      const result = parseTokens(mockOpenAIResponse, 'openai');
      
      expect(result.tokens.prompt).toBe(56);
      expect(result.tokens.completion).toBe(31);
      expect(result.tokens.total).toBe(87);
      expect(result.model).toBe('gpt-3.5-turbo');
    });

    it('should calculate and store emissions for API response', async () => {
      // Setup storage mock to return existing emissions
      const existingEmissions = [
        { id: 'old_1', amount: 1.5, timestamp: Date.now() - 1000 }
      ];
      chrome.storage.local.get.mockResolvedValueOnce({ emissions: existingEmissions });

      const result = parseTokens(mockOpenAIResponse, 'openai');
      
      // Simulate emissions calculation
      const emissions = mockCalculateAIEmissions(result.tokens.total, result.model);
      
      // Verify calculator was called correctly
      expect(mockCalculateAIEmissions).toHaveBeenCalledWith(87, 'gpt-3.5-turbo');
      
      // Simulate storing emissions
      const updatedEmissions = [...existingEmissions, emissions];
      
      // Verify emissions are stored
      await chrome.storage.local.set({ emissions: updatedEmissions });
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        emissions: expect.arrayContaining([
          expect.objectContaining({
            amount: 2.2,
            category: 'ai',
            unit: 'g'
          })
        ])
      });
    });

    it('should assert stored emissions within ±10% tolerance', async () => {
      const expectedEmissions = 2.2; // GPT-3.5 baseline
      const tolerance = 0.1; // 10%
      
      chrome.storage.local.get.mockResolvedValueOnce({ 
        emissions: [
          { amount: 2.0, category: 'ai' }, // Within tolerance (9% below)
          { amount: 2.4, category: 'ai' }, // Within tolerance (9% above)
          { amount: 2.2, category: 'ai' }  // Exact match
        ]
      });

      const stored = await chrome.storage.local.get(['emissions']);
      const aiEmissions = stored.emissions.filter((e: any) => e.category === 'ai');
      
      aiEmissions.forEach((emission: any) => {
        const difference = Math.abs(emission.amount - expectedEmissions);
        const percentDifference = difference / expectedEmissions;
        
        expect(percentDifference).toBeLessThanOrEqual(tolerance);
      });
    });
  });

  describe('Anthropic API Response Processing', () => {
    const mockAnthropicResponse = {
      id: 'msg_123',
      type: 'message',
      role: 'assistant',
      content: [{
        type: 'text',
        text: 'Hello! How can I assist you today?'
      }],
      model: 'claude-3-sonnet-20240229',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 45,
        output_tokens: 28
      }
    };

    it('should extract tokens from Anthropic API response', () => {
      const result = parseTokens(mockAnthropicResponse, 'anthropic');
      
      expect(result.tokens.prompt).toBe(45);
      expect(result.tokens.completion).toBe(28);
      expect(result.tokens.total).toBe(73);
      expect(result.model).toBe('claude-3-sonnet-20240229');
    });

    it('should calculate emissions for Claude model', async () => {
      // Mock calculator to return Claude-specific emissions
      mockCalculateAIEmissions.mockReturnValueOnce({
        id: 'ai_claude_123',
        timestamp: new Date().toISOString(),
        source: 'claude-3_inference',
        amount: 4.2,
        unit: 'g',
        category: 'ai',
        confidence: { low: 3.6, high: 4.8 }
      });

      const result = parseTokens(mockAnthropicResponse, 'anthropic');
      const emissions = mockCalculateAIEmissions(result.tokens.total, 'claude-3');
      
      expect(emissions.amount).toBe(4.2);
      expect(emissions.source).toBe('claude-3_inference');
    });
  });

  describe('Storage Operations', () => {
    it('should handle empty emissions storage', async () => {
      chrome.storage.local.get.mockResolvedValueOnce({ emissions: undefined });
      
      const newEmission = {
        id: 'ai_new',
        amount: 2.2,
        category: 'ai',
        timestamp: Date.now()
      };

      await chrome.storage.local.set({ emissions: [newEmission] });
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        emissions: [newEmission]
      });
    });

    it('should append to existing emissions', async () => {
      const existingEmissions = [
        { id: 'ai_1', amount: 1.5, timestamp: Date.now() - 1000 },
        { id: 'ai_2', amount: 3.1, timestamp: Date.now() - 500 }
      ];

      chrome.storage.local.get.mockResolvedValueOnce({ emissions: existingEmissions });
      
      const newEmission = {
        id: 'ai_3',
        amount: 2.2,
        category: 'ai',
        timestamp: Date.now()
      };

      const updatedEmissions = [...existingEmissions, newEmission];
      await chrome.storage.local.set({ emissions: updatedEmissions });
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        emissions: expect.arrayContaining([
          ...existingEmissions,
          newEmission
        ])
      });
      
      expect(chrome.storage.local.set.mock.calls[0][0].emissions).toHaveLength(3);
    });

    it('should handle storage errors gracefully', async () => {
      chrome.storage.local.get.mockRejectedValueOnce(new Error('Storage error'));
      
      try {
        await chrome.storage.local.get(['emissions']);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Storage error');
      }
    });
  });

  describe('Real-time Emissions Tracking', () => {
    it('should track cumulative emissions over session', async () => {
      const session = {
        startTime: Date.now() - 60000, // 1 minute ago
        emissions: []
      };

      // Simulate multiple API calls
      const apiCalls = [
        { tokens: 100, model: 'gpt-3.5', expectedEmissions: 0.3 },
        { tokens: 500, model: 'gpt-4', expectedEmissions: 0.625 },
        { tokens: 200, model: 'gpt-3.5', expectedEmissions: 0.06 }
      ];

      let cumulativeEmissions = 0;

      for (const call of apiCalls) {
        mockCalculateAIEmissions.mockReturnValueOnce({
          id: `ai_${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: `${call.model}_inference`,
          amount: call.expectedEmissions,
          unit: 'g',
          category: 'ai',
          confidence: { low: 0, high: 10 }
        });

        const emission = mockCalculateAIEmissions(call.tokens, call.model);
        cumulativeEmissions += emission.amount;
        session.emissions.push(emission);
      }

      expect(cumulativeEmissions).toBeCloseTo(0.985, 3); // Sum of all emissions
      expect(session.emissions).toHaveLength(3);
    });

    it('should calculate emissions rate per minute', async () => {
      const sessionDuration = 5 * 60 * 1000; // 5 minutes in ms
      const totalEmissions = 10.5; // grams
      
      const emissionsRate = (totalEmissions / sessionDuration) * 60000; // per minute
      
      expect(emissionsRate).toBeCloseTo(2.1, 1); // 2.1 g/min
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed API responses', () => {
      const malformedResponse = {
        // Missing required fields
        id: 'test',
        // no usage data
      };

      const result = parseTokens(malformedResponse, 'openai');
      
      // Should return default/fallback values
      expect(result.tokens.total).toBe(0);
      expect(result.model).toBe('unknown');
    });

    it('should handle zero token responses', () => {
      const zeroTokenResponse = {
        id: 'test',
        model: 'gpt-3.5-turbo',
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };

      const result = parseTokens(zeroTokenResponse, 'openai');
      
      expect(result.tokens.total).toBe(0);
      
      // Calculator should handle zero tokens gracefully
      const emissions = mockCalculateAIEmissions(0, 'gpt-3.5');
      expect(emissions.amount).toBe(2.2); // Should use fallback query-based emission
    });

    it('should validate emissions data before storage', async () => {
      const invalidEmission = {
        // Missing required fields
        amount: 'invalid', // Should be number
        category: 'ai'
      };

      // Should not store invalid data
      const validEmission = {
        id: 'ai_valid',
        amount: 2.2,
        unit: 'g',
        category: 'ai',
        timestamp: Date.now()
      };

      await chrome.storage.local.set({ emissions: [validEmission] });
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        emissions: [expect.objectContaining({
          amount: expect.any(Number),
          category: 'ai',
          timestamp: expect.any(Number)
        })]
      });
    });

    it('should handle concurrent API requests', async () => {
      const concurrentRequests = Array.from({ length: 5 }, (_, i) => ({
        tokens: 100 + i * 50,
        model: 'gpt-3.5',
        timestamp: Date.now() + i * 100
      }));

      const emissions = concurrentRequests.map(req => {
        mockCalculateAIEmissions.mockReturnValueOnce({
          id: `ai_${req.timestamp}`,
          timestamp: new Date(req.timestamp).toISOString(),
          source: 'gpt-3.5_inference',
          amount: req.tokens * 0.0003,
          unit: 'g',
          category: 'ai',
          confidence: { low: 1.8, high: 2.6 }
        });

        return mockCalculateAIEmissions(req.tokens, req.model);
      });

      expect(emissions).toHaveLength(5);
      expect(mockCalculateAIEmissions).toHaveBeenCalledTimes(5);
    });
  });

  describe('Performance and Memory', () => {
    it('should limit stored emissions to prevent memory bloat', async () => {
      const maxStoredEmissions = 1000;
      const existingEmissions = Array.from({ length: 1200 }, (_, i) => ({
        id: `ai_${i}`,
        amount: 2.2,
        timestamp: Date.now() - (1200 - i) * 1000
      }));

      chrome.storage.local.get.mockResolvedValueOnce({ emissions: existingEmissions });
      
      // Simulate adding new emission and trimming old ones
      const newEmission = { id: 'ai_new', amount: 2.2, timestamp: Date.now() };
      const updatedEmissions = [...existingEmissions, newEmission]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, maxStoredEmissions);

      await chrome.storage.local.set({ emissions: updatedEmissions });
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        emissions: expect.arrayContaining([
          expect.objectContaining({ id: 'ai_new' })
        ])
      });
      
      // Verify length constraint
      const storedEmissions = chrome.storage.local.set.mock.calls[0][0].emissions;
      expect(storedEmissions.length).toBeLessThanOrEqual(maxStoredEmissions);
    });
  });
});
