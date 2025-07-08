import type { EmissionData, EmissionResult } from '@qarbon/shared';
import { EmissionsCalculator } from '@qarbon/emissions';

export interface QarbonConfig {
  apiKey?: string;
  endpoint?: string;
  enableAnalytics?: boolean;
  debug?: boolean;
}

/**
 * Main QarbonQuery SDK client
 */
export class QarbonClient {
  private config: QarbonConfig;
  private calculator: EmissionsCalculator;

  constructor(config: QarbonConfig = {}) {
    this.config = {
      endpoint: 'https://api.qarbon.query',
      enableAnalytics: true,
      debug: false,
      ...config,
    };
    this.calculator = new EmissionsCalculator();
  }

  /**
   * Track digital emissions
   */
  async trackDigital(params: {
    dataTransfer: number;
    timeSpent: number;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
  }): Promise<EmissionData> {
    const emission = await this.calculator.calculateDigitalEmissions(
      params.dataTransfer,
      params.timeSpent,
      params.deviceType
    );

    if (this.config.enableAnalytics) {
      await this.sendToAnalytics(emission);
    }

    return emission;
  }

  /**
   * Track transport emissions
   */
  async trackTransport(params: {
    distance: number;
    mode?: 'car' | 'train' | 'plane' | 'bus';
  }): Promise<EmissionData> {
    const emission = await this.calculator.calculateTransportEmissions(
      params.distance,
      params.mode
    );

    if (this.config.enableAnalytics) {
      await this.sendToAnalytics(emission);
    }

    return emission;
  }

  /**
   * Track energy emissions
   */
  async trackEnergy(params: {
    consumption: number;
    source?: 'grid' | 'renewable' | 'fossil';
  }): Promise<EmissionData> {
    const emission = await this.calculator.calculateEnergyEmissions(
      params.consumption,
      params.source
    );

    if (this.config.enableAnalytics) {
      await this.sendToAnalytics(emission);
    }

    return emission;
  }

  /**
   * Generate comprehensive report
   */
  generateReport(emissions: EmissionData[]): EmissionResult {
    return this.calculator.generateResult(emissions);
  }

  /**
   * Send data to analytics (mock implementation)
   */
  private async sendToAnalytics(emission: EmissionData): Promise<void> {
    if (this.config.debug) {
      console.log('Sending to analytics:', emission);
    }
    // Mock API call
    return Promise.resolve();
  }
}

/**
 * Create a new QarbonClient instance
 */
export function createClient(config?: QarbonConfig): QarbonClient {
  return new QarbonClient(config);
}
