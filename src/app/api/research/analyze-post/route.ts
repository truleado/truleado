export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { callOpenRouterJSON } from '@/lib/openrouter-client'

export async function POST(request: NextRequest) {
  try {
    const { post, productName, productDescription, keyword } = await request.json()

    if (!post || !productName || !productDescription) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Post, productName, and productDescription are required'
      }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'OpenRouter API key not configured',
        details: 'Please set up your OpenRouter API key to use this feature'
      }, { status: 500 })
    }

    const prompt = `You are analyzing a Reddit post to determine if it's a good pitching opportunity for a specific product/service.

PRODUCT/SERVICE CONTEXT:
- Product Name: ${productName}
- Description: ${productDescription}
${keyword ? `- Keyword: "${keyword}"` : ''}

REDDIT POST TO ANALYZE:
- Title: "${post.title}"
- Content: "${post.selftext || 'No content provided'}"
- Subreddit: r/${post.subreddit}
- Score: ${post.score}
- Comments: ${post.num_comments}
- Author: u/${post.author}

OBJECTIVE: Determine if this post represents a good opportunity to pitch the product/service, and if so, provide reasoning and a sample pitch.

Return ONLY a valid JSON object with this exact structure:
{
  "isRelevant": true,
  "reasoning": "Brief explanation of why this post is a good pitching opportunity (2-3 sentences)",
  "samplePitch": "Sample pitch idea that could be used to engage with this post (2-3 sentences). Make it helpful, authentic, and not overly salesy."
}

If the post is NOT relevant, set "isRelevant" to false and still provide brief reasoning.`

    try {
      const analysis = await callOpenRouterJSON<{
        isRelevant: boolean
        reasoning: string
        samplePitch: string
      }>(prompt, {
        model: 'google/gemini-2.0-flash-exp:free',
        temperature: 0.7,
        max_tokens: 500
      })

      return NextResponse.json({
        success: true,
        analysis: {
          reasoning: analysis.reasoning || '',
          samplePitch: analysis.samplePitch || '',
          isRelevant: analysis.isRelevant !== false
        }
      })
    } catch (error: any) {
      console.error('OpenRouter analysis error:', error)
      return NextResponse.json({
        error: 'AI analysis failed',
        details: error.message || 'Failed to analyze post with AI'
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error analyzing post:', error)
    return NextResponse.json({ 
      error: 'Analysis failed', 
      details: error.message 
    }, { status: 500 })
  }
}

