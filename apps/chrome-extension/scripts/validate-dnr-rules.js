#!/usr/bin/env node

/**
 * DNR Rules Validation Script
 * Validates declarativeNetRequest rules for Chrome Manifest V3 compliance
 */

const fs = require('fs');
const path = require('path');

const DNR_RULES_PATH = path.join(__dirname, '../extension/dnr_rules.json');

console.log('🌐 Validating DNR Rules for Chrome Manifest V3 Compliance...\n');

// Valid resource types according to Chrome declarativeNetRequest API
const VALID_RESOURCE_TYPES = [
  "main_frame",
  "sub_frame", 
  "stylesheet",
  "script",
  "image",
  "font",
  "object",
  "xmlhttprequest",
  "ping",
  "csp_report",
  "media",
  "websocket",
  "webtransport",
  "webbundle",
  "other"
];

let passed = 0;
let failed = 0;

function check(description, testFn) {
  try {
    const result = testFn();
    if (result.success) {
      console.log(`✅ ${description}`);
      passed++;
    } else {
      console.log(`❌ ${description} - ${result.error}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${description} - Exception: ${error.message}`);
    failed++;
  }
}

// Check if DNR rules file exists
check('DNR rules file exists', () => {
  if (!fs.existsSync(DNR_RULES_PATH)) {
    return { success: false, error: 'dnr_rules.json not found' };
  }
  return { success: true };
});

// Load and parse DNR rules
let rules;
check('DNR rules file is valid JSON', () => {
  try {
    const content = fs.readFileSync(DNR_RULES_PATH, 'utf8');
    rules = JSON.parse(content);
    return { success: true };
  } catch (error) {
    return { success: false, error: `JSON parse error: ${error.message}` };
  }
});

if (rules) {
  // Check rules structure
  check('DNR rules is an array', () => {
    if (!Array.isArray(rules)) {
      return { success: false, error: 'Rules must be an array' };
    }
    return { success: true };
  });

  check('DNR rules array is not empty', () => {
    if (rules.length === 0) {
      return { success: false, error: 'Rules array is empty' };
    }
    return { success: true };
  });

  // Validate each rule
  rules.forEach((rule, index) => {
    const ruleNum = index + 1;

    check(`Rule ${ruleNum} has required id field`, () => {
      if (!rule.id) {
        return { success: false, error: 'Missing id field' };
      }
      if (typeof rule.id !== 'number') {
        return { success: false, error: 'id must be a number' };
      }
      return { success: true };
    });

    check(`Rule ${ruleNum} has required action field`, () => {
      if (!rule.action) {
        return { success: false, error: 'Missing action field' };
      }
      return { success: true };
    });

    check(`Rule ${ruleNum} has required condition field`, () => {
      if (!rule.condition) {
        return { success: false, error: 'Missing condition field' };
      }
      return { success: true };
    });

    if (rule.action) {
      check(`Rule ${ruleNum} action type is valid`, () => {
        const validActionTypes = ['block', 'redirect', 'allow', 'upgradeScheme', 'modifyHeaders'];
        if (!validActionTypes.includes(rule.action.type)) {
          return { success: false, error: `Invalid action type: ${rule.action.type}` };
        }
        return { success: true };
      });
    }

    if (rule.condition) {
      check(`Rule ${ruleNum} has urlFilter or initiatorDomains`, () => {
        if (!rule.condition.urlFilter && !rule.condition.initiatorDomains) {
          return { success: false, error: 'Must have urlFilter or initiatorDomains' };
        }
        return { success: true };
      });

      if (rule.condition.resourceTypes) {
        check(`Rule ${ruleNum} uses valid resource types only`, () => {
          const invalidTypes = rule.condition.resourceTypes.filter(
            type => !VALID_RESOURCE_TYPES.includes(type)
          );
          
          if (invalidTypes.length > 0) {
            return { 
              success: false, 
              error: `Invalid resource types: ${invalidTypes.join(', ')}. Valid types: ${VALID_RESOURCE_TYPES.join(', ')}` 
            };
          }
          return { success: true };
        });

        check(`Rule ${ruleNum} does not use "fetch" resource type`, () => {
          if (rule.condition.resourceTypes.includes('fetch')) {
            return { 
              success: false, 
              error: '"fetch" is not a valid resource type. Use "xmlhttprequest" for API calls' 
            };
          }
          return { success: true };
        });
      }
    }
  });

  // Check for duplicate rule IDs
  check('No duplicate rule IDs', () => {
    const ids = rules.map(rule => rule.id);
    const uniqueIds = [...new Set(ids)];
    
    if (ids.length !== uniqueIds.length) {
      return { success: false, error: 'Duplicate rule IDs found' };
    }
    return { success: true };
  });

  // Check rule priorities
  check('Rule priorities are reasonable', () => {
    const priorities = rules.map(rule => rule.priority).filter(p => p !== undefined);
    const maxPriority = Math.max(...priorities);
    
    if (maxPriority > 100) {
      return { success: false, error: 'Very high rule priorities may cause issues' };
    }
    return { success: true };
  });

  // AI Provider coverage check
  const expectedProviders = [
    'api.openai.com',
    'api.anthropic.com',
    'generativelanguage.googleapis.com',
    'bedrock',
    'claude.ai'
  ];

  expectedProviders.forEach(provider => {
    check(`Has rule for ${provider}`, () => {
      const hasRule = rules.some(rule => 
        rule.condition.urlFilter && rule.condition.urlFilter.includes(provider)
      );
      
      if (!hasRule) {
        return { success: false, error: `No rule found for ${provider}` };
      }
      return { success: true };
    });
  });
}

console.log('\n📊 DNR Rules Validation Summary:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 All DNR rules validation checks passed!');
  console.log('✨ Rules are Chrome Manifest V3 compliant and ready for use.');
  process.exit(0);
} else {
  console.log('\n❌ DNR rules validation failed. Please fix the issues above.');
  process.exit(1);
}
