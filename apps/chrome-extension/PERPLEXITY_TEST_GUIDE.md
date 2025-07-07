# Perplexity Testing Guide

## 🎯 Current Status
- ✅ Manifest includes Perplexity domains
- ✅ Host permissions configured
- ✅ Test script is active
- 📋 Ready for testing

## 🧪 Test Procedure

### Step 1: Verify Extension Setup
```bash
# Check current version
./switch-debug.sh current

# Ensure test version is active
./switch-debug.sh perplexity-test
```

### Step 2: Reload Extension
1. Go to `chrome://extensions/`
2. Find "QarbonQuery" 
3. Click the reload button 🔄
4. Verify version shows v2.3.3

### Step 3: Open Developer Console
1. Press F12 to open DevTools
2. Go to Console tab
3. Clear console for clean testing

### Step 4: Test on Perplexity
1. Navigate to https://perplexity.ai
2. Look for initial logs:
   ```
   🔍 Perplexity Debug Test - Minimal Interception
   📍 On Perplexity - Setting up minimal interception
   ✅ Minimal Perplexity test ready
   ```

### Step 5: Monitor Network Activity
1. Send a test query: "What is artificial intelligence?"
2. Watch console for:
   ```
   Fetch called: [various URLs]
   🎯 SSE endpoint detected!
   💚 Perplexity query tracked (delayed)
   ```

### Step 6: Verify Tracking
```javascript
// Run in console
localStorage.getItem('qarbon_emissions')
```

## 🔬 Test Variations

### Test 1: Minimal Fetch Interception
```bash
./switch-debug.sh perplexity-test
```
**Expected:** Logs all fetch calls, detects SSE endpoint

### Test 2: Ultra-Minimal DOM Tracking
```bash
./switch-debug.sh perplexity-ultra
```
**Expected:** No fetch interception, DOM-based detection

### Test 3: Fallback to Stable
```bash
./switch-debug.sh clean
```
**Expected:** Works perfectly on other 3 platforms

## 📊 Success Criteria

### ✅ Minimal Success
- Extension loads without errors
- Perplexity functionality not broken
- Some form of query detection

### 🎯 Full Success  
- SSE endpoint detected
- Emissions recorded in localStorage
- No interference with streaming

### 🚨 Failure Indicators
- Console errors
- Perplexity stops working
- Infinite loading/broken responses

## 🛠️ Troubleshooting

### If Extension Doesn't Load:
- Check manifest syntax
- Verify permissions
- Reload extension

### If No Logs Appear:
- Confirm script is running
- Check console for errors
- Verify domain matching

### If Perplexity Breaks:
- Immediately switch to clean version
- Report what was happening when it broke
- Check for console errors

## 📋 Results Template

```
Test Date: ___________
Test Version: ___________

Initial Load:
[ ] Extension loads successfully
[ ] Console shows setup messages
[ ] No errors in console

Network Monitoring:
[ ] Fetch calls are logged
[ ] SSE endpoint detected
[ ] Tracking executes

Functionality Check:
[ ] Perplexity search works normally
[ ] Results display correctly
[ ] No broken streaming

Emissions Tracking:
[ ] localStorage updated
[ ] Correct emission values
[ ] Daily totals accumulate

Overall Result: ___________
Notes: ___________
```

Use this guide to systematically test Perplexity integration!
