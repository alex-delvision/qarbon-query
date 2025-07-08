/**
 * Webhook Streaming Example
 *
 * This example demonstrates how to handle streaming emissions data
 * from webhooks using the WebhookStreamAdapter.
 */

const {
  WebhookStreamAdapter,
  EmissionsCalculator,
  adapterRegistry,
} = require('@qarbon/emissions');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Sample NDJSON stream data
const sampleNDJSONData = [
  '{"ts":"2023-07-15T10:30:00Z","co2_kg":0.125,"energy_kwh":0.25,"device_id":"sensor_01","location":"datacenter_west"}',
  '{"ts":"2023-07-15T10:31:00Z","co2_kg":0.130,"energy_kwh":0.26,"device_id":"sensor_01","location":"datacenter_west"}',
  '{"ts":"2023-07-15T10:32:00Z","co2_kg":0.128,"energy_kwh":0.24,"device_id":"sensor_02","location":"datacenter_east"}',
  '{"ts":"2023-07-15T10:33:00Z","co2_kg":0.142,"energy_kwh":0.28,"device_id":"sensor_03","location":"datacenter_west"}',
  '{"ts":"2023-07-15T10:34:00Z","co2_kg":0.135,"energy_kwh":0.27,"device_id":"sensor_02","location":"datacenter_east"}',
].join('\n');

// Sample SSE data
const sampleSSEData = [
  'event: emission_data',
  'data: {"timestamp":"2023-07-15T10:30:00Z","emissions":125.5,"energy":250,"source":"ml_cluster"}',
  '',
  'event: emission_data',
  'data: {"timestamp":"2023-07-15T10:31:00Z","emissions":130.2,"energy":260,"source":"ml_cluster"}',
  '',
  'event: emission_data',
  'data: {"timestamp":"2023-07-15T10:32:00Z","emissions":128.8,"energy":240,"source":"web_cluster"}',
  '',
].join('\n');

