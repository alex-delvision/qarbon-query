/**
 * Grid intensity data provider type
 */
export enum IntensityProvider {
  ElectricityMap = 'electricitymap',
  WattTime = 'watttime',
  DailyAverage = 'daily_average',
  MonthlyAverage = 'monthly_average',
  AnnualDefault = 'annual_default',
}

/**
 * Intensity response interface
 */
export interface IntensityResponse {
  intensity: number; // gCO2/kWh
  source: string;
  confidence: number; // 0-1 scale
}

/**
 * Cache entry with TTL
 */
interface CacheEntry {
  data: IntensityResponse;
  timestamp: number;
  ttl: number; // in milliseconds
}

/**
 * Cloud provider datacenter mapping
 */
interface DatacenterMapping {
  [key: string]: {
    region: string;
    pue: number;
    renewablePercentage: number;
  };
}

/**
 * Grid intensity manager with waterfall fetching and caching
 */
export class GridIntensityManager {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly defaultCacheTtl = 3600000; // 1 hour
  private readonly realtimeCacheTtl = 300000; // 5 minutes

  // Cloud provider datacenter mappings
  private readonly datacenterMappings: DatacenterMapping = {
    // AWS regions
    'us-east-1': { region: 'virginia', pue: 1.2, renewablePercentage: 0.65 },
    'us-west-2': { region: 'oregon', pue: 1.15, renewablePercentage: 0.85 },
    'eu-west-1': { region: 'ireland', pue: 1.1, renewablePercentage: 0.7 },
    'ap-southeast-1': {
      region: 'singapore',
      pue: 1.3,
      renewablePercentage: 0.4,
    },

    // Azure regions
    eastus: { region: 'virginia', pue: 1.2, renewablePercentage: 0.65 },
    westus2: { region: 'washington', pue: 1.15, renewablePercentage: 0.9 },
    northeurope: { region: 'ireland', pue: 1.1, renewablePercentage: 0.7 },
    southeastasia: { region: 'singapore', pue: 1.3, renewablePercentage: 0.4 },

    // GCP regions
    'us-central1': { region: 'iowa', pue: 1.1, renewablePercentage: 0.8 },
    'us-west1': { region: 'oregon', pue: 1.15, renewablePercentage: 0.85 },
    'europe-west1': { region: 'belgium', pue: 1.1, renewablePercentage: 0.75 },
    'asia-southeast1': {
      region: 'singapore',
      pue: 1.3,
      renewablePercentage: 0.4,
    },
  };

  // Regional default intensities (gCO2/kWh)
  private readonly regionalDefaults: Record<string, number> = {
    virginia: 396,
    oregon: 285,
    washington: 285,
    ireland: 316,
    singapore: 431,
    iowa: 462,
    belgium: 165,
    california: 203,
    texas: 434,
    default: 475, // Global average
  };

  /**
   * Get grid intensity for a region and timestamp with waterfall approach
   */
  public async getIntensity(
    region: string,
    timestamp: Date
  ): Promise<IntensityResponse> {
    const cacheKey = `${region}-${timestamp.toISOString().split('T')[0]}`;
    const cached = this.getCachedEntry(cacheKey);
    if (cached) {
      return cached;
    }

    // Try waterfall approach: real-time → daily avg → monthly → annual default
    let result = await this.fetchRealTimeIntensity(region, timestamp);
    if (!result) {
      result = await this.fetchDailyAverageIntensity(region, timestamp);
    }
    if (!result) {
      result = await this.fetchMonthlyAverageIntensity(region, timestamp);
    }
    if (!result) {
      result = this.fetchAnnualDefaultIntensity(region);
    }

    // Apply PUE and REC adjustments
    result = this.applyAdjustments(result, region);

    // Cache the result
    const ttl = result.source.includes('real-time')
      ? this.realtimeCacheTtl
      : this.defaultCacheTtl;
    this.setCacheEntry(cacheKey, result, ttl);

    return result;
  }

