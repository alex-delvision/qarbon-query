/**
 * CSV Emission Adapter
 *
 * Handles detection and ingestion of CSV formatted data
 */
export class CsvAdapter {
  static DEFAULT_COLUMN_MAPPING = {
    timestamp: [
      'timestamp',
      'time',
      'date',
      'created_at',
      'datetime',
      'start_time',
      'end_time',
    ],
    model: [
      'model',
      'model_name',
      'ai_model',
      'llm_model',
      'model_type',
      'engine',
    ],
    duration: [
      'duration',
      'duration_seconds',
      'time_seconds',
      'execution_time',
      'runtime',
      'elapsed_time',
      'process_time',
    ],
    emissions: [
      'emissions',
      'co2',
      'carbon_emissions',
      'co2_emissions',
      'emissions_kg',
      'carbon_footprint',
      'co2_equivalent',
    ],
  };
  columnMapping;
  constructor(customMapping) {
    // Merge custom mapping with defaults
    this.columnMapping = {
      timestamp: [
        ...CsvAdapter.DEFAULT_COLUMN_MAPPING.timestamp,
        ...(customMapping?.timestamp || []),
      ],
      model: [
        ...CsvAdapter.DEFAULT_COLUMN_MAPPING.model,
        ...(customMapping?.model || []),
      ],
      duration: [
        ...CsvAdapter.DEFAULT_COLUMN_MAPPING.duration,
        ...(customMapping?.duration || []),
      ],
      emissions: [
        ...CsvAdapter.DEFAULT_COLUMN_MAPPING.emissions,
        ...(customMapping?.emissions || []),
      ],
    };
  }
  /**
   * Detect if the raw data is CSV format
   * Quick sniff test for CSV data
   */
  detect(raw) {
    if (typeof raw !== 'string') {
      return false;
    }
    const trimmed = raw.trim();
    // Basic CSV detection: look for comma-separated values
    // Check if it contains commas and has multiple lines or comma-separated values in a single line
    if (trimmed.includes(',')) {
      // Check if it looks like CSV structure (has lines with commas)
      const lines = trimmed.split('\n');
      return lines.length > 0 && lines.some(line => line.includes(','));
    }
    return false;
  }
  /**
   * Analyze input and return confidence score for CSV format
   * Checks for CSV structure, headers, and emission-related content
   */
  detectConfidence(input) {
    let content;
    if (input instanceof Buffer) {
      content = input.toString('utf8');
    } else {
      // For ReadableStream, we need to read synchronously - this is a simplified approach
      // In production, consider making this method async
      throw new Error(
        'ReadableStream input not supported in this implementation'
      );
    }
    const trimmed = content.trim();
    let score = 0.0;
    const evidence = [];
    if (!trimmed) {
      return {
        adapterName: 'CsvAdapter',
        score: 0.0,
        evidence: 'Empty content',
      };
    }
    const lines = trimmed
      .split('\n')
      .map(line => line.trim())
      .filter(line => line);
    // Check if we have at least 1 line for headers, allow partial scoring
    if (lines.length < 1) {
      return {
        adapterName: 'CsvAdapter',
        score: 0.0,
        evidence: 'No content for CSV',
      };
    }
    // Early check: if there are no commas anywhere, it can't be CSV
    if (!trimmed.includes(',')) {
      return {
        adapterName: 'CsvAdapter',
        score: 0.0,
        evidence: 'No comma separators found',
      };
    }
    // If only one line (headers only), give partial score
    if (lines.length < 2) {
      // Still analyze the header for emission-related columns
      const headerLine = lines[0];
      if (headerLine && headerLine.includes(',')) {
        const headers = headerLine
          .split(',')
          .map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const foundMappings = {
          emissions: this.columnMapping.emissions.some(alias =>
            headers.includes(alias.toLowerCase())
          ),
          duration: this.columnMapping.duration.some(alias =>
            headers.includes(alias.toLowerCase())
          ),
          timestamp: this.columnMapping.timestamp.some(alias =>
            headers.includes(alias.toLowerCase())
          ),
          model: this.columnMapping.model.some(alias =>
            headers.includes(alias.toLowerCase())
          ),
        };
        let headerScore = 0.2; // Base score for CSV-like structure
        const evidence = ['Header-only CSV structure'];
        if (foundMappings.emissions) {
          headerScore += 0.2;
          evidence.push('Emission headers detected');
        }
        if (foundMappings.duration) {
          headerScore += 0.1;
          evidence.push('Duration headers detected');
        }
        if (foundMappings.timestamp || foundMappings.model) {
          headerScore += 0.05;
          evidence.push('Additional relevant headers detected');
        }
        return {
          adapterName: 'CsvAdapter',
          score: Math.min(0.6, headerScore), // Cap at 0.6 for header-only
          evidence: evidence.join('; '),
        };
      }
      return {
        adapterName: 'CsvAdapter',
        score: 0.0,
        evidence: 'Insufficient rows for CSV',
      };
    }
    // Check for comma-separated structure
    const commaLines = lines.filter(line => line.includes(','));
    if (commaLines.length === 0) {
      return {
        adapterName: 'CsvAdapter',
        score: 0.0,
        evidence: 'No comma separators found',
      };
    }
    score += 0.3;
    evidence.push('Comma-separated structure detected');
    // Check for consistent column count
    const headerCommaCount = (lines[0]?.match(/,/g) || []).length;
    const consistentColumns = lines
      .slice(1, Math.min(5, lines.length))
      .every(line => {
        const commaCount = (line.match(/,/g) || []).length;
        return Math.abs(commaCount - headerCommaCount) <= 1; // Allow 1 comma difference
      });
    if (consistentColumns) {
      score += 0.2;
      evidence.push('Consistent column structure');
    }
    // Parse header to check for canonical properties
    const headerLine = lines[0];
    if (headerLine) {
      const headers = headerLine
        .split(',')
        .map(h => h.trim().toLowerCase().replace(/"/g, ''));
      // Check for emission-related headers
      const foundMappings = {
        timestamp: this.columnMapping.timestamp.some(alias =>
          headers.includes(alias.toLowerCase())
        ),
        model: this.columnMapping.model.some(alias =>
          headers.includes(alias.toLowerCase())
        ),
        duration: this.columnMapping.duration.some(alias =>
          headers.includes(alias.toLowerCase())
        ),
        emissions: this.columnMapping.emissions.some(alias =>
          headers.includes(alias.toLowerCase())
        ),
      };
      let mappingCount = 0;
      if (foundMappings.emissions) {
        score += 0.3;
        evidence.push('Emission columns detected');
        mappingCount++;
      }
      if (foundMappings.duration) {
        score += 0.15;
        evidence.push('Duration columns detected');
        mappingCount++;
      }
      if (foundMappings.timestamp) {
        score += 0.1;
        evidence.push('Timestamp columns detected');
        mappingCount++;
      }
      if (foundMappings.model) {
        score += 0.05;
        evidence.push('Model columns detected');
        mappingCount++;
      }
      // Bonus for multiple canonical column types
      if (mappingCount >= 2) {
        score += 0.1;
        evidence.push('Multiple canonical column types');
      }
      // Check for reasonable header names (not just numbers or single chars)
      const reasonableHeaders = headers.filter(
        h => h.length > 1 && /^[a-zA-Z][a-zA-Z0-9_\-\s]*$/.test(h)
      );
      if (reasonableHeaders.length / headers.length > 0.5) {
        score += 0.1;
        evidence.push('Reasonable header names');
      }
    }
    // Check for quoted values (common in CSV)
    const quotedPattern = /"[^"]*"/g;
    const quotedMatches = trimmed.match(quotedPattern) || [];
    if (quotedMatches.length > 0) {
      score += 0.05;
      evidence.push('Quoted values detected');
    }
    // Check data consistency in first few rows
    const sampleRows = lines.slice(1, Math.min(4, lines.length));
    let numericColumnCount = 0;
    if (sampleRows.length > 0) {
      const firstRowValues =
        sampleRows[0]?.split(',').map(v => v.trim().replace(/"/g, '')) || [];
      // Count how many columns appear to be numeric across sample rows
      firstRowValues.forEach((_, colIndex) => {
        const columnValues = sampleRows.map(row => {
          const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
          return values[colIndex] || '';
        });
        const numericValues = columnValues.filter(
          val => val !== '' && !isNaN(Number(val))
        );
        if (numericValues.length / columnValues.length > 0.7) {
          numericColumnCount++;
        }
      });
      if (numericColumnCount > 0) {
        score += Math.min(0.1, numericColumnCount * 0.03);
        evidence.push(`${numericColumnCount} numeric columns detected`);
      }
    }
    // Penalty for truncated CSV (missing values in last row)
    if (lines.length >= 2) {
      const headerColumnCount = lines[0].split(',').length;
      const lastRowColumnCount = lines[lines.length - 1].split(',').length;
      if (lastRowColumnCount < headerColumnCount && lastRowColumnCount > 0) {
        score *= 0.5;
        evidence.push('Truncated row detected (penalty)');
      }
    }
    // Penalty for malformed CSV structure
    let malformedCount = 0;
    const headerColumnCount = lines[0]?.split(',').length || 0;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Check for unclosed quotes
      if ((line.match(/"/g) || []).length % 2 !== 0) {
        malformedCount++;
      }
      // Check for inconsistent column count (too many or too few)
      const columnCount = line.split(',').length;
      if (columnCount !== headerColumnCount && columnCount > 1) {
        malformedCount++;
      }
    }
    if (malformedCount > 0) {
      const penalty = Math.max(0.3, 1 - malformedCount * 0.2);
      score *= penalty;
      evidence.push(
        `Malformed CSV structure detected (${malformedCount} issues)`
      );
    }
    return {
      adapterName: 'CsvAdapter',
      score: Math.min(1.0, Math.max(0.0, score)),
      evidence: evidence.join('; '),
    };
  }
  /**
   * Ingest and parse CSV data into canonical JS object/array
   * Lightweight CSV parsing - splits lines and commas
   */
  ingest(raw) {
    if (typeof raw !== 'string') {
      throw new Error('CSV data must be a string');
    }
    const trimmed = raw.trim();
    if (!trimmed) {
      return [];
    }
    const lines = trimmed
      .split('\n')
      .map(line => line.trim())
      .filter(line => line);
    if (lines.length === 0) {
      return [];
    }
    // Simple CSV parsing - split by commas and handle basic quoted values
    const parseCSVLine = line => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    // Parse header row
    const headers = parseCSVLine(lines[0]);
    // Build header-to-index mapping (lower-cased)
    const headerIndexMap = new Map();
    headers.forEach((header, index) => {
      headerIndexMap.set(header.toLowerCase(), index);
    });
    // Find first matching alias for each standard output field
    const findIndex = aliases => {
      for (const alias of aliases) {
        const index = headerIndexMap.get(alias.toLowerCase());
        if (index !== undefined) {
          return index;
        }
      }
      return undefined;
    };
    const mapIdx = {
      ts: findIndex(this.columnMapping.timestamp),
      model: findIndex(this.columnMapping.model),
      dur: findIndex(this.columnMapping.duration),
      emi: findIndex(this.columnMapping.emissions),
    };
    const hasEmissionColumns = Object.values(mapIdx).some(i => i !== undefined);
    // Parse data rows
    const data = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      if (hasEmissionColumns) {
        // Return normalized objects with standard field names
        const rowOut = {};
        if (mapIdx.ts !== undefined) rowOut.timestamp = values[mapIdx.ts];
        if (mapIdx.model !== undefined) rowOut.model = values[mapIdx.model];
        if (mapIdx.dur !== undefined) {
          const dur = this.safeNumber(values[mapIdx.dur] || '');
          rowOut.durationSeconds = dur;
        }
        if (mapIdx.emi !== undefined) {
          const emi = this.safeNumber(values[mapIdx.emi] || '');
          rowOut.emissionsKg = emi;
        }
        return rowOut;
      } else {
        // Legacy behavior - return raw key-value pairs
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      }
    });
    return data;
  }
  /**
   * Safely convert a string to a number, returning undefined if NaN or empty
   */
  safeNumber(value) {
    if (!value || value.trim() === '') {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }
  /**
   * Add custom column mappings for specific field types
   */
  addColumnMapping(field, aliases) {
    this.columnMapping[field] = [...this.columnMapping[field], ...aliases];
  }
  /**
   * Set complete column mapping configuration
   */
  setColumnMapping(mapping) {
    Object.entries(mapping).forEach(([field, aliases]) => {
      if (aliases && field in this.columnMapping) {
        this.columnMapping[field] = aliases;
      }
    });
  }
  /**
   * Get current column mapping configuration
   */
  getColumnMapping() {
    return { ...this.columnMapping };
  }
  /**
   * Reset column mapping to defaults
   */
  resetColumnMapping() {
    this.columnMapping = {
      timestamp: [...CsvAdapter.DEFAULT_COLUMN_MAPPING.timestamp],
      model: [...CsvAdapter.DEFAULT_COLUMN_MAPPING.model],
      duration: [...CsvAdapter.DEFAULT_COLUMN_MAPPING.duration],
      emissions: [...CsvAdapter.DEFAULT_COLUMN_MAPPING.emissions],
    };
  }
}
//# sourceMappingURL=CsvAdapter.js.map
