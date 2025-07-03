/**
 * AI Emissions Tracking Example
 * 
 * This example demonstrates how to track and calculate carbon emissions
 * from AI model usage, including uncertainty quantification and batch processing.
 */

const { EmissionsCalculator } = require('@qarbon/emissions');

// Sample AI usage data for different models and use cases
const aiUsageData = [
  {
    model: 'gpt-4',
    task: 'code_generation',
    tokens: 1500,
    session_id: 'session_001',
    user: 'developer_1',
    timestamp: '2023-07-15T10:30:00Z'
  },
  {
    model: 'gpt-3.5-turbo',
    task: 'text_completion',
    tokens: 800,
    session_id: 'session_002',
    user: 'writer_1',
    timestamp: '2023-07-15T10:35:00Z'
  },
  {
    model: 'claude-2',
    task: 'document_analysis',
    tokens: 2200,
    session_id: 'session_003',
    user: 'analyst_1',
    timestamp: '2023-07-15T10:40:00Z'
  },
  {
    model: 'gpt-4',
    task: 'data_analysis',
    tokens: 3000,
    session_id: 'session_004',
    user: 'data_scientist_1',
    timestamp: '2023-07-15T10:45:00Z'
  },
  {
    model: 'text-davinci-003',
    task: 'creative_writing',
    tokens: 1200,
    session_id: 'session_005',
    user: 'content_creator_1',
    timestamp: '2023-07-15T10:50:00Z'
  }
];

