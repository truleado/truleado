# OpenRouter Migration Guide

This document outlines the migration from OpenAI and Google Gemini to OpenRouter.

## Changes Made

### 1. Created OpenRouter Client (`src/lib/openrouter-client.ts`)
- Unified interface for AI model access via OpenRouter
- Supports JSON and text responses
- Handles error cases and rate limiting

### 2. Updated Core AI Libraries
- **`src/lib/ai-lead-analyzer.ts`**: Replaced OpenAI/Gemini with OpenRouter
- **`src/lib/ai-search-generator.ts`**: Replaced OpenAI/Gemini with OpenRouter

### 3. Updated API Routes
- **`src/app/api/products/analyze/route.ts`**: Replaced OpenAI/Gemini with OpenRouter
- **`src/app/api/promote/generate-posts/route.ts`**: Replaced Gemini with OpenRouter

### 4. Removed Dependencies
- Removed `openai` package from `package.json`
- Removed `@google/generative-ai` package from `package.json`

## Environment Variables

### Required
Replace your existing OpenAI and Gemini API keys with a single OpenRouter API key:

```bash
# Old (remove these)
OPENAI_API_KEY=sk-...
GOOGLE_GEMINI_API_KEY=...

# New (add this)
OPENROUTER_API_KEY=sk-or-v1-...
```

### How to Get OpenRouter API Key
1. Sign up at https://openrouter.ai
2. Navigate to API Keys section
3. Create a new API key
4. Add it to your environment variables (Vercel, local `.env`, etc.)

## Remaining Files to Update

The following files still reference OpenAI/Gemini and should be updated:

1. **`src/app/api/promote/suggest-subreddits/route.ts`**
   - Replace `GEMINI_API_KEY` with `OPENROUTER_API_KEY`
   - Replace Gemini API calls with `callOpenRouterJSON`

2. **`src/app/api/research/analyze-keywords/route.ts`**
   - Replace `GOOGLE_GEMINI_API_KEY` with `OPENROUTER_API_KEY`
   - Replace `GoogleGenerativeAI` usage with `callOpenRouterJSON`

3. **`src/app/api/products/suggest-subreddits/route.ts`**
   - Check for any OpenAI/Gemini references and update

4. **`src/app/api/promote/create-content/route.ts`**
   - Check for any OpenAI/Gemini references and update

5. **`src/app/api/research/search-reddit/route.ts`**
   - Check for any OpenAI/Gemini references and update

6. **`src/app/api/admin/gemini-heavy-users/route.ts`**
   - This file may need to be renamed/updated to track OpenRouter usage instead

## Model Selection

OpenRouter supports multiple models. The migration uses `openai/gpt-4o-mini` as the default, which is cost-effective and performs well. You can change the model in the `callOpenRouterJSON` calls if needed.

Available models include:
- `openai/gpt-4o-mini` (default, cost-effective)
- `openai/gpt-4o`
- `openai/gpt-3.5-turbo`
- `google/gemini-2.0-flash-exp`
- And many more at https://openrouter.ai/models

## Benefits of OpenRouter

1. **Unified API**: Single API for multiple AI providers
2. **Cost Optimization**: Choose the best model for each task
3. **Reliability**: Automatic fallbacks and retries
4. **Flexibility**: Easy to switch models without code changes

## Testing

After migration:
1. Test lead analysis functionality
2. Test search term generation
3. Test product analysis
4. Test post generation
5. Verify all AI features work correctly

## Rollback

If you need to rollback:
1. Restore the old dependencies: `npm install openai @google/generative-ai`
2. Revert the changes to the files listed above
3. Restore your old environment variables

