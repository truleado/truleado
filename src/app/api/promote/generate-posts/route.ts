export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createClientSide } from '@supabase/supabase-js'
import { callOpenRouterJSON } from '@/lib/openrouter-client'

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
    console.log('=== Generate posts API called ===')
    
    const body: GeneratePostsRequest = await request.json()
    console.log('Request body received:', body)
    console.log('User ID from request body:', body.userId)
    
    // Validate required fields first
    const { productId, productName, productDescription, websiteUrl, variation = 0, userId } = body
    
    if (!userId) {
      console.error('No user ID found in request body:', body)
      return NextResponse.json({ error: 'Unauthorized - Please log in to generate posts' }, { status: 401 })
    }
    
    if (!productId || !productName) {
      console.error('Missing required fields:', { productId, productName })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Create a user object for the API call
    const currentUser = { id: userId }
    console.log('Using client-provided user ID:', userId)
    
    // Create a new Supabase client for database operations
    const supabase = await createClient()

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
      return NextResponse.json({ 
        error: 'Product not found', 
        details: productError?.message || 'Product does not exist or you do not have access to it' 
      }, { status: 404 })
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

    // Generate exactly 3 high-quality posts total
    const totalPostsToGenerate = 3
    console.log(`Generating exactly ${totalPostsToGenerate} posts total`)
    
    for (let i = 0; i < totalPostsToGenerate; i++) {
      try {
        // Cycle through subreddits to ensure diversity
        const subreddit = targetSubreddits[i % targetSubreddits.length]
        console.log(`Generating post ${i + 1}/${totalPostsToGenerate} for r/${subreddit}...`)
        
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
        console.log(`Successfully generated post ${i + 1}/${totalPostsToGenerate}`)
        
        // Add small delay between posts to avoid rate limiting
        if (i < totalPostsToGenerate - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } catch (error) {
        console.error(`Error generating post ${i + 1}:`, error)
        // Continue with next post instead of failing completely
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
      return NextResponse.json({ 
        error: 'Failed to generate any posts', 
        details: 'AI generation failed for all subreddits. Please try again.' 
      }, { status: 500 })
    }

    console.log('Returning generated posts:', generatedPosts.map(p => ({ subreddit: p.subreddit, title: p.title })))
    return NextResponse.json({ 
      posts: generatedPosts,
      success: true,
      count: generatedPosts.length
    })
  } catch (error) {
    console.error('Error in generate-posts API:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false
    }, { status: 500 })
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
  
  const openrouterApiKey = process.env.OPENROUTER_API_KEY
  if (!openrouterApiKey) {
    console.error('OpenRouter API key not configured')
    throw new Error('OpenRouter API key not configured')
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
    const result = await callOpenRouterJSON<{
      title: string
      body: string
    }>(prompt, {
      model: 'openai/gpt-4o-mini',
      temperature: 0.8,
      max_tokens: 2048
    })

    // OpenRouter already returns parsed JSON
    const postData = result

    if (!postData || !postData.title || !postData.body) {
      console.error('Invalid post data structure:', postData)
      throw new Error('Invalid response format from OpenRouter API')
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
  const openrouterApiKey = process.env.OPENROUTER_API_KEY
  if (!openrouterApiKey) {
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
    const subreddits = await callOpenRouterJSON<string[]>(prompt, {
      model: 'openai/gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 512
    })
    
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
