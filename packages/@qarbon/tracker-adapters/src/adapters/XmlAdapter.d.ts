/**
 * XML Emission Adapter
 *
 * Handles detection and ingestion of XML formatted data
 * Note: This is a placeholder implementation. In production, consider using xml2js or similar library
 */
import {
  EmissionAdapter,
  FormatConfidence,
} from '../UniversalTrackerRegistry.js';
export declare class XmlAdapter implements EmissionAdapter {
  /**
   * Detect if the raw data is XML format
   * Quick sniff test for XML data
   */
  detect(raw: unknown): boolean;
  /**
   * Analyze input and return confidence score for XML format
   * Checks root node/tag names, XML namespaces, and schema hints
   */
  detectConfidence(input: Buffer | NodeJS.ReadableStream): FormatConfidence;
  /**
   * Ingest and parse XML data into canonical JS object/array
   *
   * PLACEHOLDER IMPLEMENTATION:
   * This is a basic stub that provides minimal XML parsing.
   * In production, consider using xml2js, fast-xml-parser, or similar library.
   */
  ingest(raw: unknown): unknown;
  /**
   * Basic XML content parser (placeholder implementation)
   * TODO: Replace with proper XML parsing library like xml2js
   */
  private parseXmlContent;
}
//# sourceMappingURL=XmlAdapter.d.ts.map
