/**
 * Enhanced Format Detection Example
 *
 * This example demonstrates the new detectFormat API that provides:
 * - Confidence-based detection with scores (0.0-1.0)
 * - Parallel execution of all adapters for better performance
 * - Detailed evidence for detection results
 * - Stream support for large files
 * - Full backward compatibility with legacy detection
 *
 * API Migration: detectFormat now has two overloaded signatures:
 * 1. Legacy: detectFormat(unknown) -> string | null (synchronous)
 * 2. Enhanced: detectFormat(Buffer | ReadableStream) -> Promise<FormatDetectionResult> (asynchronous)
 */

import { UniversalTrackerRegistry } from '../src/index.js';
import { JsonAdapter } from '../src/adapters/JsonAdapter.js';
import { CsvAdapter } from '../src/adapters/CsvAdapter.js';
import { XmlAdapter } from '../src/adapters/XmlAdapter.js';

// Create registry with adapters
const registry = new UniversalTrackerRegistry({
  json: new JsonAdapter(),
  csv: new CsvAdapter(),
  xml: new XmlAdapter(),
});

async function demonstrateEnhancedDetection() {
  console.log('=== Enhanced Format Detection Demo ===\n');

  // Example 1: JSON data with emission properties
  console.log('1. JSON data with emission properties:');
  const jsonData = Buffer.from(
    JSON.stringify({
      timestamp: '2023-12-07T10:00:00Z',
      emissions: 0.5,
      duration: 3600,
      model: 'gpt-4',
      energy: 0.8,
    })
  );

  const jsonResult = await registry.detectFormat(jsonData);
  console.log('Best match:', jsonResult.bestMatch);
  console.log('All confidence scores:');
  jsonResult.confidenceScores.forEach(score => {
    console.log(
      `  ${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
    );
  });
  console.log();

  // Example 2: CSV data with emission headers
  console.log('2. CSV data with emission headers:');
  const csvData = Buffer.from(
    'timestamp,model,emissions,duration,energy\n2023-12-07T10:00:00Z,gpt-4,0.5,3600,0.8\n2023-12-07T11:00:00Z,gpt-3.5,0.3,1800,0.6'
  );

  const csvResult = await registry.detectFormat(csvData);
  console.log('Best match:', csvResult.bestMatch);
  console.log('All confidence scores:');
  csvResult.confidenceScores.forEach(score => {
    console.log(
      `  ${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
    );
  });
  console.log();

  // Example 3: XML data with emission elements
  console.log('3. XML data with emission elements:');
  const xmlData = Buffer.from(
    '<?xml version="1.0"?><emissions><timestamp>2023-12-07T10:00:00Z</timestamp><co2>0.5</co2><duration>3600</duration><model>gpt-4</model></emissions>'
  );

  const xmlResult = await registry.detectFormat(xmlData);
  console.log('Best match:', xmlResult.bestMatch);
  console.log('All confidence scores:');
  xmlResult.confidenceScores.forEach(score => {
    console.log(
      `  ${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
    );
  });
  console.log();

  // Example 4: Unknown format
  console.log('4. Unknown format:');
  const unknownData = Buffer.from(
    'This is not a known format: 12345 random data'
  );

  const unknownResult = await registry.detectFormat(unknownData);
  console.log('Best match:', unknownResult.bestMatch);
  console.log('All confidence scores:');
  unknownResult.confidenceScores.forEach(score => {
    console.log(
      `  ${score.adapterName}: ${score.score.toFixed(3)} - ${score.evidence}`
    );
  });
  console.log();

  // Example 5: Backward compatibility
  console.log('5. Backward compatibility (legacy detection):');
  console.log('JSON string:', registry.detectFormat('{"test": true}'));
  console.log('CSV string:', registry.detectFormat('name,value\ntest,123'));
  console.log(
    'XML string:',
    registry.detectFormat('<root><test>true</test></root>')
  );
  console.log('Unknown string:', registry.detectFormat('unknown format'));
}

// Run the demonstration
demonstrateEnhancedDetection().catch(console.error);
