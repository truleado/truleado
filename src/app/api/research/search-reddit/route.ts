import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Force Node.js runtime to avoid Edge runtime fetch limitations
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Reddit OAuth helper function
async function getRedditAccessToken(): Promise<string | null> {
  try {
    const clientId = process.env.REDDIT_OAUTH_CLIENT_ID
    const clientSecret = process.env.REDDIT_OAUTH_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('Reddit OAuth credentials not configured')
      return null
    }

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'User-Agent': 'Truleado/1.0'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'read'
      })
    })

    if (!response.ok) {
      console.error('Failed to get Reddit access token:', response.status)
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error getting Reddit access token:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🔍 Starting strategic Reddit problem post search...')
    
    const { keywords, productDescription, productName } = await request.json()
    console.log('📥 Request data:', { 
      keywordsCount: keywords?.length, 
      hasDescription: !!productDescription,
      hasProductName: !!productName
    })
    
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ 
        error: 'Keywords array is required',
        details: 'Please provide an array of keywords to search'
      }, { status: 400 })
    }

    if (!productDescription) {
      return NextResponse.json({ 
        error: 'Product description is required for strategic search',
        details: 'Product description helps identify relevant problem posts for pitching'
      }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Google Gemini API key not configured',
        details: 'Please set up your Google Gemini API key to use this feature'
      }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const results = []
    const MAX_EXECUTION_TIME = 50000 // 50 seconds to leave buffer for Vercel 60s limit

    for (const keyword of keywords) {
      // Check if we're running out of time
      const elapsed = Date.now() - startTime
      if (elapsed > MAX_EXECUTION_TIME) {
        console.log(`⏰ Time limit reached (${elapsed}ms). Stopping keyword processing.`)
        break
      }
      
      console.log(`🔍 Searching Reddit for keyword: ${keyword}`)
      
      try {
        // Enhanced search strategy with more targeted terms for pitching opportunities
        const searchTerms = [
          keyword, // Direct keyword search
          `${keyword} problem`,
          `${keyword} issue`,
          `${keyword} help`,
          `${keyword} struggling`,
          `${keyword} failed`,
          `${keyword} not working`,
          `${keyword} alternative`,
          `${keyword} recommendation`,
          `${keyword} solution`,
          `${keyword} best`,
          `${keyword} review`
        ]
        
        // Try multiple search terms to get maximum posts for analysis
        let allPosts: any[] = []
        let searchErrorHandled = false
        
        // Get Reddit access token once for all requests
        const accessToken = await getRedditAccessToken()
        
        for (const searchTerm of searchTerms.slice(0, 3)) { // Use 3 searches to stay within time limits
          try {
            // Use Reddit's global search API with .json suffix
            const redditUrl = `https://oauth.reddit.com/search.json?q=${encodeURIComponent(searchTerm)}&sort=relevance&limit=10&t=all`
            console.log(`🌐 Fetching Reddit URL: ${redditUrl}`)
            
            // Manual timeout implementation (25 seconds)
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 25000)
            
            // Build headers with OAuth if available
            const headers: Record<string, string> = {
              'Accept': 'application/json',
              'Accept-Language': 'en-US,en;q=0.9',
            }
            
            if (accessToken) {
              headers['Authorization'] = `Bearer ${accessToken}`
            }
            
            const redditResponse = await fetch(redditUrl, {
              headers,
              cache: 'no-store',
              signal: controller.signal,
              redirect: 'follow',
            }).finally(() => clearTimeout(timeoutId))

            console.log(`📡 Reddit response status: ${redditResponse.status}`)

            if (!redditResponse.ok) {
              const errorText = await redditResponse.text().catch(() => 'Could not read error body')
              console.error(`❌ Reddit API error for "${searchTerm}":`, {
                status: redditResponse.status,
                statusText: redditResponse.statusText,
                errorBody: errorText.substring(0, 500)
              })
              continue
            }

            const redditData = await redditResponse.json()
            console.log(`📦 Reddit data structure:`, {
              hasData: !!redditData.data,
              hasChildren: !!redditData.data?.children,
              childrenLength: redditData.data?.children?.length
            })
            
            const posts = redditData.data?.children || []
            
            if (posts.length > 0) {
              allPosts = allPosts.concat(posts)
              console.log(`✅ Found ${posts.length} posts for search term: "${searchTerm}"`)
            } else {
              console.log(`⚠️ No posts found for search term: "${searchTerm}"`)
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200))
            
          } catch (searchError: any) {
            console.error(`❌ Error searching for "${searchTerm}":`, searchError)
            // Store error details for debugging
            console.error('Error type:', searchError.name, 'Error message:', searchError.message)
            console.error('Stack trace:', searchError.stack)
            
            // Add to results with detailed error info
            if (!searchErrorHandled) {
              console.error('COMPLETE ERROR DETAILS:', {
                name: searchError.name,
                message: searchError.message,
                code: searchError.code,
                cause: searchError.cause,
                stack: searchError.stack,
                searchTerm: searchTerm,
                url: redditUrl
              })
            }
            searchErrorHandled = true
            continue
          }
        }

        // Remove duplicates based on post ID
        const uniquePosts = allPosts.filter((post, index, self) => 
          index === self.findIndex(p => p.data.id === post.data.id)
        )

        console.log(`📊 Total unique posts found for "${keyword}": ${uniquePosts.length}`)

        if (uniquePosts.length === 0) {
          console.log(`⚠️ Skipping "${keyword}" - no posts to analyze`)
          results.push({
            keyword,
            totalPosts: 0,
            strategicPosts: 0,
            posts: [],
            error: 'No posts found on Reddit for this keyword',
            debugInfo: {
              searchTermsAttempted: searchTerms.slice(0, 3).length,
              note: 'All fetch requests either returned empty results or failed'
            }
          })
          continue
        }

        // Extract post data
        const postData = uniquePosts.map((post: any) => ({
          title: post.data.title,
          selftext: post.data.selftext || '',
          subreddit: post.data.subreddit,
          score: post.data.score,
          num_comments: post.data.num_comments,
          url: `https://reddit.com${post.data.permalink}`,
          created_utc: post.data.created_utc,
          author: post.data.author
        }))
        
        console.log(`📝 Extracted post data for ${postData.length} posts - sending to AI for analysis`)

        // Use Gemini to strategically analyze posts and provide pitch ideas
        const prompt = `You are analyzing Reddit posts to find HIGH-QUALITY pitching opportunities for a specific product/service.

PRODUCT/SERVICE CONTEXT:
- Product Name: ${productName || 'Unknown Product'}
- Description: ${productDescription}

KEYWORD BEING SEARCHED: "${keyword}"

OBJECTIVE: Find ONLY the most relevant posts where someone could strategically pitch this product/service with high success probability.

ANALYZE THESE REDDIT POSTS:
${postData.map((post, index) => `
${index + 1}. Title: "${post.title}"
   Content: "${post.selftext.substring(0, 300)}..."
   Subreddit: r/${post.subreddit}
   Score: ${post.score}
   Comments: ${post.num_comments}
`).join('\n')}

CRITERIA FOR RELEVANT PITCHING OPPORTUNITIES (Include if the post is loosely related):
1. Posts mentioning problems or topics related to ${keyword}
2. Posts asking for help, recommendations, or solutions
3. Posts discussing ${keyword} or related topics
4. Posts showing interest in solutions to problems

For each relevant post, provide:
1. Post index (0-based)
2. Reasoning for why it's a pitching opportunity
3. Sample pitch idea (2-3 sentences)

Return ONLY a JSON array with this exact structure:
[
  {
    "index": 0,
    "reasoning": "Brief explanation of why this post is relevant",
    "samplePitch": "Sample pitch idea (2-3 sentences)"
  }
]

Include posts that are at least somewhat relevant to ${keyword}. Be inclusive - better to include more posts than exclude them.`

        const geminiResult = await model.generateContent(prompt)
        const geminiResponse = await geminiResult.response
        const geminiText = geminiResponse.text()

        console.log(`🤖 Gemini response for "${keyword}":`, geminiText)

        // Parse Gemini response for strategic analysis
        let strategicAnalysis: Array<{index: number, reasoning: string, samplePitch: string}> = []
        try {
          const cleanText = geminiText.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '')
          strategicAnalysis = JSON.parse(cleanText)
          console.log(`✅ Parsed ${strategicAnalysis.length} strategic posts from AI for "${keyword}"`)
        } catch (parseError) {
          console.error('❌ Failed to parse Gemini response:', parseError)
          console.error('❌ Raw Gemini text:', geminiText)
        }

        // Get the strategic posts with analysis
        const strategicPosts = strategicAnalysis
          .filter(analysis => analysis.index >= 0 && analysis.index < postData.length)
          .map(analysis => ({
            ...postData[analysis.index],
            reasoning: analysis.reasoning,
            samplePitch: analysis.samplePitch
          }))
          .slice(0, 10) // Limit to top 10 strategic posts

        results.push({
          keyword,
          totalPosts: uniquePosts.length,
          strategicPosts: strategicPosts.length,
          posts: strategicPosts
        })

        console.log(`✅ Found ${strategicPosts.length} strategic posts for "${keyword}"`)

      } catch (error: any) {
        console.error(`Error processing keyword "${keyword}":`, error)
        results.push({
          keyword,
          totalPosts: 0,
          strategicPosts: 0,
          posts: [],
          error: error.message
        })
      }
    }

    const totalStrategicPosts = results.reduce((sum, r) => sum + (r.strategicPosts || 0), 0)
    const totalKeywords = results.length
    const elapsedTime = Date.now() - startTime

    console.log(`✅ Reddit search completed in ${elapsedTime}ms - Found ${totalStrategicPosts} strategic posts across ${totalKeywords} keywords`)

    // Handle case where no strategic posts were found
    if (totalStrategicPosts === 0) {
      console.log(`⚠️ No strategic posts found. Results:`, results.map(r => ({ 
        keyword: r.keyword, 
        totalPosts: r.totalPosts, 
        strategicPosts: r.strategicPosts,
        hasError: !!r.error,
        error: r.error
      })))
    }

    // If all keywords failed, return a more helpful error
    const hasErrors = results.every(r => !!r.error)
    if (hasErrors && results.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'All keyword searches failed',
        details: 'Unable to fetch data from Reddit. This may be due to network restrictions or rate limiting.',
        debugInfo: results.map(r => ({ keyword: r.keyword, error: r.error })),
        results,
        totalKeywords,
        totalStrategicPosts: 0
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      results,
      totalKeywords,
      totalStrategicPosts
    })

  } catch (error: any) {
    console.error('❌ Reddit search error:', error)
    return NextResponse.json({ 
      error: 'Reddit search failed', 
      details: error.message 
    }, { status: 500 })
  }
}
