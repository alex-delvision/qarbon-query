/**
 * CSV Processing Example
 * 
 * This example demonstrates how to process CSV emissions data using
 * the CsvAdapter and EmissionsCalculator.
 */

const { CsvAdapter, EmissionsCalculator, adapterRegistry } = require('@qarbon/emissions');
const fs = require('fs');
const path = require('path');

async function processCsvData() {
  console.log('🧮 CSV Emissions Processing Example');
  console.log('===================================\n');

  try {
    // Read sample CSV data
    const csvFilePath = path.join(__dirname, 'sample-data.csv');
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    
    // Parse CSV content
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const rows = lines.slice(1).map(line => line.split(','));
    
    console.log('📄 Loaded CSV data:');
    console.log(`   Headers: ${headers.join(', ')}`);
    console.log(`   Rows: ${rows.length}\n`);

    // Method 1: Manual adapter configuration
    console.log('🔧 Method 1: Manual Adapter Configuration');
    console.log('------------------------------------------');
    
    const csvAdapter = new CsvAdapter({
      columnMapping: {
        timestamp: 'date',
        emissions: 'co2_kg',
        energy: 'energy_kwh',
        power: 'power_w',
        duration: 'duration_h',
        source: 'source',
        device_id: 'device_id',
        location: 'location'
      },
      delimiter: ',',
      hasHeader: true,
      emissionsUnit: 'kg',
      energyUnit: 'kWh',
      powerUnit: 'W'
    });

    const csvData = {
      headers,
      rows,
      config: csvAdapter.getMetadata()
    };

    // Validate data
    const validation = csvAdapter.validate(csvData);
    console.log('✅ Validation result:', validation.isValid ? 'PASSED' : 'FAILED');
    if (validation.warnings) {
      console.log('⚠️  Warnings:', validation.warnings);
    }

    // Normalize data
    const normalizedData = await csvAdapter.normalize(csvData);
    console.log('🔄 Normalized data sample:', JSON.stringify(normalizedData, null, 2).substring(0, 300) + '...\n');

    // Method 2: Auto-detection
    console.log('🤖 Method 2: Auto-detection');
    console.log('---------------------------');
    
    // Register the adapter first
    adapterRegistry.registerAdapter(csvAdapter);
    
    // Auto-detect adapter
    const detectedAdapter = adapterRegistry.autoDetect(csvData);
    if (detectedAdapter) {
      console.log(`✨ Auto-detected adapter: ${detectedAdapter.getMetadata().name}`);
      const autoNormalized = await detectedAdapter.normalize(csvData);
      console.log('🔄 Auto-normalized data ready for calculation\n');
    } else {
      console.log('❌ No suitable adapter detected\n');
    }

    // Calculate emissions using the calculator
    console.log('🧮 Emissions Calculation');
    console.log('------------------------');
    
    const calculator = new EmissionsCalculator({
      enableOptimizations: true,
      enableUncertainty: true
    });

    // Process first few rows as examples
    const sampleRows = rows.slice(0, 3);
    const calculationResults = [];

    for (let i = 0; i < sampleRows.length; i++) {
      const row = sampleRows[i];
      const [timestamp, co2_kg, energy_kwh, power_w, duration_h, source, location, device_id] = row;
      
      // Create calculation input from CSV row
      const calculationInput = {
        type: 'energy',
        consumption: parseFloat(energy_kwh),
        source: 'grid'
      };

      try {
        const result = await calculator.calculate(calculationInput, {
          region: location.includes('datacenter_1') ? 'US-WEST-1' : 'US-EAST-1',
          includeUncertainty: true,
          uncertaintyOptions: {
            method: 'montecarlo',
            iterations: 1000,
            confidenceLevel: 95
          }
        });

        calculationResults.push({
          row: i + 1,
          timestamp,
          source,
          device_id,
          input_energy_kwh: energy_kwh,
          calculated_emissions: result.data,
          processing_time_ms: result.processingTime
        });

        console.log(`📊 Row ${i + 1} (${source}):`);
        console.log(`   Input: ${energy_kwh} kWh`);
        console.log(`   Calculated: ${result.data.amount} ${result.data.unit} CO2`);
        if (result.data.uncertainty) {
          console.log(`   Uncertainty: ${result.data.uncertainty.low} - ${result.data.uncertainty.high} ${result.data.unit}`);
        }
        console.log(`   Processing: ${result.processingTime.toFixed(2)}ms\n`);

      } catch (error) {
        console.error(`❌ Error processing row ${i + 1}:`, error.message);
      }
    }

    // Generate final report
    console.log('📈 Final Report');
    console.log('---------------');
    
    const emissions = calculationResults.map(r => r.calculated_emissions);
    const report = calculator.generateResult(emissions);
    
    console.log('📊 Summary:');
    console.log(`   Total Emissions: ${report.footprint.total} kg CO2`);
    console.log(`   Methodology: ${report.metadata.methodology}`);
    console.log(`   Confidence: ${(report.metadata.confidence * 100).toFixed(1)}%`);
    console.log(`   Calculated At: ${report.metadata.calculatedAt}`);
    
    if (report.footprint.breakdown) {
      console.log('   Breakdown by category:');
      Object.entries(report.footprint.breakdown).forEach(([category, amount]) => {
        console.log(`     ${category}: ${amount} kg CO2`);
      });
    }

    console.log('\n✅ CSV processing complete!');

  } catch (error) {
    console.error('❌ Error processing CSV data:', error);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  processCsvData().catch(console.error);
}

module.exports = { processCsvData };
