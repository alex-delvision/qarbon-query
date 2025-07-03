// Jest setup file for UI package
import '@testing-library/jest-dom';

// Configure testing library
import { configure } from '@testing-library/react';

configure({
  testIdAttribute: 'data-testid',
});

// Mock CSS modules
jest.mock('*.module.css', () => ({}));
jest.mock('*.module.scss', () => ({}));
