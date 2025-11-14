export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { callOpenRouterJSON } from '@/lib/openrouter-client'

interface SuggestSubredditsRequest {
  productName: string
  productDescription: string
  websiteUrl: string
  features?: string[]
  benefits?: string[]
  painPoints?: string[]
  idealCustomerProfile?: string
}

interface SuggestedSubreddit {
  name: string
  reason: string
  relevance_score: number
  audience_description: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SuggestSubredditsRequest = await request.json()
    const { productName, productDescription, websiteUrl, features = [], benefits = [], painPoints = [], idealCustomerProfile } = body

    if (!productName || !productDescription) {
      return NextResponse.json({ error: 'Product name and description are required' }, { status: 400 })
    }

    // Use AI to suggest relevant subreddits based on product data
    const suggestedSubreddits = await suggestSubredditsWithAI({
      productName,
      productDescription,
      websiteUrl,
      features,
      benefits,
      painPoints,
      idealCustomerProfile
    })

    return NextResponse.json({ 
      success: true, 
      subreddits: suggestedSubreddits 
    })
  } catch (error) {
    console.error('Error suggesting subreddits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function suggestSubredditsWithAI(productData: SuggestSubredditsRequest): Promise<SuggestedSubreddit[]> {
  const openrouterApiKey = process.env.OPENROUTER_API_KEY
  if (!openrouterApiKey) {
    throw new Error('OpenRouter API key not configured')
  }

  const prompt = `Analyze this product and suggest the most relevant Reddit subreddits for promotion:

PRODUCT INFORMATION:
- Name: ${productData.productName}
- Description: ${productData.productDescription}
- Website: ${productData.websiteUrl}
- Features: ${productData.features.join(', ')}
- Benefits: ${productData.benefits.join(', ')}
- Pain Points Addressed: ${productData.painPoints.join(', ')}
- Ideal Customer: ${productData.idealCustomerProfile || 'Not specified'}

AVAILABLE SUBREDDITS:
- webdev (Web development, coding, frameworks)
- entrepreneur (Startups, business growth, funding)
- marketing (Digital marketing, growth hacking, campaigns)
- saas (Software as a Service, subscription models)
- productivity (Time management, efficiency tools)
- startups (Early-stage companies, MVP development)
- programming (Software development, algorithms)
- technology (Tech trends, innovations)
- indiehackers (Independent makers, bootstrapping)
- nocode (No-code/low-code development)
- smallbusiness (Small business owners)
- freelancing (Freelancers, independent contractors)
- business (General business discussions)
- software (Software tools, recommendations)
- tools (Productivity tools, utilities)
- recommendations (Product recommendations)

TASK:
1. Analyze the product and identify which subreddits would be most relevant
2. For each suggested subreddit, provide:
   - Why it's relevant to this product
   - What audience would be interested
   - Relevance score (1-10)

Return ONLY a JSON array with this exact structure:
[
  {
    "name": "subreddit_name",
    "reason": "Why this subreddit is relevant for this product",
    "relevance_score": 8,
    "audience_description": "Description of the audience in this subreddit"
  }
]

Suggest 5-8 most relevant subreddits, ordered by relevance score (highest first).`

  try {
    const suggestedSubreddits = await callOpenRouterJSON<SuggestedSubreddit[]>(prompt, {
      model: 'openai/gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 1024
    })
    
    // Validate the response structure
    if (!Array.isArray(suggestedSubreddits)) {
      throw new Error('Invalid response format from AI')
    }

    return suggestedSubreddits.map(sub => ({
      name: sub.name,
      reason: sub.reason,
      relevance_score: sub.relevance_score || 5,
      audience_description: sub.audience_description || 'General audience'
    }))

  } catch (error) {
    console.error('Error calling OpenRouter API for subreddit suggestions:', error)
    
    // Fallback to basic suggestions based on keywords
    return getFallbackSubredditSuggestions(productData)
  }
}

function getFallbackSubredditSuggestions(productData: SuggestSubredditsRequest): SuggestedSubreddit[] {
  const suggestions: SuggestedSubreddit[] = []
  const text = `${productData.productName} ${productData.productDescription} ${productData.features.join(' ')} ${productData.benefits.join(' ')}`.toLowerCase()

  // Basic keyword matching
  if (text.includes('web') || text.includes('app') || text.includes('development') || text.includes('code')) {
    suggestions.push({
      name: 'webdev',
      reason: 'Product appears to be web development related',
      relevance_score: 8,
      audience_description: 'Web developers and programmers'
    })
  }

  if (text.includes('business') || text.includes('startup') || text.includes('entrepreneur') || text.includes('funding')) {
    suggestions.push({
      name: 'entrepreneur',
      reason: 'Product appears to be business/startup related',
      relevance_score: 8,
      audience_description: 'Entrepreneurs and business owners'
    })
  }

  if (text.includes('marketing') || text.includes('growth') || text.includes('conversion') || text.includes('campaign')) {
    suggestions.push({
      name: 'marketing',
      reason: 'Product appears to be marketing related',
      relevance_score: 8,
      audience_description: 'Marketing professionals'
    })
  }

  if (text.includes('saas') || text.includes('subscription') || text.includes('software as a service')) {
    suggestions.push({
      name: 'saas',
      reason: 'Product appears to be SaaS related',
      relevance_score: 9,
      audience_description: 'SaaS founders and professionals'
    })
  }

  if (text.includes('productivity') || text.includes('efficiency') || text.includes('workflow') || text.includes('automation')) {
    suggestions.push({
      name: 'productivity',
      reason: 'Product appears to be productivity related',
      relevance_score: 8,
      audience_description: 'Productivity enthusiasts'
    })
  }

  // Always include some general suggestions
  if (suggestions.length < 3) {
    suggestions.push(
      {
        name: 'startups',
        reason: 'General startup community',
        relevance_score: 6,
        audience_description: 'Startup founders and entrepreneurs'
      },
      {
        name: 'indiehackers',
        reason: 'Independent makers community',
        relevance_score: 6,
        audience_description: 'Independent makers and entrepreneurs'
      }
    )
  }

  return suggestions.slice(0, 6) // Return top 6 suggestions
}
