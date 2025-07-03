/**
 * Happy-Path Tests for Format Detection
 *
 * Tests that for each payload buffer:
 * 1. Call await registry.detectFormat(buffer)
 * 2. Assert result.bestMatch equals expected adapter key (codecarbon, aiimpact, csv)
 * 3. Assert result.confidenceScores[0].score ≥ 0.8
 * 4. Assert evidence contains at least one format-specific phrase
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UniversalTrackerRegistry } from '../src/UniversalTrackerRegistry.js';
import {
  CsvAdapter,
  CodeCarbonAdapter,
  AIImpactTrackerAdapter,
} from '../src/adapters/index.js';

describe('Happy-Path Format Detection Tests', () => {
  let registry: UniversalTrackerRegistry;

  beforeEach(() => {
    registry = new UniversalTrackerRegistry({
      codecarbon: new CodeCarbonAdapter(),
      aiimpact: new AIImpactTrackerAdapter(),
      csv: new CsvAdapter(),
    });
  });

  describe('CodeCarbon Format Happy-Path Tests', () => {
    it('should detect complete CodeCarbon payload with high confidence', async () => {
      const codeCarbonBuffer = Buffer.from(
        JSON.stringify({
          timestamp: '2023-12-01T10:30:45.123456',
          project_name: 'ai-training-experiment',
          run_id: '2023-12-01T10:30:45.123456',
          duration_seconds: 3600.45,
          emissions_kg: 0.123456,
          emissions_rate: 0.000034,
          cpu_power: 42.5,
          gpu_power: 156.8,
          ram_power: 12.3,
          cpu_energy: 0.153,
          gpu_energy: 0.565,
          ram_energy: 0.044,
          energy_consumed: 0.762,
          country_name: 'United States',
          country_iso_code: 'USA',
          region: 'us-east-1',
          cloud_provider: 'aws',
          cloud_region: 'us-east-1',
          os: 'Linux-5.4.0-87-generic-x86_64-with-glibc2.31',
          python_version: '3.8.10',
          codecarbon_version: '2.1.4',
          cpu_count: 8,
          cpu_model: 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz',
          gpu_count: 1,
          gpu_model: 'Tesla V100-SXM2-16GB',
          longitude: -77.0369,
          latitude: 38.9072,
          ram_total_size: 61.035,
          tracking_mode: 'machine',
        })
      );

      const result = await registry.detectFormat(codeCarbonBuffer);

      // Assert correct adapter key
      expect(result.bestMatch).toBe('codecarbon');

      // Assert high confidence ≥ 0.8
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);

      // Assert adapter name matches
      expect(result.confidenceScores[0].adapterName).toBe('codecarbon');

      // Assert evidence contains format-specific phrase
      expect(result.confidenceScores[0].evidence).toContain(
        'CodeCarbon canonical fields present'
      );
    });

    it('should detect minimal CodeCarbon payload with high confidence', async () => {
      const minimalCodeCarbonBuffer = Buffer.from(
        JSON.stringify({
          duration_seconds: 1800.5,
          emissions_kg: 0.0456,
          project_name: 'bert-fine-tuning',
          country_name: 'Germany',
        })
      );

      const result = await registry.detectFormat(minimalCodeCarbonBuffer);

      // Assert correct adapter key
      expect(result.bestMatch).toBe('codecarbon');

      // Assert high confidence ≥ 0.8
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);

      // Assert adapter name matches
      expect(result.confidenceScores[0].adapterName).toBe('codecarbon');

      // Assert evidence contains format-specific phrase
      expect(result.confidenceScores[0].evidence).toContain(
        'CodeCarbon canonical fields present'
      );
    });

    it('should detect CodeCarbon with energy tracking fields', async () => {
      const energyTrackingBuffer = Buffer.from(
        JSON.stringify({
          duration_seconds: 7200,
          emissions_kg: 0.245,
          project_name: 'climate-model-training',
          energy_consumed: 12.5,
          cpu_power: 85.2,
          gpu_power: 320.7,
          ram_power: 18.4,
          country_name: 'Canada',
          region: 'ca-central-1',
          cloud_provider: 'gcp',
        })
      );

      const result = await registry.detectFormat(energyTrackingBuffer);

      // Assert correct adapter key
      expect(result.bestMatch).toBe('codecarbon');

      // Assert high confidence ≥ 0.8
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);

      // Assert adapter name matches
      expect(result.confidenceScores[0].adapterName).toBe('codecarbon');

      // Assert evidence contains format-specific phrase
      expect(result.confidenceScores[0].evidence).toContain(
        'CodeCarbon canonical fields present'
      );
    });
  });

  describe('AI Impact Tracker Format Happy-Path Tests', () => {
    it('should detect complete AI Impact Tracker payload with high confidence', async () => {
      const aiImpactBuffer = Buffer.from(
        JSON.stringify({
          model: 'gpt-4-0613',
          timestamp: '2023-12-01T14:30:00Z',
          tokens: {
            input: 1250,
            output: 890,
            total: 2140,
          },
          energyPerToken: 0.00125,
          totalEnergy: 2.675,
          carbonIntensity: 0.429,
          totalEmissions: 1.147675,
          region: 'us-east-1',
          cloudProvider: 'aws',
          modelSize: '175B',
          requestId: 'req_abcd1234',
          sessionId: 'sess_xyz789',
          userId: 'user_123',
          application: 'chatbot',
          metadata: {
            temperature: 0.7,
            maxTokens: 1000,
            topP: 0.9,
            frequencyPenalty: 0.1,
            presencePenalty: 0.1,
          },
        })
      );

      const result = await registry.detectFormat(aiImpactBuffer);

      // Assert correct adapter key
      expect(result.bestMatch).toBe('aiimpact');

      // Assert high confidence ≥ 0.8
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);

      // Assert adapter name matches
      expect(result.confidenceScores[0].adapterName).toBe('aiimpact');

      // Assert evidence contains format-specific phrase
      expect(result.confidenceScores[0].evidence).toContain(
        'All required AI Impact Tracker fields present'
      );
    });

    it('should detect minimal AI Impact Tracker payload with high confidence', async () => {
      const minimalAIImpactBuffer = Buffer.from(
        JSON.stringify({
          model: 'gpt-3.5-turbo',
          tokens: {
            total: 500,
            input: 300,
            output: 200,
          },
          timestamp: '2023-12-01T16:00:00Z',
          energyPerToken: 0.0008,
        })
      );

      const result = await registry.detectFormat(minimalAIImpactBuffer);

      // Assert correct adapter key
      expect(result.bestMatch).toBe('aiimpact');

      // Assert high confidence ≥ 0.8
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);

      // Assert adapter name matches
      expect(result.confidenceScores[0].adapterName).toBe('aiimpact');

      // Assert evidence contains format-specific phrase
      expect(result.confidenceScores[0].evidence).toContain(
        'All required AI Impact Tracker fields present'
      );
    });

    it('should detect batch processing AI Impact Tracker payload with high confidence', async () => {
      const batchAIImpactBuffer = Buffer.from(
        JSON.stringify({
          model: 'claude-3-sonnet',
          timestamp: '2023-12-01T18:45:00Z',
          tokens: {
            total: 50000,
            averagePerRequest: 500,
            batchCount: 100,
          },
          energyPerToken: 0.0009,
          totalEnergy: 45.0,
          batchSize: 100,
          processingTime: 3600,
          region: 'us-west-2',
          cloudProvider: 'aws',
        })
      );

      const result = await registry.detectFormat(batchAIImpactBuffer);

      // Assert correct adapter key
      expect(result.bestMatch).toBe('aiimpact');

      // Assert high confidence ≥ 0.8
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);

      // Assert adapter name matches
      expect(result.confidenceScores[0].adapterName).toBe('aiimpact');

      // Assert evidence contains format-specific phrase
      expect(result.confidenceScores[0].evidence).toContain(
        'All required AI Impact Tracker fields present'
      );
    });
  });

  describe('CSV Format Happy-Path Tests', () => {
    it('should detect AI inference log CSV with high confidence', async () => {
      const inferenceLogCsvBuffer = Buffer.from(
        'timestamp,request_id,model,input_tokens,output_tokens,latency_ms,emissions_kg,energy_kwh,region\n' +
          '2023-12-01T10:00:00Z,req_001,gpt-4,145,89,1250,0.000234,0.0045,us-east-1\n' +
          '2023-12-01T10:01:15Z,req_002,gpt-3.5-turbo,78,156,890,0.000156,0.0032,us-east-1\n' +
          '2023-12-01T10:02:30Z,req_003,claude-3-sonnet,203,245,1560,0.000345,0.0067,us-west-2\n' +
          '2023-12-01T10:03:45Z,req_004,llama-2-70b,67,123,2100,0.000567,0.0089,eu-central-1\n' +
          '2023-12-01T10:05:00Z,req_005,gpt-4,234,167,1450,0.000287,0.0056,ap-southeast-1'
      );

      const result = await registry.detectFormat(inferenceLogCsvBuffer);

      // Assert correct adapter key
      expect(result.bestMatch).toBe('csv');

      // Assert high confidence ≥ 0.8
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);

      // Assert adapter name matches
      expect(result.confidenceScores[0].adapterName).toBe('csv');

      // Assert evidence contains format-specific phrase
      expect(result.confidenceScores[0].evidence).toContain(
        'Emission columns detected'
      );
    });

    it('should detect data center energy usage CSV with high confidence', async () => {
      const datacenterCsvBuffer = Buffer.from(
        'date,facility,total_power_kw,ai_workload_power_kw,pue,carbon_intensity_g_per_kwh,emissions_kg,co2_emissions\n' +
          '2023-12-01,DC-US-East-1,2500.5,1200.3,1.15,429.2,1073.6,1.0736\n' +
          '2023-12-01,DC-EU-West-1,1800.2,890.7,1.22,312.8,556.3,0.5563\n' +
          '2023-12-01,DC-AP-Southeast-1,3200.8,1650.4,1.18,820.5,2625.5,2.6255\n' +
          '2023-12-01,DC-US-West-2,2100.3,1050.6,1.12,350.1,735.1,0.7351'
      );

      const result = await registry.detectFormat(datacenterCsvBuffer);

      // Assert correct adapter key
      expect(result.bestMatch).toBe('csv');

      // Assert high confidence ≥ 0.8
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);

      // Assert adapter name matches
      expect(result.confidenceScores[0].adapterName).toBe('csv');

      // Assert evidence contains format-specific phrase
      expect(result.confidenceScores[0].evidence).toContain(
        'Emission columns detected'
      );
    });

    it('should detect training batch metrics CSV with high confidence', async () => {
      const batchMetricsCsvBuffer = Buffer.from(
        'epoch,batch,step,loss,accuracy,gpu_util_percent,power_watts,temp_celsius,co2_g,emissions_kg,energy_kwh\n' +
          '1,0,0,2.456,0.123,85.2,320.5,78.2,0.234,0.000234,0.0032\n' +
          '1,1,1,2.234,0.167,87.1,325.3,79.1,0.241,0.000241,0.0033\n' +
          '1,2,2,2.101,0.203,89.3,330.1,80.5,0.248,0.000248,0.0034\n' +
          '1,3,3,1.987,0.234,91.2,335.7,81.2,0.256,0.000256,0.0035\n' +
          '1,4,4,1.856,0.267,88.9,328.4,79.8,0.245,0.000245,0.0033'
      );

      const result = await registry.detectFormat(batchMetricsCsvBuffer);

      // Assert correct adapter key
      expect(result.bestMatch).toBe('csv');

      // Assert high confidence ≥ 0.8
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);

      // Assert adapter name matches
      expect(result.confidenceScores[0].adapterName).toBe('csv');

      // Assert evidence contains format-specific phrase
      expect(result.confidenceScores[0].evidence).toContain(
        'Emission columns detected'
      );
    });

    it('should detect ML model comparison CSV with high confidence', async () => {
      const modelComparisonCsvBuffer = Buffer.from(
        'model_name,dataset,accuracy,f1_score,training_time_hours,emissions_kg,energy_kwh,carbon_efficiency\n' +
          'gpt-4,sentiment-analysis,0.945,0.932,12.5,0.567,28.4,0.0200\n' +
          'bert-large,sentiment-analysis,0.912,0.898,8.2,0.389,19.7,0.0197\n' +
          'roberta-base,sentiment-analysis,0.889,0.876,6.1,0.245,12.8,0.0191\n' +
          'distilbert,sentiment-analysis,0.854,0.834,3.4,0.156,8.9,0.0175\n' +
          'albert-large,sentiment-analysis,0.923,0.914,10.8,0.456,23.2,0.0196'
      );

      const result = await registry.detectFormat(modelComparisonCsvBuffer);

      // Assert correct adapter key
      expect(result.bestMatch).toBe('csv');

      // Assert high confidence ≥ 0.8
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);

      // Assert adapter name matches
      expect(result.confidenceScores[0].adapterName).toBe('csv');

      // Assert evidence contains format-specific phrase
      expect(result.confidenceScores[0].evidence).toContain(
        'Emission columns detected'
      );
    });
  });

  describe('Cross-Format Validation', () => {
    it('should ensure each format is detected with highest confidence for its respective payloads', async () => {
      // CodeCarbon payload
      const codeCarbonBuffer = Buffer.from(
        JSON.stringify({
          duration_seconds: 3600,
          emissions_kg: 0.123,
          project_name: 'test-project',
          country_name: 'USA',
        })
      );

      // AI Impact Tracker payload
      const aiImpactBuffer = Buffer.from(
        JSON.stringify({
          model: 'gpt-4',
          tokens: { total: 1000 },
          timestamp: '2023-12-01T10:00:00Z',
          energyPerToken: 0.001,
        })
      );

      // CSV payload
      const csvBuffer = Buffer.from(
        'timestamp,model,emissions_kg,duration_seconds\n' +
          '2023-12-01T10:00:00Z,gpt-4,0.001,3600\n' +
          '2023-12-01T10:01:00Z,gpt-3.5,0.0008,2400'
      );

      // Test CodeCarbon detection
      const codeCarbonResult = await registry.detectFormat(codeCarbonBuffer);
      expect(codeCarbonResult.bestMatch).toBe('codecarbon');
      expect(codeCarbonResult.confidenceScores[0].score).toBeGreaterThanOrEqual(
        0.8
      );
      expect(codeCarbonResult.confidenceScores[0].adapterName).toBe(
        'codecarbon'
      );

      // Test AI Impact Tracker detection
      const aiImpactResult = await registry.detectFormat(aiImpactBuffer);
      expect(aiImpactResult.bestMatch).toBe('aiimpact');
      expect(aiImpactResult.confidenceScores[0].score).toBeGreaterThanOrEqual(
        0.8
      );
      expect(aiImpactResult.confidenceScores[0].adapterName).toBe('aiimpact');

      // Test CSV detection
      const csvResult = await registry.detectFormat(csvBuffer);
      expect(csvResult.bestMatch).toBe('csv');
      expect(csvResult.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);
      expect(csvResult.confidenceScores[0].adapterName).toBe('csv');
    });

    it('should maintain evidence quality across all successful detections', async () => {
      const payloads = [
        {
          name: 'codecarbon',
          buffer: Buffer.from(
            JSON.stringify({
              duration_seconds: 1800,
              emissions_kg: 0.045,
              project_name: 'ml-experiment',
            })
          ),
          expectedPhrase: 'CodeCarbon canonical fields present',
        },
        {
          name: 'aiimpact',
          buffer: Buffer.from(
            JSON.stringify({
              model: 'claude-3',
              tokens: { total: 750 },
              timestamp: '2023-12-01T12:00:00Z',
              energyPerToken: 0.0012,
            })
          ),
          expectedPhrase: 'All required AI Impact Tracker fields present',
        },
        {
          name: 'csv',
          buffer: Buffer.from(
            'model,emissions_kg,energy_kwh\n' +
              'gpt-4,0.001,0.045\n' +
              'claude-3,0.0012,0.052'
          ),
          expectedPhrase: 'Emission columns detected',
        },
      ];

      for (const payload of payloads) {
        const result = await registry.detectFormat(payload.buffer);

        expect(result.bestMatch).toBe(payload.name);
        expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);
        expect(result.confidenceScores[0].adapterName).toBe(payload.name);
        expect(result.confidenceScores[0].evidence).toContain(
          payload.expectedPhrase
        );

        // Ensure evidence is meaningful and not empty
        expect(result.confidenceScores[0].evidence.length).toBeGreaterThan(0);
        expect(typeof result.confidenceScores[0].evidence).toBe('string');
      }
    });
  });
});
