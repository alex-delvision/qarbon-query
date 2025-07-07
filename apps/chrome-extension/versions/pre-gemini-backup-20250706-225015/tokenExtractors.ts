// Token extraction utilities for different AI providers
// Handles both regular and streaming responses

export interface TokenInfo {
  prompt: number;
  completion: number;
  total: number;
}

export interface ParsedResponse {
  model: string;
  tokens: TokenInfo;
}

/**
 * Buffer for handling streaming responses
 */
class StreamBuffer {
  private buffer: string = '';
  private chunks: string[] = [];

  addChunk(chunk: string): void {
    this.buffer += chunk;
    
    // Split on double newlines to separate JSON chunks
    const parts = this.buffer.split('\n\n');
    
    // Keep the last part in buffer (might be incomplete)
    this.buffer = parts.pop() || '';
    
    // Add complete chunks
    this.chunks.push(...parts.filter(part => part.trim()));
  }

  getChunks(): string[] {
    return this.chunks;
  }

  hasCompleteChunks(): boolean {
    return this.chunks.length > 0;
  }

  clear(): void {
    this.buffer = '';
    this.chunks = [];
  }
}

/**
 * Parse OpenAI API response for token information
 */
export function parseOpenAI(json: any): ParsedResponse {
  // Handle streaming response
  if (typeof json === 'string') {
    return parseOpenAIStreaming(json);
  }

  // Handle regular response
  const usage = json.usage || {};
  const model = json.model || 'unknown';
  
  return {
    model,
    tokens: {
      prompt: usage.prompt_tokens || 0,
      completion: usage.completion_tokens || 0,
      total: usage.total_tokens || 0
    }
  };
}

/**
 * Parse OpenAI streaming response
 */
function parseOpenAIStreaming(streamData: string): ParsedResponse {
  const buffer = new StreamBuffer();
  buffer.addChunk(streamData);
  
  let model = 'unknown';
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;

  for (const chunk of buffer.getChunks()) {
    try {
      // Remove 'data: ' prefix if present
      const jsonStr = chunk.replace(/^data:\s*/, '');
      if (jsonStr === '[DONE]') continue;
      
      const parsed = JSON.parse(jsonStr);
      
      if (parsed.model) {
        model = parsed.model;
      }
      
      if (parsed.usage) {
        promptTokens = parsed.usage.prompt_tokens || promptTokens;
        completionTokens = parsed.usage.completion_tokens || completionTokens;
        totalTokens = parsed.usage.total_tokens || totalTokens;
      }
    } catch (e) {
      // Skip malformed JSON chunks
      continue;
    }
  }

  return {
    model,
    tokens: {
      prompt: promptTokens,
      completion: completionTokens,
      total: totalTokens
    }
  };
}

/**
 * Parse Anthropic API response for token information
 */
export function parseAnthropic(json: any): ParsedResponse {
  // Handle streaming response
  if (typeof json === 'string') {
    return parseAnthropicStreaming(json);
  }

  // Handle regular response
  const usage = json.usage || {};
  const model = json.model || 'unknown';
  
  return {
    model,
    tokens: {
      prompt: usage.input_tokens || 0,
      completion: usage.output_tokens || 0,
      total: (usage.input_tokens || 0) + (usage.output_tokens || 0)
    }
  };
}

/**
 * Parse Anthropic streaming response
 */
function parseAnthropicStreaming(streamData: string): ParsedResponse {
  const buffer = new StreamBuffer();
  buffer.addChunk(streamData);
  
  let model = 'unknown';
  let inputTokens = 0;
  let outputTokens = 0;

  for (const chunk of buffer.getChunks()) {
    try {
      // Remove 'data: ' prefix if present
      const jsonStr = chunk.replace(/^data:\s*/, '');
      if (jsonStr === '[DONE]') continue;
      
      const parsed = JSON.parse(jsonStr);
      
      if (parsed.model) {
        model = parsed.model;
      }
      
      if (parsed.usage) {
        inputTokens = parsed.usage.input_tokens || inputTokens;
        outputTokens = parsed.usage.output_tokens || outputTokens;
      }
      
      // Handle message_stop event with usage
      if (parsed.type === 'message_stop' && parsed.usage) {
        inputTokens = parsed.usage.input_tokens || inputTokens;
        outputTokens = parsed.usage.output_tokens || outputTokens;
      }
    } catch (e) {
      // Skip malformed JSON chunks
      continue;
    }
  }

  return {
    model,
    tokens: {
      prompt: inputTokens,
      completion: outputTokens,
      total: inputTokens + outputTokens
    }
  };
}

/**
 * Parse Google AI API response for token information
 */
