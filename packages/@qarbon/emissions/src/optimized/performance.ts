// Auto-generated performance monitoring
// Generated at: 2025-07-04T12:25:23.229Z

export interface PerformanceMetrics {
  calculationTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  batchSize: number;
  throughput: number;
}

export class PerformanceTracker {
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();
  
  startOperation(operationId: string): void {
    this.startTimes.set(operationId, performance.now());
  }
  
  endOperation(operationId: string): number {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) {
      throw new Error(`Operation ${operationId} was not started`);
    }
    
    const duration = performance.now() - startTime;
    this.recordMetric(`${operationId}_duration`, duration);
    this.startTimes.delete(operationId);
    
    return duration;
  }
  
  recordMetric(metricName: string, value: number): void {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    this.metrics.get(metricName)!.push(value);
  }
  
  getMetrics(metricName: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(metricName);
    if (!values || values.length === 0) {
      return null;
    }
    
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }
  
  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [name] of this.metrics) {
      result[name] = this.getMetrics(name);
    }
    return result;
  }
  
  clear(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }
  
  getReport(): string {
    const metrics = this.getAllMetrics();
    const report = ['Performance Report', '='.repeat(50)];
    
    for (const [name, stats] of Object.entries(metrics)) {
      if (stats) {
        report.push(`${name}:`);
        report.push(`  Average: ${stats.avg.toFixed(2)}ms`);
        report.push(`  Min: ${stats.min.toFixed(2)}ms`);
        report.push(`  Max: ${stats.max.toFixed(2)}ms`);
        report.push(`  Count: ${stats.count}`);
        report.push('');
      }
    }
    
    return report.join('\n');
  }
}

export const performanceTracker = new PerformanceTracker();

// Performance monitoring decorators
export function measurePerformance(operationName: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      const operationId = `${operationName}_${Date.now()}`;
      performanceTracker.startOperation(operationId);
      
      try {
        const result = originalMethod.apply(this, args);
        
        if (result instanceof Promise) {
          return result.finally(() => {
            performanceTracker.endOperation(operationId);
          });
        } else {
          performanceTracker.endOperation(operationId);
          return result;
        }
      } catch (error) {
        performanceTracker.endOperation(operationId);
        throw error;
      }
    };
    
    return descriptor;
  };
}
