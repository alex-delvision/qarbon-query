# QarbonQuery v2.3 Test Results

## ✅ All Platforms Working

### ChatGPT (chat.openai.com)

- Endpoint: `/backend-api/conversation`
- Token calc: length / 4
- Status: ✅ WORKING

### Claude (claude.ai)

- Endpoint: `/completion`, `/append_message`
- Token calc: length / 3.5
- Status: ✅ WORKING

### Gemini (gemini.google.com)

- Endpoint: `StreamGenerate` (XHR)
- Token calc: length / 4
- Status: ✅ WORKING
- Sample: 0.0015g CO₂e (756 tokens)

### Perplexity (perplexity.ai)

- Endpoint: `/rest/sse/perplexity_ask`
- Token calc: length / 4
- Status: ⚠️ Site down during testing

## Emission Formula

- All platforms: (tokens / 1000) \* 0.002 g CO₂e
- Storage: Daily totals in localStorage

## Next Steps

1. Test Perplexity when site is back up
2. Add monthly view to popup
3. Add export functionality
