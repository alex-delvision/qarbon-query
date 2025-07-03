/**
 * FIT (Flexible and Interoperable Data Transfer) Binary Adapter
 *
 * Handles detection and ingestion of FIT protocol binary data
 * Verifies protocol headers and CRC for confidence scoring
 */

import {
  EmissionAdapter,
  FormatConfidence,
} from '../UniversalTrackerRegistry.js';

export class FitAdapter implements EmissionAdapter {
  private static readonly FIT_HEADER_SIZE = 14;
  private static readonly FIT_FILE_TYPE_OFFSET = 8;
  private static readonly FIT_PROTOCOL_VERSION_OFFSET = 0;
  private static readonly FIT_PROFILE_VERSION_OFFSET = 4;
  private static readonly FIT_DATA_SIZE_OFFSET = 4;

  /**
   * Detect if the raw data is FIT format
   * Quick sniff test for FIT binary data
   */
  detect(raw: unknown): boolean {
    if (!(raw instanceof Buffer)) {
      return false;
    }

    // FIT files must be at least 14 bytes (header size)
    if (raw.length < FitAdapter.FIT_HEADER_SIZE) {
      return false;
    }

    // Check for FIT file signature
    return this.validateFitHeader(raw).isValid;
  }

  /**
   * Analyze input and return confidence score for FIT format
   * Verifies protocol headers and CRC
   */
  detectConfidence(input: Buffer | NodeJS.ReadableStream): FormatConfidence {
    let buffer: Buffer;

    if (input instanceof Buffer) {
      buffer = input;
    } else {
      // For ReadableStream, we need to read synchronously - this is a simplified approach
      // In production, consider making this method async
      throw new Error(
        'ReadableStream input not supported in this implementation'
      );
    }

    let score = 0.0;
    const evidence: string[] = [];

    // Check minimum size
    if (buffer.length < FitAdapter.FIT_HEADER_SIZE) {
      return {
        adapterName: 'FitAdapter',
        score: 0.0,
        evidence: 'File too small for FIT format',
      };
    }

    // Validate FIT header
    const headerValidation = this.validateFitHeader(buffer);
    if (headerValidation.isValid) {
      score += 0.6;
      evidence.push('Valid FIT header structure');

      // Additional header validation
      if (headerValidation.hasValidSize) {
        score += 0.15;
        evidence.push('Valid data size in header');
      }

      if (headerValidation.hasValidProtocolVersion) {
        score += 0.1;
        evidence.push('Valid protocol version');
      }

      if (headerValidation.hasValidProfileVersion) {
        score += 0.05;
        evidence.push('Valid profile version');
      }
    } else {
      evidence.push('Invalid FIT header structure');
      return {
        adapterName: 'FitAdapter',
        score: 0.0,
        evidence: evidence.join('; '),
      };
    }

    // Verify CRC if available
    if (this.verifyCrc(buffer)) {
      score += 0.2;
      evidence.push('Valid CRC checksum');
    } else {
      // Partial penalty for invalid CRC, but don't completely fail
      score *= 0.8;
      evidence.push('CRC verification failed');
    }

    // Check for emission-related message types in the data
    const emissionMessageTypes = this.findEmissionMessageTypes(buffer);
    if (emissionMessageTypes.length > 0) {
      score += 0.1;
      evidence.push(
        `Found ${emissionMessageTypes.length} emission-related message types`
      );
    }

    return {
      adapterName: 'FitAdapter',
      score: Math.min(1.0, Math.max(0.0, score)),
      evidence: evidence.join('; '),
    };
  }

  /**
   * Ingest and parse FIT binary data into canonical format
   */
  ingest(raw: unknown): unknown {
    if (!(raw instanceof Buffer)) {
      throw new Error('FIT data must be a Buffer');
    }

    if (!this.detect(raw)) {
      throw new Error('Invalid FIT data format');
    }

    try {
      // Parse FIT file structure
      const header = this.parseFitHeader(raw);
      const records = this.parseFitRecords(raw, FitAdapter.FIT_HEADER_SIZE);

      // Extract emission-related data
      const emissionData = this.extractEmissionData(records);

      return {
        header,
        emissionData,
        totalRecords: records.length,
        fileSize: raw.length,
      };
    } catch (error) {
      throw new Error(`Failed to parse FIT data: ${error}`);
    }
  }

