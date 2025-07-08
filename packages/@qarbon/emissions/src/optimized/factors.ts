// Auto-generated optimized factor lookups
// Generated at: 2025-07-04T12:25:23.228Z

export const OPTIMIZED_AI_FACTORS = new Map<string, any>([
  [
    'gpt-4',
    {
      co2PerToken: 0.0045,
      co2PerQuery: 4.5,
      confidence: { low: 3, high: 6 },
      source: 'OpenAI Energy Report 2024',
      lastUpdated: '2024-01-01',
    },
  ],
  [
    'gpt-3.5-turbo',
    {
      co2PerToken: 0.0022,
      co2PerQuery: 2.2,
      confidence: { low: 1.5, high: 3 },
      source: 'OpenAI Energy Report 2024',
      lastUpdated: '2024-01-01',
    },
  ],
  [
    'claude-v1',
    {
      co2PerToken: 0.0006,
      co2PerQuery: 0.6,
      confidence: { low: 0.4, high: 0.8 },
      source: 'Anthropic Sustainability Report 2024',
      lastUpdated: '2024-01-01',
    },
  ],
  [
    'claude-instant',
    {
      co2PerToken: 0.0003,
      co2PerQuery: 0.3,
      confidence: { low: 0.2, high: 0.5 },
      source: 'Anthropic Sustainability Report 2024',
      lastUpdated: '2024-01-01',
    },
  ],
  [
    'gemini-pro',
    {
      co2PerToken: 0.00035,
      co2PerQuery: 0.35,
      confidence: { low: 0.25, high: 0.45 },
      source: 'Google AI Environmental Impact 2024',
      lastUpdated: '2024-01-01',
    },
  ],
]);

export const OPTIMIZED_CLOUD_FACTORS = new Map<string, any>([
  [
    't3.micro',
    {
      co2PerHour: 0.012,
      confidence: { low: 0.01, high: 0.015 },
      provider: 'aws',
      vcpu: 2,
      memory: 1,
      source: 'AWS Sustainability Report 2024',
    },
  ],
  [
    't3.small',
    {
      co2PerHour: 0.024,
      confidence: { low: 0.02, high: 0.03 },
      provider: 'aws',
      vcpu: 2,
      memory: 2,
      source: 'AWS Sustainability Report 2024',
    },
  ],
  [
    't3.medium',
    {
      co2PerHour: 0.048,
      confidence: { low: 0.04, high: 0.06 },
      provider: 'aws',
      vcpu: 2,
      memory: 4,
      source: 'AWS Sustainability Report 2024',
    },
  ],
  [
    's3-standard',
    {
      co2PerGBMonth: 0.00001,
      confidence: { low: 0.000008, high: 0.000012 },
      provider: 'aws',
      storageType: 'object',
      source: 'AWS Sustainability Report 2024',
    },
  ],
  [
    'internet-egress',
    {
      co2PerGB: 0.006,
      confidence: { low: 0.004, high: 0.008 },
      transferType: 'egress',
      source: 'Carbon Trust Digital Carbon Footprint 2024',
    },
  ],
]);

export const OPTIMIZED_CRYPTO_FACTORS = new Map<string, any>([
  [
    'bitcoin',
    {
      co2PerTransaction: 707,
      co2PerHashPerHour: 0.0000015,
      confidence: { low: 600, high: 850 },
      consensusMechanism: 'proof-of-work',
      source: 'Cambridge Bitcoin Electricity Consumption Index 2024',
    },
  ],
  [
    'ethereum',
    {
      co2PerTransaction: 0.0212,
      co2PerStakedTokenPerHour: 0.000001,
      confidence: { low: 0.015, high: 0.03 },
      consensusMechanism: 'proof-of-stake',
      source: 'Ethereum Foundation Environmental Report 2024',
    },
  ],
  [
    'litecoin',
    {
      co2PerTransaction: 18.5,
      co2PerHashPerHour: 2.5e-7,
      confidence: { low: 15, high: 22 },
      consensusMechanism: 'proof-of-work',
      source: 'Litecoin Foundation Environmental Analysis 2024',
    },
  ],
  [
    'dogecoin',
    {
      co2PerTransaction: 0.12,
      co2PerHashPerHour: 8e-8,
      confidence: { low: 0.1, high: 0.15 },
      consensusMechanism: 'proof-of-work',
      source: 'Independent Cryptocurrency Research 2024',
    },
  ],
  [
    'solana',
    {
      co2PerTransaction: 0.00051,
      co2PerStakedTokenPerHour: 1e-7,
      confidence: { low: 0.0004, high: 0.0007 },
      consensusMechanism: 'proof-of-stake',
      source: 'Solana Foundation Environmental Report 2024',
    },
  ],
  [
    'cardano',
    {
      co2PerTransaction: 0.0012,
      co2PerStakedTokenPerHour: 2e-7,
      confidence: { low: 0.001, high: 0.0015 },
      consensusMechanism: 'proof-of-stake',
      source: 'Cardano Foundation Sustainability Report 2024',
    },
  ],
]);

