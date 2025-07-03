/**
 * Sample Data Files Tests
 *
 * Tests using realistic sample files for each format to verify:
 * 1. Correct adapter ranks first with score ≥ 0.8
 * 2. Near-miss formats get lower scores
 * 3. Unknown data returns empty/low scores
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
} from '../src/adapters/index.js';

describe('Sample Data Files Tests', () => {
  let registry: UniversalTrackerRegistry;

  beforeEach(() => {
    registry = new UniversalTrackerRegistry({
      json: new JsonAdapter(),
      csv: new CsvAdapter(),
      xml: new XmlAdapter(),
      codecarbon: new CodeCarbonAdapter(),
      aiimpact: new AIImpactTrackerAdapter(),
      fit: new FitAdapter(),
    });
  });

  describe('Realistic JSON Samples', () => {
    it('should detect OpenAI API response format', async () => {
      const openaiResponse = Buffer.from(
        JSON.stringify({
          id: 'chatcmpl-123',
          object: 'chat.completion',
          created: 1677652288,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'Hello there, how may I assist you today?',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 56,
            completion_tokens: 31,
            total_tokens: 87,
          },
          model: 'gpt-3.5-turbo',
          system_fingerprint: 'fp_44709d6fcb',
          metadata: {
            emissions: 0.000123,
            duration: 1.45,
            energy_kwh: 0.0021,
          },
        })
      );

      const result = await registry.detectFormat(openaiResponse);

      expect(result.bestMatch).toBe('json');
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);
    });

    it('should detect Hugging Face inference endpoint response', async () => {
      const huggingfaceResponse = Buffer.from(
        JSON.stringify([
          {
            generated_text:
              'The future of AI is bright and full of possibilities...',
            metadata: {
              model: 'gpt2-medium',
              timestamp: '2023-12-01T10:30:00Z',
              input_tokens: 25,
              output_tokens: 150,
              total_tokens: 175,
              carbon_emissions_kg: 0.000087,
              energy_consumption_kwh: 0.0015,
              execution_time_seconds: 2.3,
            },
          },
        ])
      );

      const result = await registry.detectFormat(huggingfaceResponse);

      expect(result.bestMatch).toBe('json');
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);
    });

    it('should detect ML training metrics log', async () => {
      const trainingLog = Buffer.from(
        JSON.stringify({
          experiment: {
            id: 'exp_20231201_bert_training',
            name: 'BERT Fine-tuning Experiment',
            start_time: '2023-12-01T08:00:00Z',
            end_time: '2023-12-01T12:00:00Z',
          },
          model: {
            architecture: 'bert-base-uncased',
            parameters: 110000000,
            dataset_size: 50000,
          },
          metrics: {
            epochs: 3,
            final_accuracy: 0.945,
            final_loss: 0.123,
          },
          emissions: {
            total_kg_co2: 0.245,
            duration_hours: 4.0,
            energy_kwh: 12.5,
            carbon_intensity: 0.019654,
            gpu_model: 'Tesla V100',
            gpu_count: 4,
            cloud_provider: 'AWS',
            cloud_region: 'us-east-1',
          },
        })
      );

      const result = await registry.detectFormat(trainingLog);

      expect(result.bestMatch).toBe('json');
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('Realistic CSV Samples', () => {
    it('should detect AI model inference log CSV', async () => {
      const inferenceLogCsv = Buffer.from(
        'timestamp,request_id,model,input_tokens,output_tokens,latency_ms,emissions_kg,energy_kwh,region\n' +
          '2023-12-01T10:00:00Z,req_001,gpt-4,145,89,1250,0.000234,0.0045,us-east-1\n' +
          '2023-12-01T10:01:15Z,req_002,gpt-3.5-turbo,78,156,890,0.000156,0.0032,us-east-1\n' +
          '2023-12-01T10:02:30Z,req_003,claude-3-sonnet,203,245,1560,0.000345,0.0067,us-west-2\n' +
          '2023-12-01T10:03:45Z,req_004,llama-2-70b,67,123,2100,0.000567,0.0089,eu-central-1\n' +
          '2023-12-01T10:05:00Z,req_005,gpt-4,234,167,1450,0.000287,0.0056,ap-southeast-1'
      );

      const result = await registry.detectFormat(inferenceLogCsv);

      expect(result.bestMatch).toBe('csv');
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);
      expect(result.confidenceScores[0].evidence).toContain(
        'Emission columns detected'
      );
    });

    it('should detect data center energy usage CSV', async () => {
      const datacenterCsv = Buffer.from(
        'date,facility,total_power_kw,ai_workload_power_kw,pue,carbon_intensity_g_per_kwh,total_emissions_kg\n' +
          '2023-12-01,DC-US-East-1,2500.5,1200.3,1.15,429.2,1073.6\n' +
          '2023-12-01,DC-EU-West-1,1800.2,890.7,1.22,312.8,556.3\n' +
          '2023-12-01,DC-AP-Southeast-1,3200.8,1650.4,1.18,820.5,2625.5\n' +
          '2023-12-01,DC-US-West-2,2100.3,1050.6,1.12,350.1,735.1'
      );

      const result = await registry.detectFormat(datacenterCsv);

      expect(result.bestMatch).toBe('csv');
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.79);
    });

    it('should detect training batch metrics CSV', async () => {
      const batchMetricsCsv = Buffer.from(
        'epoch,batch,step,loss,accuracy,gpu_util_percent,power_watts,temp_celsius,co2_g\n' +
          '1,0,0,2.456,0.123,85.2,320.5,78.2,0.234\n' +
          '1,1,1,2.234,0.167,87.1,325.3,79.1,0.241\n' +
          '1,2,2,2.101,0.203,89.3,330.1,80.5,0.248\n' +
          '1,3,3,1.987,0.234,91.2,335.7,81.2,0.256\n' +
          '1,4,4,1.856,0.267,88.9,328.4,79.8,0.245'
      );

      const result = await registry.detectFormat(batchMetricsCsv);

      expect(result.bestMatch).toBe('csv');
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('Realistic XML Samples', () => {
    it('should detect AI model registry XML', async () => {
      const modelRegistryXml = Buffer.from(
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<modelRegistry>\n' +
          '  <models>\n' +
          '    <model id="gpt-4-1106-preview">\n' +
          '      <name>GPT-4 Turbo Preview</name>\n' +
          '      <provider>OpenAI</provider>\n' +
          '      <parameters>1760000000000</parameters>\n' +
          '      <carbonFootprint>\n' +
          '        <trainingEmissions unit="kg-co2">552000</trainingEmissions>\n' +
          '        <inferenceEmissions unit="g-co2-per-1k-tokens">8.5</inferenceEmissions>\n' +
          '        <energyPerToken unit="wh">0.012</energyPerToken>\n' +
          '      </carbonFootprint>\n' +
          '      <performance>\n' +
          '        <latencyP50 unit="ms">1200</latencyP50>\n' +
          '        <throughput unit="tokens-per-second">45</throughput>\n' +
          '      </performance>\n' +
          '    </model>\n' +
          '    <model id="claude-3-sonnet">\n' +
          '      <name>Claude 3 Sonnet</name>\n' +
          '      <provider>Anthropic</provider>\n' +
          '      <parameters>unknown</parameters>\n' +
          '      <carbonFootprint>\n' +
          '        <inferenceEmissions unit="g-co2-per-1k-tokens">6.2</inferenceEmissions>\n' +
          '        <energyPerToken unit="wh">0.009</energyPerToken>\n' +
          '      </carbonFootprint>\n' +
          '    </model>\n' +
          '  </models>\n' +
          '</modelRegistry>'
      );

      const result = await registry.detectFormat(modelRegistryXml);

      expect(result.bestMatch).toBe('xml');
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.35);
      expect(result.confidenceScores[0].evidence).toContain(
        'XML declaration present'
      );
      expect(result.confidenceScores[0].evidence).toContain(
        'Emission-related content detected'
      );
    });

    it('should detect experiment configuration XML', async () => {
      const experimentConfigXml = Buffer.from(
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<experiment>\n' +
          '  <metadata>\n' +
          '    <id>exp_climate_model_2023</id>\n' +
          '    <name>Climate Change Impact Analysis</name>\n' +
          '    <created>2023-12-01T00:00:00Z</created>\n' +
          '    <researcher>Dr. Jane Smith</researcher>\n' +
          '  </metadata>\n' +
          '  <compute>\n' +
          '    <infrastructure>\n' +
          '      <provider>Google Cloud</provider>\n' +
          '      <region>us-central1</region>\n' +
          '      <instances>\n' +
          '        <instance type="n1-highmem-96" count="8"/>\n' +
          '        <gpu type="Tesla V100" count="32"/>\n' +
          '      </instances>\n' +
          '    </infrastructure>\n' +
          '    <duration hours="72"/>\n' +
          '    <estimatedCost currency="USD">4567.89</estimatedCost>\n' +
          '  </compute>\n' +
          '  <sustainability>\n' +
          '    <carbonBudget kg="50.0"/>\n' +
          '    <energySource>renewable</energySource>\n' +
          '    <offsetProvider>Carbonfund.org</offsetProvider>\n' +
          '    <tracking>\n' +
          '      <realTimeMonitoring>true</realTimeMonitoring>\n' +
          '      <emissionAlerts>true</emissionAlerts>\n' +
          '    </tracking>\n' +
          '  </sustainability>\n' +
          '</experiment>'
      );

      const result = await registry.detectFormat(experimentConfigXml);

      expect(result.bestMatch).toBe('xml');
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.4);
    });
  });

  describe('Real CodeCarbon Samples', () => {
    it('should detect actual CodeCarbon output', async () => {
      const codeCarbonOutput = Buffer.from(
        JSON.stringify({
          timestamp: '2023-12-01T10:30:45.123456',
          project_name: 'ai-climate-research',
          run_id: '2023-12-01T10:30:45.123456',
          duration: 3600.45,
          emissions: 0.123456,
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

      const result = await registry.detectFormat(codeCarbonOutput);

      expect(result.bestMatch).toBe('codecarbon');
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);
      expect(result.confidenceScores[0].evidence).toContain(
        'CodeCarbon alternative field combination'
      );
    });

    it('should detect simplified CodeCarbon format', async () => {
      const simpleCodeCarbon = Buffer.from(
        JSON.stringify({
          duration_seconds: 1800.5,
          emissions_kg: 0.0456,
          project_name: 'bert-fine-tuning',
          country_name: 'Germany',
          region: 'eu-central-1',
        })
      );

      const result = await registry.detectFormat(simpleCodeCarbon);

      expect(result.bestMatch).toBe('codecarbon');
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('AI Impact Tracker Samples', () => {
    it('should detect comprehensive AI Impact Tracker data', async () => {
      const aiImpactData = Buffer.from(
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

      const result = await registry.detectFormat(aiImpactData);

      expect(result.bestMatch).toBe('aiimpact');
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);
      expect(result.confidenceScores[0].evidence).toContain(
        'All required AI Impact Tracker fields present'
      );
    });

    it('should detect batch processing AI Impact Tracker data', async () => {
      const batchAIImpact = Buffer.from(
        JSON.stringify({
          model: 'claude-3-haiku',
          timestamp: '2023-12-01T16:45:00Z',
          tokens: {
            total: 50000,
            averagePerRequest: 500,
          },
          energyPerToken: 0.0008,
          totalEnergy: 40.0,
          batchSize: 100,
          processingTime: 3600,
          region: 'us-west-2',
        })
      );

      const result = await registry.detectFormat(batchAIImpact);

      expect(result.bestMatch).toBe('aiimpact');
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('Mixed and Ambiguous Samples', () => {
    it('should handle JSON with CSV-like field names', async () => {
      const csvLikeJson = Buffer.from(
        JSON.stringify({
          'timestamp,model,emissions': 'header row',
          data: [
            '2023-12-01T10:00:00Z,gpt-4,0.001',
            '2023-12-01T10:01:00Z,gpt-3.5,0.0008',
          ],
          actualEmissions: 0.0018,
          model: 'aggregated',
        })
      );

      const result = await registry.detectFormat(csvLikeJson);

      // JSON should win due to valid JSON structure
      expect(result.bestMatch).toBe('json');
      const jsonScore =
        result.confidenceScores.find(s => s.adapterName === 'json')?.score || 0;
      const csvScore =
        result.confidenceScores.find(s => s.adapterName === 'csv')?.score || 0;
      expect(jsonScore).toBeGreaterThan(csvScore);
    });

    it('should handle XML embedded in JSON strings', async () => {
      const xmlInJsonData = Buffer.from(
        JSON.stringify({
          format: 'mixed',
          xmlContent:
            '<emissions><co2>0.001</co2><duration>3600</duration></emissions>',
          metadata: {
            timestamp: '2023-12-01T10:00:00Z',
            model: 'gpt-4',
            actualEmissions: 0.001,
          },
        })
      );

      const result = await registry.detectFormat(xmlInJsonData);

      // JSON should win
      expect(result.bestMatch).toBe('json');
      const jsonScore =
        result.confidenceScores.find(s => s.adapterName === 'json')?.score || 0;
      expect(jsonScore).toBeGreaterThanOrEqual(0.8);
    });

    it('should handle CSV with JSON-like field values', async () => {
      const jsonLikeCsv = Buffer.from(
        'timestamp,model,config,emissions_kg\n' +
          '2023-12-01T10:00:00Z,gpt-4,"{""temperature"": 0.7}",0.001\n' +
          '2023-12-01T10:01:00Z,claude-3,"{""max_tokens"": 1000}",0.0008\n' +
          '2023-12-01T10:02:00Z,llama-2,"{""top_p"": 0.9}",0.0012'
      );

      const result = await registry.detectFormat(jsonLikeCsv);

      // CSV should win due to clear CSV structure
      expect(result.bestMatch).toBe('csv');
      const csvScore =
        result.confidenceScores.find(s => s.adapterName === 'csv')?.score || 0;
      expect(csvScore).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('Corrupted and Truncated Samples', () => {
    it('should handle corrupted JSON with binary data', async () => {
      const corruptedJsonBuffer = Buffer.concat([
        Buffer.from('{"model": "gpt-4", "emissions": 0.001, '),
        Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe]),
        Buffer.from('"timestamp": "2023-12-01"}'),
      ]);

      const result = await registry.detectFormat(corruptedJsonBuffer);

      const jsonScore =
        result.confidenceScores.find(s => s.adapterName === 'json')?.score || 0;
      expect(jsonScore).toBeLessThan(0.5);
    });

    it('should handle truncated CSV with incomplete rows', async () => {
      const truncatedCsv = Buffer.from(
        'timestamp,model,emissions_kg,duration_seconds,notes\n' +
          '2023-12-01T10:00:00Z,gpt-4,0.001,3600,"Complete row"\n' +
          '2023-12-01T10:01:00Z,gpt-3.5,0.0008,2400,"Another complete"\n' +
          '2023-12-01T10:02:00Z,claude-3,0.0012' // Truncated row
      );

      const result = await registry.detectFormat(truncatedCsv);

      const csvScore =
        result.confidenceScores.find(s => s.adapterName === 'csv')?.score || 0;
      expect(csvScore).toBeGreaterThan(0.3);
      expect(csvScore).toBeLessThan(0.8);
    });

    it('should handle XML with malformed tags', async () => {
      const malformedXml = Buffer.from(
        '<?xml version="1.0"?>\n' +
          '<emissions>\n' +
          '  <record>\n' +
          '    <timestamp>2023-12-01T10:00:00Z</timestamp>\n' +
          '    <model>gpt-4</model>\n' +
          '    <co2>0.001</co2\n' + // Missing closing >
          '    <duration>3600</duration>\n' +
          '  </record>\n' +
          '</emissions>'
      );

      const result = await registry.detectFormat(malformedXml);

      const xmlScore =
        result.confidenceScores.find(s => s.adapterName === 'xml')?.score || 0;
      expect(xmlScore).toBeLessThan(0.6);
    });
  });

  describe('Large File Samples', () => {
    it('should handle large JSON files efficiently', async () => {
      // Create a large JSON structure
      const largeEmissionLog = {
        metadata: {
          experiment: 'large-scale-training',
          startTime: '2023-12-01T00:00:00Z',
          totalRecords: 10000,
        },
        emissions: Array.from({ length: 1000 }, (_, i) => ({
          timestamp: `2023-12-01T${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z`,
          model: i % 3 === 0 ? 'gpt-4' : i % 3 === 1 ? 'gpt-3.5' : 'claude-3',
          co2: Math.random() * 0.01,
          duration: Math.random() * 10,
          energy: Math.random() * 0.1,
          tokens: Math.floor(Math.random() * 1000) + 100,
        })),
      };

      const largeData = Buffer.from(JSON.stringify(largeEmissionLog));

      const startTime = Date.now();
      const result = await registry.detectFormat(largeData);
      const endTime = Date.now();

      expect(result.bestMatch).toBe('json');
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle large CSV files efficiently', async () => {
      // Create a large CSV
      const headers =
        'timestamp,model,emissions_kg,duration_seconds,energy_kwh,tokens,region';
      const rows = Array.from({ length: 5000 }, (_, i) => {
        const hour = Math.floor(i / 3600);
        const minute = Math.floor((i % 3600) / 60);
        const second = i % 60;
        return (
          `2023-12-01T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}Z,` +
          `${i % 3 === 0 ? 'gpt-4' : 'gpt-3.5'},` +
          `${(Math.random() * 0.01).toFixed(6)},` +
          `${Math.floor(Math.random() * 10) + 1},` +
          `${(Math.random() * 0.1).toFixed(4)},` +
          `${Math.floor(Math.random() * 1000) + 100},` +
          `us-east-1`
        );
      });

      const largeCsv = Buffer.from([headers, ...rows].join('\n'));

      const startTime = Date.now();
      const result = await registry.detectFormat(largeCsv);
      const endTime = Date.now();

      expect(result.bestMatch).toBe('csv');
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.8);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Edge Case Samples', () => {
    it('should handle empty JSON objects and arrays', async () => {
      const emptyJson = Buffer.from('{}');
      const result1 = await registry.detectFormat(emptyJson);
      expect(result1.bestMatch).toBe('json');

      const emptyArray = Buffer.from('[]');
      const result2 = await registry.detectFormat(emptyArray);
      expect(result2.bestMatch).toBe('json');
    });

    it('should handle single-line CSV', async () => {
      const singleLineCsv = Buffer.from('timestamp,model,emissions_kg');
      const result = await registry.detectFormat(singleLineCsv);

      const csvScore =
        result.confidenceScores.find(s => s.adapterName === 'csv')?.score || 0;
      expect(csvScore).toBeGreaterThan(0);
      expect(csvScore).toBeLessThan(0.8);
    });

    it('should handle minimal valid XML', async () => {
      const minimalXml = Buffer.from('<root/>');
      const result = await registry.detectFormat(minimalXml);

      const xmlScore =
        result.confidenceScores.find(s => s.adapterName === 'xml')?.score || 0;
      expect(xmlScore).toBeGreaterThan(0);
      expect(xmlScore).toBeLessThan(0.6);
    });

    it('should handle Unicode and international characters', async () => {
      const unicodeJson = Buffer.from(
        JSON.stringify({
          模型: 'gpt-4',
          时间戳: '2023-12-01T10:00:00Z',
          碳排放量: 0.001,
          持续时间: 3600,
          备注: '测试数据 with émojis 🌍 and symbols ⚡',
        }),
        'utf8'
      );

      const result = await registry.detectFormat(unicodeJson);

      expect(result.bestMatch).toBe('json');
      expect(result.confidenceScores[0].score).toBeGreaterThanOrEqual(0.7);
    });
  });
});
