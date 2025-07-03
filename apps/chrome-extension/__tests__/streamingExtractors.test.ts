import { parseOpenAI, parseAnthropic, parseGoogle, parseBedrock } from "../src/tokenExtractors";
import { readFileSync } from "fs";
import { join } from "path";

const loadTextFixture = (filename: string): string => {
  const filePath = join(__dirname, "fixtures", filename);
  return readFileSync(filePath, "utf-8");
};

describe("Streaming Token Extractors", () => {
  describe("parseOpenAI - Streaming", () => {
    test("extracts correct token totals from streaming response", () => {
      const streamingData = loadTextFixture("openai_streaming.txt");
      const parsed = parseOpenAI(streamingData);
      
      expect(parsed.model).toBe("gpt-4-0613");
      expect(parsed.tokens.prompt).toBe(25);
      expect(parsed.tokens.completion).toBe(15);
      expect(parsed.tokens.total).toBe(40);
    });

    test("handles malformed streaming chunks gracefully", () => {
      const malformedStream = `data: {"invalid": "json"

data: {"model": "gpt-4", "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}}

data: [DONE]`;
      
      const parsed = parseOpenAI(malformedStream);
      
      expect(parsed.model).toBe("gpt-4");
      expect(parsed.tokens.prompt).toBe(10);
      expect(parsed.tokens.completion).toBe(5);
      expect(parsed.tokens.total).toBe(15);
    });

    test("handles empty streaming response", () => {
      const emptyStream = "data: [DONE]";
      const parsed = parseOpenAI(emptyStream);
      
      expect(parsed.model).toBe("unknown");
      expect(parsed.tokens.prompt).toBe(0);
      expect(parsed.tokens.completion).toBe(0);
      expect(parsed.tokens.total).toBe(0);
    });
  });

  describe("parseAnthropic - Streaming", () => {
    test("extracts tokens from Anthropic streaming response", () => {
      const anthropicStream = `
data: {"type": "message_start", "message": {"model": "claude-3-opus-20240229"}}

data: {"type": "content_block_delta", "delta": {"text": "Hello"}}

data: {"type": "message_stop", "usage": {"input_tokens": 20, "output_tokens": 10}}
      `;
      
      const parsed = parseAnthropic(anthropicStream);
      
      expect(parsed.model).toBe("claude-3-opus-20240229");
      expect(parsed.tokens.prompt).toBe(20);
      expect(parsed.tokens.completion).toBe(10);
      expect(parsed.tokens.total).toBe(30);
    });
  });

  describe("parseGoogle - Streaming", () => {
    test("extracts tokens from Google streaming response", () => {
      const googleStream = `
{"model": "gemini-1.5-pro", "usageMetadata": {"promptTokenCount": 15, "candidatesTokenCount": 8, "totalTokenCount": 23}}
      `;
      
      const parsed = parseGoogle(googleStream);
      
      expect(parsed.model).toBe("gemini-1.5-pro");
      expect(parsed.tokens.prompt).toBe(15);
      expect(parsed.tokens.completion).toBe(8);
      expect(parsed.tokens.total).toBe(23);
    });
  });

  describe("parseBedrock - Streaming", () => {
    test("extracts tokens from Bedrock streaming response", () => {
      const bedrockStream = `
{"model": "anthropic.claude-3-sonnet-20240229-v1:0", "usage": {"inputTokens": 18, "outputTokens": 12}}
      `;
      
      const parsed = parseBedrock(bedrockStream);
      
      expect(parsed.model).toBe("anthropic.claude-3-sonnet-20240229-v1:0");
      expect(parsed.tokens.prompt).toBe(18);
      expect(parsed.tokens.completion).toBe(12);
      expect(parsed.tokens.total).toBe(30);
    });

    test("handles Bedrock invocation metrics format", () => {
      const bedrockMetricsStream = `
{"amazon-bedrock-invocationMetrics": {"inputTokenCount": 25, "outputTokenCount": 15}, "modelId": "claude-v2"}
      `;
      
      const parsed = parseBedrock(bedrockMetricsStream);
      
      expect(parsed.model).toBe("claude-v2");
      expect(parsed.tokens.prompt).toBe(25);
      expect(parsed.tokens.completion).toBe(15);
      expect(parsed.tokens.total).toBe(40);
    });
  });
});
