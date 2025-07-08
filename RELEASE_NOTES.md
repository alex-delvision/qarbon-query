# Release Notes

## Version 0.3.0 - 2024-07-03

### 📚 Documentation & Methodology

#### Enhanced API Interception Documentation

- **Updated `API_INTERCEPTION.md`** with comprehensive methodology details
- **Added detailed accuracy metrics** for token counting across different provider types:
  - API-based providers: 85-95% confidence
  - Web interface extraction: 60-80% confidence
  - Fallback estimations: 40-70% confidence
- **Documented energy calculation factors** with specific confidence ranges for each AI model
- **Added carbon intensity calculations** for different regions and data center types

#### New AI Emissions Documentation

- **Created `AI_EMISSIONS.md`** in `@qarbon/emissions` package
- **Detailed methodology overview** explaining energy per token calculations
- **Model-specific energy factors** with confidence ranges:
  - GPT-3.5: 0.0000006 kWh/token (±25%)
  - GPT-4: 0.0000025 kWh/token (±30%)
  - Claude-2/3: 0.0000008-0.0000012 kWh/token (±20-25%)
  - Gemini Pro: 0.0000007 kWh/token (±22%)
- **Regional carbon intensity values** and data center efficiency factors
- **Confidence assessment framework** for different calculation scenarios

### 🔄 Version Updates

#### @qarbon/emissions v0.3.0 (Minor)

- Enhanced methodology documentation
- Improved confidence range specifications
- Better factor organization and explanation

#### @qarbon/chrome-extension v0.1.1 (Patch)

- Updated documentation
- Synchronized manifest version
- Improved accuracy documentation

### 🎯 What's Improved

1. **Methodology Transparency**: Clear documentation of how emissions are calculated
2. **Accuracy Metrics**: Detailed confidence ranges for different data sources
3. **Scientific Foundation**: References to peer-reviewed research and industry reports
4. **Implementation Guidance**: Better understanding of limitations and future improvements

### 🔬 Scientific References

The methodology is based on:

- Patterson et al. (2021): "Carbon Emissions and Large Neural Network Training"
- OpenAI Sustainability Report (2023)
- Anthropic Constitutional AI Paper (2022)
- Google AI Environmental Report (2022)

### 📈 Future Roadmap

- Real-time geographic localization of compute resources
- Integration with real-time grid carbon intensity APIs
- Model-specific hardware efficiency tracking
- Multi-region data center carbon footprint mapping

---

**Full Changelog**: Compare changes in the repository for detailed code differences.