  /**
   * Get intensity by cloud provider datacenter code
   */
  public async getIntensityByDatacenter(
    datacenterCode: string,
    timestamp: Date
  ): Promise<IntensityResponse> {
    const mapping = this.datacenterMappings[datacenterCode];
    if (!mapping) {
      throw new Error(`Unknown datacenter code: ${datacenterCode}`);
    }

    return this.getIntensity(mapping.region, timestamp);
  }

  /**
   * Fetch real-time intensity from ElectricityMap or WattTime
   */
  private async fetchRealTimeIntensity(
    region: string,
    timestamp: Date
  ): Promise<IntensityResponse | null> {
    try {
      // Try ElectricityMap first
      const electricityMapResult = await this.fetchFromElectricityMap(
        region,
        timestamp
      );
      if (electricityMapResult) {
        return electricityMapResult;
      }

      // Fallback to WattTime
      const wattTimeResult = await this.fetchFromWattTime(region, timestamp);
      if (wattTimeResult) {
        return wattTimeResult;
      }
    } catch (error) {
      console.warn(`Failed to fetch real-time intensity for ${region}:`, error);
    }

    return null;
  }

  /**
   * Fetch from ElectricityMap API (placeholder)
   */
  private async fetchFromElectricityMap(
    _region: string,
    _timestamp: Date
  ): Promise<IntensityResponse | null> {
    // Placeholder for ElectricityMap API integration
    // In real implementation, this would make HTTP requests to ElectricityMap API
    return null;
  }

  /**
   * Fetch from WattTime API (placeholder)
   */
  private async fetchFromWattTime(
    _region: string,
    _timestamp: Date
  ): Promise<IntensityResponse | null> {
    // Placeholder for WattTime API integration
    // In real implementation, this would make HTTP requests to WattTime API
    return null;
  }

  /**
   * Fetch daily average intensity
   */
  private async fetchDailyAverageIntensity(
    _region: string,
    _timestamp: Date
  ): Promise<IntensityResponse | null> {
    // Placeholder for daily average data
    // In real implementation, this would query historical data sources
    return null;
  }

  /**
   * Fetch monthly average intensity
   */
  private async fetchMonthlyAverageIntensity(
    _region: string,
    _timestamp: Date
  ): Promise<IntensityResponse | null> {
    // Placeholder for monthly average data
    // In real implementation, this would query historical data sources
    return null;
  }

  /**
   * Fetch annual default intensity
   */
  private fetchAnnualDefaultIntensity(region: string): IntensityResponse {
    const intensity =
      this.regionalDefaults[region] || this.regionalDefaults['default'];
    return {
      intensity: intensity!,
      source: 'annual_default',
      confidence: 0.5,
    };
  }

  /**
   * Apply PUE and REC adjustments
   */
  private applyAdjustments(
    response: IntensityResponse,
    region: string
  ): IntensityResponse {
    const datacenterInfo = Object.values(this.datacenterMappings).find(
      dc => dc.region === region
    );

    let adjustedIntensity = response.intensity;

    if (datacenterInfo) {
      // Apply PUE (Power Usage Effectiveness)
      adjustedIntensity *= datacenterInfo.pue;

      // Apply REC (Renewable Energy Certificates) adjustment
      const renewableAdjustment = 1 - datacenterInfo.renewablePercentage;
      adjustedIntensity *= renewableAdjustment;
    } else {
      // Default adjustments
      const defaultPUE = 1.2;
      const defaultREC = 0.9;
      adjustedIntensity *= defaultPUE * defaultREC;
    }

    return {
      ...response,
      intensity: Math.round(adjustedIntensity),
      source: `${response.source}_adjusted`,
    };
  }

  /**
   * Get cached entry if valid
   */
  private getCachedEntry(key: string): IntensityResponse | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < entry.ttl) {
      return entry.data;
    }
    if (entry) {
      this.cache.delete(key); // Remove expired entry
    }
    return null;
  }

  /**
   * Set cache entry with TTL
   */
  private setCacheEntry(
    key: string,
    data: IntensityResponse,
    ttl: number
  ): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get supported datacenter codes
   */
  public getSupportedDatacenters(): string[] {
    return Object.keys(this.datacenterMappings);
  }
}
