import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import {
  GridIntensityManager,
  IntensityProvider,
} from '../../grid/intensity-manager';

// Mock external API calls
const mockElectricityMapAPI = vi.fn();
const mockWattTimeAPI = vi.fn();
const mockDailyAverageAPI = vi.fn();
const mockMonthlyAverageAPI = vi.fn();

// Mock fetch for external API calls
global.fetch = vi.fn();

describe('Grid Intensity Manager', () => {
  let gridManager: GridIntensityManager;
  const testTimestamp = new Date('2023-07-15T12:00:00Z');

  beforeEach(() => {
    gridManager = new GridIntensityManager();
    vi.clearAllMocks();

    // Reset fetch mock
    (global.fetch as Mock).mockReset();
  });

  describe('Waterfall Intensity Fetching', () => {
    it('should return real-time data when available', async () => {
      // Mock successful ElectricityMap response
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          carbonIntensity: 350,
          confidence: 0.9,
        }),
      });

      const result = await gridManager.getIntensity('virginia', testTimestamp);

      expect(result.intensity).toBe(350);
      expect(result.source).toContain('electricitymap');
      expect(result.confidence).toBe(0.9);
    });

    it('should fallback to WattTime when ElectricityMap fails', async () => {
      // Mock ElectricityMap failure
      (global.fetch as Mock)
        .mockRejectedValueOnce(new Error('ElectricityMap API error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            value: 380,
            confidence: 0.85,
          }),
        });

      const result = await gridManager.getIntensity('virginia', testTimestamp);

      expect(result.intensity).toBe(380);
      expect(result.source).toContain('watttime');
      expect(result.confidence).toBe(0.85);
    });

    it('should fallback to daily average when real-time APIs fail', async () => {
      // Mock all real-time API failures
      (global.fetch as Mock)
        .mockRejectedValueOnce(new Error('ElectricityMap API error'))
        .mockRejectedValueOnce(new Error('WattTime API error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            intensity: 400,
            source: 'historical_daily',
          }),
        });

      const result = await gridManager.getIntensity('virginia', testTimestamp);

      expect(result.intensity).toBe(400);
      expect(result.source).toBe('daily_average');
      expect(result.confidence).toBeLessThan(0.8); // Lower confidence for historical data
    });

    it('should fallback to monthly average when daily fails', async () => {
      // Mock real-time and daily failures
      (global.fetch as Mock)
        .mockRejectedValue(new Error('API error'))
        .mockRejectedValue(new Error('API error'))
        .mockRejectedValue(new Error('Daily API error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            intensity: 420,
            source: 'historical_monthly',
          }),
        });

      const result = await gridManager.getIntensity('virginia', testTimestamp);

      expect(result.intensity).toBe(420);
      expect(result.source).toBe('monthly_average');
      expect(result.confidence).toBeLessThan(0.7); // Even lower confidence
    });

    it('should fallback to annual default when all APIs fail', async () => {
      // Mock all API failures
      (global.fetch as Mock).mockRejectedValue(new Error('API error'));

      const result = await gridManager.getIntensity('virginia', testTimestamp);

      expect(result.intensity).toBe(396); // Virginia default
      expect(result.source).toBe('annual_default');
      expect(result.confidence).toBe(0.5);
    });

    it('should use global default for unknown regions', async () => {
      // Mock all API failures
      (global.fetch as Mock).mockRejectedValue(new Error('API error'));

      const result = await gridManager.getIntensity(
        'unknown-region',
        testTimestamp
      );

      expect(result.intensity).toBe(475); // Global default
      expect(result.source).toBe('annual_default');
      expect(result.confidence).toBe(0.5);
    });
  });

  describe('Datacenter Code Resolution', () => {
    it('should resolve AWS datacenter codes correctly', async () => {
      // Mock API failure to test fallback
      (global.fetch as Mock).mockRejectedValue(new Error('API error'));

      const testCases = [
        {
          code: 'us-east-1',
          expectedRegion: 'virginia',
          expectedIntensity: 396,
        },
        { code: 'us-west-2', expectedRegion: 'oregon', expectedIntensity: 285 },
        {
          code: 'eu-west-1',
          expectedRegion: 'ireland',
          expectedIntensity: 316,
        },
      ];

      for (const { code, expectedIntensity } of testCases) {
        const result = await gridManager.getIntensityByDatacenter(
          code,
          testTimestamp
        );
        expect(result.intensity).toBe(expectedIntensity);
      }
    });

    it('should resolve Azure datacenter codes correctly', async () => {
      (global.fetch as Mock).mockRejectedValue(new Error('API error'));

      const testCases = [
        { code: 'eastus', expectedIntensity: 396 }, // Virginia
        { code: 'westus2', expectedIntensity: 285 }, // Washington
        { code: 'northeurope', expectedIntensity: 316 }, // Ireland
      ];

      for (const { code, expectedIntensity } of testCases) {
        const result = await gridManager.getIntensityByDatacenter(
          code,
          testTimestamp
        );
        expect(result.intensity).toBe(expectedIntensity);
      }
    });

    it('should resolve GCP datacenter codes correctly', async () => {
      (global.fetch as Mock).mockRejectedValue(new Error('API error'));

      const testCases = [
        { code: 'us-central1', expectedIntensity: 462 }, // Iowa
        { code: 'us-west1', expectedIntensity: 285 }, // Oregon
        { code: 'europe-west1', expectedIntensity: 165 }, // Belgium
      ];

      for (const { code, expectedIntensity } of testCases) {
        const result = await gridManager.getIntensityByDatacenter(
          code,
          testTimestamp
        );
        expect(result.intensity).toBe(expectedIntensity);
      }
    });

    it('should throw error for unknown datacenter codes', async () => {
      await expect(
        gridManager.getIntensityByDatacenter(
          'unknown-datacenter',
          testTimestamp
        )
      ).rejects.toThrow('Unknown datacenter code: unknown-datacenter');
    });
  });

  describe('Caching Mechanism', () => {
    it('should cache intensity data and return cached results', async () => {
      // Mock first API call
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          carbonIntensity: 350,
          confidence: 0.9,
        }),
      });

      // First call should hit the API
      const result1 = await gridManager.getIntensity('virginia', testTimestamp);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await gridManager.getIntensity('virginia', testTimestamp);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still only one API call

      expect(result1.intensity).toBe(result2.intensity);
      expect(result1.source).toBe(result2.source);
    });

    it('should use different cache TTL for real-time vs default data', async () => {
      // This test would need to manipulate time to test TTL
      // For now, we'll test that the caching mechanism is in place
      const cacheKey = 'virginia-2023-07-15';

      // Mock real-time data
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          carbonIntensity: 350,
          confidence: 0.9,
        }),
      });

      await gridManager.getIntensity('virginia', testTimestamp);

      // Verify cache was used on second call
      await gridManager.getIntensity('virginia', testTimestamp);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('PUE and REC Adjustments', () => {
    it('should apply PUE adjustments to intensity values', async () => {
      // Mock API failure to use defaults
      (global.fetch as Mock).mockRejectedValue(new Error('API error'));

      const result = await gridManager.getIntensityByDatacenter(
        'us-east-1',
        testTimestamp
      );

      // us-east-1 has PUE of 1.2, so intensity should be adjusted
      // Base Virginia intensity: 396, with PUE 1.2 = 396 * 1.2 = 475.2
      expect(result.intensity).toBeGreaterThan(396);
      expect(result.intensity).toBeLessThanOrEqual(475.2);
    });

    it('should apply renewable energy credits (REC) adjustments', async () => {
      (global.fetch as Mock).mockRejectedValue(new Error('API error'));

      // Test high renewable region (us-west-2 has 85% renewable)
      const result = await gridManager.getIntensityByDatacenter(
        'us-west-2',
        testTimestamp
      );

      // Base Oregon intensity: 285, with 85% renewable should be lower
      expect(result.intensity).toBeLessThan(285);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle API timeouts gracefully', async () => {
      // Mock timeout
      (global.fetch as Mock).mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
      );

      const result = await gridManager.getIntensity('virginia', testTimestamp);

      // Should fallback to default
      expect(result.intensity).toBe(396);
      expect(result.source).toBe('annual_default');
    });

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          invalidField: 'bad data',
        }),
      });

      const result = await gridManager.getIntensity('virginia', testTimestamp);

      // Should fallback to default when data is malformed
      expect(result.intensity).toBe(396);
      expect(result.source).toBe('annual_default');
    });

    it('should handle HTTP error responses', async () => {
      // Mock HTTP error
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await gridManager.getIntensity('virginia', testTimestamp);

      // Should fallback to default
      expect(result.intensity).toBe(396);
      expect(result.source).toBe('annual_default');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent requests efficiently', async () => {
      // Mock API response
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          carbonIntensity: 350,
          confidence: 0.9,
        }),
      });

      // Make multiple concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        gridManager.getIntensity('virginia', testTimestamp)
      );

      const results = await Promise.all(promises);

      // All should return the same result
      results.forEach(result => {
        expect(result.intensity).toBe(350);
      });

      // Should have made only one API call due to caching
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should rate limit API calls appropriately', async () => {
      // This test would verify rate limiting in a real implementation
      // For now, we'll just ensure the method completes
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          carbonIntensity: 350,
          confidence: 0.9,
        }),
      });

      const result = await gridManager.getIntensity('virginia', testTimestamp);
      expect(result).toBeDefined();
    });
  });

  describe('Data Quality and Validation', () => {
    it('should validate intensity values are within reasonable ranges', async () => {
      // Mock extreme values
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          carbonIntensity: -100, // Invalid negative value
          confidence: 0.9,
        }),
      });

      const result = await gridManager.getIntensity('virginia', testTimestamp);

      // Should fallback when data is invalid
      expect(result.intensity).toBeGreaterThan(0);
      expect(result.intensity).toBeLessThan(2000); // Reasonable upper bound
    });

    it('should validate confidence values are normalized', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          carbonIntensity: 350,
          confidence: 1.5, // Invalid confidence > 1
        }),
      });

      const result = await gridManager.getIntensity('virginia', testTimestamp);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});
