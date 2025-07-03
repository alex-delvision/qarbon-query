/**
 * Carbon accounting methodologies and standards
 */

export interface Methodology {
  name: string;
  version: string;
  description: string;
  accuracy: number; // 0-1 scale
  scope: string[];
}

export const METHODOLOGIES: Record<string, Methodology> = {
  'qarbon-v1': {
    name: 'QarbonQuery Standard v1',
    version: '1.0.0',
    description: 'QarbonQuery proprietary carbon accounting methodology',
    accuracy: 0.85,
    scope: ['digital', 'transport', 'energy', 'other'],
  },
  'ghg-protocol': {
    name: 'GHG Protocol',
    version: '2015',
    description: 'Greenhouse Gas Protocol Corporate Standard',
    accuracy: 0.95,
    scope: ['transport', 'energy', 'other'],
  },
  'iso-14064': {
    name: 'ISO 14064',
    version: '2018',
    description: 'International standard for GHG quantification and reporting',
    accuracy: 0.92,
    scope: ['transport', 'energy', 'other'],
  },
};

/**
 * Get methodology by name
 */
export function getMethodology(name: string): Methodology {
  const methodology = METHODOLOGIES[name];
  if (!methodology) {
    throw new Error(`Unknown methodology: ${name}`);
  }
  return methodology;
}

/**
 * List all available methodologies
 */
export function listMethodologies(): Methodology[] {
  return Object.values(METHODOLOGIES);
}

/**
 * Find best methodology for given scope
 */
export function getBestMethodology(requiredScope: string[]): Methodology {
  const filtered = listMethodologies()
    .filter(m => requiredScope.every(scope => m.scope.includes(scope)))
    .sort((a, b) => b.accuracy - a.accuracy);

  if (filtered.length > 0) {
    return filtered[0]!;
  }

  const fallback = METHODOLOGIES['qarbon-v1'];
  if (!fallback) {
    throw new Error('Default methodology not found');
  }

  return fallback;
}
