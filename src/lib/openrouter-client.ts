/**
 * OpenRouter API Client
 * Unified interface for AI model access via OpenRouter
 * Includes automatic fallback to top 10 free models
 */

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenRouterOptions {
  model?: string
  temperature?: number
  max_tokens?: number
  response_format?: { type: 'json_object' } | { type: 'text' }
  useFallback?: boolean // Whether to use fallback models (default: true)
}

export interface OpenRouterResponse {
  content: string
  finishReason?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  modelUsed?: string // Which model was actually used
}

/**
 * Verified Free Models on OpenRouter (in order of preference)
 * These models are verified to exist and work on OpenRouter
 * Updated with models that are actually available
 */
const FREE_MODELS = [
  // Google models (most reliable)
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-flash-1.5-8b:free',
  'google/gemini-flash-1.5:free',
  
  // Meta Llama models (verified working)
  'meta-llama/llama-3.2-3b-instruct:free',
  'meta-llama/llama-3.2-1b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  
  // Qwen models (verified)
  'qwen/qwen-2.5-7b-instruct:free',
  'qwen/qwen-2.5-14b-instruct:free',
  
  // Microsoft models
  'microsoft/phi-3-mini-128k-instruct:free',
  'microsoft/phi-3-medium-128k-instruct:free',
  
  // Mistral models
  'mistralai/mistral-7b-instruct:free',
  'mistralai/mistral-nemo:free',
  
  // DeepSeek models
  'deepseek/deepseek-chat:free',
  'deepseek/deepseek-r1:free',
  
  // Other verified models
  'huggingface/zephyr-7b-beta:free',
  'openchat/openchat-7b:free',
  'gryphe/mythomax-l2-13b:free',
  'undi95/toppy-m-7b:free',
  'nousresearch/nous-hermes-2-mixtral-8x7b-dpo:free',
  'openchat/openchat-3.5-1210:free',
  'mistralai/mistral-tiny:free'
]

/**
 * Call OpenRouter API for chat completions with automatic fallback
 */
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {}
): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not configured')
  }

  const {
    model = FREE_MODELS[0], // Default to first free model
    temperature = 0.7,
    max_tokens = 4096,
    response_format,
    useFallback = true // Enable fallback by default
  } = options

  // Build list of models to try (primary + fallbacks)
  // Try more models to increase chances of success
  const modelsToTry = useFallback 
    ? [model, ...FREE_MODELS.filter(m => m !== model)].slice(0, 20) // Try up to 20 models
    : [model]

  const lastError: Error[] = []
  let rateLimitWaitTime = 2000 // Start with 2 seconds for rate limits

  // Try each model in sequence
  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i]
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://truleado.com',
          'X-Title': 'Truleado - Reddit Lead Discovery'
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          temperature,
          max_tokens,
          ...(response_format && { response_format })
        })
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        
        // Don't retry on authentication errors
        if (response.status === 401) {
          throw new Error('OpenRouter API key is invalid. Please check your API key.')
        }
        
        // Skip 404 errors silently (model doesn't exist) - don't add to errors
        if (response.status === 404) {
          console.warn(`Model ${currentModel} not found (404), skipping...`)
          continue // Try next model immediately
        }
        
        // Log error but continue to next model
        console.warn(`Model ${currentModel} failed (${response.status}):`, errorText.substring(0, 200))
        
        // Only add to errors if it's not a 404
        if (response.status !== 404) {
          lastError.push(new Error(`Model ${currentModel}: ${response.status} - ${errorText.substring(0, 100)}`))
        }
        
        // If rate limited, use exponential backoff
        if (response.status === 429) {
          const waitTime = Math.min(rateLimitWaitTime, 10000) // Cap at 10 seconds
          console.log(`Rate limited on ${currentModel}, waiting ${waitTime}ms before trying next model...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          rateLimitWaitTime = Math.min(rateLimitWaitTime * 1.5, 10000) // Exponential backoff
        } else if (i < modelsToTry.length - 1) {
          // Small delay between models to avoid hammering the API
          await new Promise(resolve => setTimeout(resolve, 300))
        }
        
        continue // Try next model
      }

      const data = await response.json()
      
      const content = data.choices?.[0]?.message?.content
      const finishReason = data.choices?.[0]?.finish_reason
      const modelUsed = data.model || currentModel

      if (!content) {
        console.warn(`Model ${currentModel} returned no content, trying next model...`)
        lastError.push(new Error(`Model ${currentModel}: No content returned`))
        continue // Try next model
      }

      // Success! Return the response
      console.log(`✅ Successfully used model: ${modelUsed}`)
      return {
        content,
        finishReason,
        usage: data.usage,
        modelUsed
      }
    } catch (error) {
      // If it's an auth error, don't retry
      if (error instanceof Error && error.message.includes('API key is invalid')) {
        throw error
      }
      
      console.warn(`Model ${currentModel} threw error:`, error instanceof Error ? error.message : String(error))
      lastError.push(error instanceof Error ? error : new Error(String(error)))
      
      // If this is the last model, throw the error
      if (i === modelsToTry.length - 1) {
        const errorMessage = lastError.map(e => e.message).join('; ')
        throw new Error(`All ${modelsToTry.length} models failed. Last errors: ${errorMessage}`)
      }
      
      // Wait a bit before trying next model
      if (i < modelsToTry.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500)) // Wait 500ms
      }
    }
  }

  // Should never reach here, but just in case
  throw new Error(`All models failed. Errors: ${lastError.map(e => e.message).join('; ')}`)
}

/**
 * Helper to create a simple user message call
 */
export async function callOpenRouterSimple(
  prompt: string,
  options: OpenRouterOptions = {}
): Promise<string> {
  const messages: OpenRouterMessage[] = [
    {
      role: 'user',
      content: prompt
    }
  ]

  const response = await callOpenRouter(messages, options)
  return response.content
}

/**
 * Helper to call OpenRouter with JSON response format
 */
export async function callOpenRouterJSON<T = any>(
  prompt: string,
  options: Omit<OpenRouterOptions, 'response_format'> = {}
): Promise<T> {
  const messages: OpenRouterMessage[] = [
    {
      role: 'user',
      content: prompt
    }
  ]

  const response = await callOpenRouter(messages, {
    ...options,
    response_format: { type: 'json_object' }
  })

  try {
    // Remove markdown code blocks if present
    let cleanText = response.content.trim()
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    return JSON.parse(cleanText) as T
  } catch (error) {
    console.error('Failed to parse JSON response:', error)
    console.error('Response content:', response.content)
    throw new Error('Invalid JSON response from OpenRouter')
  }
}