  /**
   * Validate FIT file header structure
   */
  private validateFitHeader(buffer: Buffer): {
    isValid: boolean;
    hasValidSize: boolean;
    hasValidProtocolVersion: boolean;
    hasValidProfileVersion: boolean;
  } {
    try {
      // Header size (should be 14 for FIT)
      const headerSize = buffer.readUInt8(0);
      if (headerSize !== 14) {
        return {
          isValid: false,
          hasValidSize: false,
          hasValidProtocolVersion: false,
          hasValidProfileVersion: false,
        };
      }

      // Protocol version (should be reasonable, e.g., 1.0 to 2.9)
      const protocolVersion = buffer.readUInt8(1);
      const isValidProtocol = protocolVersion >= 10 && protocolVersion <= 29; // 1.0 to 2.9

      // Profile version (little endian, should be reasonable)
      const profileVersion = buffer.readUInt16LE(2);
      const isValidProfile = profileVersion >= 100 && profileVersion <= 9999;

      // Data size (little endian, should match file size minus header and CRC)
      const dataSize = buffer.readUInt32LE(4);
      const expectedSize = buffer.length - headerSize - 2; // minus header and 2-byte CRC
      const isValidSize = Math.abs(dataSize - expectedSize) <= 4; // Allow small variance

      // File type signature ('.FIT')
      const fileType = buffer.subarray(8, 12).toString('ascii');
      const isValidSignature = fileType === '.FIT';

      return {
        isValid: isValidSignature && headerSize === 14,
        hasValidSize: isValidSize,
        hasValidProtocolVersion: isValidProtocol,
        hasValidProfileVersion: isValidProfile,
      };
    } catch {
      return {
        isValid: false,
        hasValidSize: false,
        hasValidProtocolVersion: false,
        hasValidProfileVersion: false,
      };
    }
  }

  /**
   * Verify CRC checksum (simplified implementation)
   */
  private verifyCrc(buffer: Buffer): boolean {
    try {
      if (buffer.length < 4) return false;

      // FIT files have 2-byte CRC at the end
      const fileCrc = buffer.readUInt16LE(buffer.length - 2);

      // Calculate CRC-16 for the data (excluding the CRC itself)
      const dataForCrc = buffer.subarray(0, buffer.length - 2);
      const calculatedCrc = this.calculateCrc16(dataForCrc);

      return fileCrc === calculatedCrc;
    } catch {
      return false;
    }
  }

  /**
   * Calculate CRC-16 checksum (simplified implementation)
   */
  private calculateCrc16(data: Buffer): number {
    let crc = 0x0000;
    const polynomial = 0x1021; // CRC-16-CCITT polynomial

    for (let i = 0; i < data.length; i++) {
      crc ^= (data[i] ?? 0) << 8;

      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ polynomial) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }

