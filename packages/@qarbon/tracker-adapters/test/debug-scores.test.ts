/**
 * Debug test to see actual confidence scores
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

describe('Debug Confidence Scores', () => {
  let registry: UniversalTrackerRegistry;

  beforeEach(() => {
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

  it('should show CodeCarbon scores vs JSON scores', async () => {
    const validCodeCarbon = Buffer.from(
      JSON.stringify({
        duration_seconds: 3600,
        emissions_kg: 0.001,
        project_name: 'ai-training',
        country_name: 'USA',
        region: 'us-east-1',
      })
    );

    const result = await registry.detectFormat(validCodeCarbon);

    console.log('\n=== CodeCarbon Test Results ===');
    console.log('Best match:', result.bestMatch);
    console.log('\nAll scores:');
    result.confidenceScores.forEach(score => {
      console.log(
        `${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
      );
    });

    expect(true).toBe(true); // Just to make the test pass
  });

  it('should show AI Impact Tracker scores', async () => {
    const validAIImpact = Buffer.from(
      JSON.stringify({
        model: 'gpt-4',
        tokens: { total: 1000, input: 800, output: 200 },
        timestamp: '2023-01-01T00:00:00Z',
        energyPerToken: 0.001,
        region: 'us-east-1',
      })
    );

    const result = await registry.detectFormat(validAIImpact);

    console.log('\n=== AI Impact Tracker Test Results ===');
    console.log('Best match:', result.bestMatch);
    console.log('\nAll scores:');
    result.confidenceScores.forEach(score => {
      console.log(
        `${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
      );
    });

    expect(true).toBe(true); // Just to make the test pass
  });

  it('should show single-line CSV scores', async () => {
    const singleLineCsv = Buffer.from('timestamp,model,emissions_kg');

    const result = await registry.detectFormat(singleLineCsv);

    console.log('\n=== Single-line CSV Test Results ===');
    console.log('Best match:', result.bestMatch);
    console.log('\nAll scores:');
    result.confidenceScores.forEach(score => {
      console.log(
        `${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
      );
    });

    expect(true).toBe(true); // Just to make the test pass
  });

  it('should show corrupted JSON scores', async () => {
    const corruptedJson = Buffer.from(
      '{"emissions": 0.5 "model": "gpt-4", invalid: }'
    );

    const result = await registry.detectFormat(corruptedJson);

    console.log('\n=== Corrupted JSON Test Results ===');
    console.log('Best match:', result.bestMatch);
    console.log('\nAll scores:');
    result.confidenceScores.forEach(score => {
      console.log(
        `${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
      );
    });

    expect(true).toBe(true); // Just to make the test pass
  });
});
