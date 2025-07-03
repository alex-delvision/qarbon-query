/**
 * Configuration utilities for QarbonQuery SDK
 */

export interface SDKConfig {
  apiKey?: string;
  endpoint?: string;
  enableAnalytics?: boolean;
  debug?: boolean;
  version?: string;
}

export const DEFAULT_CONFIG: SDKConfig = {
  endpoint: 'https://api.qarbon.query',
  enableAnalytics: true,
  debug: false,
  version: '1.0.0',
};

/**
 * Validate SDK configuration
 */
export function validateConfig(config: SDKConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.endpoint && !isValidUrl(config.endpoint)) {
    errors.push('Invalid endpoint URL');
  }

  if (config.apiKey && config.apiKey.length < 10) {
    errors.push('API key too short');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Merge configuration with defaults
 */
export function mergeConfig(userConfig: Partial<SDKConfig>): SDKConfig {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
  };
}

/**
 * Simple URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Environment-specific configurations
 */
export const ENVIRONMENTS = {
  development: {
    endpoint: 'http://localhost:3000/api',
    debug: true,
    enableAnalytics: false,
  },
  staging: {
    endpoint: 'https://staging-api.qarbon.query',
    debug: false,
    enableAnalytics: true,
  },
  production: {
    endpoint: 'https://api.qarbon.query',
    debug: false,
    enableAnalytics: true,
  },
} as const;

export type Environment = keyof typeof ENVIRONMENTS;
