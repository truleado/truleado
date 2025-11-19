import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { callOpenRouterJSON } from '@/lib/openrouter-client'

// Force Node.js runtime to avoid Edge runtime fetch limitations
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Reddit OAuth helper function - gets user token first, falls back to server token
async function getRedditAccessToken(userId?: string): Promise<string | null> {
  try {
    // Try to get user's Reddit token first (better rate limits and more reliable)
    if (userId) {
      const supabase = await createClient()
      const { data: apiKeys } = await supabase
        .from('api_keys')
        .select('reddit_access_token, reddit_token_expires_at')
        .eq('user_id', userId)
        .single()

      if (apiKeys?.reddit_access_token) {
        // Check if token is expired
        const isExpired = apiKeys.reddit_token_expires_at && 
          new Date(apiKeys.reddit_token_expires_at) <= new Date()

        if (!isExpired) {
          console.log('Using user Reddit token')
          return apiKeys.reddit_access_token
        }
      }
    }

    // Fall back to server token
    console.log('Falling back to server Reddit token')
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

/**
 * Filter posts by relevance to product value proposition using AI
 * Returns only posts that are highly relevant (isRelevant: true)
 */
async function filterPostsByRelevance(
  posts: any[],
  productName: string,
  productDescription: string,
  painPoints: string[] = [],
  benefits: string[] = []
): Promise<any[]> {
  if (posts.length === 0) return []
  
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.warn('OpenRouter API key not configured, skipping relevance filtering')
    return posts // Return all posts if AI is not available
  }

  try {
    // Process posts in batches of 10 to stay within token limits and time constraints
    const BATCH_SIZE = 10
    const relevantPosts: any[] = []
    let successfulBatches = 0
    let failedBatches = 0
    
    for (let i = 0; i < posts.length; i += BATCH_SIZE) {
      const batch = posts.slice(i, i + BATCH_SIZE)
      
      // Build prompt for batch analysis
      const postsData = batch.map((post, idx) => ({
        index: idx + 1,
        title: post.title,
        content: (post.selftext || '').substring(0, 500), // Limit content length
        subreddit: post.subreddit,
        score: post.score,
        num_comments: post.num_comments
      }))
      
      const prompt = `You are a GTM strategist analyzing Reddit posts to find high-quality pitching opportunities.

PRODUCT/SERVICE CONTEXT:
- Product Name: ${productName}
- Description: ${productDescription}
${painPoints.length > 0 ? `- Pain Points Solved: ${painPoints.join(', ')}` : ''}
${benefits.length > 0 ? `- Key Benefits: ${benefits.join(', ')}` : ''}

REDDIT POSTS TO ANALYZE:
${JSON.stringify(postsData, null, 2)}

OBJECTIVE: For each post, determine if it represents a HIGH-QUALITY opportunity to pitch this product/service. A post is relevant ONLY if:
1. The post discusses a problem/pain point that this product directly solves
2. The post author is actively seeking a solution or expressing frustration
3. The product's value proposition clearly aligns with the post's topic
4. The post is NOT just tangentially related - it must be a strong match

Return ONLY valid JSON with this exact structure:
{
  "results": [
    {
      "index": 1,
      "isRelevant": true,
      "relevanceScore": 8,
      "reasoning": "Brief explanation (1-2 sentences) of why this post is relevant or not"
    },
    ...
  ]
}

Be STRICT with relevance - only mark posts as relevant (isRelevant: true) if they are a STRONG match. Relevance score should be 1-10, where 7+ means highly relevant.`

      try {
        const analysis = await callOpenRouterJSON<{
          results: Array<{
            index: number
            isRelevant: boolean
            relevanceScore: number
            reasoning: string
          }>
        }>(prompt, {
          model: 'google/gemini-2.0-flash-exp:free',
          temperature: 0.3, // Lower temperature for more consistent filtering
          max_tokens: 2000
        })
        
        // Map analysis results back to posts
        batch.forEach((post, batchIdx) => {
          const result = analysis.results?.find(r => r.index === batchIdx + 1)
          if (result && result.isRelevant && result.relevanceScore >= 7) {
            // Add relevance metadata to post
            relevantPosts.push({
              ...post,
              relevanceScore: result.relevanceScore,
              relevanceReasoning: result.reasoning
            })
          }
        })
        
        successfulBatches++
        console.log(`✅ Filtered batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} posts → ${analysis.results?.filter(r => r.isRelevant && r.relevanceScore >= 7).length || 0} relevant`)
        
        // Small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < posts.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (batchError: any) {
        failedBatches++
        console.error(`Error filtering batch ${Math.floor(i / BATCH_SIZE) + 1}:`, batchError.message || batchError)
        // If batch fails, skip it (don't include those posts)
        // Add a small delay before trying next batch
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }
    }
    
    // If all batches failed, return all posts (graceful degradation)
    if (successfulBatches === 0 && failedBatches > 0) {
      console.warn(`⚠️ All ${failedBatches} batches failed AI filtering. Returning all posts without filtering.`)
      return posts.map(post => ({
        ...post,
        relevanceScore: 5, // Default score
        relevanceReasoning: 'AI filtering unavailable - post included by default'
      }))
    }
    
    console.log(`🎯 Relevance filtering: ${posts.length} posts → ${relevantPosts.length} highly relevant posts (${successfulBatches} successful batches, ${failedBatches} failed)`)
    return relevantPosts
    
  } catch (error: any) {
    console.error('Error in relevance filtering:', error)
    // If filtering fails entirely, return all posts (better than returning nothing)
    return posts
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Get the current user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔍 Starting strategic Reddit problem post search...')
    
    const { keywords, keywordGroups, productDescription, productName, painPoints, benefits } = await request.json()
    console.log('📥 Request data:', { 
      keywordsCount: keywords?.length, 
      keywordGroupCount: keywordGroups?.length,
      hasDescription: !!productDescription,
      hasProductName: !!productName,
      painPointsCount: painPoints?.length || 0,
      benefitsCount: benefits?.length || 0
    })
    
    // Build search plan from keyword groups or fallback keywords
    const searchPlans: Array<{ keyword: string, groupType: string, groupLabel: string }> = []
    
    if (Array.isArray(keywordGroups) && keywordGroups.length > 0) {
      keywordGroups.forEach((group: any) => {
        const groupType = group?.type || 'custom'
        const groupLabel = group?.label || groupType
        if (Array.isArray(group?.keywords)) {
          group.keywords.forEach((keyword: string) => {
            if (keyword && keyword.trim().length > 1) {
              searchPlans.push({
                keyword: keyword.trim(),
                groupType,
                groupLabel
              })
            }
          })
        }
      })
    } else if (Array.isArray(keywords)) {
      keywords.forEach((keyword: string) => {
        if (keyword && keyword.trim().length > 1) {
          searchPlans.push({
            keyword: keyword.trim(),
            groupType: 'legacy',
            groupLabel: 'Keyword'
          })
        }
      })
    }
    
    if (searchPlans.length === 0) {
      return NextResponse.json({ 
        error: 'No keywords provided',
        details: 'Please provide keywords or keywordGroups to search'
      }, { status: 400 })
    }
    
    const seenPostIdsByGroup = new Map<string, Set<string>>()
    const seenCanonicalByGroup = new Map<string, Set<string>>()
    const seenTitleHashesByGroup = new Map<string, Set<string>>()

    const getGroupKey = (plan: { groupType?: string, groupLabel?: string }) => {
      return `${plan.groupType || 'default'}|${plan.groupLabel || plan.groupType || 'group'}`
    }
    
    const getDedupSet = (map: Map<string, Set<string>>, key: string) => {
      if (!map.has(key)) {
        map.set(key, new Set<string>())
      }
      return map.get(key)!
    }

    if (!productDescription) {
      return NextResponse.json({ 
        error: 'Product description is required for strategic search',
        details: 'Product description helps identify relevant problem posts for pitching'
      }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'OpenRouter API key not configured',
        details: 'Please set up your OpenRouter API key to use this feature'
      }, { status: 500 })
    }

    const results = []
    const MAX_EXECUTION_TIME = 50000 // 50 seconds to leave buffer for Vercel 60s limit

    for (const plan of searchPlans) {
      const keyword = plan.keyword
      const groupKey = getGroupKey(plan)
      const groupPostIds = getDedupSet(seenPostIdsByGroup, groupKey)
      const groupCanonicalSet = getDedupSet(seenCanonicalByGroup, groupKey)
      const groupTitleHashSet = getDedupSet(seenTitleHashesByGroup, groupKey)
      // Check if we're running out of time
      const elapsed = Date.now() - startTime
      if (elapsed > MAX_EXECUTION_TIME) {
        console.log(`⏰ Time limit reached (${elapsed}ms). Stopping keyword processing.`)
        break
      }
      
      console.log(`🔍 Searching Reddit for keyword: ${keyword} (type: ${plan.groupType})`)
      
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
        
        // Get Reddit access token once for all requests (try user's token first)
        const accessToken = await getRedditAccessToken(user?.id)
        
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

        // Extract post data (without AI analysis to save API costs)
        const postData = uniquePosts.map((post: any) => {
          const permalink = post.data.permalink ? `https://reddit.com${post.data.permalink}` : ''
          const externalUrl = post.data.url || ''
          // Determine canonical URL (for text posts, use permalink; for link posts, use external URL)
          const canonicalUrl = externalUrl && !externalUrl.startsWith('https://www.reddit.com')
            ? externalUrl
            : permalink

          return {
            id: post.data.id,
            title: post.data.title,
            selftext: post.data.selftext || '',
            subreddit: post.data.subreddit,
            score: post.data.score,
            num_comments: post.data.num_comments,
            url: permalink || externalUrl,
            canonicalUrl,
            created_utc: post.data.created_utc,
            author: post.data.author,
            matchedKeyword: keyword,
            matchedGroupType: plan.groupType,
            matchedGroupLabel: plan.groupLabel,
            // Analysis will be done on-demand when user clicks "Pitch" button
            reasoning: null,
            samplePitch: null
          }
        })
        
        let duplicateCountForKeyword = 0
        const dedupedPosts = postData.filter(post => {
          const dedupeKey = post.id || post.url
          const canonicalKey = (post.canonicalUrl || '').toLowerCase().replace(/\/$/, '')
          const titleHash = (post.title || '').toLowerCase().replace(/\s+/g, ' ').substring(0, 140)

          if (dedupeKey && groupPostIds.has(dedupeKey)) {
            duplicateCountForKeyword++
            return false
          }
          if (canonicalKey && groupCanonicalSet.has(canonicalKey)) {
            duplicateCountForKeyword++
            return false
          }
          if (titleHash && groupTitleHashSet.has(titleHash)) {
            duplicateCountForKeyword++
            return false
          }

          if (dedupeKey) {
            groupPostIds.add(dedupeKey)
          }
          if (canonicalKey) {
            groupCanonicalSet.add(canonicalKey)
          }
          if (titleHash) {
            groupTitleHashSet.add(titleHash)
          }
          return true
        })
        
        if (duplicateCountForKeyword > 0) {
          console.log(`🧹 Removed ${duplicateCountForKeyword} duplicates for keyword "${keyword}"`)
        }
        
        console.log(`📝 Extracted post data for ${dedupedPosts.length} posts (after dedupe)`)

        if (dedupedPosts.length === 0) {
          results.push({
            keyword,
            groupType: plan.groupType,
            groupLabel: plan.groupLabel,
            totalPosts: 0,
            strategicPosts: 0,
            posts: [],
            note: 'All posts for this keyword were duplicates of other keywords'
          })
          continue
        }

        // Filter posts by relevance to product value proposition
        console.log(`🎯 Filtering ${dedupedPosts.length} posts for relevance to "${productName}"...`)
        const relevantPosts = await filterPostsByRelevance(
          dedupedPosts,
          productName || 'the product',
          productDescription || '',
          Array.isArray(painPoints) ? painPoints : [],
          Array.isArray(benefits) ? benefits : []
        )

        if (relevantPosts.length === 0) {
          console.log(`⚠️ No relevant posts found for "${keyword}" after filtering`)
          results.push({
            keyword,
            groupType: plan.groupType,
            groupLabel: plan.groupLabel,
            totalPosts: dedupedPosts.length,
            strategicPosts: 0,
            posts: [],
            note: `Found ${dedupedPosts.length} posts but none were highly relevant to the product's value proposition`
          })
          continue
        }

        // Sort by relevance score (highest first), then by engagement (score + comments)
        const sortedPosts = relevantPosts.sort((a, b) => {
          const scoreA = a.relevanceScore || 0
          const scoreB = b.relevanceScore || 0
          if (scoreA !== scoreB) return scoreB - scoreA
          const engagementA = (a.score || 0) + (a.num_comments || 0)
          const engagementB = (b.score || 0) + (b.num_comments || 0)
          return engagementB - engagementA
        })

        // Return only highly relevant posts
        results.push({
          keyword,
          groupType: plan.groupType,
          groupLabel: plan.groupLabel,
          totalPosts: dedupedPosts.length,
          strategicPosts: sortedPosts.length,
          posts: sortedPosts.slice(0, 30) // Limit to top 30 most relevant posts per keyword
        })

        console.log(`✅ Found ${sortedPosts.length} highly relevant posts for "${keyword}" (from ${dedupedPosts.length} total posts)`)

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

    const totalPosts = results.reduce((sum, r) => sum + (r.totalPosts || 0), 0)
    const totalStrategicPosts = results.reduce((sum, r) => sum + (r.posts?.length || 0), 0)
    const totalKeywords = results.length
    const elapsedTime = Date.now() - startTime

    console.log(`✅ Reddit search completed in ${elapsedTime}ms - Found ${totalPosts} posts across ${totalKeywords} keywords (ready for on-demand analysis)`)

    // Handle case where no posts were found
    if (totalPosts === 0) {
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
      totalStrategicPosts,
      keywordGroupsUsed: Array.isArray(keywordGroups) ? keywordGroups.length : 0,
      keywordPlans: searchPlans.length
    })

  } catch (error: any) {
    console.error('❌ Reddit search error:', error)
    return NextResponse.json({ 
      error: 'Reddit search failed', 
      details: error.message 
    }, { status: 500 })
  }
}
