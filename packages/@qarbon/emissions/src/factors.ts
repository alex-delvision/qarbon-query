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
  'llama-2-7b': {
    energyPerToken: 0.00000055,
    co2PerToken: 0.00028,
    confidence: { low: 0.00024, high: 0.00032 },
  },
  'llama-2-13b': {
    energyPerToken: 0.00000065,
    co2PerToken: 0.00031,
    confidence: { low: 0.00027, high: 0.00035 },
  },
  'llama-2-70b': {
    energyPerToken: 0.00000175,
    co2PerToken: 0.00102,
    confidence: { low: 0.0009, high: 0.00114 },
  },
  'mistral-8x7b': {
    energyPerToken: 0.00000078,
    co2PerToken: 0.00035,
    confidence: { low: 0.0003, high: 0.0004 },
  },
  'falcon-7b': {
    energyPerToken: 0.00000045,
    co2PerToken: 0.00022,
    confidence: { low: 0.00019, high: 0.00025 },
  },
  'falcon-40b': {
    energyPerToken: 0.00000145,
    co2PerToken: 0.00078,
    confidence: { low: 0.0007, high: 0.00086 },
  },
  'bloom-176b': {
    energyPerToken: 0.0000041,
    co2PerToken: 0.0023,
    confidence: { low: 0.002, high: 0.0026 },
  },
  stablediffusion: {
    energyPerToken: 0.0000029,
    co2PerToken: 0.0016,
    confidence: { low: 0.0014, high: 0.0018 },
  },
  whisper: {
    energyPerToken: 0.000002,
    co2PerToken: 0.0011,
    confidence: { low: 0.001, high: 0.0012 },
  },
  'dalle-3': {
    energyPerToken: 0.0000031,
    co2PerToken: 0.00176,
    confidence: { low: 0.0015, high: 0.002 },
  },
  midjourney: {
    energyPerToken: 0.0000024,
    co2PerToken: 0.0013,
    confidence: { low: 0.0011, high: 0.0015 },
  },
  'phi-2': {
    energyPerToken: 0.0000013,
    co2PerToken: 0.0007,
    confidence: { low: 0.0006, high: 0.0008 },
  },
  'gemini-nano': {
    energyPerToken: 0.00000017,
    co2PerToken: 0.00009,
    confidence: { low: 0.00008, high: 0.0001 },
  },
  tinyllama: {
    energyPerToken: 0.0000002,
    co2PerToken: 0.00011,
    confidence: { low: 0.0001, high: 0.00012 },
  },
  'gpt-4-us': {
    energyPerToken: 0.0000026,
    co2PerToken: 0.0013,
    confidence: { low: 0.0012, high: 0.0014 },
  },
  'gpt-4-eu': {
    energyPerToken: 0.0000026,
    co2PerToken: 0.00078,
    confidence: { low: 0.0007, high: 0.00086 },
  },
  'gpt-4-asia': {
    energyPerToken: 0.0000026,
    co2PerToken: 0.0011,
    confidence: { low: 0.001, high: 0.0012 },
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
    return AI_FACTORS[normalizedModel] || null;
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
    { pattern: /llama-?2-?7b/, key: 'llama-2-7b' },
    { pattern: /llama-?2-?13b/, key: 'llama-2-13b' },
    { pattern: /llama-?2-?70b/, key: 'llama-2-70b' },
    { pattern: /mistral-?8x7b/, key: 'mistral-8x7b' },
    { pattern: /falcon-?7b/, key: 'falcon-7b' },
    { pattern: /falcon-?40b/, key: 'falcon-40b' },
    { pattern: /bloom-?176b/, key: 'bloom-176b' },
    { pattern: /stablediffusion/, key: 'stablediffusion' },
    { pattern: /whisper/, key: 'whisper' },
    { pattern: /dalle-?3/, key: 'dalle-3' },
    { pattern: /midjourney/, key: 'midjourney' },
    { pattern: /phi-?2/, key: 'phi-2' },
    { pattern: /gemini-?nano/, key: 'gemini-nano' },
    { pattern: /tinyllama/, key: 'tinyllama' },
    { pattern: /gpt-?4-?us/, key: 'gpt-4-us' },
    { pattern: /gpt-?4-?eu/, key: 'gpt-4-eu' },
    { pattern: /gpt-?4-?asia/, key: 'gpt-4-asia' },
  ];

  for (const { pattern, key } of patterns) {
    if (pattern.test(normalizedModel)) {
      return AI_FACTORS[key] || null;
    }
  }

  return null;
}

/**
 * Get cloud factor for instance type
 */
export function getCloudFactor(instanceType: string): any | null {
  // Use the digital factors for cloud compute
  return DIGITAL_FACTORS[instanceType] || null;
}

/**
 * Basic crypto emission factors (should be updated with real data)
 */
const CRYPTO_FACTORS_DATA: Record<string, any> = {
  bitcoin: {
    co2PerTransaction: 707,
    co2PerHashPerHour: 0.0000015,
    confidence: { low: 600, high: 850 },
    consensusMechanism: 'proof-of-work',
  },
  ethereum: {
    co2PerTransaction: 0.0212,
    co2PerStakedTokenPerHour: 0.000001,
    confidence: { low: 0.015, high: 0.03 },
    consensusMechanism: 'proof-of-stake',
  },
  litecoin: {
    co2PerTransaction: 18.5,
    co2PerHashPerHour: 0.00000025,
    confidence: { low: 15, high: 22 },
    consensusMechanism: 'proof-of-work',
  },
};

/**
 * Get crypto factor for currency
 */
export function getCryptoFactor(currency: string): any | null {
  return CRYPTO_FACTORS_DATA[currency.toLowerCase()] || null;
}

/**
 * Export factor collections for direct access
 */
export { AI_FACTORS };
export const CLOUD_FACTORS = DIGITAL_FACTORS;
export const CRYPTO_FACTORS = CRYPTO_FACTORS_DATA;
