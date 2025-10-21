import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createClientSide } from '@supabase/supabase-js'

interface GeneratePostsRequest {
  productId: string
  productName: string
  productDescription: string
  websiteUrl: string
  variation?: number
  userId?: string
}

interface GeneratedPost {
  subreddit: string
  title: string
  body: string
  type: 'educational' | 'problem-solution' | 'community' | 'promotional'
}

export async function POST(request: NextRequest) {
  try {
    console.log('Generate posts API called')
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    console.log('Auth header:', authHeader ? 'Present' : 'Missing')
    
    // Try to get user from the request
    const supabase = await createClient()
    
    // Check authentication
    console.log('Starting authentication check...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('Auth check in generate-posts:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
      errorCode: authError?.code,
      errorStatus: authError?.status
    })

    // Also check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session check in generate-posts:', {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionError: sessionError?.message
    })
    
    const body: GeneratePostsRequest = await request.json()
    console.log('Request body received:', body)
    
    // If no user from server-side auth, try to get from client-side
    let currentUser = user
    if (authError || !user) {
      console.log('Server-side auth failed, trying client-side approach...')
      
      // Try to get user from the request body
      const userId = body.userId
      
      if (!userId) {
        console.error('No user ID found in request')
        return NextResponse.json({ error: 'Unauthorized - Please log in to generate posts' }, { status: 401 })
      }
      
      // Create a user object for the API call
      currentUser = { id: userId }
      console.log('Using client-provided user ID:', userId)
    }
    
    const { productId, productName, productDescription, websiteUrl, variation = 0 } = body

    if (!productId || !productName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get product details from database
    console.log('Looking for product:', { productId, userId: currentUser.id })
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', currentUser.id)
      .single()

    console.log('Product query result:', { product, productError })

    if (productError || !product) {
      console.error('Product not found:', { productError, productId, userId: currentUser.id })
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Extract product data from database
    const features = product.features || []
    const benefits = product.benefits || []
    const painPoints = product.pain_points || []
    const idealCustomerProfile = product.ideal_customer_profile || ''

    console.log('Product data from database:', {
      name: productName,
      description: productDescription,
      features,
      benefits,
      painPoints,
      idealCustomerProfile,
      website: product.website_url
    })

    // Automatically determine relevant subreddits based on product data
    let targetSubreddits
    try {
      console.log('Starting subreddit determination...')
      console.log('Product data for subreddit detection:', {
        productName,
        productDescription,
        features,
        benefits,
        painPoints,
        idealCustomerProfile
      })
      targetSubreddits = await determineRelevantSubreddits(
        productName,
        productDescription,
        features,
        benefits,
        painPoints,
        idealCustomerProfile
      )
      console.log(`AI-detected subreddits for ${productName}:`, targetSubreddits)
    } catch (error) {
      console.error('Error determining subreddits:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      // Fallback to default subreddits
      targetSubreddits = ['entrepreneur', 'startups', 'saas', 'marketing']
      console.log(`Using fallback subreddits for ${productName}:`, targetSubreddits)
    }

    const generatedPosts: GeneratedPost[] = []

    console.log('Starting post generation for subreddits:', targetSubreddits)
    console.log('Number of subreddits to process:', targetSubreddits.length)

    // Generate multiple high-quality posts for each automatically detected subreddit
    for (const subreddit of targetSubreddits) {
      try {
        console.log(`Starting high-quality post generation for r/${subreddit}...`)
        
        // Generate 2-3 variations per subreddit for maximum quality and diversity
        const postsPerSubreddit = Math.min(3, Math.max(2, Math.floor(8 / targetSubreddits.length)))
        console.log(`Will generate ${postsPerSubreddit} posts for r/${subreddit}`)
        
        for (let i = 0; i < postsPerSubreddit; i++) {
          try {
            console.log(`Calling generatePostForSubreddit for r/${subreddit}, variation ${i}`)
            const post = await generatePostForSubreddit(
              subreddit,
              productName,
              productDescription,
              websiteUrl,
              i, // Use index as variation
              features,
              benefits,
              painPoints,
              idealCustomerProfile
            )
            console.log(`Post generated successfully for r/${subreddit}:`, { title: post.title, bodyLength: post.body.length })
            generatedPosts.push(post)
            console.log(`Successfully generated post ${i + 1}/${postsPerSubreddit} for r/${subreddit}`)
            
            // Add small delay between variations to avoid rate limiting
            if (i < postsPerSubreddit - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          } catch (postError) {
            console.error(`Error generating post ${i + 1} for r/${subreddit}:`, {
              error: postError,
              message: postError instanceof Error ? postError.message : 'Unknown error',
              stack: postError instanceof Error ? postError.stack : undefined,
              subreddit,
              productName,
              variation: i
            })
            // Continue with next post instead of failing completely
            continue
          }
        }
        
        console.log(`Completed post generation for r/${subreddit}`)
        
      } catch (error) {
        console.error(`Error generating posts for r/${subreddit}:`, error)
        // Continue with next subreddit instead of failing completely
        continue
      }
    }

    console.log(`Post generation completed. Generated ${generatedPosts.length} posts total.`)
    
    if (generatedPosts.length === 0) {
      console.error('No posts were generated successfully', {
        targetSubreddits,
        productName,
        productId,
        userId: currentUser.id
      })
      return NextResponse.json({ error: 'Failed to generate any posts' }, { status: 500 })
    }

    console.log('Returning generated posts:', generatedPosts.map(p => ({ subreddit: p.subreddit, title: p.title })))
    return NextResponse.json({ posts: generatedPosts })
  } catch (error) {
    console.error('Error in generate-posts API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generatePostForSubreddit(
  subreddit: string,
  productName: string,
  productDescription: string,
  websiteUrl: string,
  variation: number,
  productFeatures: string[] = [],
  productBenefits: string[] = [],
  productPainPoints: string[] = [],
  idealCustomerProfile: string = ''
): Promise<GeneratedPost> {
  console.log(`generatePostForSubreddit called for r/${subreddit}, variation ${variation}`)
  
  const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!geminiApiKey) {
    console.error('Gemini API key not configured')
    throw new Error('Gemini API key not configured')
  }

  console.log(`Generating high-quality post for r/${subreddit} with variation ${variation}`)
  
  // Advanced AI-powered post generation with sophisticated analysis
  const prompt = `You are an expert Reddit marketing strategist and content creator. Create a SHORT, HIGH-IMPACT Reddit post for r/${subreddit} that will genuinely help the community while subtly promoting "${productName}".

PRODUCT DEEP ANALYSIS:
- Product Name: ${productName}
- Description: ${productDescription}
- Website: ${websiteUrl}
- Key Features: ${productFeatures.join(', ')}
- Core Benefits: ${productBenefits.join(', ')}
- Pain Points Solved: ${productPainPoints.join(', ')}
- Target Customer: ${idealCustomerProfile || 'Not specified'}

POST CREATION GUIDELINES:
1. **LENGTH**: Keep posts VERY SHORT (100-200 words max) - Reddit users scroll fast
2. **HOOK**: Start with a compelling hook that grabs attention in the first 10 words
3. **VALUE**: Provide immediate, actionable value
4. **NATURAL MENTION**: Mention the product naturally as a solution, not a sales pitch
5. **URL INTEGRATION**: Smartly embed the product URL (${websiteUrl}) in context
6. **CALL TO ACTION**: End with a question to encourage engagement
7. **TONE**: Match the subreddit's tone perfectly - be conversational and helpful
8. **IMPACT**: Make every word count - no fluff

CONTENT STRATEGY:
- Start with a relatable problem or question (1-2 sentences)
- Share a brief solution or insight (2-3 sentences)
- Naturally mention your product as the solution (1 sentence)
- Include the product URL in context (not just at the end)
- End with an engaging question (1 sentence)

TONE & STYLE FOR r/${subreddit}:
- Use their exact terminology and communication style
- Be direct and to the point
- Provide immediate value
- Avoid corporate speak or marketing jargon

URL INTEGRATION RULES:
- Embed the URL naturally in the text, not as a separate link
- Use phrases like "I found this tool at [URL]" or "Check out [URL] for more details"
- Don't just paste the URL at the end
- Make it feel like a genuine recommendation

Return ONLY a JSON object with this exact structure:
{
  "title": "Your compelling, community-specific title here (keep it short and punchy)",
  "body": "Your short, engaging post with natural product mention and embedded URL"
}

Create content that will genuinely help the r/${subreddit} community and encourage meaningful engagement.`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 2048,
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Gemini API error: ${response.status} - ${errorText}`)
      
      if (response.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED')
      }
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!responseText) {
      throw new Error('No response from Gemini API')
    }

    // Parse the JSON response (handle markdown code blocks)
    let postData
    try {
      // Extract JSON from markdown code blocks if present
      let jsonText = responseText
      if (jsonText.includes('```json')) {
        const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          jsonText = jsonMatch[1]
        }
      } else if (jsonText.includes('```')) {
        const jsonMatch = jsonText.match(/```\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          jsonText = jsonMatch[1]
        }
      }
      
      postData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Failed to parse post generation JSON:', responseText)
      throw new Error('Invalid JSON response from AI')
    }
    
    if (!postData.title || !postData.body) {
      console.error('Invalid post data structure:', postData)
      throw new Error('Invalid response format from AI')
    }

    return {
      subreddit,
      title: postData.title,
      body: postData.body,
      type: 'promotional' // Default type, AI will make it appropriate
    }
  } catch (error) {
    console.error(`Error generating post for r/${subreddit}:`, error)
    throw error
  }
}

async function determineRelevantSubreddits(
  productName: string,
  productDescription: string,
  features: string[],
  benefits: string[],
  painPoints: string[],
  idealCustomerProfile: string
): Promise<string[]> {
  const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!geminiApiKey) {
    // Fallback to default subreddits if no API key
    return ['entrepreneur', 'startups', 'saas', 'marketing']
  }

  const prompt = `You are an expert Reddit marketing strategist. Analyze this product comprehensively and suggest 5-8 highly relevant subreddits where it would be valuable and appropriate to promote.

PRODUCT ANALYSIS:
- Name: ${productName}
- Description: ${productDescription}
- Key Features: ${features.join(', ')}
- Core Benefits: ${benefits.join(', ')}
- Pain Points Solved: ${painPoints.join(', ')}
- Target Customer Profile: ${idealCustomerProfile || 'Not specified'}

DEEP ANALYSIS REQUIRED:
1. Identify the primary industry/niche this product serves
2. Determine the technical complexity level (beginner, intermediate, advanced)
3. Analyze the target audience demographics and interests
4. Consider the product's unique value proposition
5. Identify specific problems this product solves
6. Determine the business model and pricing tier
7. Think about what communities would genuinely benefit from this product

SUBREDDIT SUGGESTION CRITERIA:
1. Suggest subreddits where this product would solve REAL, SPECIFIC problems
2. Prioritize communities that match the product's technical level and target audience
3. Consider the product's business model and pricing (B2B vs B2C, enterprise vs SMB)
4. Select communities where the product would provide genuine value, not just promotion
5. Think about niche communities, industry-specific subreddits, and broader relevant communities
6. Consider both technical and non-technical communities based on the product
7. Include communities where the target audience actively participates

IMPORTANT: Suggest actual subreddit names that exist on Reddit. Think broadly about:
- Industry-specific subreddits (e.g., r/accounting, r/realestate, r/healthcare)
- Professional communities (e.g., r/consulting, r/sales, r/HR)
- Technology communities (e.g., r/webdev, r/programming, r/cybersecurity)
- Business communities (e.g., r/entrepreneur, r/startups, r/smallbusiness)
- Niche communities related to the product's use case
- Educational communities where people learn about this domain

Return ONLY a JSON array of 5-8 subreddit names (without "r/" prefix):
["subreddit1", "subreddit2", "subreddit3", "subreddit4", "subreddit5"]`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
        }
      })
    })

    if (!response.ok) {
      console.error(`Gemini API error for subreddit detection: ${response.status}`)
      return ['entrepreneur', 'startups', 'saas', 'marketing'] // Fallback
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!responseText) {
      return ['entrepreneur', 'startups', 'saas', 'marketing'] // Fallback
    }

    // Parse the JSON response (handle markdown code blocks)
    let subreddits
    try {
      // Extract JSON from markdown code blocks if present
      let jsonText = responseText
      if (jsonText.includes('```json')) {
        const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          jsonText = jsonMatch[1]
        }
      } else if (jsonText.includes('```')) {
        const jsonMatch = jsonText.match(/```\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          jsonText = jsonMatch[1]
        }
      }
      
      subreddits = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Failed to parse subreddit suggestions JSON:', responseText)
      return ['entrepreneur', 'startups', 'saas', 'marketing'] // Fallback
    }
    
    if (!Array.isArray(subreddits) || subreddits.length === 0) {
      console.error('Invalid subreddit suggestions format:', subreddits)
      return ['entrepreneur', 'startups', 'saas', 'marketing'] // Fallback
    }

    // Filter out any invalid entries and ensure they're strings
    const validSubreddits = subreddits
      .filter(sub => typeof sub === 'string' && sub.trim().length > 0)
      .map(sub => sub.trim().toLowerCase())
      .slice(0, 8) // Limit to 8 subreddits max

    console.log('AI suggested subreddits:', validSubreddits)
    return validSubreddits.length > 0 ? validSubreddits : ['entrepreneur', 'startups', 'saas', 'marketing']
  } catch (error) {
    console.error('Error determining relevant subreddits:', error)
    return ['entrepreneur', 'startups', 'saas', 'marketing'] // Fallback
  }
}
