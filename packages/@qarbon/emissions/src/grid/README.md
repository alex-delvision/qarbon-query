# Grid Intensity Manager

This module provides the `GridIntensityManager` class for fetching and managing carbon intensity data for electricity grids with intelligent caching and waterfall fallback strategies.

## Features

### ✅ Core Requirements Implemented

1. **Waterfall Fetching Strategy**: Real-time → Daily Average → Monthly Average → Annual Default
2. **Caching System**: TTL-based caching with different cache durations for different data sources
3. **Provider Support**: Placeholder support for ElectricityMap and WattTime APIs
4. **Cloud Provider Mapping**: Built-in mappings for AWS, Azure, and GCP datacenter regions
5. **PUE & REC Adjustments**: Automatic application of Power Usage Effectiveness and Renewable Energy Certificate adjustments
6. **Uncertainty Interface**: Returns `{ intensity, source, confidence }` for uncertainty calculations

### API Methods

#### `getIntensity(region: string, timestamp: Date): Promise<IntensityResponse>`
Fetches grid intensity for a specific region and timestamp using the waterfall strategy.

#### `getIntensityByDatacenter(datacenterCode: string, timestamp: Date): Promise<IntensityResponse>`
Fetches intensity by cloud provider datacenter code (e.g., 'us-east-1', 'westus2', 'us-central1').

#### `getSupportedDatacenters(): string[]`
Returns list of supported datacenter codes.

#### `clearCache(): void`
Clears the internal cache.

### Data Sources

1. **Real-time**: ElectricityMap / WattTime APIs (placeholder implementation)
2. **Daily Average**: Historical daily averages (placeholder implementation)
3. **Monthly Average**: Historical monthly averages (placeholder implementation)
4. **Annual Default**: Regional defaults with global fallback

### Cloud Provider Mappings

- **AWS**: us-east-1, us-west-2, eu-west-1, ap-southeast-1
- **Azure**: eastus, westus2, northeurope, southeastasia  
- **GCP**: us-central1, us-west1, europe-west1, asia-southeast1

### Regional Defaults (gCO2/kWh)

- Virginia: 396
- Oregon: 285
- Ireland: 316
- Singapore: 431
- Iowa: 462
- Belgium: 165
- California: 203
- Texas: 434
- Global Default: 475

### Example Usage

```typescript
import { GridIntensityManager } from '@qarbon/emissions';

const manager = new GridIntensityManager();

// Get intensity for a region
const result = await manager.getIntensity('virginia', new Date());
console.log(result);
// { intensity: 475, source: 'annual_default_adjusted', confidence: 0.5 }

// Get intensity by datacenter
const awsResult = await manager.getIntensityByDatacenter('us-east-1', new Date());
console.log(awsResult);
// { intensity: 475, source: 'annual_default_adjusted', confidence: 0.5 }
```

### Response Interface

```typescript
interface IntensityResponse {
  intensity: number;  // gCO2/kWh
  source: string;     // Data source identifier
  confidence: number; // Confidence level (0-1)
}
```

### Caching Strategy

- **Real-time data**: 5 minute TTL
- **Historical data**: 1 hour TTL
- **Cache key format**: `${region}-${date}`
- **Automatic cleanup**: Expired entries are removed on access

### Future Enhancements

1. **API Integration**: Implement actual HTTP clients for ElectricityMap and WattTime
2. **Historical Data**: Add database connections for historical averages
3. **Configuration**: Make regional defaults and datacenter mappings configurable
4. **Monitoring**: Add metrics and logging for cache hit rates and API performance
5. **Validation**: Add input validation and error handling
6. **Rate Limiting**: Implement rate limiting for external API calls
