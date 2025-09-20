import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { name, description, features, benefits, painPoints, idealCustomerProfile } = await request.json()

    if (!name && !description) {
      return NextResponse.json({ error: 'Product information is required' }, { status: 400 })
    }

    // Find relevant subreddits based on product analysis
    const subreddits = await findRelevantSubreddits({
      name,
      description,
      features,
      benefits,
      painPoints,
      idealCustomerProfile,
    })

    return NextResponse.json({ subreddits })
  } catch (error) {
    console.error('Subreddit discovery error:', error)
    return NextResponse.json({ error: 'Failed to find subreddits' }, { status: 500 })
  }
}

async function findRelevantSubreddits(productInfo: {
  name: string
  description: string
  features: string[]
  benefits: string[]
  painPoints: string[]
  idealCustomerProfile: string
}) {
  const openaiApiKey = process.env.OPENAI_API_KEY
  
  if (!openaiApiKey) {
    // Return default subreddits if OpenAI key is not configured
    return getDefaultSubreddits(productInfo)
  }

  try {
    const productSummary = `
Product: ${productInfo.name}
Description: ${productInfo.description}
Features: ${productInfo.features.join(', ')}
Benefits: ${productInfo.benefits.join(', ')}
Pain Points: ${productInfo.painPoints.join(', ')}
Target Customers: ${productInfo.idealCustomerProfile}
    `.trim()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a Reddit community expert. Based on the product information provided, suggest 6-8 relevant subreddits where potential customers might discuss problems this product solves.

Consider:
- Business/entrepreneurship subreddits for B2B products
- Industry-specific subreddits
- Problem-solving communities
- Professional development subreddits

Return ONLY a valid JSON array of subreddit names (without r/ prefix). Example: ["entrepreneur", "smallbusiness", "marketing"]`
          },
          {
            role: 'user',
            content: productSummary
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const subredditsText = data.choices[0]?.message?.content

    if (!subredditsText) {
      throw new Error('No subreddits returned from OpenAI')
    }

    // Parse JSON response - handle markdown code blocks
    let cleanText = subredditsText.trim()
    
    // Remove markdown code blocks if present
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    const subreddits = JSON.parse(cleanText)
    
    // Validate and clean the response
    if (Array.isArray(subreddits)) {
      return subreddits.slice(0, 8) // Limit to 8 subreddits
    }
    
    return getDefaultSubreddits(productInfo)
  } catch (error) {
    console.error('OpenAI subreddit discovery error:', error)
    return getDefaultSubreddits(productInfo)
  }
}

function getDefaultSubreddits(productInfo: any): string[] {
  // Default subreddits based on common SaaS categories
  const defaultSubreddits = [
    'entrepreneur',
    'smallbusiness',
    'startups',
    'saas',
    'business',
    'productivity',
    'marketing',
    'webdev'
  ]

  // Add more specific subreddits based on keywords
  const text = `${productInfo.name} ${productInfo.description} ${productInfo.features.join(' ')} ${productInfo.benefits.join(' ')}`.toLowerCase()

  if (text.includes('marketing') || text.includes('social media')) {
    defaultSubreddits.push('marketing', 'socialmedia')
  }
  
  if (text.includes('design') || text.includes('ui') || text.includes('ux')) {
    defaultSubreddits.push('design', 'uxdesign')
  }
  
  if (text.includes('development') || text.includes('coding') || text.includes('programming')) {
    defaultSubreddits.push('programming', 'webdev')
  }
  
  if (text.includes('finance') || text.includes('accounting') || text.includes('money')) {
    defaultSubreddits.push('personalfinance', 'investing')
  }
  
  if (text.includes('health') || text.includes('fitness') || text.includes('wellness')) {
    defaultSubreddits.push('fitness', 'health')
  }

  // Remove duplicates and return unique subreddits
  return [...new Set(defaultSubreddits)].slice(0, 8)
}
