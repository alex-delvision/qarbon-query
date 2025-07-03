import { parseOpenAI, parseAnthropic, parseGoogle, parseBedrock, parseTokens } from "../src/tokenExtractors";
import { readFileSync } from "fs";
import { join } from "path";

const loadJSONFixture = (filename: string) => {
  const filePath = join(__dirname, "fixtures", filename);
  const data = readFileSync(filePath, "utf-8");
  return JSON.parse(data);
};

describe("Token Extractors", () => {
  describe("parseOpenAI", () => {
    test("extracts correct token totals from OpenAI response", () => {
      const jsonResponse = loadJSONFixture("openai_response.json");
      const parsed = parseOpenAI(jsonResponse);
      
      expect(parsed.model).toBe("gpt-4-0613");
      expect(parsed.tokens.prompt).toBe(25);
      expect(parsed.tokens.completion).toBe(15);
      expect(parsed.tokens.total).toBe(40);
    });

    test("handles missing usage data gracefully", () => {
      const invalidResponse = { model: "gpt-4" };
      const parsed = parseOpenAI(invalidResponse);
      
      expect(parsed.model).toBe("gpt-4");
      expect(parsed.tokens.prompt).toBe(0);
      expect(parsed.tokens.completion).toBe(0);
      expect(parsed.tokens.total).toBe(0);
    });
  });

  describe("parseAnthropic", () => {
    test("extracts correct token totals from Anthropic response", () => {
      const jsonResponse = loadJSONFixture("anthropic_response.json");
      const parsed = parseAnthropic(jsonResponse);
      
      expect(parsed.model).toBe("claude-3-opus-20240229");
      expect(parsed.tokens.prompt).toBe(35);
      expect(parsed.tokens.completion).toBe(18);
      expect(parsed.tokens.total).toBe(53); // input_tokens + output_tokens
    });

    test("handles missing usage data gracefully", () => {
      const invalidResponse = { model: "claude-3" };
      const parsed = parseAnthropic(invalidResponse);
      
      expect(parsed.model).toBe("claude-3");
      expect(parsed.tokens.prompt).toBe(0);
      expect(parsed.tokens.completion).toBe(0);
      expect(parsed.tokens.total).toBe(0);
    });
  });

  describe("parseGoogle", () => {
    test("extracts correct token totals from Google AI response", () => {
      const jsonResponse = loadJSONFixture("google_response.json");
      const parsed = parseGoogle(jsonResponse);
      
      expect(parsed.model).toBe("gemini-1.5-pro");
      expect(parsed.tokens.prompt).toBe(28);
      expect(parsed.tokens.completion).toBe(24);
      expect(parsed.tokens.total).toBe(52);
    });

    test("handles missing usage metadata gracefully", () => {
      const invalidResponse = { model: "gemini-pro" };
      const parsed = parseGoogle(invalidResponse);
      
      expect(parsed.model).toBe("gemini-pro");
      expect(parsed.tokens.prompt).toBe(0);
      expect(parsed.tokens.completion).toBe(0);
      expect(parsed.tokens.total).toBe(0);
    });
  });

  describe("parseBedrock", () => {
    test("extracts correct token totals from Bedrock response", () => {
      const jsonResponse = loadJSONFixture("bedrock_response.json");
      const parsed = parseBedrock(jsonResponse);
      
      expect(parsed.model).toBe("anthropic.claude-3-sonnet-20240229-v1:0");
      expect(parsed.tokens.prompt).toBe(32);
      expect(parsed.tokens.completion).toBe(22);
      expect(parsed.tokens.total).toBe(54);
    });

    test("handles missing usage data gracefully", () => {
      const invalidResponse = { model: "bedrock-model" };
      const parsed = parseBedrock(invalidResponse);
      
      expect(parsed.model).toBe("bedrock-model");
      expect(parsed.tokens.prompt).toBe(0);
      expect(parsed.tokens.completion).toBe(0);
      expect(parsed.tokens.total).toBe(0);
    });
  });

  describe("parseTokens - Generic Parser", () => {
    test("auto-detects OpenAI format", () => {
      const openAIResponse = loadJSONFixture("openai_response.json");
      const parsed = parseTokens(openAIResponse);
      
      expect(parsed.model).toBe("gpt-4-0613");
      expect(parsed.tokens.total).toBe(40);
    });

    test("auto-detects Anthropic format", () => {
      const anthropicResponse = loadJSONFixture("anthropic_response.json");
      const parsed = parseTokens(anthropicResponse);
      
      expect(parsed.model).toBe("claude-3-opus-20240229");
      expect(parsed.tokens.total).toBe(53);
    });

    test("auto-detects Google format", () => {
      const googleResponse = loadJSONFixture("google_response.json");
      const parsed = parseTokens(googleResponse);
      
      expect(parsed.model).toBe("gemini-1.5-pro");
      expect(parsed.tokens.total).toBe(52);
    });

    test("auto-detects Bedrock format", () => {
      const bedrockResponse = loadJSONFixture("bedrock_response.json");
      const parsed = parseTokens(bedrockResponse);
      
      expect(parsed.model).toBe("anthropic.claude-3-sonnet-20240229-v1:0");
      expect(parsed.tokens.total).toBe(54);
    });

    test("uses explicit provider parameter", () => {
      const openAIResponse = loadJSONFixture("openai_response.json");
      const parsed = parseTokens(openAIResponse, "openai");
      
      expect(parsed.model).toBe("gpt-4-0613");
      expect(parsed.tokens.total).toBe(40);
    });

    test("handles unknown format gracefully", () => {
      const unknownResponse = { someField: "value" };
      const parsed = parseTokens(unknownResponse);
      
      expect(parsed.model).toBe("unknown");
      expect(parsed.tokens.prompt).toBe(0);
      expect(parsed.tokens.completion).toBe(0);
      expect(parsed.tokens.total).toBe(0);
    });

    test("throws error for unsupported provider", () => {
      const response = {};
      expect(() => parseTokens(response, "unsupported")).toThrow("Unsupported provider: unsupported");
    });
  });
});
