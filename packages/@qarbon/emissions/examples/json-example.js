/**
 * JSON Processing Example
 *
 * This example demonstrates how to process JSON emissions data using
 * the JsonAdapter and EmissionsCalculator.
 */

const {
  JsonAdapter,
  EmissionsCalculator,
  adapterRegistry,
} = require('@qarbon/emissions');
const fs = require('fs');
const path = require('path');

async function processJsonData() {
  console.log('📋 JSON Emissions Processing Example');
  console.log('====================================\n');

  try {
    // Read sample JSON data
    const jsonFilePath = path.join(__dirname, 'sample-data.json');
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
    const jsonData = JSON.parse(jsonContent);

    console.log('📄 Loaded JSON data:');
    console.log(`   Measurements: ${jsonData.measurements.length}`);
    console.log(
      `   Time range: ${jsonData.summary.time_range.start} to ${jsonData.summary.time_range.end}`
    );
    console.log(
      `   Total emissions: ${jsonData.summary.total_emissions_kg} kg\n`
    );

    // Method 1: Manual adapter configuration for nested JSON
    console.log('🔧 Method 1: Nested JSON Processing');
    console.log('-----------------------------------');

    const jsonAdapter = new JsonAdapter({
      propertyMapping: {
        timestamp: 'timestamp',
        emissions: 'metrics.carbon.total_kg',
        energy: 'metrics.energy.consumption_kwh',
        power: 'metrics.energy.power_w',
        source: 'metadata.activity',
        device_id: 'metadata.device_id',
        location: 'metadata.location',
      },
      arrayPath: 'measurements', // Process the measurements array
      emissionsUnit: 'kg',
      energyUnit: 'kWh',
      powerUnit: 'W',
    });

    const jsonInputData = {
      data: jsonData,
      config: jsonAdapter.getMetadata(),
    };

    // Validate data
    const validation = jsonAdapter.validate(jsonInputData);
    console.log(
      '✅ Validation result:',
      validation.isValid ? 'PASSED' : 'FAILED'
    );
    if (validation.warnings) {
      console.log('⚠️  Warnings:', validation.warnings);
    }

    // Normalize data
    const normalizedData = await jsonAdapter.normalize(jsonInputData);
    console.log(
      '🔄 Normalized data:',
      JSON.stringify(normalizedData, null, 2).substring(0, 400) + '...\n'
    );

    // Method 2: Process individual measurement objects
    console.log('🔍 Method 2: Individual Measurement Processing');
    console.log('---------------------------------------------');

    const calculator = new EmissionsCalculator({
      enableOptimizations: true,
      enableUncertainty: true,
    });

    const calculationResults = [];

    for (let i = 0; i < jsonData.measurements.length; i++) {
      const measurement = jsonData.measurements[i];

      console.log(`📊 Processing measurement ${i + 1}:`);
      console.log(`   ID: ${measurement.id}`);
      console.log(`   Activity: ${measurement.metadata.activity}`);
      console.log(`   Device: ${measurement.metadata.device_id}`);

      // Create calculation input from measurement
      const energyInput = {
        type: 'energy',
        consumption: measurement.metrics.energy.consumption_kwh,
        source: 'grid',
      };

      try {
        const result = await calculator.calculate(energyInput, {
          region: measurement.metadata.location.includes('west')
            ? 'US-WEST-1'
            : 'US-EAST-1',
          includeUncertainty: true,
          uncertaintyOptions: {
            method: 'montecarlo',
            iterations: 1000,
            confidenceLevel: 95,
          },
        });

        calculationResults.push({
          measurement_id: measurement.id,
          timestamp: measurement.timestamp,
          activity: measurement.metadata.activity,
          device_id: measurement.metadata.device_id,
          original_emissions_kg: measurement.metrics.carbon.total_kg,
          calculated_emissions: result.data,
          processing_time_ms: result.processingTime,
        });

        console.log(
          `   Input: ${measurement.metrics.energy.consumption_kwh} kWh`
        );
        console.log(
          `   Original: ${measurement.metrics.carbon.total_kg} kg CO2`
        );
        console.log(
          `   Calculated: ${result.data.amount} ${result.data.unit} CO2`
        );
        if (result.data.uncertainty) {
          console.log(
            `   Uncertainty: ${result.data.uncertainty.low} - ${result.data.uncertainty.high} ${result.data.unit}`
          );
        }
        console.log(`   Processing: ${result.processingTime.toFixed(2)}ms\n`);
      } catch (error) {
        console.error(
          `❌ Error processing measurement ${measurement.id}:`,
          error.message
        );
      }
    }

    // Method 3: Auto-detection with flat JSON structure
    console.log('🤖 Method 3: Auto-detection with Flat JSON');
    console.log('------------------------------------------');

    // Create a flat JSON structure from the first measurement for demo
    const flatJsonData = {
      timestamp: jsonData.measurements[0].timestamp,
      co2_emissions: jsonData.measurements[0].metrics.carbon.total_kg * 1000, // Convert to grams
      energy_kwh: jsonData.measurements[0].metrics.energy.consumption_kwh,
      power_watts: jsonData.measurements[0].metrics.energy.power_w,
      source: jsonData.measurements[0].metadata.activity,
      device: jsonData.measurements[0].metadata.device_id,
    };

    console.log('📄 Flat JSON sample:', JSON.stringify(flatJsonData, null, 2));

    const flatAdapter = new JsonAdapter({
      propertyMapping: {
        timestamp: 'timestamp',
        emissions: 'co2_emissions',
        energy: 'energy_kwh',
        power: 'power_watts',
        source: 'source',
        device_id: 'device',
      },
      emissionsUnit: 'g', // Note: grams instead of kg
      energyUnit: 'kWh',
      powerUnit: 'W',
    });

    // Register and auto-detect
    adapterRegistry.registerAdapter(flatAdapter);

    const flatInputData = {
      data: flatJsonData,
      config: flatAdapter.getMetadata(),
    };

    const detectedAdapter = adapterRegistry.autoDetect(flatInputData);
    if (detectedAdapter) {
      console.log(
        `✨ Auto-detected adapter: ${detectedAdapter.getMetadata().name}`
      );
      const autoNormalized = await detectedAdapter.normalize(flatInputData);
      console.log('🔄 Auto-normalized flat data ready for calculation\n');
    }

    // Method 4: Batch processing of all measurements
    console.log('⚡ Method 4: Batch Processing');
    console.log('-----------------------------');

    const batchInputs = jsonData.measurements.map(measurement => ({
      type: 'energy',
      consumption: measurement.metrics.energy.consumption_kwh,
      source: 'grid',
    }));

    console.log(`🚀 Processing ${batchInputs.length} measurements in batch...`);

    const batchStartTime = performance.now();
    const batchResults = await calculator.calculate(batchInputs, {
      region: 'US-WEST-1',
      batchSize: 10,
      includeUncertainty: false, // Disable for faster batch processing
    });
    const batchEndTime = performance.now();

    console.log(
      `✅ Batch processing completed in ${(batchEndTime - batchStartTime).toFixed(2)}ms`
    );
    console.log(
      `   Average time per calculation: ${((batchEndTime - batchStartTime) / batchInputs.length).toFixed(2)}ms`
    );
    console.log(`   Results: ${batchResults.length} calculations\n`);

    // Generate comprehensive report
    console.log('📈 Comprehensive Report');
    console.log('----------------------');

    const allEmissions = calculationResults.map(r => r.calculated_emissions);
    const report = calculator.generateResult(allEmissions);

    console.log('📊 Summary:');
    console.log(`   Total Emissions: ${report.footprint.total} kg CO2`);
    console.log(`   Methodology: ${report.metadata.methodology}`);
    console.log(
      `   Confidence: ${(report.metadata.confidence * 100).toFixed(1)}%`
    );
    console.log(`   Calculated At: ${report.metadata.calculatedAt}`);

    // Compare with original data
    const originalTotal = jsonData.summary.total_emissions_kg;
    const calculatedTotal =
      allEmissions.reduce((sum, emission) => sum + emission.amount, 0) / 1000; // Convert g to kg
    const difference = Math.abs(originalTotal - calculatedTotal);
    const percentDiff = ((difference / originalTotal) * 100).toFixed(1);

    console.log('\n🔍 Comparison with Original Data:');
    console.log(`   Original Total: ${originalTotal} kg CO2`);
    console.log(`   Calculated Total: ${calculatedTotal.toFixed(3)} kg CO2`);
    console.log(`   Difference: ${difference.toFixed(3)} kg (${percentDiff}%)`);

    // Activity breakdown
    console.log('\n📋 Activity Breakdown:');
    const activityBreakdown = {};
    calculationResults.forEach(result => {
      const activity = result.activity;
      if (!activityBreakdown[activity]) {
        activityBreakdown[activity] = { count: 0, total_kg: 0 };
      }
      activityBreakdown[activity].count++;
      activityBreakdown[activity].total_kg +=
        result.calculated_emissions.amount / 1000; // Convert g to kg
    });

    Object.entries(activityBreakdown).forEach(([activity, data]) => {
      console.log(
        `   ${activity}: ${data.count} measurements, ${data.total_kg.toFixed(3)} kg CO2`
      );
    });

    console.log('\n✅ JSON processing complete!');
  } catch (error) {
    console.error('❌ Error processing JSON data:', error);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  processJsonData().catch(console.error);
}

module.exports = { processJsonData };
