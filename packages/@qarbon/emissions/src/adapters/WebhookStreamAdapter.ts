/**
 * Webhook Stream Adapter
 * 
 * Handles streaming data from webhooks in NDJSON (Newline Delimited JSON) and 
 * SSE (Server-Sent Events) formats for real-time emissions monitoring.
 * 
 * @example
 * ```typescript
 * import { WebhookStreamAdapter } from './WebhookStreamAdapter';
 * 
 * const adapter = new WebhookStreamAdapter({
 *   format: 'ndjson',
 *   fieldMapping: {
 *     timestamp: 'ts',
 *     emissions: 'co2_kg',
 *     source: 'device_id'
 *   }
 * });
 * 
 * const result = adapter.normalize(streamData);
 * ```
 * 
 * @example NDJSON format:
 * ```
 * {"ts":"2023-07-15T10:30:00Z","co2_kg":0.125,"energy_kwh":0.25,"device_id":"sensor_01"}
 * {"ts":"2023-07-15T10:31:00Z","co2_kg":0.130,"energy_kwh":0.26,"device_id":"sensor_01"}
 * {"ts":"2023-07-15T10:32:00Z","co2_kg":0.128,"energy_kwh":0.24,"device_id":"sensor_02"}
 * ```
 * 
 * @example SSE format:
 * ```
 * event: emission_data
 * data: {"timestamp":"2023-07-15T10:30:00Z","emissions":125.5,"energy":250,"source":"ml_cluster"}
 * 
 * event: emission_data  
 * data: {"timestamp":"2023-07-15T10:31:00Z","emissions":130.2,"energy":260,"source":"ml_cluster"}
 * ```
 * 
 * @example Webhook payload format:
 * ```json
 * {
 *   "webhook_id": "webhook_001",
 *   "timestamp": "2023-07-15T10:30:00Z",
 *   "format": "ndjson",
 *   "data": "line1\nline2\nline3",
 *   "source": {
 *     "url": "https://api.example.com/emissions/stream",
 *     "method": "POST",
 *     "headers": {
 *       "content-type": "application/x-ndjson"
 *     }
 *   }
 * }
 * ```
 */

import { BaseAdapter, ValidationResult, NormalizedData, AdapterMetadata, DetectionHeuristic } from './index';
import { adapterRegistry } from './index';

export type StreamFormat = 'ndjson' | 'sse' | 'json_array';

export interface WebhookStreamConfig {
  format: StreamFormat;
  fieldMapping?: {
    timestamp?: string;
    emissions?: string;
    energy?: string;
    power?: string;
    source?: string;
    device_id?: string;
    [key: string]: string | undefined;
  };
  emissionsUnit?: string;
  energyUnit?: string;
  powerUnit?: string;
  batchSize?: number;
  aggregationWindow?: number; // seconds
}

export interface WebhookStreamData {
  webhook_id?: string;
  timestamp: string;
  format: StreamFormat;
  data: string;
  source?: {
    url?: string;
    method?: string;
    headers?: { [key: string]: string };
  };
  config: WebhookStreamConfig;
}

export class WebhookStreamAdapter extends BaseAdapter<WebhookStreamData> {
  private config: WebhookStreamConfig;

  constructor(config?: WebhookStreamConfig) {
    super({
      name: 'WebhookStreamAdapter',
      version: '1.0.0',
      description: 'Adapter for webhook streaming data in NDJSON and SSE formats',
      supportedFormats: ['ndjson', 'sse', 'webhook'],
      confidence: 0.80
    });
    
    this.config = {
      format: 'ndjson',
      emissionsUnit: 'kg',
      energyUnit: 'kWh',
      powerUnit: 'W',
      batchSize: 100,
      aggregationWindow: 60,
      fieldMapping: {},
      ...config
    };
  }

  validate(input: WebhookStreamData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!input.timestamp) {
      errors.push('Missing required field: timestamp');
    }
    if (!input.format) {
      errors.push('Missing required field: format');
    }
    if (!input.data) {
      errors.push('Missing required field: data');
    }

    // Validate timestamp format
    if (input.timestamp && !this.isValidTimestamp(input.timestamp)) {
      errors.push('Invalid timestamp format');
    }

    // Validate format
    const validFormats: StreamFormat[] = ['ndjson', 'sse', 'json_array'];
    if (input.format && !validFormats.includes(input.format)) {
      errors.push(`Invalid format: ${input.format}. Must be one of: ${validFormats.join(', ')}`);
    }

    // Validate configuration
    const config = { ...this.config, ...input.config };
    if (config.batchSize && config.batchSize <= 0) {
      warnings.push('Batch size should be greater than 0');
    }
    if (config.aggregationWindow && config.aggregationWindow <= 0) {
      warnings.push('Aggregation window should be greater than 0');
    }

