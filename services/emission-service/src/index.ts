/**
 * QarbonQuery Emission Service
 */

import { EmissionsCalculator } from '@qarbon/emissions';

const calculator = new EmissionsCalculator();

export const service = {
  name: 'QarbonQuery Emission Service',
  version: '0.1.0',
  calculator,
};

console.log('QarbonQuery Emission Service starting...');