export const OPTIMIZED_GRID_FACTORS = new Map<string, number>([
  ['us-east-1', 0.42],
  ['us-west-2', 0.13],
  ['eu-west-1', 0.25],
  ['eu-north-1', 0.04],
  ['ap-southeast-1', 0.59],
  ['ap-south-1', 0.75],
  ['ca-central-1', 0.08],
  ['us-west-1', 0.17],
  ['eu-central-1', 0.34],
  ['ap-northeast-1', 0.5],
  ['sa-east-1', 0.28],
  ['ap-southeast-2', 0.62],
  ['eu-south-1', 0.31],
  ['af-south-1', 0.85],
  ['me-south-1', 0.72],
]);

// Pre-computed region multipliers for common regions
export const REGION_MULTIPLIERS = new Map<string, number>([
  ['us-east-1', 1.0],
  ['us-west-2', 0.3],
  ['eu-west-1', 0.6],
  ['eu-north-1', 0.1],
  ['ap-southeast-1', 1.4],
  ['ap-south-1', 1.8],
  ['ca-central-1', 0.2],
  ['us-west-1', 0.4],
  ['eu-central-1', 0.8],
  ['ap-northeast-1', 1.2],
]);

// Fast lookup functions
export function getOptimizedAIFactor(model: string): any | null {
  return (
    OPTIMIZED_AI_FACTORS.get(model) ||
    OPTIMIZED_AI_FACTORS.get(model.toLowerCase()) ||
    null
  );
}

export function getOptimizedCloudFactor(instanceType: string): any | null {
  return (
    OPTIMIZED_CLOUD_FACTORS.get(instanceType) ||
    OPTIMIZED_CLOUD_FACTORS.get(instanceType.toLowerCase()) ||
    null
  );
}

export function getOptimizedCryptoFactor(currency: string): any | null {
  return (
    OPTIMIZED_CRYPTO_FACTORS.get(currency) ||
    OPTIMIZED_CRYPTO_FACTORS.get(currency.toLowerCase()) ||
    null
  );
}

export function getRegionMultiplier(region: string): number {
  return (
    REGION_MULTIPLIERS.get(region) ||
    REGION_MULTIPLIERS.get(region.toLowerCase()) ||
    1.0
  );
}

// Batch calculation utilities
export function calculateBatchAI(
  inputs: Array<{ tokens: number; model: string; region?: string }>
): Float32Array {
  const results = new Float32Array(inputs.length);

  for (let i = 0; i < inputs.length; i++) {
    const { tokens, model, region = 'us-east-1' } = inputs[i];
    const factor = getOptimizedAIFactor(model);
    const regionMultiplier = getRegionMultiplier(region);

    if (factor) {
      results[i] = tokens * factor.co2PerToken * regionMultiplier;
    } else {
      results[i] = 0;
    }
  }

  return results;
}

export function calculateBatchCloud(
  inputs: Array<{ hours: number; instanceType: string; region?: string }>
): Float32Array {
  const results = new Float32Array(inputs.length);

  for (let i = 0; i < inputs.length; i++) {
    const { hours, instanceType, region = 'us-east-1' } = inputs[i];
    const factor = getOptimizedCloudFactor(instanceType);
    const regionMultiplier = getRegionMultiplier(region);

    if (factor) {
      results[i] = hours * factor.co2PerHour * regionMultiplier;
    } else {
      results[i] = 0;
    }
  }

  return results;
}
