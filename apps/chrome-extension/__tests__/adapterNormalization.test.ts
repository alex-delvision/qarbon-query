// import { AIImpactTrackerAdapter } from "@qarbon/tracker-adapters";
import { parseOpenAI, parseAnthropic, parseGoogle, parseBedrock } from "../src/tokenExtractors";
import { readFileSync } from "fs";
import { join } from "path";

const loadJSONFixture = (filename: string) => {
  const filePath = join(__dirname, "fixtures", filename);
  const data = readFileSync(filePath, "utf-8");
  return JSON.parse(data);
};

// Mock data that would come from token extractors
const createMockTokenData = (extractor: any, fixture: any) => {
  const parsed = extractor(fixture);
  return {
    model: parsed.model,
    tokens: {
      prompt: parsed.tokens.prompt,
      completion: parsed.tokens.completion,
      total: parsed.tokens.total,
    },
    timestamp: new Date().toISOString(),
    energyPerToken: 0.000001, // 1 microjoule per token (sample value)
    emissions: parsed.tokens.total * 0.000001 * 0.0004, // Sample CO2 calculation
  };
};

describe.skip("Adapter Normalization Conformity", () => {
  let adapter: AIImpactTrackerAdapter;

  beforeEach(() => {
    adapter = new AIImpactTrackerAdapter();
  });

  describe("OpenAI Extractor Integration", () => {
    test("normalizes OpenAI extractor output correctly", () => {
      const openAIResponse = loadJSONFixture("openai_response.json");
      const tokenData = createMockTokenData(parseOpenAI, openAIResponse);

      // Test that adapter can detect the format
      expect(adapter.detect(tokenData)).toBe(true);

      // Test normalization
      const normalized = adapter.ingest(tokenData);

      expect(normalized.model).toBe("gpt-4-0613");
      expect(normalized.tokens.prompt).toBe(25);
      expect(normalized.tokens.completion).toBe(15);
      expect(normalized.tokens.total).toBe(40);
      expect(normalized.energyPerToken).toBe(0.000001);
      expect(normalized.emissions).toBeCloseTo(0.000016); // 40 * 0.000001 * 0.0004
      expect(typeof normalized.timestamp).toBe("string");
    });
  });

  describe("Anthropic Extractor Integration", () => {
    test("normalizes Anthropic extractor output correctly", () => {
      const anthropicResponse = loadJSONFixture("anthropic_response.json");
      const tokenData = createMockTokenData(parseAnthropic, anthropicResponse);

      expect(adapter.detect(tokenData)).toBe(true);

      const normalized = adapter.ingest(tokenData);

      expect(normalized.model).toBe("claude-3-opus-20240229");
      expect(normalized.tokens.prompt).toBe(35);
      expect(normalized.tokens.completion).toBe(18);
      expect(normalized.tokens.total).toBe(53);
      expect(normalized.energyPerToken).toBe(0.000001);
      expect(normalized.emissions).toBeCloseTo(0.0000212); // 53 * 0.000001 * 0.0004
    });
  });

  describe("Google Extractor Integration", () => {
    test("normalizes Google extractor output correctly", () => {
      const googleResponse = loadJSONFixture("google_response.json");
      const tokenData = createMockTokenData(parseGoogle, googleResponse);

      expect(adapter.detect(tokenData)).toBe(true);

      const normalized = adapter.ingest(tokenData);

      expect(normalized.model).toBe("gemini-1.5-pro");
      expect(normalized.tokens.prompt).toBe(28);
      expect(normalized.tokens.completion).toBe(24);
      expect(normalized.tokens.total).toBe(52);
      expect(normalized.energyPerToken).toBe(0.000001);
      expect(normalized.emissions).toBeCloseTo(0.0000208); // 52 * 0.000001 * 0.0004
    });
  });

  describe("Bedrock Extractor Integration", () => {
    test("normalizes Bedrock extractor output correctly", () => {
      const bedrockResponse = loadJSONFixture("bedrock_response.json");
      const tokenData = createMockTokenData(parseBedrock, bedrockResponse);

      expect(adapter.detect(tokenData)).toBe(true);

      const normalized = adapter.ingest(tokenData);

      expect(normalized.model).toBe("anthropic.claude-3-sonnet-20240229-v1:0");
      expect(normalized.tokens.prompt).toBe(32);
      expect(normalized.tokens.completion).toBe(22);
      expect(normalized.tokens.total).toBe(54);
      expect(normalized.energyPerToken).toBe(0.000001);
      expect(normalized.emissions).toBeCloseTo(0.0000216); // 54 * 0.000001 * 0.0004
    });
  });

  describe("Data Validation", () => {
    test("rejects invalid token data structure", () => {
      const invalidData = {
        model: "test-model",
        // missing tokens field
        timestamp: new Date().toISOString(),
        energyPerToken: 0.000001,
      };

      expect(adapter.detect(invalidData)).toBe(false);
      expect(() => adapter.ingest(invalidData)).toThrow();
    });

    test("rejects missing required fields", () => {
      const incompleteData = {
        model: "test-model",
        tokens: { total: 100 },
        // missing timestamp and energyPerToken
      };

      expect(adapter.detect(incompleteData)).toBe(false);
      expect(() => adapter.ingest(incompleteData)).toThrow();
    });

    test("handles string JSON input correctly", () => {
      const tokenData = createMockTokenData(parseOpenAI, loadJSONFixture("openai_response.json"));
      const jsonString = JSON.stringify(tokenData);

      expect(adapter.detect(jsonString)).toBe(true);

      const normalized = adapter.ingest(jsonString);
      expect(normalized.model).toBe("gpt-4-0613");
      expect(normalized.tokens.total).toBe(40);
    });

    test("computes emissions when missing", () => {
      const tokenData = createMockTokenData(parseOpenAI, loadJSONFixture("openai_response.json"));
      delete tokenData.emissions; // Remove emissions field

      const normalized = adapter.ingest(tokenData);
      
      // Should compute emissions as tokens.total * energyPerToken
      expect(normalized.emissions).toBe(40 * 0.000001); // 0.00004
      expect(normalized.tokens.total).toBe(40);
    });

    test("validates numeric fields are non-negative", () => {
      const invalidTokenData = {
        model: "test-model",
        tokens: {
          prompt: -5, // Invalid negative value
          completion: 10,
          total: 5,
        },
        timestamp: new Date().toISOString(),
        energyPerToken: 0.000001,
      };

      expect(() => adapter.ingest(invalidTokenData)).toThrow(/non-negative/);
    });

    test("validates token consistency", () => {
      const openAIResponse = loadJSONFixture("openai_response.json");
      const tokenData = createMockTokenData(parseOpenAI, openAIResponse);
      
      // Ensure prompt + completion calculations are consistent
      expect(tokenData.tokens.prompt + tokenData.tokens.completion).toBe(tokenData.tokens.total);
    });
  });

  describe("Edge Cases", () => {
    test("handles zero token responses", () => {
      const zeroTokenData = {
        model: "test-model",
        tokens: {
          prompt: 0,
          completion: 0,
          total: 0,
        },
        timestamp: new Date().toISOString(),
        energyPerToken: 0.000001,
        emissions: 0,
      };

      expect(adapter.detect(zeroTokenData)).toBe(true);
      
      const normalized = adapter.ingest(zeroTokenData);
      expect(normalized.tokens.total).toBe(0);
      expect(normalized.emissions).toBe(0);
    });

    test("handles large token counts", () => {
      const largeTokenData = {
        model: "test-model",
        tokens: {
          prompt: 100000,
          completion: 50000,
          total: 150000,
        },
        timestamp: new Date().toISOString(),
        energyPerToken: 0.000001,
        emissions: 0.06, // 150000 * 0.000001 * 0.4
      };

      expect(adapter.detect(largeTokenData)).toBe(true);
      
      const normalized = adapter.ingest(largeTokenData);
      expect(normalized.tokens.total).toBe(150000);
      expect(normalized.emissions).toBe(0.06);
    });
  });
});
