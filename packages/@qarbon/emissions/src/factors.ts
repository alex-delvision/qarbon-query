/**
 * Emission factors for various activities
 * Based on standard carbon accounting methodologies
 */

interface EmissionFactor {
  [key: string]: any;
}

const DIGITAL_FACTORS: Record<string, EmissionFactor> = {
  mobile: {
    dataFactor: 0.006, // g CO2e per MB
    timeFactor: 0.012, // g CO2e per minute
  },
  desktop: {
    dataFactor: 0.008, // g CO2e per MB
    timeFactor: 0.025, // g CO2e per minute
  },
  tablet: {
    dataFactor: 0.007, // g CO2e per MB
    timeFactor: 0.018, // g CO2e per minute
  },
};

const TRANSPORT_FACTORS: Record<string, EmissionFactor> = {
  car: {
    perKm: 0.21, // kg CO2e per km (average car)
  },
  train: {
    perKm: 0.041, // kg CO2e per km
  },
  plane: {
    perKm: 0.255, // kg CO2e per km (domestic flights)
  },
  bus: {
    perKm: 0.089, // kg CO2e per km
  },
};

const ENERGY_FACTORS: Record<string, EmissionFactor> = {
  grid: {
    perKwh: 0.5, // kg CO2e per kWh (average grid)
  },
  renewable: {
    perKwh: 0.05, // kg CO2e per kWh
  },
  fossil: {
    perKwh: 0.85, // kg CO2e per kWh
  },
};

/**
 * AI model emission factors
 * Based on Patterson 2021, OpenAI 2023, Anthropic LCA papers
 * Reference: GPT-3 average ≈ 2.2 g CO₂e per query
 */
interface AIEmissionFactor {
  energyPerToken: number; // kWh per token
  co2PerToken: number; // g CO₂e per token
  co2PerQuery?: number; // g CO₂e per average query (optional)
  confidence: { low: number; high: number }; // 95% CI
}

const AI_FACTORS: Record<string, AIEmissionFactor> = {
  'gpt-3.5': {
    energyPerToken: 0.0000006, // kWh per token
    co2PerToken: 0.0022, // g CO₂e per token (2.2g per 1000 tokens)
    co2PerQuery: 2.2, // g CO₂e per average query
    confidence: { low: 1.8, high: 2.6 },
  },
  'gpt-4': {
    energyPerToken: 0.0000025, // kWh per token
    co2PerToken: 0.0045, // g CO₂e per token (4.5g per 1000 tokens)
    co2PerQuery: 8.5, // g CO₂e per average query
    confidence: { low: 7.2, high: 9.8 },
  },
  'claude-2': {
    energyPerToken: 0.0000008, // kWh per token
    co2PerToken: 0.0004, // g CO₂e per token
    co2PerQuery: 3.1, // g CO₂e per average query
    confidence: { low: 2.5, high: 3.7 },
  },
  'claude-3': {
    energyPerToken: 0.0000012, // kWh per token
    co2PerToken: 0.0006, // g CO₂e per token
    co2PerQuery: 4.2, // g CO₂e per average query
    confidence: { low: 3.6, high: 4.8 },
  },
  'gemini-pro': {
    energyPerToken: 0.0000007, // kWh per token
    co2PerToken: 0.00035, // g CO₂e per token
    co2PerQuery: 2.8, // g CO₂e per average query
    confidence: { low: 2.3, high: 3.3 },
  },
  'llama-2': {
    energyPerToken: 0.0000005, // kWh per token
    co2PerToken: 0.00025, // g CO₂e per token
    co2PerQuery: 1.9, // g CO₂e per average query
    confidence: { low: 1.5, high: 2.3 },
  },
  'palm-2': {
    energyPerToken: 0.0000009, // kWh per token
    co2PerToken: 0.00045, // g CO₂e per token
    co2PerQuery: 3.4, // g CO₂e per average query
    confidence: { low: 2.8, high: 4.0 },
  },
  'mistral-7b': {
    energyPerToken: 0.0000004, // kWh per token
    co2PerToken: 0.0002, // g CO₂e per token
    co2PerQuery: 1.5, // g CO₂e per average query
    confidence: { low: 1.2, high: 1.8 },
  },
};

const ALL_FACTORS = {
  digital: DIGITAL_FACTORS,
  transport: TRANSPORT_FACTORS,
  energy: ENERGY_FACTORS,
  ai: AI_FACTORS,
  other: {}, // Placeholder for other categories
};

/**
 * Get emission factor for a specific category and type
 */
export function getEmissionFactor(
  category: string,
  type: string
): EmissionFactor {
  const categoryFactors = ALL_FACTORS[category as keyof typeof ALL_FACTORS];
  if (!categoryFactors || typeof categoryFactors !== 'object') {
    throw new Error(`Unknown emission category: ${category}`);
  }

  const factor = (categoryFactors as Record<string, EmissionFactor>)[type];
  if (!factor) {
    throw new Error(`Unknown emission type: ${type} for category: ${category}`);
  }

  return factor;
}

/**
 * Get all available factors
 */
export function getAllFactors() {
  return ALL_FACTORS;
}

/**
 * List available types for a category
 */
export function getAvailableTypes(category: string): string[] {
  const categoryFactors = ALL_FACTORS[category as keyof typeof ALL_FACTORS];
  return categoryFactors ? Object.keys(categoryFactors) : [];
}

/**
 * Get AI emission factor with fuzzy matching
 * Examples:
 * - "gpt-3.5-turbo" → "gpt-3.5"
 * - "gpt-4-turbo" → "gpt-4"
 * - "claude-2.1" → "claude-2"
 * - "gemini-pro-vision" → "gemini-pro"
 */
export function getAIFactor(model: string): AIEmissionFactor | null {
  const normalizedModel = model.toLowerCase();
  
  // Direct match first
  if (AI_FACTORS[normalizedModel]) {
    return AI_FACTORS[normalizedModel];
  }
  
  // Fuzzy matching patterns
  const patterns = [
    // GPT models
    { pattern: /gpt-?3\.?5/, key: 'gpt-3.5' },
    { pattern: /gpt-?4/, key: 'gpt-4' },
    { pattern: /gpt-?3/, key: 'gpt-3.5' }, // fallback for GPT-3
    
    // Claude models
    { pattern: /claude-?2/, key: 'claude-2' },
    { pattern: /claude-?3/, key: 'claude-3' },
    { pattern: /claude(?!-[0-9])/, key: 'claude-3' }, // default to latest
    
    // Gemini models
    { pattern: /gemini-?pro/, key: 'gemini-pro' },
    { pattern: /gemini/, key: 'gemini-pro' },
    
    // Llama models
    { pattern: /llama-?2/, key: 'llama-2' },
    { pattern: /llama/, key: 'llama-2' },
    
    // PaLM models
    { pattern: /palm-?2/, key: 'palm-2' },
    { pattern: /palm/, key: 'palm-2' },
    
    // Mistral models
    { pattern: /mistral-?7b/, key: 'mistral-7b' },
    { pattern: /mistral/, key: 'mistral-7b' },
  ];
  
  for (const { pattern, key } of patterns) {
    if (pattern.test(normalizedModel)) {
      return AI_FACTORS[key] || null;
    }
  }
  
  return null;
}

/**
 * Export AI factors for direct access
 */
export { AI_FACTORS };