async function demonstrateWebhookStreaming() {
  console.log('🌊 Webhook Streaming Example');
  console.log('============================\n');

  const calculator = new EmissionsCalculator({
    enableOptimizations: true,
    enableUncertainty: false, // Disable for real-time processing
  });

  // Example 1: NDJSON Stream Processing
  console.log('📡 Example 1: NDJSON Stream Processing');
  console.log('-------------------------------------');

  try {
    const ndjsonAdapter = new WebhookStreamAdapter({
      format: 'ndjson',
      fieldMapping: {
        timestamp: 'ts',
        emissions: 'co2_kg',
        energy: 'energy_kwh',
        source: 'device_id',
        location: 'location',
      },
      emissionsUnit: 'kg',
      energyUnit: 'kWh',
      batchSize: 50,
      aggregationWindow: 60,
    });

    const ndjsonStreamData = {
      webhook_id: 'webhook_001',
      timestamp: '2023-07-15T10:30:00Z',
      format: 'ndjson',
      data: sampleNDJSONData,
      source: {
        url: 'https://api.example.com/emissions/stream',
        method: 'POST',
        headers: { 'content-type': 'application/x-ndjson' },
      },
      config: ndjsonAdapter.getMetadata(),
    };

    // Validate webhook data
    const ndjsonValidation = ndjsonAdapter.validate(ndjsonStreamData);
    console.log(
      '✅ NDJSON validation:',
      ndjsonValidation.isValid ? 'PASSED' : 'FAILED'
    );
    if (ndjsonValidation.warnings) {
      console.log('⚠️  Warnings:', ndjsonValidation.warnings);
    }

    // Normalize and process
    const ndjsonNormalized = await ndjsonAdapter.normalize(ndjsonStreamData);
    console.log(
      '🔄 NDJSON normalized entries:',
      Object.keys(ndjsonNormalized).length || 'single entry'
    );
    console.log(
      '📄 Sample normalized data:',
      JSON.stringify(ndjsonNormalized, null, 2).substring(0, 300) + '...\n'
    );

    // Process with calculator
    const ndjsonResults = [];
    if (Array.isArray(ndjsonNormalized.entries)) {
      for (const entry of ndjsonNormalized.entries.slice(0, 3)) {
        // Process first 3 for demo
        const result = await calculator.calculate(
          {
            type: 'energy',
            consumption: entry.energy || 0.25,
            source: 'grid',
          },
          {
            region:
              entry.location && entry.location.includes('west')
                ? 'US-WEST-1'
                : 'US-EAST-1',
          }
        );
        ndjsonResults.push(result);

        console.log(
          `📊 Processed entry: ${entry.energy} kWh → ${result.data.amount} ${result.data.unit} CO2`
        );
      }
    }

    console.log(
      `✅ NDJSON processing complete: ${ndjsonResults.length} entries processed\n`
    );
  } catch (error) {
    console.error('❌ NDJSON processing error:', error.message);
  }

  // Example 2: SSE Stream Processing
  console.log('📺 Example 2: SSE Stream Processing');
  console.log('----------------------------------');

  try {
    const sseAdapter = new WebhookStreamAdapter({
      format: 'sse',
      fieldMapping: {
        timestamp: 'timestamp',
        emissions: 'emissions',
        energy: 'energy',
        source: 'source',
      },
      emissionsUnit: 'g', // Note: grams in this example
      energyUnit: 'W',
      batchSize: 25,
      aggregationWindow: 30,
    });

    const sseStreamData = {
      webhook_id: 'webhook_002',
      timestamp: '2023-07-15T10:30:00Z',
      format: 'sse',
      data: sampleSSEData,
      source: {
        url: 'https://events.example.com/emissions',
        method: 'GET',
        headers: { accept: 'text/event-stream' },
      },
      config: sseAdapter.getMetadata(),
    };

    // Validate SSE data
    const sseValidation = sseAdapter.validate(sseStreamData);
    console.log(
      '✅ SSE validation:',
      sseValidation.isValid ? 'PASSED' : 'FAILED'
    );

    // Normalize and process
    const sseNormalized = await sseAdapter.normalize(sseStreamData);
    console.log(
      '🔄 SSE normalized events:',
      Object.keys(sseNormalized).length || 'single event'
    );
    console.log(
      '📄 Sample SSE data:',
      JSON.stringify(sseNormalized, null, 2).substring(0, 300) + '...\n'
    );
  } catch (error) {
    console.error('❌ SSE processing error:', error.message);
  }

  // Example 3: Real-time simulation
  console.log('⚡ Example 3: Real-time Processing Simulation');
  console.log('--------------------------------------------');

  await simulateRealTimeProcessing(calculator);

  // Example 4: Webhook server setup (mock)
  console.log('🖥️  Example 4: Mock Webhook Server Setup');
  console.log('----------------------------------------');

  setupMockWebhookServer();
}

async function simulateRealTimeProcessing(calculator) {
  console.log('🎬 Simulating real-time emissions data stream...\n');

  const streamAdapter = new WebhookStreamAdapter({
    format: 'ndjson',
    fieldMapping: {
      timestamp: 'timestamp',
      emissions: 'co2_g',
      energy: 'energy_w',
      source: 'device',
    },
    emissionsUnit: 'g',
    energyUnit: 'W',
    batchSize: 10,
  });

  // Simulate real-time data points
  const realtimeData = [];
  const startTime = Date.now();

  for (let i = 0; i < 5; i++) {
    const timestamp = new Date(startTime + i * 1000).toISOString();
    const dataPoint = {
      timestamp,
      co2_g: Math.random() * 200 + 50, // 50-250g
      energy_w: Math.random() * 300 + 100, // 100-400W
      device: `sensor_${String((i % 3) + 1).padStart(2, '0')}`,
    };
    realtimeData.push(JSON.stringify(dataPoint));
  }

  const streamData = {
    webhook_id: 'realtime_stream',
    timestamp: new Date().toISOString(),
    format: 'ndjson',
    data: realtimeData.join('\n'),
    config: streamAdapter.getMetadata(),
  };

  try {
    console.log('📊 Processing real-time data points...');
    const normalized = await streamAdapter.normalize(streamData);

    // Process in batches for efficiency
    if (normalized.entries) {
      const batchInputs = normalized.entries.map(entry => ({
        type: 'energy',
        consumption: (entry.energy || 200) / 1000, // Convert W to kWh (assuming 1 hour)
        source: 'grid',
      }));

      const batchResults = await calculator.calculate(batchInputs, {
        region: 'US-WEST-1',
        batchSize: 5,
      });

      console.log(
        `✅ Real-time batch processed: ${batchResults.length} data points`
      );

      batchResults.forEach((result, index) => {
        const originalData = JSON.parse(realtimeData[index]);
        console.log(
          `   ${originalData.device}: ${originalData.energy_w}W → ${result.data.amount} ${result.data.unit} CO2`
        );
      });

      // Calculate throughput
      const processingTime = Date.now() - startTime;
      const throughput = (
        (batchResults.length / processingTime) *
        1000
      ).toFixed(1);
      console.log(`\n📈 Throughput: ${throughput} calculations/second`);
    }
  } catch (error) {
    console.error('❌ Real-time processing error:', error.message);
  }

  console.log('');
}

