# QarbonQuery Working Configuration

## Verified Working Setup (DO NOT MODIFY WITHOUT BACKUP)

### Chrome Extension Structure:
extension/
├── manifest.json  (124 lines - permissions, content scripts)
├── content.js     (55 lines - fetch interception, emissions)
├── popup.html     (25 lines - simple UI)
└── popup.js       (57 lines - data aggregation)

### Key Detection Patterns:
- Claude: `/completion`, `/append_message`
- ChatGPT: `/backend-api/conversation`

### Emission Formula:
- Tokens = response_length / (platform === 'Claude' ? 3.5 : 4)
- Emissions = (tokens / 1000) * 0.002 g CO₂e

### Next Safe Additions:
1. Add more AI platforms (Gemini, Perplexity)
2. Add monthly view to popup
3. Add export functionality
4. Add visualizations

### DO NOT CHANGE:
- Fetch interception method
- Storage key names
- Basic calculation formula
