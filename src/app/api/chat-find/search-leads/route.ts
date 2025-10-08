import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { queryParser } from '@/lib/query-parser'
import { getRedditClient } from '@/lib/reddit-client'
import { aiLeadAnalyzer } from '@/lib/ai-lead-analyzer'

interface ParsedQuery {
  productType: string
  searchTerms: string[]
  subreddits: string[]
  intent: 'find_leads' | 'find_discussions' | 'find_problems'
  confidence: number
}

export async function POST(request: NextRequest) {
  try {
    console.log('Chat & Find API: Starting request')
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Chat & Find API: Auth check', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    })
    
    if (authError || !user) {
      console.log('Chat & Find API: Unauthorized', { authError: authError?.message })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query } = await request.json()
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    console.log(`Chat & Find search for user ${user.id}: "${query}"`)

    // Check if user can perform chat find search (usage limits)
    try {
      const { data: canSearch, error: canSearchError } = await supabase
        .rpc('can_perform_chat_find_search', { user_id: user.id })

      if (canSearchError) {
        console.error('Error checking search permission:', canSearchError)
        // If function doesn't exist, allow search for now
        console.log('Usage tracking function not available, allowing search')
      } else if (!canSearch) {
        // Get user's current usage for the error message
        const { data: usageInfo } = await supabase
          .rpc('get_chat_find_usage_info', { user_id: user.id })

        return NextResponse.json({ 
          error: 'Free search limit reached',
          code: 'USAGE_LIMIT_EXCEEDED',
          message: 'You have used your free search. Upgrade to Pro to continue using Chat & Find.',
          freeSearchesUsed: usageInfo?.used || 0,
          limit: 1
        }, { status: 402 }) // 402 Payment Required
      }
    } catch (error) {
      console.error('Error in usage check:', error)
      // If any error occurs, allow search to proceed
      console.log('Allowing search despite usage check error')
    }

    // Create search record in database
    const { data: searchRecord, error: searchError } = await supabase
      .from('chat_find_searches')
      .insert({
        user_id: user.id,
        query: query.trim(),
        search_status: 'pending'
      })
      .select()
      .single()

    if (searchError) {
      console.error('Failed to create search record:', searchError)
      return NextResponse.json({ error: 'Failed to start search' }, { status: 500 })
    }

    // Parse the user query using AI
    const parsedQuery = await queryParser.parseQuery(query)
    console.log('Parsed query:', parsedQuery)

    // Update search record with parsed query
    await supabase
      .from('chat_find_searches')
      .update({ 
        parsed_query: parsedQuery,
        search_status: 'processing'
      })
      .eq('id', searchRecord.id)

    // Check Reddit connection
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('reddit_access_token, reddit_token_expires_at')
      .eq('user_id', user.id)
      .single()

    if (apiKeysError || !apiKeys?.reddit_access_token) {
      return NextResponse.json({ 
        error: 'Reddit account not connected. Please connect your Reddit account in Settings.' 
      }, { status: 400 })
    }

    const tokenExpired = apiKeys.reddit_token_expires_at && 
      new Date(apiKeys.reddit_token_expires_at) < new Date()

    if (tokenExpired) {
      return NextResponse.json({ 
        error: 'Reddit token has expired. Please reconnect your Reddit account in Settings.' 
      }, { status: 400 })
    }

    // Initialize Reddit client
    const redditClient = getRedditClient(user.id)
    
    console.log('Reddit client status:', {
      isInitialized: redditClient.isInitialized,
      userId: redditClient.userId
    })
    
    // Wait for client to initialize
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log('Reddit client status after wait:', {
      isInitialized: redditClient.isInitialized,
      userId: redditClient.userId
    })
    
    if (!redditClient.isInitialized) {
      return NextResponse.json({ 
        error: 'Reddit client not initialized. Please check your Reddit connection in Settings.' 
      }, { status: 500 })
    }

    const leads = []
    const maxLeadsPerSubreddit = 3
    const totalMaxLeads = 15
    const totalSubreddits = parsedQuery.subreddits.length

    console.log(`Searching in ${totalSubreddits} subreddits for leads`)

    // Search each subreddit
    for (let i = 0; i < parsedQuery.subreddits.length; i++) {
      const subreddit = parsedQuery.subreddits[i]
      if (leads.length >= totalMaxLeads) break

      try {
        console.log(`Searching in r/${subreddit}... (${i + 1}/${totalSubreddits})`)
        
        // Use Reddit client to search for posts
        const searchQuery = parsedQuery.searchTerms.join(' OR ')
        console.log(`Searching r/${subreddit} with query: "${searchQuery}"`)
        
        const posts = await redditClient.searchPosts({
          subreddit: subreddit,
          query: searchQuery,
          sort: 'relevance',
          time: 'week',
          limit: maxLeadsPerSubreddit
        })

        console.log(`Found ${posts.length} posts in r/${subreddit}`)
        if (posts.length > 0) {
          console.log('Sample post:', {
            title: posts[0].title,
            subreddit: posts[0].subreddit,
            score: posts[0].score
          })
        }

        // Process each post
        for (const post of posts) {
          if (leads.length >= totalMaxLeads) break

          try {
            // Calculate relevance score
            const relevanceScore = await calculateRelevanceScore(post, parsedQuery)
            
            // Only include high-relevance leads
            if (relevanceScore >= 6) {
              // Perform AI analysis
              const leadData = {
                title: post.title,
                content: post.selftext || '',
                author: post.author,
                subreddit: post.subreddit,
                score: post.score,
                numComments: post.num_comments,
                leadType: 'post' as const
              }

              const productData = {
                name: parsedQuery.productType,
                description: `Looking for ${parsedQuery.productType}`,
                features: [],
                benefits: [],
                painPoints: [],
                idealCustomerProfile: 'Reddit users seeking solutions'
              }

              let aiAnalysis = null
              try {
                aiAnalysis = await aiLeadAnalyzer.analyzeLead(leadData, productData)
              } catch (aiError) {
                console.error('AI analysis failed:', aiError)
                // Continue without AI analysis
              }

              const lead = {
                id: `chat-find-${post.id}`,
                title: post.title,
                content: post.selftext || '',
                subreddit: post.subreddit,
                author: post.author,
                url: `https://reddit.com${post.permalink}`,
                score: post.score,
                comments: post.num_comments,
                createdAt: new Date(post.created_utc * 1000).toISOString(),
                relevanceScore,
                aiAnalysisReasons: aiAnalysis?.reasons || [],
                aiSampleReply: aiAnalysis?.sampleReply || '',
                aiAnalysisScore: aiAnalysis?.qualityScore || 0,
                leadType: 'post' as const,
                isComment: false
              }

              leads.push(lead)
              console.log(`Added lead: ${post.title} (Score: ${relevanceScore})`)
            }
          } catch (postError) {
            console.error(`Error processing post ${post.id}:`, postError)
            // Continue with next post
          }
        }
      } catch (subredditError) {
        console.error(`Error searching in r/${subreddit}:`, subredditError)
        // Continue with next subreddit
      }
    }

    // Sort leads by relevance score (highest first)
    leads.sort((a, b) => b.relevanceScore - a.relevanceScore)

    // Save results to database
    if (leads.length > 0) {
      const resultsToInsert = leads.map(lead => ({
        search_id: searchRecord.id,
        lead_id: lead.id,
        title: lead.title,
        content: lead.content,
        subreddit: lead.subreddit,
        author: lead.author,
        url: lead.url,
        score: lead.score,
        comments: lead.comments,
        created_at: lead.createdAt,
        relevance_score: lead.relevanceScore,
        ai_analysis_reasons: lead.aiAnalysisReasons,
        ai_sample_reply: lead.aiSampleReply,
        ai_analysis_score: lead.aiAnalysisScore,
        lead_type: lead.leadType,
        parent_post_title: lead.parentPostTitle,
        parent_post_url: lead.parentPostUrl,
        is_comment: lead.isComment
      }))

      const { error: resultsError } = await supabase
        .from('chat_find_results')
        .insert(resultsToInsert)

      if (resultsError) {
        console.error('Failed to save search results:', resultsError)
      }
    }

    // Update search record as completed
    await supabase
      .from('chat_find_searches')
      .update({
        total_leads_found: leads.length,
        search_status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', searchRecord.id)

    // Increment user's search count
    try {
      const { error: incrementError } = await supabase
        .rpc('increment_chat_find_search_count', { user_id: user.id })

      if (incrementError) {
        console.error('Error incrementing search count:', incrementError)
        // Don't fail the search if counting fails
      }
    } catch (error) {
      console.error('Error in usage increment:', error)
      // Don't fail the search if counting fails
    }

    console.log(`Chat & Find completed: Found ${leads.length} leads for query "${query}"`)

    return NextResponse.json({ 
      leads,
      query: parsedQuery,
      totalFound: leads.length,
      searchId: searchRecord.id
    })

  } catch (error) {
    console.error('Error in chat-find search:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({ 
      error: 'Failed to search for leads',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

async function calculateRelevanceScore(post: any, parsedQuery: ParsedQuery): Promise<number> {
  let score = 0
  const title = post.title.toLowerCase()
  const content = (post.selftext || '').toLowerCase()
  const fullText = `${title} ${content}`

  // Check for search term matches
  for (const term of parsedQuery.searchTerms) {
    if (fullText.includes(term.toLowerCase())) {
      score += 2
    }
  }

  // Boost score for product type mentions
  if (fullText.includes(parsedQuery.productType.toLowerCase())) {
    score += 3
  }

  // Boost score for problem indicators
  const problemWords = ['need', 'looking for', 'want', 'require', 'seeking', 'help', 'problem', 'issue', 'struggling', 'difficult']
  for (const word of problemWords) {
    if (fullText.includes(word)) {
      score += 1
    }
  }

  // Boost score for question posts
  if (title.includes('?') || title.includes('how') || title.includes('what') || title.includes('where')) {
    score += 2
  }

  // Boost score for recent posts (within last 7 days)
  const postAge = Date.now() - (post.created_utc * 1000)
  const daysOld = postAge / (1000 * 60 * 60 * 24)
  if (daysOld <= 7) {
    score += 1
  }

  // Boost score for high engagement
  if (post.num_comments > 5) {
    score += 1
  }
  if (post.score > 10) {
    score += 1
  }

  return Math.min(Math.max(score, 0), 10)
}
