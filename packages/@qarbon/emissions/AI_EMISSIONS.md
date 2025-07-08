# AI Emissions Methodology & Factors

This document details the methodology used for calculating AI model emissions, the factors involved,
and the confidence ranges associated with these calculations.

## Methodology Overview

Emissions calculations are based on the estimated energy consumption of AI models and the
corresponding CO₂ emissions for that energy consumption. Key components include:

- **Energy per Token**: The average energy consumption for processing one token.
- **Carbon Intensity**: The CO₂ emissions per kWh of energy consumed, varying by region and energy
  source.
- **AI Model Efficiency**: The energy consumption efficiency for different AI models.

## Key Factors

### Energy Factors

Each AI model has specific energy consumption factors expressed in kWh per token. These are based on
published benchmarks and reports.

#### Model-Specific Energy Factors

- **GPT-3.5**: 0.0000006 kWh/token (confidence: ±25%)
- **GPT-4**: 0.0000025 kWh/token (confidence: ±30%)
- **Claude-2**: 0.0000008 kWh/token (confidence: ±20%)
- **Claude-3**: 0.0000012 kWh/token (confidence: ±25%)
- **Gemini Pro**: 0.0000007 kWh/token (confidence: ±22%)

### Carbon Intensity

Regional carbon intensity values are derived from grid averages and cloud provider mixes.

#### Regional Intensity Values

- **US Average**: 500 g CO₂e/kWh
- **EU Average**: 300 g CO₂e/kWh
- **Cloud Provider Mix**: 350 g CO₂e/kWh (AWS/Azure/GCP weighted average)

### Data Center Efficiency

The Power Usage Effectiveness (PUE) for various data center types is considered.

- **Hyperscale**: 1.12 (Google, Microsoft, AWS)
- **Traditional**: 1.6 (industry average)
- **Edge Computing**: 1.8 (estimated)

## Confidence Ranges

### Factor Confidence

The confidence ranges for energy and emissions factors are based on:

- Published papers and industry reports
- Variability in model deployments and data center operations
- Regional differences in energy sources and grid responses

### Overall Confidence

1. **High Confidence**: API-based calculations with real token counts (±5% uncertainty).
2. **Moderate Confidence**: Web-based calculations using heuristics (±15-25% uncertainty).
3. **Low Confidence**: Fallback estimations (±30-50% uncertainty).

## Recent Updates

### Version 1.0.0

- **Exports**: Added exports mapping in `package.json` for proper module resolution.
- **Versioning**: Updated package version to 1.0.0.

- **Added Models**: Updated emission factors to include new AI models such as Llama-2 (7B, 13B,
  70B), Mistral-7B, Mistral-8x7B, Falcon-7B/40B, BLOOM-176B, StableDiffusion, Whisper, DALL-E 3,
  Midjourney, Phi-2, Gemini-Nano, TinyLlama.
- **Regional Variants**: Introduced regional-specific variants (`gpt-4-us`, `gpt-4-eu`, etc.) with
  customized emission factors.
- **Enhanced Detection**: Improved fuzzy logic in `getAIFactor` to detect new model names and sizes
  effectively.

---

This document will be updated regularly to reflect advancements in methodologies and changes in
underlying factors like model efficiency, data center efficiency, and regional carbon intensity.
