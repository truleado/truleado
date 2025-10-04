import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

interface GeneratePostsRequest {
  productId: string
  productName: string
  productDescription: string
  websiteUrl: string
  targetSubreddits: string[]
}

interface GeneratedPost {
  subreddit: string
  title: string
  body: string
  type: 'educational' | 'problem-solution' | 'community' | 'promotional'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: GeneratePostsRequest = await request.json()
    const { productId, productName, productDescription, websiteUrl, targetSubreddits } = body

    if (!productId || !productName || !targetSubreddits || targetSubreddits.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user owns this product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const generatedPosts: GeneratedPost[] = []

    // Generate posts for each subreddit
    for (const subreddit of targetSubreddits) {
      try {
        console.log(`Starting post generation for r/${subreddit}...`)
        
        // Generate 2 variations per subreddit
        for (let i = 0; i < 2; i++) {
          console.log(`Generating variation ${i + 1} for r/${subreddit}...`)
          
          const post = await generatePostForSubreddit(
            subreddit,
            productName,
            productDescription,
            websiteUrl,
            i
          )
          generatedPosts.push(post)
          console.log(`Successfully generated variation ${i + 1} for r/${subreddit}`)
        }
      } catch (error) {
        console.error(`Error generating posts for r/${subreddit}:`, error)
        
        // Add fallback posts even if generation fails
        for (let i = 0; i < 2; i++) {
          generatedPosts.push({
            subreddit,
            title: `Check out ${productName} - ${productDescription.substring(0, 50)}...`,
            body: `Hey r/${subreddit} community! I wanted to share ${productName} which helps with ${productDescription.toLowerCase()}. Check it out at ${websiteUrl}`,
            type: 'promotional' as const
          })
        }
      }
    }

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
  variation: number
): Promise<GeneratedPost> {
  const geminiApiKey = process.env.GEMINI_API_KEY
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured')
  }

  // Determine post type and tone based on subreddit and variation
  const postTypes = ['educational', 'problem-solution', 'community', 'promotional']
  const postType = postTypes[variation % postTypes.length] as GeneratedPost['type']

  // Get subreddit context for better targeting
  const subredditContext = getSubredditContext(subreddit)

  const prompt = `Create a Reddit post for r/${subreddit} to promote "${productName}".

Product Details:
- Name: ${productName}
- Description: ${productDescription}
- Website: ${websiteUrl}

Subreddit Context:
${subredditContext}

Post Type: ${postType}

Requirements:
1. Create a compelling title (under 100 characters)
2. Write engaging post content (200-400 words)
3. Make it feel natural and community-appropriate for r/${subreddit}
4. Include the website URL naturally in the content
5. Avoid spammy language - focus on value and community engagement
6. Match the tone and style of ${subreddit} community
7. For educational posts: focus on teaching something valuable
8. For problem-solution posts: address a common problem the product solves
9. For community posts: engage with the community and ask questions
10. For promotional posts: be subtle and value-focused

Return ONLY a JSON object with this exact structure:
{
  "title": "Your post title here",
  "body": "Your post content here with natural website mention"
}`

  try {
    console.log(`Generating post for r/${subreddit} with Gemini...`)
    
    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert Reddit marketer who creates engaging, community-appropriate promotional posts. You understand Reddit culture and create content that provides value while subtly promoting products.

${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Gemini API error: ${response.status} - ${errorText}`)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Gemini response received:', { 
      hasCandidates: !!data.candidates, 
      candidatesLength: data.candidates?.length,
      finishReason: data.candidates?.[0]?.finishReason 
    })
    
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) {
      console.error('No content in Gemini response:', data)
      throw new Error('No content generated by Gemini')
    }

    // Parse JSON response
    let parsedContent
    try {
      parsedContent = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON response:', content)
      throw new Error('Invalid JSON response from Gemini')
    }
    
    console.log(`Successfully generated post for r/${subreddit}`)
    return {
      subreddit,
      title: parsedContent.title,
      body: parsedContent.body,
      type: postType
    }
  } catch (error) {
    console.error(`Error generating post with Gemini for r/${subreddit}:`, error)
    
    // Fallback post if AI generation fails
    return {
      subreddit,
      title: `Check out ${productName} - ${productDescription.substring(0, 50)}...`,
      body: `Hey r/${subreddit} community!

I wanted to share something that might be useful for you all. I've been using ${productName} and it's been really helpful for ${productDescription.toLowerCase()}.

${productDescription}

If you're interested, you can check it out at ${websiteUrl}

What do you think? Have any of you tried similar tools? I'd love to hear your experiences!`,
      type: postType
    }
  }
}

function getSubredditContext(subreddit: string): string {
  const contexts: { [key: string]: string } = {
    'entrepreneur': 'A community of entrepreneurs, startup founders, and business owners sharing experiences, advice, and resources.',
    'startups': 'Startup founders and entrepreneurs discussing business ideas, funding, and growth strategies.',
    'marketing': 'Marketing professionals and business owners sharing marketing strategies, tools, and insights.',
    'saas': 'Software as a Service discussions, tools, and business models.',
    'productivity': 'People interested in productivity tools, methods, and improving efficiency.',
    'business': 'General business discussions, advice, and networking.',
    'smallbusiness': 'Small business owners sharing experiences and seeking advice.',
    'freelance': 'Freelancers and independent contractors discussing work and business.',
    'webdev': 'Web developers sharing projects, tools, and development discussions.',
    'programming': 'Software developers discussing programming, tools, and technology.',
    'technology': 'General technology discussions and news.',
    'gadgets': 'Technology gadgets, reviews, and recommendations.',
    'software': 'Software discussions, recommendations, and reviews.',
    'tools': 'Productivity tools, software, and utilities discussions.',
    'recommendations': 'Community for product and service recommendations.',
    'buymyproduct': 'Community for promoting and discovering new products.',
    'sideproject': 'Developers and entrepreneurs sharing their side projects.',
    'indiehackers': 'Independent makers and entrepreneurs building products.',
    'nocode': 'No-code and low-code development discussions.',
    'automation': 'Workflow automation and productivity tools.',
  }

  return contexts[subreddit.toLowerCase()] || `A community focused on ${subreddit} topics and discussions.`
}