function setupMockWebhookServer() {
  console.log('🔧 Setting up mock webhook server...\n');

  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/emissions/webhook') {
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          console.log(
            '📨 Received webhook data:',
            body.substring(0, 100) + '...'
          );

          // Parse webhook payload
          const webhookData = JSON.parse(body);

          // Process with appropriate adapter
          const adapter = new WebhookStreamAdapter({
            format: webhookData.format || 'ndjson',
            fieldMapping: {
              timestamp: 'timestamp',
              emissions: 'co2_kg',
              energy: 'energy_kwh',
            },
          });

          if (adapter.validate(webhookData).isValid) {
            const normalized = await adapter.normalize(webhookData);
            console.log('✅ Webhook data processed successfully');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                status: 'success',
                processed: true,
                entries: Array.isArray(normalized.entries)
                  ? normalized.entries.length
                  : 1,
              })
            );
          } else {
            throw new Error('Webhook data validation failed');
          }
        } catch (error) {
          console.error('❌ Webhook processing error:', error.message);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', message: error.message }));
        }
      });
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  // Start server on a random port for demo
  const port = 3000 + Math.floor(Math.random() * 1000);
  server.listen(port, () => {
    console.log(`🚀 Mock webhook server listening on http://localhost:${port}`);
    console.log(`   Endpoint: POST /emissions/webhook`);
    console.log(`   Expected format: JSON with webhook data structure\n`);

    // Example curl command
    console.log('📝 Example webhook call:');
    console.log(`curl -X POST http://localhost:${port}/emissions/webhook \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(
      `  -d '{"webhook_id":"test","timestamp":"${new Date().toISOString()}","format":"ndjson","data":"{\\"timestamp\\":\\"${new Date().toISOString()}\\",\\"co2_kg\\":0.125,\\"energy_kwh\\":0.25}"}'`
    );

    // Auto-close server after demo
    setTimeout(() => {
      server.close();
      console.log('\n🔌 Mock server closed');
    }, 5000);
  });
}

// Utility function to create webhook payload
function createWebhookPayload(format, data) {
  return {
    webhook_id: `webhook_${Date.now()}`,
    timestamp: new Date().toISOString(),
    format,
    data: typeof data === 'string' ? data : JSON.stringify(data),
    source: {
      url: 'https://api.example.com/emissions',
      method: 'POST',
      headers: {
        'content-type':
          format === 'ndjson' ? 'application/x-ndjson' : 'application/json',
      },
    },
  };
}

// Example of processing webhook with auto-detection
async function processWebhookWithAutoDetection(webhookPayload) {
  console.log('🤖 Auto-detecting webhook format...');

  // Register common webhook adapters
  const ndjsonAdapter = new WebhookStreamAdapter({ format: 'ndjson' });
  const sseAdapter = new WebhookStreamAdapter({ format: 'sse' });

  adapterRegistry.registerAdapter(ndjsonAdapter);
  adapterRegistry.registerAdapter(sseAdapter);

  const detectedAdapter = adapterRegistry.autoDetect(webhookPayload);
  if (detectedAdapter) {
    console.log(`✨ Detected adapter: ${detectedAdapter.getMetadata().name}`);
    return await detectedAdapter.normalize(webhookPayload);
  } else {
    throw new Error('No suitable adapter found for webhook data');
  }
}

// Run the example
if (require.main === module) {
  demonstrateWebhookStreaming().catch(console.error);
}

module.exports = {
  demonstrateWebhookStreaming,
  createWebhookPayload,
  processWebhookWithAutoDetection,
};
