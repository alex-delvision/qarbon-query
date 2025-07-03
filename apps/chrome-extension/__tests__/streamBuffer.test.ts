import { StreamBuffer } from "../src/tokenExtractors";

describe("StreamBuffer Utility", () => {
  let buffer: StreamBuffer;

  beforeEach(() => {
    buffer = new StreamBuffer();
  });

  describe("Basic Functionality", () => {
    test("starts with empty buffer", () => {
      expect(buffer.getChunks()).toHaveLength(0);
      expect(buffer.hasCompleteChunks()).toBe(false);
    });

    test("adds single chunk correctly", () => {
      buffer.addChunk("data: {\"test\": true}\\n\\n");
      
      expect(buffer.hasCompleteChunks()).toBe(true);
      expect(buffer.getChunks()).toEqual(["data: {\"test\": true}"]);
    });

    test("handles multiple chunks", () => {
      buffer.addChunk("data: {\"chunk1\": true}\\n\\ndata: {\"chunk2\": false}\\n\\n");
      
      const chunks = buffer.getChunks();
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toBe("data: {\"chunk1\": true}");
      expect(chunks[1]).toBe("data: {\"chunk2\": false}");
    });

    test("accumulates incomplete chunks", () => {
      buffer.addChunk("data: {\"incomplete\":");
      expect(buffer.hasCompleteChunks()).toBe(false);
      expect(buffer.getChunks()).toHaveLength(0);

      buffer.addChunk(" true}\\n\\n");
      expect(buffer.hasCompleteChunks()).toBe(true);
      expect(buffer.getChunks()).toEqual(["data: {\"incomplete\": true}"]);
    });
  });

  describe("Real-world Streaming Scenarios", () => {
    test("handles OpenAI streaming format", () => {
      const openAIStream = `data: {\"id\":\"chatcmpl-123\",\"object\":\"chat.completion.chunk\",\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}

data: {\"id\":\"chatcmpl-123\",\"object\":\"chat.completion.chunk\",\"choices\":[{\"delta\":{\"content\":\" world\"}}]}

data: {\"id\":\"chatcmpl-123\",\"object\":\"chat.completion.chunk\",\"choices\":[{\"finish_reason\":\"stop\"}],\"usage\":{\"total_tokens\":10}}

data: [DONE]`;

      buffer.addChunk(openAIStream);
      
      const chunks = buffer.getChunks();
      expect(chunks).toHaveLength(4);
      expect(chunks[0]).toContain("Hello");
      expect(chunks[1]).toContain("world");
      expect(chunks[2]).toContain("total_tokens");
      expect(chunks[3]).toBe("data: [DONE]");
    });

    test("handles partial network chunks", () => {
      // Simulate network chunks arriving separately
      buffer.addChunk("data: {\"start\":");
      buffer.addChunk(" true}\\n\\ndata: {\"middle\":");
      buffer.addChunk(" false}\\n\\ndata: {\"end\": ");
      buffer.addChunk("null}\\n\\n");

      const chunks = buffer.getChunks();
      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toBe("data: {\"start\": true}");
      expect(chunks[1]).toBe("data: {\"middle\": false}");
      expect(chunks[2]).toBe("data: {\"end\": null}");
    });

    test("filters out empty chunks", () => {
      buffer.addChunk("\\n\\ndata: {\"valid\": true}\\n\\n\\n\\n");
      
      const chunks = buffer.getChunks();
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe("data: {\"valid\": true}");
    });
  });

  describe("Edge Cases", () => {
    test("handles chunks with only newlines", () => {
      buffer.addChunk("\\n\\n\\n\\n");
      
      expect(buffer.hasCompleteChunks()).toBe(false);
      expect(buffer.getChunks()).toHaveLength(0);
    });

    test("handles chunks with whitespace", () => {
      buffer.addChunk("   \\n\\ndata: {\"spaced\": true}   \\n\\n   ");
      
      const chunks = buffer.getChunks();
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe("data: {\"spaced\": true}   ");
    });

    test("handles large chunks", () => {
      const largeContent = "x".repeat(10000);
      buffer.addChunk(`data: {\"large\": \"${largeContent}\"}\\n\\n`);
      
      const chunks = buffer.getChunks();
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toContain(largeContent);
    });

    test("handles malformed chunks gracefully", () => {
      buffer.addChunk("not-valid-format\\n\\ndata: {\"valid\": true}\\n\\n");
      
      const chunks = buffer.getChunks();
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toBe("not-valid-format");
      expect(chunks[1]).toBe("data: {\"valid\": true}");
    });
  });

  describe("Buffer Management", () => {
    test("clears buffer completely", () => {
      buffer.addChunk("data: {\"test\": true}\\n\\n");
      expect(buffer.hasCompleteChunks()).toBe(true);

      buffer.clear();
      expect(buffer.hasCompleteChunks()).toBe(false);
      expect(buffer.getChunks()).toHaveLength(0);
    });

    test("maintains state across multiple operations", () => {
      buffer.addChunk("data: {\"first\": 1}\\n\\n");
      expect(buffer.getChunks()).toHaveLength(1);

      buffer.addChunk("data: {\"second\": 2}\\n\\n");
      expect(buffer.getChunks()).toHaveLength(2);

      buffer.addChunk("data: {\"third\":");
      expect(buffer.getChunks()).toHaveLength(2); // Still 2, third is incomplete

      buffer.addChunk(" 3}\\n\\n");
      expect(buffer.getChunks()).toHaveLength(3); // Now 3
    });
  });

  describe("Performance", () => {
    test("handles many small chunks efficiently", () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        buffer.addChunk(`data: {\"chunk${i}\": ${i}}\\n\\n`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(buffer.getChunks()).toHaveLength(1000);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    test("handles streaming simulation", () => {
      // Simulate receiving a stream in random-sized chunks
      const fullStream = Array.from({ length: 50 }, (_, i) => 
        `data: {\"message${i}\": \"content ${i}\"}\\n\\n`
      ).join("");

      // Split into random chunks
      let position = 0;
      while (position < fullStream.length) {
        const chunkSize = Math.floor(Math.random() * 100) + 10; // 10-110 chars
        const chunk = fullStream.slice(position, position + chunkSize);
        buffer.addChunk(chunk);
        position += chunkSize;
      }

      expect(buffer.getChunks()).toHaveLength(50);
      expect(buffer.getChunks()[0]).toContain("message0");
      expect(buffer.getChunks()[49]).toContain("message49");
    });
  });

  describe("Integration with Token Extraction", () => {
    test("works with real OpenAI streaming token extraction", () => {
      const streamWithTokens = `data: {\"id\":\"chatcmpl-123\",\"model\":\"gpt-4\"}

data: {\"id\":\"chatcmpl-123\",\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}

data: {\"id\":\"chatcmpl-123\",\"choices\":[{\"finish_reason\":\"stop\"}],\"usage\":{\"prompt_tokens\":10,\"completion_tokens\":5,\"total_tokens\":15}}

data: [DONE]`;

      buffer.addChunk(streamWithTokens);
      
      const chunks = buffer.getChunks();
      
      // Find the chunk with usage information
      const usageChunk = chunks.find(chunk => chunk.includes("usage"));
      expect(usageChunk).toBeDefined();
      expect(usageChunk).toContain("total_tokens\":15");
      expect(usageChunk).toContain("prompt_tokens\":10");
      expect(usageChunk).toContain("completion_tokens\":5");
    });

    test("handles Anthropic streaming format", () => {
      const anthropicStream = `data: {"type":"message_start","message":{"model":"claude-3-opus"}}

data: {"type":"content_block_delta","delta":{"text":"Hello"}}

data: {"type":"message_stop","usage":{"input_tokens":20,"output_tokens":8}}`;

      buffer.addChunk(anthropicStream);
      
      const chunks = buffer.getChunks();
      expect(chunks.length).toBeGreaterThanOrEqual(2); // At least 2 chunks
      
      const usageChunk = chunks.find(chunk => chunk.includes("message_stop"));
      expect(usageChunk).toContain("input_tokens\":20");
      expect(usageChunk).toContain("output_tokens\":8");
    });
  });
});
