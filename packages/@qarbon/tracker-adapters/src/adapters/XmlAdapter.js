/**
 * XML Emission Adapter
 *
 * Handles detection and ingestion of XML formatted data
 * Note: This is a placeholder implementation. In production, consider using xml2js or similar library
 */
export class XmlAdapter {
  /**
   * Detect if the raw data is XML format
   * Quick sniff test for XML data
   */
  detect(raw) {
    if (typeof raw !== 'string') {
      return false;
    }
    const trimmed = raw.trim();
    // Basic XML detection: look for XML declaration or root element
    return (
      trimmed.startsWith('<?xml') ||
      (trimmed.startsWith('<') &&
        trimmed.includes('>') &&
        trimmed.includes('</'))
    );
  }
  /**
   * Analyze input and return confidence score for XML format
   * Checks root node/tag names, XML namespaces, and schema hints
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
    // Check for XML declaration
    if (trimmed.startsWith('<?xml')) {
      score += 0.4;
      evidence.push('XML declaration present');
      // Check for encoding specification
      if (/\bencoding\s*=\s*["'][^"']*["']/i.test(trimmed)) {
        score += 0.1;
        evidence.push('Encoding specified');
      }
    }
    // Check for well-formed XML structure
    if (trimmed.includes('<') && trimmed.includes('>')) {
      score += 0.2;
      evidence.push('Contains XML tags');
      // Check for closing tags
      const closingTagCount = (trimmed.match(/<\//g) || []).length;
      const openingTagCount = (trimmed.match(/<[^?!][^>]*>/g) || []).length;
      if (closingTagCount > 0) {
        score += 0.2;
        evidence.push('Contains closing tags');
        // Bonus for balanced tags (simplified check)
        if (Math.abs(openingTagCount - closingTagCount) <= 1) {
          score += 0.1;
          evidence.push('Tags appear balanced');
        }
      }
      // Penalty for malformed XML (unmatched angle brackets, missing closing tags in obvious places)
      if (
        trimmed.includes('<') &&
        !trimmed.includes('</') &&
        !/\/>/.test(trimmed)
      ) {
        score *= 0.5;
        evidence.push('No closing tags found (penalty)');
      }
      // Penalty for truncated XML (incomplete tag at end)
      if (
        trimmed.endsWith('<') ||
        /< *$/.test(trimmed) ||
        /< *\w+ *$/.test(trimmed)
      ) {
        score *= 0.4;
        evidence.push('Truncated XML detected (penalty)');
      }
      // Additional penalty for malformed tags
      if (/<\w+[^>]*$/.test(trimmed)) {
        // Tag that doesn't end
        score *= 0.3;
        evidence.push('Incomplete XML tag detected (penalty)');
      }
      // Penalty for obviously broken tag structure
      if (/<\w+</.test(trimmed) || />\w+</.test(trimmed)) {
        score *= 0.2;
        evidence.push('Malformed XML tag structure (penalty)');
      }
    }
    // Check for XML namespaces
    if (/xmlns\s*[:=]/i.test(trimmed)) {
      score += 0.15;
      evidence.push('XML namespaces detected');
    }
    // Check for schema hints
    if (/xsi:schemaLocation|xsi:noNamespaceSchemaLocation/i.test(trimmed)) {
      score += 0.1;
      evidence.push('Schema location hints found');
    }
    // Check for common XML patterns
    if (/<\w+[^>]*>.*<\/\w+>/s.test(trimmed)) {
      score += 0.1;
      evidence.push('Well-formed element structure');
    }
    // Check for emission-related XML content (but be more discriminating)
    const emissionPatterns = [
      /<[^>]*emission[^>]*>|<[^>]*carbon[^>]*>|<[^>]*co2[^>]*>/i,
      /<[^>]*duration[^>]*>|<[^>]*time[^>]*>|<[^>]*timestamp[^>]*>/i,
      /<[^>]*energy[^>]*>|<[^>]*power[^>]*>|<[^>]*consumption[^>]*>/i,
    ];
    let emissionTagCount = 0;
    emissionPatterns.forEach(pattern => {
      if (pattern.test(trimmed)) {
        score += 0.05;
        emissionTagCount++;
        evidence.push('Emission-related content detected');
      }
    });
    // If it only matches text content but no XML tags, reduce score significantly
    if (emissionTagCount > 0 && !/<\w+[^>]*>.*<\/\w+>/s.test(trimmed)) {
      score *= 0.3;
      evidence.push('Emission text found but poor XML structure');
    }
    // Penalize if it looks more like HTML
    if (/<html|<body|<div|<script/i.test(trimmed)) {
      score *= 0.3;
      evidence.push('HTML-like content detected (penalty)');
    }
    return {
      adapterName: 'XmlAdapter',
      score: Math.min(1.0, Math.max(0.0, score)),
      evidence:
        evidence.length > 0 ? evidence.join('; ') : 'No XML structure detected',
    };
  }
  /**
   * Ingest and parse XML data into canonical JS object/array
   *
   * PLACEHOLDER IMPLEMENTATION:
   * This is a basic stub that provides minimal XML parsing.
   * In production, consider using xml2js, fast-xml-parser, or similar library.
   */
  ingest(raw) {
    if (typeof raw !== 'string') {
      throw new Error('XML data must be a string');
    }
    const trimmed = raw.trim();
    if (!trimmed) {
      return {};
    }
    // PLACEHOLDER: Very basic XML parsing
    // This is a stub implementation - replace with proper XML parser in production
    try {
      // Remove XML declaration if present
      const xmlContent = trimmed.replace(/<\?xml[^>]*\?>/i, '').trim();
      // Basic extraction of root element and simple text content
      const rootMatch = xmlContent.match(/<([^>\s]+)[^>]*>(.*)<\/\1>/s);
      if (rootMatch) {
        const [, rootElement, content] = rootMatch;
        // Very basic parsing - extract simple text content and child elements
        const result = {};
        if (rootElement && content !== undefined) {
          result[rootElement] = this.parseXmlContent(content.trim());
        }
        return result;
      }
      // Fallback: return the raw XML as a string property
      return { xml: xmlContent };
    } catch (error) {
      throw new Error(`Failed to parse XML: ${error}`);
    }
  }
  /**
   * Basic XML content parser (placeholder implementation)
   * TODO: Replace with proper XML parsing library like xml2js
   */
  parseXmlContent(content) {
    if (!content) {
      return '';
    }
    // Check if content contains child elements
    const hasChildElements = /<[^>]+>/.test(content);
    if (!hasChildElements) {
      // Simple text content
      return content;
    }
    // PLACEHOLDER: Very basic child element extraction
    // This should be replaced with proper XML parsing
    const result = {};
    // Extract simple child elements (non-nested)
    const elementMatches = content.match(/<([^>\s/]+)[^>]*>([^<]*)<\/\1>/g);
    if (elementMatches) {
      elementMatches.forEach(match => {
        const elementMatch = match.match(/<([^>\s/]+)[^>]*>([^<]*)<\/\1>/);
        if (elementMatch) {
          const [, tagName, textContent] = elementMatch;
          if (tagName && textContent !== undefined) {
            result[tagName] = textContent.trim();
          }
        }
      });
    }
    // If no child elements were parsed, return the raw content
    if (Object.keys(result).length === 0) {
      return content;
    }
    return result;
  }
}
//# sourceMappingURL=XmlAdapter.js.map