async function demonstrateAIEmissionsTracking() {
  console.log('🤖 AI Emissions Tracking Example');
  console.log('================================\n');

  const calculator = new EmissionsCalculator({
    enableOptimizations: true,
    enableUncertainty: true
  });

  // Example 1: Single AI inference calculation
  console.log('🧠 Example 1: Single AI Inference');
  console.log('----------------------------------');

  try {
    const singleInference = aiUsageData[0];
    console.log(`Processing ${singleInference.model} inference:`);
    console.log(`  Task: ${singleInference.task}`);
    console.log(`  Tokens: ${singleInference.tokens}`);
    console.log(`  User: ${singleInference.user}\n`);

    const result = await calculator.calculate({
      type: 'ai',
      tokens: singleInference.tokens,
      model: singleInference.model
    }, {
      includeUncertainty: true,
      uncertaintyOptions: {
        method: 'montecarlo',
        iterations: 5000,
        confidenceLevel: 95
      }
    });

    console.log(`📊 Results:`);
    console.log(`  Emissions: ${result.data.amount} ${result.data.unit} CO2`);
    if (result.data.uncertainty) {
      console.log(`  Uncertainty (95% CI): ${result.data.uncertainty.low} - ${result.data.uncertainty.high} ${result.data.unit}`);
      console.log(`  Mean: ${result.data.uncertainty.mean} ${result.data.unit}`);
    }
    console.log(`  Processing time: ${result.processingTime.toFixed(2)}ms`);
    console.log(`  Source: ${result.source}\n`);

  } catch (error) {
    console.error('❌ Single inference calculation error:', error.message);
  }

  // Example 2: Batch processing of AI usage data
  console.log('⚡ Example 2: Batch AI Processing');
  console.log('--------------------------------');

  try {
    console.log(`Processing ${aiUsageData.length} AI inferences in batch...\n`);

    const batchInputs = aiUsageData.map(usage => ({
      type: 'ai',
      tokens: usage.tokens,
      model: usage.model
    }));

    const batchStartTime = performance.now();
    const batchResults = await calculator.calculate(batchInputs, {
      batchSize: 10,
      includeUncertainty: false // Disable for faster batch processing
    });
    const batchEndTime = performance.now();

    console.log(`✅ Batch processing completed in ${(batchEndTime - batchStartTime).toFixed(2)}ms`);
    console.log(`   Average time per calculation: ${((batchEndTime - batchStartTime) / batchInputs.length).toFixed(2)}ms\n`);

    // Process results
    batchResults.forEach((result, index) => {
      const usage = aiUsageData[index];
      console.log(`📊 ${usage.model} (${usage.task}):`);
      console.log(`   Tokens: ${usage.tokens} → ${result.data.amount} ${result.data.unit} CO2`);
    });

    console.log('');

  } catch (error) {
    console.error('❌ Batch processing error:', error.message);
  }

  // Example 3: Model comparison analysis
  console.log('📈 Example 3: Model Comparison Analysis');
  console.log('--------------------------------------');

  try {
    const modelComparisonData = [
      { model: 'gpt-4', tokens: 1000 },
      { model: 'gpt-3.5-turbo', tokens: 1000 },
      { model: 'claude-2', tokens: 1000 },
      { model: 'text-davinci-003', tokens: 1000 }
    ];

    console.log('Comparing emissions for 1000 tokens across different models:\n');

    const comparisonResults = [];
    for (const comparison of modelComparisonData) {
      try {
        const result = await calculator.calculate({
          type: 'ai',
          tokens: comparison.tokens,
          model: comparison.model
        }, {
          includeUncertainty: true,
          uncertaintyOptions: {
            method: 'montecarlo',
            iterations: 3000,
            confidenceLevel: 95
          }
        });

        comparisonResults.push({
          model: comparison.model,
          tokens: comparison.tokens,
          emissions: result.data.amount,
          unit: result.data.unit,
          uncertainty: result.data.uncertainty
        });

        console.log(`🎯 ${comparison.model}:`);
        console.log(`   Emissions: ${result.data.amount} ${result.data.unit} CO2`);
        if (result.data.uncertainty) {
          console.log(`   Range: ${result.data.uncertainty.low} - ${result.data.uncertainty.high} ${result.data.unit}`);
          const confidenceWidth = result.data.uncertainty.high - result.data.uncertainty.low;
          console.log(`   Confidence width: ${confidenceWidth.toFixed(3)} ${result.data.unit}`);
        }
        console.log('');

      } catch (error) {
        console.error(`❌ Error calculating for ${comparison.model}:`, error.message);
      }
    }

    // Find most/least efficient models
    if (comparisonResults.length > 0) {
      const sortedByEmissions = comparisonResults.sort((a, b) => a.emissions - b.emissions);
      console.log('🏆 Model Efficiency Ranking (per 1000 tokens):');
      sortedByEmissions.forEach((result, index) => {
        const efficiency = index === 0 ? '🥇 Most efficient' : 
                          index === sortedByEmissions.length - 1 ? '🥉 Least efficient' : 
                          `#${index + 1}`;
        console.log(`   ${efficiency}: ${result.model} (${result.emissions} ${result.unit})`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Model comparison error:', error.message);
  }

  // Example 4: Usage tracking and reporting
  console.log('📊 Example 4: Usage Tracking & Reporting');
  console.log('---------------------------------------');

  try {
    // Track usage by user and task type
    const userEmissions = {};
    const taskEmissions = {};
    const modelEmissions = {};

    for (const usage of aiUsageData) {
      const result = await calculator.calculate({
        type: 'ai',
        tokens: usage.tokens,
        model: usage.model
      });

      const emissions = result.data.amount;

      // Track by user
      if (!userEmissions[usage.user]) {
        userEmissions[usage.user] = { totalEmissions: 0, totalTokens: 0, sessions: 0 };
      }
      userEmissions[usage.user].totalEmissions += emissions;
      userEmissions[usage.user].totalTokens += usage.tokens;
      userEmissions[usage.user].sessions += 1;

      // Track by task
      if (!taskEmissions[usage.task]) {
        taskEmissions[usage.task] = { totalEmissions: 0, totalTokens: 0, count: 0 };
      }
      taskEmissions[usage.task].totalEmissions += emissions;
      taskEmissions[usage.task].totalTokens += usage.tokens;
      taskEmissions[usage.task].count += 1;

      // Track by model
      if (!modelEmissions[usage.model]) {
        modelEmissions[usage.model] = { totalEmissions: 0, totalTokens: 0, count: 0 };
      }
      modelEmissions[usage.model].totalEmissions += emissions;
      modelEmissions[usage.model].totalTokens += usage.tokens;
      modelEmissions[usage.model].count += 1;
    }

    // Generate reports
    console.log('👥 Emissions by User:');
    Object.entries(userEmissions).forEach(([user, data]) => {
      const avgEmissionsPerToken = (data.totalEmissions / data.totalTokens).toFixed(6);
      console.log(`   ${user}: ${data.totalEmissions.toFixed(3)}g CO2 (${data.totalTokens} tokens, ${data.sessions} sessions)`);
      console.log(`     Average: ${avgEmissionsPerToken}g CO2/token`);
    });

    console.log('\n📋 Emissions by Task Type:');
    Object.entries(taskEmissions).forEach(([task, data]) => {
      const avgEmissionsPerTask = (data.totalEmissions / data.count).toFixed(3);
      console.log(`   ${task}: ${data.totalEmissions.toFixed(3)}g CO2 (${data.count} tasks)`);
      console.log(`     Average per task: ${avgEmissionsPerTask}g CO2`);
    });

    console.log('\n🤖 Emissions by Model:');
    Object.entries(modelEmissions).forEach(([model, data]) => {
      const avgEmissionsPerToken = (data.totalEmissions / data.totalTokens).toFixed(6);
      console.log(`   ${model}: ${data.totalEmissions.toFixed(3)}g CO2 (${data.count} uses)`);
      console.log(`     Efficiency: ${avgEmissionsPerToken}g CO2/token`);
    });

    // Calculate total organizational footprint
    const totalEmissions = Object.values(userEmissions).reduce((sum, user) => sum + user.totalEmissions, 0);
    const totalTokens = Object.values(userEmissions).reduce((sum, user) => sum + user.totalTokens, 0);

    console.log('\n🌍 Total Organizational AI Footprint:');
    console.log(`   Total Emissions: ${totalEmissions.toFixed(3)}g CO2`);
    console.log(`   Total Tokens: ${totalTokens.toLocaleString()}`);
    console.log(`   Average Efficiency: ${(totalEmissions / totalTokens).toFixed(6)}g CO2/token`);
    console.log(`   Equivalent to: ${(totalEmissions / 1000000).toFixed(6)} kg CO2`);

  } catch (error) {
    console.error('❌ Usage tracking error:', error.message);
  }

  // Example 5: Real-time monitoring simulation
  console.log('\n🔄 Example 5: Real-time Monitoring Simulation');
  console.log('--------------------------------------------');

  await simulateRealTimeAIMonitoring(calculator);

  console.log('\n✅ AI emissions tracking demonstration complete!');
}

async function simulateRealTimeAIMonitoring(calculator) {
  console.log('🎬 Simulating real-time AI usage monitoring...\n');

  const models = ['gpt-4', 'gpt-3.5-turbo', 'claude-2'];
  const tasks = ['chat', 'code_gen', 'analysis', 'summary'];
  const users = ['user_1', 'user_2', 'user_3', 'user_4'];

  // Simulate 10 AI inferences over time
  for (let i = 0; i < 10; i++) {
    const model = models[Math.floor(Math.random() * models.length)];
    const task = tasks[Math.floor(Math.random() * tasks.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const tokens = Math.floor(Math.random() * 2000) + 500; // 500-2500 tokens

    try {
      const startTime = performance.now();
      const result = await calculator.calculate({
        type: 'ai',
        tokens,
        model
      });
      const endTime = performance.now();

      console.log(`🔍 Real-time inference ${i + 1}:`);
      console.log(`   User: ${user} | Task: ${task} | Model: ${model}`);
      console.log(`   Tokens: ${tokens} → ${result.data.amount} ${result.data.unit} CO2`);
      console.log(`   Processing: ${(endTime - startTime).toFixed(2)}ms`);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Real-time inference ${i + 1} failed:`, error.message);
    }
  }

  console.log('\n⚡ Real-time monitoring simulation complete');
}

// Utility function to calculate emissions for a specific model and token count
async function calculateModelEmissions(calculator, model, tokens, options = {}) {
  try {
    const result = await calculator.calculate({
      type: 'ai',
      tokens,
      model
    }, options);

    return {
      success: true,
      model,
      tokens,
      emissions: result.data.amount,
      unit: result.data.unit,
      uncertainty: result.data.uncertainty,
      processingTime: result.processingTime
    };
  } catch (error) {
    return {
      success: false,
      model,
      tokens,
      error: error.message
    };
  }
}

// Utility function to estimate monthly AI emissions based on usage patterns
function estimateMonthlyAIEmissions(dailyUsageData) {
  const dailyTotal = dailyUsageData.reduce((sum, usage) => sum + usage.emissions, 0);
  const weeklyTotal = dailyTotal * 7;
  const monthlyTotal = dailyTotal * 30;
  const yearlyTotal = dailyTotal * 365;

  return {
    daily: dailyTotal,
    weekly: weeklyTotal,
    monthly: monthlyTotal,
    yearly: yearlyTotal,
    unit: dailyUsageData[0]?.unit || 'g'
  };
}

// Example usage of utility functions
async function demonstrateUtilityFunctions() {
  console.log('\n🔧 Utility Functions Demo');
  console.log('-------------------------');

  const calculator = new EmissionsCalculator();

  // Test model emissions calculation
  const modelResult = await calculateModelEmissions(calculator, 'gpt-4', 1000);
  console.log('📊 Model calculation result:', modelResult);

  // Test monthly estimation
  const sampleDailyData = [
    { emissions: 50.2, unit: 'g' },
    { emissions: 75.8, unit: 'g' },
    { emissions: 30.1, unit: 'g' }
  ];
  const monthlyEstimate = estimateMonthlyAIEmissions(sampleDailyData);
  console.log('📅 Monthly emission estimate:', monthlyEstimate);
}

// Run the example
if (require.main === module) {
  demonstrateAIEmissionsTracking()
    .then(() => demonstrateUtilityFunctions())
    .catch(console.error);
}

module.exports = { 
  demonstrateAIEmissionsTracking,
  calculateModelEmissions,
  estimateMonthlyAIEmissions,
  simulateRealTimeAIMonitoring
};
