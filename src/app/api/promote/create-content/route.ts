import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { callOpenRouterJSON } from '@/lib/openrouter-client'

const MAX_REDIRECTS = 5
const FETCH_TIMEOUT_MS = 15000
const POSTS_PER_BATCH = 3
const MAX_GENERATION_ATTEMPTS = 3

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function fetchWithRedirects(url: string) {
  let currentUrl = url

  for (let i = 0; i < MAX_REDIRECTS; i++) {
    const response = await fetch(currentUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    // Success responses
    if (response.ok) {
      const html = await response.text()
      return { html, finalUrl: response.url || currentUrl }
    }

    // Handle redirect responses (3xx)
    if (response.status >= 300 && response.status < 400) {
      const locationHeader = response.headers.get('location')
      if (locationHeader) {
        currentUrl = new URL(locationHeader, currentUrl).toString()
        continue
      }

      // Some frameworks (Next.js app router) return soft redirects in the body
      const body = await response.text().catch(() => '')
      const nextRedirectMatch = body.match(/NEXT_REDIRECT;[^;]*;([^;]+);/i)
      if (nextRedirectMatch?.[1]) {
        currentUrl = new URL(nextRedirectMatch[1], currentUrl).toString()
        continue
      }

      throw new Error(`Redirect (${response.status}) without location header from ${currentUrl}`)
    }

    // Non-success responses should include more detail
    const errorText = await response.text().catch(() => '')
    throw new Error(
      `Failed to fetch URL: ${response.status}${errorText ? ` - ${errorText.slice(0, 200)}` : ''}`
    )
  }

  throw new Error('Too many redirects while fetching the URL')
}

export async function POST(request: NextRequest) {
  try {
    const { url, contentType } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }

    // Fetch the URL content with manual redirect handling
    console.log('📄 Fetching URL content:', url)
    const { html, finalUrl } = await fetchWithRedirects(url)
    console.log('📄 Final URL after redirects:', finalUrl)
    
    // Parse HTML using cheerio for better content extraction
    const $ = cheerio.load(html)
    
    // Remove unwanted elements
    $('script, style, noscript, iframe, header, footer, nav, aside').remove()
    
    // Extract title
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Content'
    
    // Extract main content from common content containers
    let textContent = ''
    
    // Try to find main content areas
    const mainContent = $('main, article, [role="main"], .content, .post-content, .entry-content, .article-content').first()
    
    if (mainContent.length > 0) {
      textContent = mainContent.text()
    } else {
      // Fallback to body content if no main container found
      textContent = $('body').text()
    }
    
    // Clean up the text content
    textContent = textContent.replace(/\s\s+/g, ' ').trim()

    console.log(`📄 Extracted content - Title: ${title.substring(0, 100)}, Content length: ${textContent.length}`)

    // Build content type instruction based on user input
    let contentTypeInstruction = ''
    if (contentType) {
      const lowerContentType = contentType.toLowerCase()
      
      if (lowerContentType.includes('promotional') || lowerContentType.includes('promote') || lowerContentType.includes('product launch')) {
        contentTypeInstruction = `\n\nCONTENT TYPE: Promotional/Product Launch. Create posts that highlight the product, service, or brand from the URL. Make them engaging and informative, showing value and benefits. Still maintain authenticity and don't be overly salesy - focus on what the product/brand does and why it matters.`
      } else if (lowerContentType.includes('informational') || lowerContentType.includes('educational') || lowerContentType.includes('information')) {
        contentTypeInstruction = `\n\nCONTENT TYPE: Informational/Educational. Create posts that share knowledge, insights, or educational content from the URL. Focus on teaching Reddit users something valuable. Be factual, informative, and educational. Share key learnings or interesting facts from the content.`
      } else if (lowerContentType.includes('case study') || lowerContentType.includes('case study')) {
        contentTypeInstruction = `\n\nCONTENT TYPE: Case Study. Create posts that share real examples, success stories, or case studies from the URL content. Make them relatable and show practical applications.`
      } else if (lowerContentType.includes('tutorial') || lowerContentType.includes('how to')) {
        contentTypeInstruction = `\n\nCONTENT TYPE: Tutorial/How-To. Create posts that provide step-by-step guidance or how-to information from the URL content. Make them actionable and helpful for Reddit users.`
      } else {
        contentTypeInstruction = `\n\nCONTENT TYPE: "${contentType}". Create posts specifically tailored to this type of content based on the URL.`
      }
    }
    
    const prompt = `You are a Reddit content creator working for a brand. Analyze this website content and create 3 Reddit posts that are authentic, helpful, and written from the brand's/organizer's personal perspective. Each post should feel 100% human-written.

Website Title: ${title}
Website Content: ${textContent.substring(0, 8000)}${contentTypeInstruction}

CRITICAL: Write from a FIRST-PERSON perspective as the brand/business owner/organizer. The tone should be:
- Personal: Use "I", "we", "our" when talking about the business/brand
- Authentic: Share real experiences, insights, or journey from the brand's perspective
- Conversational: Sound like a real person talking about their work, product, or service
- NOT third-party: Don't write like you're reviewing someone else's product/brand
- Engaging: Show genuine passion or interest in what you've built/learned

Based on the actual content from this URL, create Reddit posts that:
- Use first-person language ("I built", "we discovered", "our experience", "my journey")
- Reference real insights, facts, or takeaways from the website content from the creator's perspective
- Show personality and authenticity as the brand/owner
- Share genuine experiences, lessons learned, or insights from the brand's point of view
- Adapt the tone and style based on the content type requested
- Should feel like the brand owner sharing something valuable directly with Reddit users

Examples:
- Instead of "This product helps with X" → "I built this to help with X"
- Instead of "The company discovered Y" → "We discovered Y in our journey"
- Instead of "They offer Z" → "We offer Z because..."
- Instead of "Users find this useful" → "People tell me this is useful because..."

Important: The posts MUST be written from the brand's first-person perspective, using "I/we/my/our" language, and be based on the actual content from the URL.

Also suggest 5-6 highly relevant subreddits where this content would fit. Only suggest subreddit names without the "r/" prefix (just the name).

Respond ONLY in valid JSON format like this:
{
  "posts": [
    {
      "title": "Post title here",
      "description": "Post description here"
    }
  ],
  "suggestedSubreddits": ["subreddit1", "subreddit2", "subreddit3", "subreddit4", "subreddit5", "subreddit6"]
}`

    const aggregatedPosts: Array<{ title: string; description: string }> = []
    const subredditSet = new Set<string>()

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      console.log(`🧠 Generating content attempt ${attempt + 1}`)
      const jsonResponse = await callOpenRouterJSON<{
        posts: Array<{ title: string; description: string }>
        suggestedSubreddits: string[]
      }>(prompt, {
        model: 'google/gemini-2.0-flash-exp:free',
        temperature: 0.8,
        max_tokens: 2000
      })

      if (jsonResponse.posts?.length) {
        aggregatedPosts.push(...jsonResponse.posts)
      }

      jsonResponse.suggestedSubreddits?.forEach(sub => subredditSet.add(sub))

      if (aggregatedPosts.length >= POSTS_PER_BATCH) {
        break
      }
    }

    if (aggregatedPosts.length === 0) {
      throw new Error('No posts were generated. Please try again.')
    }

    const finalPosts = aggregatedPosts.slice(0, POSTS_PER_BATCH)
    const finalSubreddits = Array.from(subredditSet).slice(0, 6)

    if (finalPosts.length < POSTS_PER_BATCH) {
      console.warn(`⚠️ Only generated ${finalPosts.length} posts after ${MAX_GENERATION_ATTEMPTS} attempts`)
    }

    return NextResponse.json({
      success: true,
      posts: finalPosts,
      suggestedSubreddits: finalSubreddits
    })

  } catch (error: any) {
    console.error('Error creating content:', error)
    return NextResponse.json({ 
      error: 'Failed to create content', 
      details: error.message 
    }, { status: 500 })
  }
}

