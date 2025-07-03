/**
 * Streaming calculator using Node.js Transform for real-time emissions processing
 */

import { Transform, TransformCallback } from 'stream';
import { EmissionInput, EmissionOutput, StreamingCalculationOptions, BatchMetrics } from './types';
import { batchCalculator } from './batch-calculator';
import { featureFlags } from './feature-flags';

/**
 * Streaming emissions calculator
 */
export class StreamingCalculator extends Transform {
  private buffer: EmissionInput[] = [];
  private batchSize: number;
  private metrics: BatchMetrics;
  private features: any;

  constructor(options: StreamingCalculationOptions = {}) {
    super({
      objectMode: true,
      highWaterMark: options.highWaterMark || 16,
      ...options,
    });

    this.batchSize = options.batchSize || 100;
    this.features = options.features || featureFlags.getFlags();
    this.metrics = this.initMetrics();
  }

  private initMetrics(): BatchMetrics {
    return {
      totalInputs: 0,
      processedInputs: 0,
      failedInputs: 0,
      processingTime: 0,
      useWasm: false,
      useSIMD: false,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Transform implementation for processing emission inputs
   */
  _transform(
    chunk: EmissionInput | EmissionInput[],
    encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    try {
      // Handle both single inputs and arrays
      const inputs = Array.isArray(chunk) ? chunk : [chunk];
      
      // Add to buffer
      this.buffer.push(...inputs);
      this.metrics.totalInputs += inputs.length;

      // Process if buffer is large enough or if this is the end
      if (this.buffer.length >= this.batchSize) {
        this.processBatch()
          .then(() => callback())
          .catch(callback);
      } else {
        callback();
      }
    } catch (error) {
      callback(error);
    }
  }

  /**
   * Flush remaining items in buffer
   */
  _flush(callback: TransformCallback): void {
    if (this.buffer.length > 0) {
      this.processBatch()
        .then(() => callback())
        .catch(callback);
    } else {
      callback();
    }
  }

  /**
   * Process batched inputs
   */
  private async processBatch(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const inputs = this.buffer.splice(0, this.batchSize);
    
    try {
      const { results, metrics } = await batchCalculator.calculateBatch(inputs, {
        features: this.features,
      });

      // Merge metrics
      this.mergeMetrics(metrics);

      // Push results to output stream
      for (const result of results) {
        this.push(result);
      }
    } catch (error) {
      this.metrics.failedInputs += inputs.length;
      this.emit('error', error);
    }
  }

  /**
   * Merge batch metrics with streaming metrics
   */
  private mergeMetrics(batchMetrics: BatchMetrics): void {
    this.metrics.processedInputs += batchMetrics.processedInputs;
    this.metrics.failedInputs += batchMetrics.failedInputs;
    this.metrics.processingTime += batchMetrics.processingTime;
    this.metrics.cacheHits += batchMetrics.cacheHits;
    this.metrics.cacheMisses += batchMetrics.cacheMisses;
    this.metrics.useWasm = this.metrics.useWasm || batchMetrics.useWasm;
    this.metrics.useSIMD = this.metrics.useSIMD || batchMetrics.useSIMD;
  }

  /**
   * Get current processing metrics
   */
  getMetrics(): BatchMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = this.initMetrics();
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Force process current buffer
   */
  async flushBuffer(): Promise<void> {
    await this.processBatch();
  }
}

/**
 * Real-time log processor for emission data
 */
export class LogProcessor extends Transform {
  private lineBuffer: string = '';
  private parser: (line: string) => EmissionInput | null;

  constructor(
    parser: (line: string) => EmissionInput | null,
    options: StreamingCalculationOptions = {}
  ) {
    super({
      objectMode: false,
      ...options,
    });

    this.parser = parser;
  }

  /**
   * Transform log lines into emission inputs
   */
  _transform(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    try {
      const text = chunk.toString();
      const lines = (this.lineBuffer + text).split('\n');
      
      // Keep last incomplete line in buffer
      this.lineBuffer = lines.pop() || '';

      // Process complete lines
      for (const line of lines) {
        if (line.trim()) {
          const input = this.parser(line);
          if (input) {
            this.push(input);
          }
        }
      }

      callback();
    } catch (error) {
      callback(error);
    }
  }

  /**
   * Flush remaining buffer
   */
  _flush(callback: TransformCallback): void {
    if (this.lineBuffer.trim()) {
      const input = this.parser(this.lineBuffer);
      if (input) {
        this.push(input);
      }
    }
    callback();
  }
}

/**
 * Result aggregator for streaming calculations
 */
export class ResultAggregator extends Transform {
  private aggregatedResults: EmissionOutput[] = [];
  private aggregationWindow: number;
  private windowStart: number;

  constructor(windowMs: number = 1000) {
    super({ objectMode: true });
    
    this.aggregationWindow = windowMs;
    this.windowStart = Date.now();
  }

  /**
   * Aggregate emission results over time windows
   */
  _transform(
    chunk: EmissionOutput,
    encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    try {
      const now = Date.now();
      
      // Check if we need to flush current window
      if (now - this.windowStart >= this.aggregationWindow) {
        this.flushWindow();
        this.windowStart = now;
      }

      // Add to current window
      this.aggregatedResults.push(chunk);
      
      callback();
    } catch (error) {
      callback(error);
    }
  }

  /**
   * Flush final window
   */
  _flush(callback: TransformCallback): void {
    this.flushWindow();
    callback();
  }

  /**
   * Flush current aggregation window
   */
  private flushWindow(): void {
    if (this.aggregatedResults.length === 0) {
      return;
    }

    // Calculate aggregated statistics
    const summary = this.calculateSummary(this.aggregatedResults);
    
    // Emit aggregated result
    this.push(summary);
    
    // Reset for next window
    this.aggregatedResults = [];
  }

  /**
   * Calculate summary statistics for aggregated results
   */
  private calculateSummary(results: EmissionOutput[]) {
    const categories = new Map<string, { count: number; total: number; unit: string }>();
    
    for (const result of results) {
      if (!categories.has(result.category)) {
        categories.set(result.category, { count: 0, total: 0, unit: result.unit });
      }
      
      const category = categories.get(result.category)!;
      category.count++;
      category.total += result.amount;
    }

    const summary = {
      timestamp: new Date().toISOString(),
      windowStart: new Date(this.windowStart).toISOString(),
      windowEnd: new Date().toISOString(),
      totalResults: results.length,
      categories: Object.fromEntries(categories),
      totalEmissions: Array.from(categories.values()).reduce((sum, cat) => sum + cat.total, 0),
    };

    return summary;
  }
}

/**
 * Create a complete streaming pipeline
 */
export function createStreamingPipeline(options: {
  logParser?: (line: string) => EmissionInput | null;
  calculationOptions?: StreamingCalculationOptions;
  aggregationWindow?: number;
}) {
  const pipeline: Transform[] = [];

  // Log processor (if parser provided)
  if (options.logParser) {
    pipeline.push(new LogProcessor(options.logParser, options.calculationOptions));
  }

  // Streaming calculator
  pipeline.push(new StreamingCalculator(options.calculationOptions));

  // Result aggregator (if window specified)
  if (options.aggregationWindow) {
    pipeline.push(new ResultAggregator(options.aggregationWindow));
  }

  return pipeline;
}

/**
 * Default log parsers for common formats
 */
export const logParsers = {
  /**
   * Parse JSON log lines
   */
  json: (line: string): EmissionInput | null => {
    try {
      const data = JSON.parse(line);
      
      if (data.category && data.type && typeof data.value === 'number') {
        return {
          id: data.id || `json_${Date.now()}_${Math.random()}`,
          category: data.category,
          type: data.type,
          value: data.value,
          unit: data.unit,
          model: data.model,
          region: data.region,
          metadata: data.metadata,
        };
      }
    } catch {
      // Invalid JSON, skip
    }
    
    return null;
  },

  /**
   * Parse CSV log lines
   */
  csv: (line: string): EmissionInput | null => {
    const parts = line.split(',').map(p => p.trim());
    
    if (parts.length >= 4) {
      const [category, type, value, unit = '', model = '', region = ''] = parts;
      
      if (category && type && !isNaN(Number(value))) {
        return {
          id: `csv_${Date.now()}_${Math.random()}`,
          category: category as any,
          type,
          value: Number(value),
          unit: unit || undefined,
          model: model || undefined,
          region: region || undefined,
        };
      }
    }
    
    return null;
  },

  /**
   * Parse AI usage logs
   */
  aiUsage: (line: string): EmissionInput | null => {
    // Example: "2024-01-01T12:00:00Z [AI] model=gpt-4 tokens=1500 region=us-east-1"
    const match = line.match(/\[AI\]\s+model=(\S+)\s+tokens=(\d+)(?:\s+region=(\S+))?/);
    
    if (match) {
      const [, model, tokens, region] = match;
      
      return {
        id: `ai_${Date.now()}_${Math.random()}`,
        category: 'ai',
        type: 'inference',
        value: Number(tokens),
        model,
        region: region || 'global',
      };
    }
    
    return null;
  },
};
