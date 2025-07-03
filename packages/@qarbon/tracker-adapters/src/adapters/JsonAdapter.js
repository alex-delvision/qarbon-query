/**
 * JSON Emission Adapter
 *
 * Handles detection and ingestion of JSON formatted data
 */
export class JsonAdapter {
    /**
     * Detect if the raw data is JSON format
     * Quick sniff test for JSON data
     */
    detect(raw) {
        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            return trimmed.startsWith('{') || trimmed.startsWith('[');
        }
        // If it's already an object or array, consider it JSON-compatible
        if (typeof raw === 'object' && raw !== null) {
            return true;
        }
        return false;
    }
    /**
     * Analyze input and return confidence score for JSON format
     * Searches for canonical property sets and valid JSON structure
     */
    detectConfidence(input) {
        let content;
        if (input instanceof Buffer) {
            content = input.toString('utf8');
        }
        else {
            // For ReadableStream, we need to read synchronously - this is a simplified approach
            // In production, consider making this method async
            throw new Error('ReadableStream input not supported in this implementation');
        }
        const trimmed = content.trim();
        let score = 0.0;
        const evidence = [];
        // Check if it starts with valid JSON delimiters
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            score += 0.3;
            evidence.push('Valid JSON delimiter start');
            // Check if it ends with corresponding delimiter
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                score += 0.2;
                evidence.push('Matching JSON delimiters');
            }
        }
        // Try to parse as JSON
        let parsedData;
        try {
            parsedData = JSON.parse(trimmed);
            score += 0.4;
            evidence.push('Valid JSON syntax');
        }
        catch {
            // Check for partial JSON patterns even if invalid
            if (/[{[].*[}]]/s.test(trimmed) && /"\w+"\s*:/.test(trimmed)) {
                score += 0.1;
                evidence.push('JSON-like structure detected');
            }
            // Apply penalties for truncated or corrupted JSON
            if (/[{[]/s.test(trimmed) && !/[}]]/s.test(trimmed)) {
                score *= 0.3;
                evidence.push('Truncated JSON (no closing bracket/brace)');
            }
            if (/[,:]\s*$/.test(trimmed)) {
                score *= 0.4;
                evidence.push('JSON ends with comma or colon');
            }
            // Severe penalty for corrupted JSON - invalid JSON should get very low scores
            if (/[{[].*[}]]/.test(trimmed)) {
                // If it has JSON delimiters but failed to parse, it's corrupted
                score *= 0.15;
                evidence.push('Corrupted JSON - has delimiters but invalid syntax');
            }
            // Additional penalty for syntax issues
            if (/\w+\s*[^:=]\s*[^,}\]]/.test(trimmed)) {
                // Unquoted keys or values
                score *= 0.1;
                evidence.push('Invalid JSON syntax detected');
            }
            return {
                adapterName: 'JsonAdapter',
                score: Math.min(1.0, Math.max(0.0, score)),
                evidence: evidence.join('; '),
            };
        }
        // Analyze content for emission-related canonical property sets
        if (parsedData && typeof parsedData === 'object') {
            const dataObj = parsedData;
            // Check for common emission tracking properties
            const emissionProperties = [
                'emissions',
                'co2',
                'carbon',
                'carbonEmissions',
                'co2Emissions',
                'emissions_kg',
                'carbonFootprint',
                'co2Equivalent',
            ];
            const durationProperties = [
                'duration',
                'durationSeconds',
                'duration_seconds',
                'time',
                'timestamp',
                'executionTime',
                'runtime',
            ];
            const energyProperties = [
                'energy',
                'power',
                'consumption',
                'energyUsed',
                'powerUsage',
            ];
            const modelProperties = [
                'model',
                'modelName',
                'ai_model',
                'llm_model',
                'model_name',
                'engine',
                'modelType',
            ];
            let propertyMatches = 0;
            // Check for emission properties (but be conservative to not overtake specialized adapters)
            if (emissionProperties.some(prop => prop in dataObj)) {
                score += 0.15;
                propertyMatches++;
                evidence.push('Emission properties found');
            }
            // Check for duration/time properties
            if (durationProperties.some(prop => prop in dataObj)) {
                score += 0.08;
                propertyMatches++;
                evidence.push('Duration/time properties found');
            }
            // Check for energy properties
            if (energyProperties.some(prop => prop in dataObj)) {
                score += 0.08;
                propertyMatches++;
                evidence.push('Energy properties found');
            }
            // Check for model properties
            if (modelProperties.some(prop => prop in dataObj)) {
                score += 0.05;
                propertyMatches++;
                evidence.push('Model properties found');
            }
            // Bonus for multiple canonical property types, but keep it moderate
            if (propertyMatches >= 2) {
                score += 0.08;
                evidence.push('Multiple canonical property types');
            }
            // Penalty if this looks like it should be handled by a specialized adapter
            // Check for CodeCarbon specific fields
            if ('duration_seconds' in dataObj && 'emissions_kg' in dataObj) {
                score = Math.min(0.7, score); // Cap at 0.7 to let CodeCarbon win
                evidence.push('CodeCarbon-like structure detected (capped)');
            }
            // Additional CodeCarbon field combinations
            if (('duration' in dataObj && 'emissions' in dataObj) ||
                'duration_seconds' in dataObj ||
                'emissions_kg' in dataObj) {
                const codeCarbonFields = [
                    'project_name',
                    'run_id',
                    'cpu_energy',
                    'gpu_energy',
                    'codecarbon_version',
                ];
                const hasCodeCarbonFields = codeCarbonFields.some(field => field in dataObj);
                if (hasCodeCarbonFields) {
                    score = Math.min(0.6, score); // Even more conservative for strong CodeCarbon indicators
                    evidence.push('Strong CodeCarbon indicators detected (capped)');
                }
            }
            // Check for AI Impact Tracker specific fields
            if ('model' in dataObj &&
                'tokens' in dataObj &&
                'energyPerToken' in dataObj) {
                score = Math.min(0.85, score); // Cap at 0.85 to let AIImpact win
                evidence.push('AI Impact Tracker-like structure detected (capped)');
            }
            // Check for array of objects with consistent structure
            if (Array.isArray(parsedData) && parsedData.length > 0) {
                const firstItem = parsedData[0];
                if (typeof firstItem === 'object' && firstItem !== null) {
                    score += 0.05;
                    evidence.push('Array of structured objects');
                    // Check if multiple items have similar structure
                    if (parsedData.length > 1) {
                        const firstKeys = Object.keys(firstItem).sort();
                        const similarStructure = parsedData.slice(1, 5).every(item => typeof item === 'object' &&
                            item !== null &&
                            Object.keys(item)
                                .sort()
                                .join(',') === firstKeys.join(','));
                        if (similarStructure) {
                            score += 0.05;
                            evidence.push('Consistent array structure');
                        }
                    }
                }
            }
        }
        return {
            adapterName: 'JsonAdapter',
            score: Math.min(1.0, Math.max(0.0, score)),
            evidence: evidence.length > 0
                ? evidence.join('; ')
                : 'No JSON structure detected',
        };
    }
    /**
     * Ingest and parse JSON data into canonical JS object/array
     */
    ingest(raw) {
        if (typeof raw === 'string') {
            try {
                return JSON.parse(raw);
            }
            catch (error) {
                throw new Error(`Failed to parse JSON: ${error}`);
            }
        }
        // If it's already an object, return as-is
        if (typeof raw === 'object' && raw !== null) {
            return raw;
        }
        throw new Error('Invalid JSON data format');
    }
}
//# sourceMappingURL=JsonAdapter.js.map