    return crc;
  }

  /**
   * Parse FIT file header
   */
  private parseFitHeader(buffer: Buffer): Record<string, unknown> {
    return {
      headerSize: buffer.readUInt8(0),
      protocolVersion: buffer.readUInt8(1),
      profileVersion: buffer.readUInt16LE(2),
      dataSize: buffer.readUInt32LE(4),
      fileType: buffer.subarray(8, 12).toString('ascii'),
      crc: buffer.length >= 14 ? buffer.readUInt16LE(12) : null,
    };
  }

  /**
   * Parse FIT records (simplified implementation)
   */
  private parseFitRecords(
    buffer: Buffer,
    startOffset: number
  ): Array<Record<string, unknown>> {
    const records: Array<Record<string, unknown>> = [];
    let offset = startOffset;
    const endOffset = buffer.length - 2; // Exclude CRC

    try {
      while (offset < endOffset) {
        // Check if we have enough bytes for a record header
        if (offset + 1 >= endOffset) break;

        const recordHeader = buffer.readUInt8(offset);
        const isDefinitionMessage = (recordHeader & 0x40) !== 0;
        const messageType = recordHeader & 0x0f;

        if (isDefinitionMessage) {
          // Definition message - defines the structure of data messages
          const definitionLength = this.parseDefinitionMessage(buffer, offset);
          offset += definitionLength;
        } else {
          // Data message - contains actual data
          const dataLength = this.parseDataMessage(buffer, offset, messageType);
          offset += dataLength;

          records.push({
            type: 'data',
            messageType,
            offset: offset - dataLength,
            length: dataLength,
          });
        }

        // Safety check to prevent infinite loops
        if (offset <= startOffset || records.length > 10000) {
          break;
        }
      }
    } catch {
      // If parsing fails, return what we have so far
    }

    return records;
  }

  /**
   * Parse definition message (simplified)
   */
  private parseDefinitionMessage(buffer: Buffer, offset: number): number {
    // Simplified parsing - return estimated length
    // In a full implementation, this would parse the actual definition structure
    const minDefinitionSize = 5; // Minimum size for definition message
    const remainingBytes = buffer.length - offset - 2; // Exclude CRC

    return Math.min(minDefinitionSize, remainingBytes);
  }

  /**
   * Parse data message (simplified)
   */
  private parseDataMessage(
    buffer: Buffer,
    offset: number,
    messageType: number
  ): number {
    // Simplified parsing - return estimated length based on message type
    // In a full implementation, this would use the definition to parse the data
    const estimatedSizes: Record<number, number> = {
      0: 20, // File ID message
      1: 25, // Capabilities message
      2: 15, // Device settings message
      3: 30, // User profile message
      4: 10, // HRM profile message
      // Add more message types as needed
    };

    const estimatedSize = estimatedSizes[messageType] || 10;
    const remainingBytes = buffer.length - offset - 2; // Exclude CRC

    return Math.min(estimatedSize, remainingBytes);
  }

  /**
   * Find emission-related message types in the data
   */
  private findEmissionMessageTypes(buffer: Buffer): number[] {
    const emissionMessageTypes: number[] = [];

    // Look for message types that might contain emission data
    // This is a simplified approach - in practice, you'd need to know
    // the specific FIT message types used for emission data
    const potentialEmissionTypes = [
      20,
      21,
      22, // Session, lap, record messages
      34,
      35, // Activity, workout messages
      72,
      73, // Training file messages
      200,
      201, // Developer/custom messages (common for emission data)
    ];

    // Scan through the buffer looking for these message types
    for (let i = FitAdapter.FIT_HEADER_SIZE; i < buffer.length - 2; i++) {
      const byte = buffer.readUInt8(i);
      const messageType = byte & 0x0f;

      if (
        potentialEmissionTypes.includes(messageType) &&
        !emissionMessageTypes.includes(messageType)
      ) {
        emissionMessageTypes.push(messageType);
      }
    }

    return emissionMessageTypes;
  }

  /**
   * Extract emission-related data from parsed records
   */
  private extractEmissionData(
    records: Array<Record<string, unknown>>
  ): Array<Record<string, unknown>> {
    // This is a placeholder implementation
    // In practice, you would parse the actual FIT message data
    // and extract emission-related fields like power, energy consumption, etc.

    return records
      .filter(
        record =>
          record.type === 'data' &&
          typeof record.messageType === 'number' &&
          [20, 21, 22, 34, 35, 72, 73, 200, 201].includes(record.messageType)
      )
      .map(record => ({
        ...record,
        // Placeholder emission data - in practice, parse from the actual record
        estimatedPower: 250, // watts
        duration: 3600, // seconds
        estimatedEmissions: 0.1, // kg CO2
      }));
  }
}
