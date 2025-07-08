/**
 * Lazy Loading Example
 * Demonstrates how to load specific calculators only when needed
 */

class LazyEmissionsCalculator {
  constructor() {
    this.calculators = new Map();
  }

  async getAICalculator() {
    if (!this.calculators.has('ai')) {
      const { aiCalculator } = await import('qarbon-emissions/ai');
      this.calculators.set('ai', aiCalculator);
    }
    return this.calculators.get('ai');
  }

  async getCloudCalculator() {
    if (!this.calculators.has('cloud')) {
      const { cloudCalculator } = await import('qarbon-emissions/cloud');
      this.calculators.set('cloud', cloudCalculator);
    }
    return this.calculators.get('cloud');
  }

  async getCryptoCalculator() {
    if (!this.calculators.has('crypto')) {
      const { cryptoCalculator } = await import('qarbon-emissions/crypto');
      this.calculators.set('crypto', cryptoCalculator);
    }
    return this.calculators.get('crypto');
  }

  async calculateAI(tokens, model) {
    const calculator = await this.getAICalculator();
    return calculator.calculateTokenEmissions(tokens, model);
  }

  async calculateCloud(hours, instanceType, options) {
    const calculator = await this.getCloudCalculator();
    return calculator.calculateComputeEmissions(hours, instanceType, options);
  }

  async calculateCrypto(transactions, currency, options) {
    const calculator = await this.getCryptoCalculator();
    return calculator.calculateTransactionEmissions(
      transactions,
      currency,
      options
    );
  }
}

// Usage example
const calculator = new LazyEmissionsCalculator();

// Only loads the AI bundle when needed
const aiEmission = await calculator.calculateAI(1000, 'gpt-4');
console.log('AI Emission:', aiEmission);

// Only loads the cloud bundle when needed
const cloudEmission = await calculator.calculateCloud(5, 't3.micro', {
  region: 'us-west-2',
});
console.log('Cloud Emission:', cloudEmission);

export { LazyEmissionsCalculator };
