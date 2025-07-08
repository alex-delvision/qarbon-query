# CSV Adapter

The `CsvAdapter` processes CSV (Comma-Separated Values) files containing emissions and energy data
with configurable column mapping.

## Features

- **Flexible column mapping**: Map CSV columns to standard emission data fields
- **Configurable delimiters**: Support for different CSV formats (comma, semicolon, tab, etc.)
- **Header detection**: Automatic header row detection and validation
- **Data validation**: Comprehensive validation of CSV structure and content
- **Unit conversion**: Support for different emission and energy units
- **Error handling**: Graceful handling of malformed or missing data

## Configuration

### Column Mapping

Map CSV columns to standard fields:

```typescript
const columnMapping = {
  timestamp: 'date', // Timestamp column
  emissions: 'co2_kg', // Emissions amount column
  energy: 'energy_kwh', // Energy consumption column
  power: 'power_w', // Power usage column
  duration: 'duration_h', // Duration column
  source: 'measurement_source', // Data source column
  device_id: 'device_id', // Device identifier column
  location: 'location', // Location/facility column
};
```

### Adapter Options

```typescript
const config = {
  columnMapping: columnMapping,
  delimiter: ',', // CSV delimiter (default: comma)
  hasHeader: true, // CSV has header row (default: true)
  emissionsUnit: 'kg', // Emissions unit (kg, g, tonnes)
  energyUnit: 'kWh', // Energy unit (kWh, Wh, MWh)
  powerUnit: 'W', // Power unit (W, kW, MW)
  durationUnit: 'hours', // Duration unit (hours, minutes, seconds)
  skipRows: 0, // Number of rows to skip (default: 0)
};
```

## Usage Examples

### Basic CSV Processing

```typescript
import { CsvAdapter } from '@qarbon/emissions';

const adapter = new CsvAdapter({
  columnMapping: {
    timestamp: 'date',
    emissions: 'co2_kg',
    energy: 'energy_kwh',
    source: 'measurement_source',
  },
});

const csvData = {
  headers: ['date', 'co2_kg', 'energy_kwh', 'measurement_source'],
  rows: [
    ['2023-07-15T10:30:00Z', '0.125', '0.25', 'ml_training'],
    ['2023-07-15T12:30:00Z', '0.089', '0.18', 'web_server'],
  ],
  config: adapter.getMetadata(),
};

// Validate CSV data
const validation = adapter.validate(csvData);
if (validation.isValid) {
  // Normalize data
  const normalized = await adapter.normalize(csvData);
  console.log('Normalized data:', normalized);
} else {
  console.error('Validation errors:', validation.errors);
}
```

### Advanced Configuration

```typescript
const advancedAdapter = new CsvAdapter({
  columnMapping: {
    timestamp: 'measurement_time',
    emissions: 'carbon_emissions_g',
    energy: 'power_consumption_w',
    device_id: 'sensor_id',
    location: 'facility_name',
  },
  delimiter: ';', // Semicolon-separated
  hasHeader: true,
  emissionsUnit: 'g', // Grams instead of kg
  energyUnit: 'W', // Watts instead of kWh
  skipRows: 2, // Skip first 2 rows (metadata)
});
```

### File Processing

```typescript
import fs from 'fs';

// Read CSV file
const csvContent = fs.readFileSync('emissions-data.csv', 'utf8');
const lines = csvContent.trim().split('\n');
const headers = lines[0].split(',');
const rows = lines.slice(1).map(line => line.split(','));

const csvData = {
  headers,
  rows,
  config: adapter.getMetadata(),
};

const normalized = await adapter.normalize(csvData);
```

## Input Format

### Standard CSV Format

```csv
date,co2_kg,energy_kwh,power_w,duration_h,source,location,device_id
2023-07-15T10:30:00Z,0.125,0.25,125,2,ml_training,datacenter_1,server_01
2023-07-15T12:30:00Z,0.089,0.18,90,2,web_server,datacenter_1,server_02
2023-07-15T14:30:00Z,0.156,0.31,155,2,data_processing,datacenter_2,server_03
```

### Alternative Format

```csv
timestamp;carbon_emissions;total_energy;average_power;device_id;facility
2023-07-15T10:30:00Z;125.5;250;125;server_01;aws_us_west_2
2023-07-15T12:30:00Z;89.2;180;90;server_02;aws_us_west_2
```

## Output Format

The adapter normalizes CSV data into a standard format:

```typescript
{
  type: 'energy',              // Inferred calculation type
  timestamp: '2023-07-15T10:30:00Z',
  emissions: 0.125,            // kg CO2
  energy: 0.25,                // kWh
  power: 125,                  // W
  duration: 2,                 // hours
  source: 'ml_training',
  device_id: 'server_01',
  location: 'datacenter_1',
  metadata: {
    originalRow: 0,
    adapter: 'CsvAdapter',
    version: '1.0.0'
  }
}
```

## Validation Rules

### Required Fields

- At least one of: `emissions` or `energy` mapping
- Valid CSV structure with consistent column counts

### Optional Fields

- `timestamp`: ISO 8601 format recommended
- `source`: String identifier for data source
- `device_id`: Unique device identifier
- `location`: Facility or region identifier

### Warnings

- Missing timestamp mapping
- Inconsistent row lengths
- Missing mapped columns in headers

## Error Handling

### Common Errors

- **Missing rows**: CSV data contains no rows
- **Invalid column mapping**: Mapped columns not found in headers
- **Inconsistent columns**: Rows have different column counts
- **Invalid configuration**: Missing required configuration options

### Error Response

```typescript
{
  isValid: false,
  errors: [
    'Missing or invalid rows array',
    'Column mapping configuration is required'
  ],
  warnings: [
    'No timestamp column mapping specified'
  ]
}
```

## Performance Considerations

### Optimization Tips

1. **Batch Processing**: Process multiple CSV files in batches
2. **Memory Management**: Use streaming for very large CSV files
3. **Column Validation**: Pre-validate column mappings to avoid runtime errors
4. **Data Types**: Use appropriate numeric types for calculations

### Limitations

- **Memory Usage**: Entire CSV is loaded into memory
- **File Size**: Recommended maximum ~100MB per file
- **Row Count**: Optimal performance with <100,000 rows per batch

## Integration with Calculator

```typescript
import { CsvAdapter, EmissionsCalculator } from '@qarbon/emissions';

const adapter = new CsvAdapter({
  columnMapping: {
    timestamp: 'date',
    energy: 'energy_kwh',
    source: 'source',
  },
});

const calculator = new EmissionsCalculator();

// Process CSV and calculate emissions
const csvData = {
  /* CSV data */
};
const normalized = await adapter.normalize(csvData);

// Convert to calculation input
const calculationInput = {
  type: 'energy',
  consumption: normalized.energy,
  source: 'grid',
};

const result = await calculator.calculate(calculationInput);
console.log(`Emissions: ${result.data.amount} ${result.data.unit} CO2`);
```

## See Also

- [JSON Adapter](./JsonAdapter.md) - For JSON data processing
- [Webhook Stream Adapter](./WebhookStreamAdapter.md) - For real-time streaming data
- [EmissionsCalculator](../calculator.ts) - Main calculation engine
