# AI API Setup for Better Product Analysis

To get more accurate and specific product analysis when adding products, you can set up AI API keys. Without these, the system falls back to intelligent pattern matching which is more generic.

## Setup Instructions

### Option 1: Google Gemini (Recommended - Cheaper)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to your `.env.local` file:
```
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

### Option 2: OpenAI
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to your `.env.local` file:
```
OPENAI_API_KEY=your_api_key_here
```

## What This Improves

With AI APIs enabled, product analysis will:
- Extract specific features from website content
- Generate quantified benefits with real numbers
- Identify actual pain points the product solves
- Create detailed customer profiles
- Provide more accurate descriptions

Without AI APIs, the system uses intelligent pattern matching which is still good but more generic.

## Current Status
The system is currently running without AI API keys, so it's using the enhanced fallback analysis with better category detection and more specific patterns.
