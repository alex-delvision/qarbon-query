import { createClient } from '@qarbon/sdk';

/**
 * QarbonQuery Web Dashboard
 * Basic implementation without React for build testing
 */

// Initialize the client
const qarbon = createClient({
  enableAnalytics: true,
  debug: true,
});

// Export dashboard configuration
export const dashboardConfig = {
  title: 'QarbonQuery Web Dashboard',
  version: '0.1.0',
  client: qarbon,
};

// Sample tracking function
export async function trackSampleEmission() {
  const emission = await qarbon.trackDigital({
    dataTransfer: 2.5,
    timeSpent: 10,
    deviceType: 'desktop',
  });

  console.warn('Tracked emission:', emission);
  return emission;
}

export default dashboardConfig;
