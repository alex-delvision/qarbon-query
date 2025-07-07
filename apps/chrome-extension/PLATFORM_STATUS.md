# QarbonQuery Platform Support Status

## ✅ Working Platforms (3/4)

### ChatGPT ✅
- Method: Fetch interception
- Endpoint: `/backend-api/conversation`
- Status: Fully working

### Claude ✅
- Method: Fetch interception  
- Endpoints: `/completion`, `/append_message`
- Status: Fully working

### Gemini ✅
- Method: XHR interception
- Endpoint: `StreamGenerate`
- Status: Fully working

### Perplexity ❌
- Method: Would use fetch interception
- Endpoint: `/rest/sse/perplexity_ask`
- Status: **Disabled** - Service worker conflicts
- Issue: Complex service worker architecture interferes with fetch interception
- Solution: Excluded from tracking to prevent breaking functionality

## Summary
- 3 out of 4 major AI platforms successfully tracked
- ~75% coverage of major AI tools
- Stable, working implementation
