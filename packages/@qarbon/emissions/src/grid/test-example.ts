/**
 * Example usage of GridIntensityManager
 * This file demonstrates the functionality and can be removed in production
 */

import { GridIntensityManager } from './intensity-manager';

// Example usage
async function demonstrateGridIntensityManager() {
  const manager = new GridIntensityManager();

  console.log('GridIntensityManager Demo');
  console.log('========================');

  // Test basic region lookup
  const timestamp = new Date();
  const virginiaIntensity = await manager.getIntensity('virginia', timestamp);
  console.log('Virginia intensity:', virginiaIntensity);

  // Test datacenter lookup
  try {
    const awsUsEast1 = await manager.getIntensityByDatacenter(
      'us-east-1',
      timestamp
    );
    console.log('AWS us-east-1 intensity:', awsUsEast1);
  } catch (error) {
    console.error('Datacenter lookup error:', error);
  }

  // Test supported datacenters
  const supportedDatacenters = manager.getSupportedDatacenters();
  console.log(
    'Supported datacenters:',
    supportedDatacenters.slice(0, 5),
    '...'
  );

  // Test caching (second call should be faster)
  const startTime = Date.now();
  await manager.getIntensity('virginia', timestamp);
  const cachedTime = Date.now() - startTime;
  console.log(`Cached lookup took: ${cachedTime}ms`);

  // Clear cache
  manager.clearCache();
  console.log('Cache cleared');
}

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateGridIntensityManager().catch(console.error);
}

export { demonstrateGridIntensityManager };
