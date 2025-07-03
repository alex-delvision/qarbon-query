import { describe, it, beforeEach } from 'vitest';
import { UniversalTrackerRegistry } from '../src/UniversalTrackerRegistry.js';
import { JsonAdapter } from '../src/adapters/JsonAdapter.js';
import { CsvAdapter } from '../src/adapters/CsvAdapter.js';
import { XmlAdapter } from '../src/adapters/XmlAdapter.js';
import { CodeCarbonAdapter } from '../src/adapters/CodeCarbonAdapter.js';
import { AIImpactTrackerAdapter } from '../src/adapters/AIImpactTrackerAdapter.js';
import { FitAdapter } from '../src/adapters/FitAdapter.js';
import { JSONSchemaAdapter } from '../src/adapters/JSONSchemaAdapter.js';

describe('Debug Failing Tests', () => {
  let registry: UniversalTrackerRegistry;

  beforeEach(() => {
    registry = new UniversalTrackerRegistry();
    registry.registerAdapter('json', new JsonAdapter());
    registry.registerAdapter('csv', new CsvAdapter());
    registry.registerAdapter('xml', new XmlAdapter());
    registry.registerAdapter('codecarbon', new CodeCarbonAdapter());
    registry.registerAdapter('aiimpact', new AIImpactTrackerAdapter());
    registry.registerAdapter('fit', new FitAdapter());
    registry.registerAdapter(
      'jsonschema',
      new JSONSchemaAdapter({
        schemas: {
          emission: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              emissions: { type: 'number' },
              duration: { type: 'number' },
            },
            required: ['timestamp', 'emissions'],
          } as any,
        },
      })
    );
  });

  it('Debug corrupted JSON scores', async () => {
    const corruptedJson = `{ "emissions": 0.5, "invalid": syntax }`;
    const result = await registry.detectFormat(Buffer.from(corruptedJson));

    console.log('Corrupted JSON scores:');
    result.confidenceScores.forEach(score => {
      console.log(
        `  ${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
      );
    });
    console.log(`Best match: ${result.bestMatch}\n`);
  });

  it('Debug random characters with JSON-like syntax', async () => {
    const randomChars = `abc {"emission": def} xyz`;
    const result = await registry.detectFormat(Buffer.from(randomChars));

    console.log('Random characters with JSON-like syntax scores:');
    result.confidenceScores.forEach(score => {
      console.log(
        `  ${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
      );
    });
    console.log(`Best match: ${result.bestMatch}\n`);
  });

  it('Debug truncated CSV scores', async () => {
    const truncatedCsv = `timestamp,model,duration,emissions\n2024-01-01,gpt-4,120`;
    const result = await registry.detectFormat(Buffer.from(truncatedCsv));

    console.log('Truncated CSV scores:');
    result.confidenceScores.forEach(score => {
      console.log(
        `  ${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
      );
    });
    console.log(`Best match: ${result.bestMatch}\n`);
  });

  it('Debug malformed CSV scores', async () => {
    const malformedCsv = `emission,time\n"unclosed quote,broken\nrow,with,too,many,columns\nvalid,10`;
    const result = await registry.detectFormat(Buffer.from(malformedCsv));

    console.log('Malformed CSV scores:');
    result.confidenceScores.forEach(score => {
      console.log(
        `  ${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
      );
    });
    console.log(`Best match: ${result.bestMatch}\n`);
  });

  it('Debug XML without declaration', async () => {
    const xmlWithoutDecl = `<emission><co2>1.5</co2><duration>300</duration></emission>`;
    const result = await registry.detectFormat(Buffer.from(xmlWithoutDecl));

    console.log('XML without declaration scores:');
    result.confidenceScores.forEach(score => {
      console.log(
        `  ${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
      );
    });
    console.log(`Best match: ${result.bestMatch}\n`);
  });

  it('Debug truncated XML scores', async () => {
    const truncatedXml = `<emission><co2>1.5</co2><duration>300`;
    const result = await registry.detectFormat(Buffer.from(truncatedXml));

    console.log('Truncated XML scores:');
    result.confidenceScores.forEach(score => {
      console.log(
        `  ${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
      );
    });
    console.log(`Best match: ${result.bestMatch}\n`);
  });

  it('Debug malformed XML scores', async () => {
    const malformedXml = `<emission><broken<tag>value</invalid>`;
    const result = await registry.detectFormat(Buffer.from(malformedXml));

    console.log('Malformed XML scores:');
    result.confidenceScores.forEach(score => {
      console.log(
        `  ${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
      );
    });
    console.log(`Best match: ${result.bestMatch}\n`);
  });

  it('Debug partial AI Impact data', async () => {
    const partialAiImpact = `{"model": "gpt-4", "tokens": 1000}`;
    const result = await registry.detectFormat(Buffer.from(partialAiImpact));

    console.log('Partial AI Impact data scores:');
    result.confidenceScores.forEach(score => {
      console.log(
        `  ${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
      );
    });
    console.log(`Best match: ${result.bestMatch}\n`);
  });

  it('Debug perfect JSON Schema match', async () => {
    const perfectMatch = `{"timestamp": "2024-01-01", "emissions": 1.5, "duration": 300}`;
    const result = await registry.detectFormat(Buffer.from(perfectMatch));

    console.log('Perfect JSON Schema match scores:');
    result.confidenceScores.forEach(score => {
      console.log(
        `  ${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
      );
    });
    console.log(`Best match: ${result.bestMatch}\n`);
  });

  it('Debug random text scores', async () => {
    const randomText = `This is just some random text with no structure`;
    const result = await registry.detectFormat(Buffer.from(randomText));

    console.log('Random text scores:');
    result.confidenceScores.forEach(score => {
      console.log(
        `  ${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
      );
    });
    console.log(`Best match: ${result.bestMatch}\n`);
  });

  it('Debug binary data scores', async () => {
    const binaryData = Buffer.from([0x42, 0x49, 0x4e, 0x00, 0xff, 0xaa, 0x55]);
    const result = await registry.detectFormat(binaryData);

    console.log('Binary data scores:');
    result.confidenceScores.forEach(score => {
      console.log(
        `  ${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
      );
    });
    console.log(`Best match: ${result.bestMatch}\n`);
  });
});
