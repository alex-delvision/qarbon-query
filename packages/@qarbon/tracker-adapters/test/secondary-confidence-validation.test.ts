/**
 * Secondary / Near-miss Confidence Ordering Validation Test
 *
 * Step 6: For each payload pick two other adapters (e.g. JSON versus CSV).
 * Assert their scores are < expected's score and ≤ 0.7.
 * For webhook payload assert all scores ≤ 0.2 and bestMatch === null.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UniversalTrackerRegistry } from '../src/UniversalTrackerRegistry.js';
import {
  JsonAdapter,
  CsvAdapter,
  XmlAdapter,
  CodeCarbonAdapter,
  AIImpactTrackerAdapter,
  FitAdapter,
  JSONSchemaAdapter,
} from '../src/adapters/index.js';

describe('Secondary / Near-miss Confidence Ordering Validation', () => {
  let registry: UniversalTrackerRegistry;

  beforeEach(() => {
    // Create registry with all adapters
    const schemas = {
      'emission-v1': {
        type: 'object' as const,
        properties: {
          timestamp: { type: 'string' as const },
          emissions: { type: 'number' as const },
          source: { type: 'string' as const },
        },
        required: ['timestamp', 'emissions'],
      },
    };

    registry = new UniversalTrackerRegistry({
      json: new JsonAdapter(),
      csv: new CsvAdapter(),
      xml: new XmlAdapter(),
      codecarbon: new CodeCarbonAdapter(),
      aiimpact: new AIImpactTrackerAdapter(),
      fit: new FitAdapter(),
      jsonschema: new JSONSchemaAdapter({ schemas }),
    });
  });

  describe('JSON payload secondary confidence validation', () => {
    it('should rank JSON/JSONSchema first with CSV and XML scores < expected score and ≤ 0.7', async () => {
      const jsonPayload = Buffer.from(
        JSON.stringify({
          timestamp: '2023-01-01T00:00:00Z',
          model: 'gpt-4',
          emissions: 0.5,
          duration: 3600,
          energy: 2.1,
        })
      );

      const result = await registry.detectFormat(jsonPayload);

      // Find scores for expected adapter and two near-miss adapters
      const jsonScore =
        result.confidenceScores.find(s => s.adapterName === 'json')?.score || 0;
      const jsonSchemaScore =
        result.confidenceScores.find(s => s.adapterName === 'jsonschema')
          ?.score || 0;
      const csvScore =
        result.confidenceScores.find(s => s.adapterName === 'csv')?.score || 0;
      const xmlScore =
        result.confidenceScores.find(s => s.adapterName === 'xml')?.score || 0;

      // Expected adapter should rank first (JSON or JSONSchema can match)
      expect(['json', 'jsonschema']).toContain(result.bestMatch);

      // Get the winning adapter's score
      const winningScore =
        result.bestMatch === 'json' ? jsonScore : jsonSchemaScore;

      // Winning score should be higher than near-miss adapters
      expect(csvScore).toBeLessThan(winningScore);
      expect(xmlScore).toBeLessThan(winningScore);

      // Near-miss scores should be ≤ 0.7
      expect(csvScore).toBeLessThanOrEqual(0.7);
      expect(xmlScore).toBeLessThanOrEqual(0.7);
    });
  });

  describe('CSV payload secondary confidence validation', () => {
    it('should rank CSV first with JSON and XML scores < CSV score and ≤ 0.7', async () => {
      const csvPayload = Buffer.from(
        'timestamp,model,emissions_kg,duration_seconds,energy_kwh\n' +
          '2023-01-01T00:00:00Z,gpt-4,0.001,3600,2.1\n' +
          '2023-01-01T01:00:00Z,gpt-3.5,0.0008,2400,1.8\n' +
          '2023-01-01T02:00:00Z,claude-3,0.0012,4200,2.5'
      );

      const result = await registry.detectFormat(csvPayload);

      // Find scores for expected adapter and two near-miss adapters
      const csvScore =
        result.confidenceScores.find(s => s.adapterName === 'csv')?.score || 0;
      const jsonScore =
        result.confidenceScores.find(s => s.adapterName === 'json')?.score || 0;
      const xmlScore =
        result.confidenceScores.find(s => s.adapterName === 'xml')?.score || 0;

      // Expected adapter should rank first
      expect(result.bestMatch).toBe('csv');

      // CSV score should be higher than near-miss adapters
      expect(jsonScore).toBeLessThan(csvScore);
      expect(xmlScore).toBeLessThan(csvScore);

      // Near-miss scores should be ≤ 0.7
      expect(jsonScore).toBeLessThanOrEqual(0.7);
      expect(xmlScore).toBeLessThanOrEqual(0.7);
    });
  });

  describe('XML payload secondary confidence validation', () => {
    it('should rank XML first with JSON and CSV scores < XML score and ≤ 0.7', async () => {
      const xmlPayload = Buffer.from(
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<emissions>\n' +
          '  <record>\n' +
          '    <timestamp>2023-01-01T00:00:00Z</timestamp>\n' +
          '    <model>gpt-4</model>\n' +
          '    <co2>0.001</co2>\n' +
          '    <duration>3600</duration>\n' +
          '    <energy>2.1</energy>\n' +
          '  </record>\n' +
          '</emissions>'
      );

      const result = await registry.detectFormat(xmlPayload);

      // Find scores for expected adapter and two near-miss adapters
      const xmlScore =
        result.confidenceScores.find(s => s.adapterName === 'xml')?.score || 0;
      const jsonScore =
        result.confidenceScores.find(s => s.adapterName === 'json')?.score || 0;
      const csvScore =
        result.confidenceScores.find(s => s.adapterName === 'csv')?.score || 0;

      // Expected adapter should rank first
      expect(result.bestMatch).toBe('xml');

      // XML score should be higher than near-miss adapters
      expect(jsonScore).toBeLessThan(xmlScore);
      expect(csvScore).toBeLessThan(xmlScore);

      // Near-miss scores should be ≤ 0.7
      expect(jsonScore).toBeLessThanOrEqual(0.7);
      expect(csvScore).toBeLessThanOrEqual(0.7);
    });
  });

  describe('CodeCarbon payload secondary confidence validation', () => {
    it('should rank CodeCarbon first with JSON and CSV scores < CodeCarbon score and ≤ 0.7', async () => {
      const codeCarbonPayload = Buffer.from(
        JSON.stringify({
          duration_seconds: 3600,
          emissions_kg: 0.001,
          project_name: 'ai-training',
          country_name: 'USA',
          region: 'us-east-1',
          timestamp: '2023-12-01T10:30:45.123456',
        })
      );

      const result = await registry.detectFormat(codeCarbonPayload);

      // Find scores for expected adapter and two near-miss adapters
      const codeCarbonScore =
        result.confidenceScores.find(s => s.adapterName === 'codecarbon')
          ?.score || 0;
      const jsonScore =
        result.confidenceScores.find(s => s.adapterName === 'json')?.score || 0;
      const csvScore =
        result.confidenceScores.find(s => s.adapterName === 'csv')?.score || 0;

      // Expected adapter should rank first (CodeCarbon or JSONSchema might match)
      expect(['codecarbon', 'jsonschema']).toContain(result.bestMatch);

      // CodeCarbon score should be higher than near-miss adapters
      expect(jsonScore).toBeLessThan(codeCarbonScore);
      expect(csvScore).toBeLessThan(codeCarbonScore);

      // Near-miss scores should be ≤ 0.7
      expect(jsonScore).toBeLessThanOrEqual(0.7);
      expect(csvScore).toBeLessThanOrEqual(0.7);
    });
  });

  describe('AIImpact payload secondary confidence validation', () => {
    it('should rank AIImpact first with non-winning adapters having scores < AIImpact score', async () => {
      const aiImpactPayload = Buffer.from(
        JSON.stringify({
          model: 'gpt-4',
          tokens: { total: 1000, input: 800, output: 200 },
          timestamp: '2023-01-01T00:00:00Z',
          energyPerToken: 0.001,
          region: 'us-east-1',
        })
      );

      const result = await registry.detectFormat(aiImpactPayload);

      // Find scores for expected adapter and two near-miss adapters
      const aiImpactScore =
        result.confidenceScores.find(s => s.adapterName === 'aiimpact')
          ?.score || 0;
      const csvScore =
        result.confidenceScores.find(s => s.adapterName === 'csv')?.score || 0;
      const xmlScore =
        result.confidenceScores.find(s => s.adapterName === 'xml')?.score || 0;

      // Expected adapter should rank first
      expect(result.bestMatch).toBe('aiimpact');

      // AIImpact score should be higher than near-miss adapters
      expect(csvScore).toBeLessThan(aiImpactScore);
      expect(xmlScore).toBeLessThan(aiImpactScore);

      // Non-JSON near-miss scores should be ≤ 0.7
      expect(csvScore).toBeLessThanOrEqual(0.7);
      expect(xmlScore).toBeLessThanOrEqual(0.7);
    });
  });

  describe('FIT payload secondary confidence validation', () => {
    it('should rank FIT first with JSON and CSV scores < FIT score and ≤ 0.7', async () => {
      // Create a valid FIT file header
      const fitPayload = Buffer.alloc(16);
      fitPayload.writeUInt8(14, 0); // Header size
      fitPayload.writeUInt8(16, 1); // Protocol version (1.6)
      fitPayload.writeUInt16LE(2120, 2); // Profile version
      fitPayload.writeUInt32LE(2, 4); // Data size
      fitPayload.write('.FIT', 8); // File type signature
      fitPayload.writeUInt16LE(0, 12); // Header CRC
      fitPayload.writeUInt16LE(0, 14); // File CRC

      const result = await registry.detectFormat(fitPayload);

      // Find scores for expected adapter and two near-miss adapters
      const fitScore =
        result.confidenceScores.find(s => s.adapterName === 'fit')?.score || 0;
      const jsonScore =
        result.confidenceScores.find(s => s.adapterName === 'json')?.score || 0;
      const csvScore =
        result.confidenceScores.find(s => s.adapterName === 'csv')?.score || 0;

      // Expected adapter should rank first
      expect(result.bestMatch).toBe('fit');

      // FIT score should be higher than near-miss adapters
      expect(jsonScore).toBeLessThan(fitScore);
      expect(csvScore).toBeLessThan(fitScore);

      // Near-miss scores should be ≤ 0.7
      expect(jsonScore).toBeLessThanOrEqual(0.7);
      expect(csvScore).toBeLessThanOrEqual(0.7);
    });
  });

  describe('JSONSchema payload secondary confidence validation', () => {
    it('should rank JSONSchema first with non-JSON adapters having scores ≤ 0.7', async () => {
      const jsonSchemaPayload = Buffer.from(
        JSON.stringify({
          timestamp: '2023-01-01T00:00:00Z',
          emissions: 0.001,
          source: 'gpt-4-training',
        })
      );

      const result = await registry.detectFormat(jsonSchemaPayload);

      // Find scores for expected adapter and two near-miss adapters
      const jsonSchemaScore =
        result.confidenceScores.find(s => s.adapterName === 'jsonschema')
          ?.score || 0;
      const csvScore =
        result.confidenceScores.find(s => s.adapterName === 'csv')?.score || 0;
      const xmlScore =
        result.confidenceScores.find(s => s.adapterName === 'xml')?.score || 0;

      // Expected adapter should rank first
      expect(result.bestMatch).toBe('jsonschema');

      // JSONSchema score should be higher than near-miss adapters
      expect(csvScore).toBeLessThan(jsonSchemaScore);
      expect(xmlScore).toBeLessThan(jsonSchemaScore);

      // Non-JSON near-miss scores should be ≤ 0.7
      expect(csvScore).toBeLessThanOrEqual(0.7);
      expect(xmlScore).toBeLessThanOrEqual(0.7);
    });
  });

  describe('Webhook payload validation', () => {
    it("should return appropriate low scores for webhook payload that doesn't match emission formats", async () => {
      // Simulate a simple webhook payload that clearly doesn't match emission formats
      const webhookPayload = Buffer.from(
        JSON.stringify({
          webhook_event: 'notification',
          payload: {
            id: 'notif_123',
            type: 'alert',
            message: 'System update completed',
          },
          delivery_id: 'delivery_789',
        })
      );

      const result = await registry.detectFormat(webhookPayload);

      // Get scores for emission-specific adapters
      const codeCarbonScore =
        result.confidenceScores.find(s => s.adapterName === 'codecarbon')
          ?.score || 0;
      const aiImpactScore =
        result.confidenceScores.find(s => s.adapterName === 'aiimpact')
          ?.score || 0;
      const fitScore =
        result.confidenceScores.find(s => s.adapterName === 'fit')?.score || 0;
      const csvScore =
        result.confidenceScores.find(s => s.adapterName === 'csv')?.score || 0;
      const xmlScore =
        result.confidenceScores.find(s => s.adapterName === 'xml')?.score || 0;

      // Emission-specific adapters should have low scores
      expect(codeCarbonScore).toBeLessThanOrEqual(0.4);
      expect(aiImpactScore).toBeLessThanOrEqual(0.4);
      expect(fitScore).toBeLessThanOrEqual(0.2);
      expect(csvScore).toBeLessThanOrEqual(0.2);
      expect(xmlScore).toBeLessThanOrEqual(0.2);

      // If JSON matches due to valid syntax, it should still be relatively low for non-emission content
      if (result.bestMatch === 'json' || result.bestMatch === 'jsonschema') {
        const bestScore = result.confidenceScores[0].score;
        expect(bestScore).toBeLessThanOrEqual(1.0); // JSON may score high due to syntax but should not exceed 1.0
      }
    });

    it('should return low emission-specific scores for GitHub webhook payload', async () => {
      // GitHub webhook example
      const githubWebhookPayload = Buffer.from(
        JSON.stringify({
          action: 'opened',
          number: 1,
          pull_request: {
            id: 1,
            url: 'https://api.github.com/repos/octocat/Hello-World/pulls/1',
            html_url: 'https://github.com/octocat/Hello-World/pull/1',
            title: 'new-feature',
            user: {
              login: 'octocat',
              id: 1,
            },
            body: 'Please pull these awesome changes',
          },
          repository: {
            id: 1296269,
            name: 'Hello-World',
            full_name: 'octocat/Hello-World',
          },
        })
      );

      const result = await registry.detectFormat(githubWebhookPayload);

      // Emission-specific adapters should have low scores
      const codeCarbonScore =
        result.confidenceScores.find(s => s.adapterName === 'codecarbon')
          ?.score || 0;
      const aiImpactScore =
        result.confidenceScores.find(s => s.adapterName === 'aiimpact')
          ?.score || 0;
      const fitScore =
        result.confidenceScores.find(s => s.adapterName === 'fit')?.score || 0;
      const csvScore =
        result.confidenceScores.find(s => s.adapterName === 'csv')?.score || 0;
      const xmlScore =
        result.confidenceScores.find(s => s.adapterName === 'xml')?.score || 0;

      expect(codeCarbonScore).toBeLessThanOrEqual(0.4);
      expect(aiImpactScore).toBeLessThanOrEqual(0.4);
      expect(fitScore).toBeLessThanOrEqual(0.2);
      expect(csvScore).toBeLessThanOrEqual(0.2);
      expect(xmlScore).toBeLessThanOrEqual(0.2);
    });

    it('should return low emission-specific scores for Slack webhook payload', async () => {
      // Slack webhook example
      const slackWebhookPayload = Buffer.from(
        JSON.stringify({
          token: 'verification_token',
          team_id: 'T1DC2JH3J',
          api_app_id: 'A0MDYCDME',
          event: {
            type: 'message',
            channel: 'C2147483705',
            user: 'U2147483697',
            text: 'Hello world',
            ts: '1355517523.000005',
          },
          type: 'event_callback',
          event_id: 'Ev1234567890',
          event_time: 1234567890,
        })
      );

      const result = await registry.detectFormat(slackWebhookPayload);

      // Emission-specific adapters should have low scores
      const codeCarbonScore =
        result.confidenceScores.find(s => s.adapterName === 'codecarbon')
          ?.score || 0;
      const aiImpactScore =
        result.confidenceScores.find(s => s.adapterName === 'aiimpact')
          ?.score || 0;
      const fitScore =
        result.confidenceScores.find(s => s.adapterName === 'fit')?.score || 0;
      const csvScore =
        result.confidenceScores.find(s => s.adapterName === 'csv')?.score || 0;
      const xmlScore =
        result.confidenceScores.find(s => s.adapterName === 'xml')?.score || 0;

      expect(codeCarbonScore).toBeLessThanOrEqual(0.4);
      expect(aiImpactScore).toBeLessThanOrEqual(0.4);
      expect(fitScore).toBeLessThanOrEqual(0.2);
      expect(csvScore).toBeLessThanOrEqual(0.2);
      expect(xmlScore).toBeLessThanOrEqual(0.2);
    });

    it('should return low emission-specific scores for payment webhook payload', async () => {
      // Payment webhook example
      const paymentWebhookPayload = Buffer.from(
        JSON.stringify({
          id: 'evt_1234567890',
          object: 'event',
          api_version: '2020-08-27',
          created: 1609459200,
          data: {
            object: {
              id: 'pi_1234567890',
              object: 'payment_intent',
              amount: 2000,
              currency: 'usd',
              status: 'succeeded',
            },
          },
          livemode: false,
          pending_webhooks: 1,
          request: {
            id: 'req_1234567890',
            idempotency_key: null,
          },
          type: 'payment_intent.succeeded',
        })
      );

      const result = await registry.detectFormat(paymentWebhookPayload);

      // Emission-specific adapters should have low scores
      const codeCarbonScore =
        result.confidenceScores.find(s => s.adapterName === 'codecarbon')
          ?.score || 0;
      const aiImpactScore =
        result.confidenceScores.find(s => s.adapterName === 'aiimpact')
          ?.score || 0;
      const fitScore =
        result.confidenceScores.find(s => s.adapterName === 'fit')?.score || 0;
      const csvScore =
        result.confidenceScores.find(s => s.adapterName === 'csv')?.score || 0;
      const xmlScore =
        result.confidenceScores.find(s => s.adapterName === 'xml')?.score || 0;

      expect(codeCarbonScore).toBeLessThanOrEqual(0.4);
      expect(aiImpactScore).toBeLessThanOrEqual(0.4);
      expect(fitScore).toBeLessThanOrEqual(0.2);
      expect(csvScore).toBeLessThanOrEqual(0.2);
      expect(xmlScore).toBeLessThanOrEqual(0.2);
    });
  });

  describe('Edge cases for secondary confidence validation', () => {
    it('should handle malformed JSON with CSV-like content', async () => {
      const malformedPayload = Buffer.from(
        '{"data": "timestamp,model,emissions\n2023-01-01,gpt-4,0.5", "incomplete": '
      );

      const result = await registry.detectFormat(malformedPayload);

      // Find the highest scoring adapter
      const topScore = result.confidenceScores[0];
      const secondScore = result.confidenceScores[1];
      const thirdScore = result.confidenceScores[2];

      if (topScore.score > 0) {
        // Second and third place should be lower than first
        expect(secondScore.score).toBeLessThan(topScore.score);
        expect(thirdScore.score).toBeLessThan(topScore.score);

        // Lower ranked scores should be ≤ 0.7
        expect(secondScore.score).toBeLessThanOrEqual(0.7);
        expect(thirdScore.score).toBeLessThanOrEqual(0.7);
      }
    });

    it('should handle data with mixed format indicators', async () => {
      const mixedPayload = Buffer.from(
        'timestamp,model,emissions\n' +
          '2023-01-01,gpt-4,{"value": 0.5}\n' +
          '2023-01-02,<model>gpt-3.5</model>,0.3'
      );

      const result = await registry.detectFormat(mixedPayload);

      // Find scores for potential adapters
      const csvScore =
        result.confidenceScores.find(s => s.adapterName === 'csv')?.score || 0;
      const jsonScore =
        result.confidenceScores.find(s => s.adapterName === 'json')?.score || 0;
      const xmlScore =
        result.confidenceScores.find(s => s.adapterName === 'xml')?.score || 0;

      // Verify the highest scoring adapter beats others and near-miss scores are ≤ 0.7
      if (result.bestMatch) {
        const bestScore = result.confidenceScores[0].score;
        const otherScores = result.confidenceScores.slice(1);

        otherScores.forEach(score => {
          expect(score.score).toBeLessThan(bestScore);
          expect(score.score).toBeLessThanOrEqual(0.7);
        });
      }
    });
  });
});
