/**
 * OpenRouter API Client
 * Unified interface for AI model access via OpenRouter
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
}

export interface OpenRouterResponse {
  content: string
  finishReason?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Call OpenRouter API for chat completions
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
    model = 'google/gemini-2.5-pro-exp-03-25', // Default model
    temperature = 0.7,
    max_tokens = 4096,
    response_format
  } = options

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
        model,
        messages,
        temperature,
        max_tokens,
        ...(response_format && { response_format })
      })
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`OpenRouter API error ${response.status}:`, errorText)
      
      if (response.status === 429) {
        throw new Error('OpenRouter API rate limit exceeded. Please try again in a moment.')
      } else if (response.status === 401) {
        throw new Error('OpenRouter API key is invalid. Please check your API key.')
      } else if (response.status === 400) {
        throw new Error(`OpenRouter API request invalid: ${errorText}`)
      } else {
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
      }
    }

    const data = await response.json()
    
    const content = data.choices?.[0]?.message?.content
    const finishReason = data.choices?.[0]?.finish_reason

    if (!content) {
      console.error('OpenRouter response structure:', data)
      throw new Error('No content returned from OpenRouter')
    }

    return {
      content,
      finishReason,
      usage: data.usage
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`OpenRouter API call failed: ${String(error)}`)
  }
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