    // Test parse data based on format
    try {
      const parsedData = this.parseStreamData(input.data, input.format);
      if (parsedData.length === 0) {
        warnings.push('No valid data entries found');
      }
    } catch (error) {
      errors.push(`Failed to parse ${input.format} data: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  normalize(input: WebhookStreamData): NormalizedData {
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw new Error(`Invalid webhook stream data: ${validation.errors?.join(', ')}`);
    }

    const config = { ...this.config, ...input.config };
    
    // Parse stream data
    const parsedEntries = this.parseStreamData(input.data, input.format);
    
    if (parsedEntries.length === 0) {
      throw new Error('No valid entries found in stream data');
    }

    // Process entries
    const normalizedEntries = parsedEntries.map((entry, index) => 
      this.normalizeEntry(entry, config, index)
    );

    // Return single entry or aggregated data
    if (normalizedEntries.length === 1) {
      return this.addWebhookMetadata(normalizedEntries[0], input);
    }

    return this.aggregateEntries(normalizedEntries, input, config);
  }

  private parseStreamData(data: string, format: StreamFormat): any[] {
    const entries: any[] = [];

    switch (format) {
      case 'ndjson':
        return this.parseNDJSON(data);
      
      case 'sse':
        return this.parseSSE(data);
      
      case 'json_array':
        return this.parseJSONArray(data);
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private parseNDJSON(data: string): any[] {
    const entries: any[] = [];
    const lines = data.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        entries.push(parsed);
      } catch (error) {
        console.warn(`Failed to parse NDJSON line: ${line}`, error);
      }
    }
    
    return entries;
  }

  private parseSSE(data: string): any[] {
    const entries: any[] = [];
    const events = data.split('\n\n').filter(event => event.trim());
    
    for (const event of events) {
      try {
        const lines = event.split('\n');
        let eventType = '';
        let eventData = '';
        
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            eventData = line.substring(5).trim();
          }
        }
        
        if (eventData) {
          const parsed = JSON.parse(eventData);
          parsed._sse_event = eventType;
          entries.push(parsed);
        }
      } catch (error) {
        console.warn(`Failed to parse SSE event: ${event}`, error);
      }
    }
    
    return entries;
  }

  private parseJSONArray(data: string): any[] {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      throw new Error(`Invalid JSON array: ${error}`);
    }
  }

  private normalizeEntry(entry: any, config: WebhookStreamConfig, index: number): NormalizedData {
    // Extract mapped values
    const getValue = (field: string): any => {
      const mappedField = config.fieldMapping?.[field] || field;
      return entry[mappedField];
    };

    const timestampValue = getValue('timestamp') || new Date().toISOString();
    const emissionsValue = this.parseNumber(getValue('emissions'));
    const energyValue = this.parseNumber(getValue('energy'));
    const powerValue = this.parseNumber(getValue('power'));
    const sourceValue = getValue('source') || getValue('device_id') || 'webhook_stream';

    // Convert timestamp
    const timestamp = this.parseTimestamp(timestampValue);
    if (!timestamp) {
      throw new Error(`Invalid timestamp in entry ${index}: ${timestampValue}`);
    }

    return {
      id: `webhook_entry_${index}_${timestamp.getTime()}`,
      timestamp: timestamp.toISOString(),
      source: sourceValue,
      category: 'webhook_stream',
      
      // Core emissions data
      emissions: emissionsValue ? {
        total: emissionsValue,
        unit: config.emissionsUnit || 'kg',
        scope: 'scope2' // Default assumption
      } : undefined,
      
      // Energy data
      energy: energyValue ? {
        total: energyValue,
        unit: config.energyUnit || 'kWh'
      } : undefined,
      
      // Power data
      power: powerValue ? {
        instantaneous: powerValue,
        unit: config.powerUnit || 'W'
      } : undefined,
      
      // Stream metadata
      stream_metadata: {
        entry_index: index,
        sse_event: entry._sse_event
      },
      
      // Raw entry data
      raw_entry: entry,
      
      // Metadata
      metadata: {
        adapter: 'WebhookStreamAdapter',
        adapter_version: '1.0.0',
        confidence: 0.80
      }
    };
  }

  private aggregateEntries(entries: NormalizedData[], webhookData: WebhookStreamData, config: WebhookStreamConfig): NormalizedData {
    // Calculate totals and averages
    const totalEmissions = entries.reduce((sum, entry) => {
      return sum + (entry.emissions?.total || 0);
    }, 0);

    const totalEnergy = entries.reduce((sum, entry) => {
      return sum + (entry.energy?.total || 0);
    }, 0);

    const avgPower = entries.reduce((sum, entry, index, arr) => {
      return sum + (entry.power?.instantaneous || 0) / arr.length;
    }, 0);

    // Determine time range
    const timestamps = entries.map(e => new Date(e.timestamp)).sort();
    const startTime = timestamps[0];
    const endTime = timestamps[timestamps.length - 1];
    const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

    const aggregated: NormalizedData = {
      id: `webhook_stream_${webhookData.webhook_id || Date.now()}`,
      timestamp: new Date(webhookData.timestamp).toISOString(),
      source: 'webhook_stream',
      category: 'webhook_aggregate',
      
      emissions: totalEmissions > 0 ? {
        total: totalEmissions,
        unit: config.emissionsUnit || 'kg',
        scope: 'scope2'
      } : undefined,
      
      energy: totalEnergy > 0 ? {
        total: totalEnergy,
        unit: config.energyUnit || 'kWh'
      } : undefined,
      
      power: avgPower > 0 ? {
        average: avgPower,
        unit: config.powerUnit || 'W'
      } : undefined,
      
      // Stream aggregation data
      stream_aggregation: {
        entry_count: entries.length,
        format: webhookData.format,
        time_range: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          duration_seconds: durationSeconds
        },
        data_rate: entries.length / Math.max(durationSeconds, 1) // entries per second
      },
      
      // Webhook source information
      webhook_source: webhookData.source,
      
      metadata: {
        adapter: 'WebhookStreamAdapter',
        adapter_version: '1.0.0',
        confidence: 0.80
      }
    };

    return this.addWebhookMetadata(aggregated, webhookData);
  }

  private addWebhookMetadata(data: NormalizedData, webhookData: WebhookStreamData): NormalizedData {
    return {
      ...data,
      webhook_metadata: {
        webhook_id: webhookData.webhook_id,
        received_at: new Date(webhookData.timestamp).toISOString(),
        format: webhookData.format,
        source_url: webhookData.source?.url,
        source_method: webhookData.source?.method,
        content_type: webhookData.source?.headers?.['content-type']
      }
    };
  }

  getConfidence(input: any): number {
    return this.calculateHeuristicConfidence(input);
  }

  protected getDetectionHeuristics(): DetectionHeuristic[] {
    return [
      {
        weight: 0.4,
        test: (data: any) => {
          // Check for webhook stream structure
          if (typeof data !== 'object' || data === null) return false;
          const hasRequiredFields = 'format' in data && 'data' in data && 'timestamp' in data;
          return hasRequiredFields;
        }
      },
      {
        weight: 0.3,
        test: (data: any) => {
          // Check for supported stream formats
          if (typeof data !== 'object' || data === null) return false;
          const validFormats = ['ndjson', 'sse', 'json_array'];
          return validFormats.includes(data.format);
        }
      },
      {
        weight: 0.2,
        test: (data: any) => {
          // Check for webhook-specific fields
          if (typeof data !== 'object' || data === null) return false;
          const webhookFields = ['webhook_id', 'source'];
          return webhookFields.some(field => field in data);
        }
      },
      {
        weight: 0.1,
        test: (data: any) => {
          // Check if data field contains stream-like content
          if (typeof data !== 'object' || data === null) return false;
          if (typeof data.data !== 'string') return false;
          
          // Check for NDJSON pattern (multiple lines with JSON)
          const lines = data.data.split('\n').filter(l => l.trim());
          if (lines.length > 1) {
            return lines.some(line => {
              try {
                JSON.parse(line);
                return true;
              } catch {
                return false;
              }
            });
          }
          
          // Check for SSE pattern
          return data.data.includes('event:') && data.data.includes('data:');
        }
      }
    ];
  }

  private parseNumber(value: any): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.trim());
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  private parseTimestamp(value: any): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') {
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      } catch {
        return null;
      }
    }
    return null;
  }

  private isValidTimestamp(timestamp: string): boolean {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
  }

  /**
   * Create a WebhookStreamAdapter with specific configuration
   */
  static withConfig(config: WebhookStreamConfig): WebhookStreamAdapter {
    return new WebhookStreamAdapter(config);
  }

  /**
   * Create a WebhookStreamAdapter for NDJSON format
   */
  static forNDJSON(fieldMapping?: { [key: string]: string }): WebhookStreamAdapter {
    return new WebhookStreamAdapter({
      format: 'ndjson',
      fieldMapping
    });
  }

  /**
   * Create a WebhookStreamAdapter for SSE format
   */
  static forSSE(fieldMapping?: { [key: string]: string }): WebhookStreamAdapter {
    return new WebhookStreamAdapter({
      format: 'sse',
      fieldMapping
    });
  }
}

// Auto-register the adapter
adapterRegistry.registerAdapter(new WebhookStreamAdapter());