export function parseGoogle(json: any): ParsedResponse {
  // Handle streaming response
  if (typeof json === 'string') {
    return parseGoogleStreaming(json);
  }

  // Handle regular response
  const usageMetadata = json.usageMetadata || {};
  const model = json.model || 'unknown';
  
  return {
    model,
    tokens: {
      prompt: usageMetadata.promptTokenCount || 0,
      completion: usageMetadata.candidatesTokenCount || 0,
      total: usageMetadata.totalTokenCount || 0
    }
  };
}

/**
 * Parse Google streaming response
 */
function parseGoogleStreaming(streamData: string): ParsedResponse {
  const buffer = new StreamBuffer();
  buffer.addChunk(streamData);
  
  let model = 'unknown';
  let promptTokens = 0;
  let candidatesTokens = 0;
  let totalTokens = 0;

  for (const chunk of buffer.getChunks()) {
    try {
      const parsed = JSON.parse(chunk);
      
      if (parsed.model) {
        model = parsed.model;
      }
      
      if (parsed.usageMetadata) {
        promptTokens = parsed.usageMetadata.promptTokenCount || promptTokens;
        candidatesTokens = parsed.usageMetadata.candidatesTokenCount || candidatesTokens;
        totalTokens = parsed.usageMetadata.totalTokenCount || totalTokens;
      }
    } catch (e) {
      // Skip malformed JSON chunks
      continue;
    }
  }

  return {
    model,
    tokens: {
      prompt: promptTokens,
      completion: candidatesTokens,
      total: totalTokens
    }
  };
}

/**
 * Parse AWS Bedrock API response for token information
 */
export function parseBedrock(json: any): ParsedResponse {
  // Handle streaming response
  if (typeof json === 'string') {
    return parseBedrockStreaming(json);
  }

  // Handle regular response
  const usage = json.usage || {};
  const model = json.model || json.modelId || 'unknown';
  
  return {
    model,
    tokens: {
      prompt: usage.inputTokens || 0,
      completion: usage.outputTokens || 0,
      total: usage.totalTokens || (usage.inputTokens || 0) + (usage.outputTokens || 0)
    }
  };
}

/**
 * Parse Bedrock streaming response
 */
function parseBedrockStreaming(streamData: string): ParsedResponse {
  const buffer = new StreamBuffer();
  buffer.addChunk(streamData);
  
  let model = 'unknown';
  let inputTokens = 0;
  let outputTokens = 0;

  for (const chunk of buffer.getChunks()) {
    try {
      const parsed = JSON.parse(chunk);
      
      if (parsed.model || parsed.modelId) {
        model = parsed.model || parsed.modelId;
      }
      
      if (parsed.usage) {
        inputTokens = parsed.usage.inputTokens || inputTokens;
        outputTokens = parsed.usage.outputTokens || outputTokens;
      }
      
      // Handle different event types in streaming
      if (parsed['amazon-bedrock-invocationMetrics']) {
        const metrics = parsed['amazon-bedrock-invocationMetrics'];
        inputTokens = metrics.inputTokenCount || inputTokens;
        outputTokens = metrics.outputTokenCount || outputTokens;
      }
    } catch (e) {
      // Skip malformed JSON chunks
      continue;
    }
  }

  return {
    model,
    tokens: {
      prompt: inputTokens,
      completion: outputTokens,
      total: inputTokens + outputTokens
    }
  };
}

/**
 * Generic parser that attempts to detect the provider and parse accordingly
 */
export function parseTokens(json: any, provider?: string): ParsedResponse {
  if (provider) {
    switch (provider.toLowerCase()) {
      case 'openai':
        return parseOpenAI(json);
      case 'anthropic':
        return parseAnthropic(json);
      case 'google':
        return parseGoogle(json);
      case 'bedrock':
        return parseBedrock(json);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  // Try to auto-detect provider based on response structure
  if (typeof json === 'object' && json !== null) {
    // OpenAI detection
    if (json.usage && 'prompt_tokens' in json.usage) {
      return parseOpenAI(json);
    }
    
    // Anthropic detection
    if (json.usage && 'input_tokens' in json.usage) {
      return parseAnthropic(json);
    }
    
    // Google detection
    if (json.usageMetadata && 'promptTokenCount' in json.usageMetadata) {
      return parseGoogle(json);
    }
    
    // Bedrock detection
    if (json.usage && 'inputTokens' in json.usage) {
      return parseBedrock(json);
    }
  }

  // Default fallback
  return {
    model: 'unknown',
    tokens: {
      prompt: 0,
      completion: 0,
      total: 0
    }
  };
}

export { StreamBuffer };
