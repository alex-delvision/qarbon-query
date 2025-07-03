/**
 * Main pipeline orchestrator for qarbon-query
 *
 * Coordinates data flow from input → adapter → normalized data → calculator → result
 */
import type { PipelineProcessor, PipelineOptions, PipelineConfig, PipelineExecutionResult, PipelineStageResult } from './types';
/**
 * Core pipeline orchestrator class
 */
export declare class Pipeline implements PipelineProcessor {
    private config;
    private stageResults;
    constructor(config?: Partial<PipelineConfig>);
    /**
     * Process input through the complete pipeline
     */
    process(input: any, options?: PipelineOptions): Promise<PipelineExecutionResult>;
    /**
     * Configure the pipeline
     */
    configure(config: Partial<PipelineConfig>): void;
    /**
     * Get stage results for debugging
     */
    getStageResults(): PipelineStageResult[];
    /**
     * Stage 1: Adapt input to normalized EmissionData format
     */
    private adaptInput;
    /**
     * Stage 2: Enhance with grid data (placeholder)
     */
    private enhanceWithGrid;
    /**
     * Stage 3: Calculate emissions using existing calculator
     */
    private calculateEmissions;
    /**
     * Stage 4: Calculate uncertainty (placeholder)
     */
    private calculateUncertainty;
    /**
     * Stage 5: Apply optimizations (placeholder)
     */
    private applyOptimizations;
    /**
     * Helper methods
     */
    private isEmissionData;
    private normalizeToEmissionDataArray;
    private normalizeToEmissionData;
    private recordStage;
    private getDefaultConfig;
}
export declare const pipeline: Pipeline;
//# sourceMappingURL=pipeline.d.ts.map