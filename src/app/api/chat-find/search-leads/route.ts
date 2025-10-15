import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { queryParser } from '@/lib/query-parser'
import { getRedditClient } from '@/lib/reddit-client'
import { aiLeadAnalyzer } from '@/lib/ai-lead-analyzer'

// Enhanced relevance calculation with context
async function calculateEnhancedRelevanceScore(post: any, parsedQuery: ParsedQuery): Promise<number> {
  let score = 0
  const text = `${post.title} ${post.selftext || ''}`.toLowerCase()
  
  // Base score from post engagement
  score += Math.min(post.score / 10, 5) // Up to 5 points for high engagement
  score += Math.min(post.num_comments / 5, 3) // Up to 3 points for discussion
  
  // Search terms relevance (most important)
  for (const term of parsedQuery.searchTerms) {
    if (text.includes(term.toLowerCase())) {
      score += 3
    }
  }
  
  // Problem keywords (indicates pain points)
  for (const keyword of parsedQuery.problemKeywords) {
    if (text.includes(keyword.toLowerCase())) {
      score += 2
    }
  }
  
  // Conversation triggers (indicates active seeking)
  for (const trigger of parsedQuery.conversationTriggers) {
    if (text.includes(trigger.toLowerCase())) {
      score += 2
    }
  }
  
  // Solution keywords (indicates they're looking for solutions)
  for (const keyword of parsedQuery.solutionKeywords) {
    if (text.includes(keyword.toLowerCase())) {
      score += 1.5
    }
  }
  
  // Bonus for question marks (indicates seeking help)
  if (text.includes('?')) {
    score += 1
  }
  
  // Bonus for help-seeking phrases (expanded list)
  const helpPhrases = ['help', 'advice', 'recommend', 'suggest', 'need', 'looking for', 'struggling', 'frustrated', 'want', 'require', 'seeking', 'problem', 'issue', 'difficult', 'challenge', 'best', 'good', 'alternative', 'option', 'solution', 'tool', 'software', 'app', 'service']
  for (const phrase of helpPhrases) {
    if (text.includes(phrase)) {
      score += 1
    }
  }
  
  return Math.min(score, 10) // Cap at 10
}

interface ParsedQuery {
  productType: string
  searchTerms: string[]
  subreddits: string[]
  intent: 'find_leads' | 'find_discussions' | 'find_problems'
  confidence: number
  problemKeywords: string[]
  solutionKeywords: string[]
  conversationTriggers: string[]
  targetAudience: string
  industryContext: string
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
      userEmail: user?.email,
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
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('Reddit client status after wait:', {
      isInitialized: redditClient.isInitialized,
      userId: redditClient.userId
    })
    
    // If Reddit client not initialized, return helpful message
    if (!redditClient.isInitialized) {
      console.log('Reddit client not initialized - user needs to connect Reddit')
      return NextResponse.json({ 
        leads: [],
        query: parsedQuery,
        totalFound: 0,
        searchId: searchRecord.id,
        message: 'Please connect your Reddit account in Settings to enable lead discovery.',
        requiresRedditConnection: true
      })
    }

    const leads = []
    const maxLeadsPerSubreddit = 3  // Reduced for faster searches
    const totalMaxLeads = 15  // Reduced for faster searches
    const totalSubreddits = Math.min(parsedQuery.subreddits.length, 5)  // Limit to 5 subreddits max

    console.log(`Searching in ${totalSubreddits} subreddits for leads`)

    // Search each subreddit with timeout protection
    for (let i = 0; i < totalSubreddits; i++) {
      const subreddit = parsedQuery.subreddits[i]
      if (leads.length >= totalMaxLeads) break

      try {
        console.log(`Searching in r/${subreddit}... (${i + 1}/${totalSubreddits})`)
        
        // Create intelligent search query combining search terms, problem keywords, and conversation triggers
        const allSearchTerms = [
          ...parsedQuery.searchTerms,
          ...parsedQuery.problemKeywords,
          ...parsedQuery.conversationTriggers
        ]
        
        // Remove duplicates and create a more targeted search
        const uniqueTerms = [...new Set(allSearchTerms)]
        const searchQuery = uniqueTerms.slice(0, 12).join(' OR ') // Increased from 8 to 12 terms for better coverage
        
        console.log(`Searching r/${subreddit} with query: "${searchQuery}"`)
        
        const searchPromise = redditClient.searchPosts({
          subreddit: subreddit,
          query: searchQuery,
          sort: 'relevance',
          time: 'year',  // Changed from 'week' to 'year'
          limit: maxLeadsPerSubreddit
        })
        
        // Add timeout to prevent 504 errors (reduced to 15s for better reliability)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Search timeout')), 15000)
        )
        
        const posts = await Promise.race([searchPromise, timeoutPromise])

        console.log(`Found ${posts.length} posts in r/${subreddit}`)
        if (posts.length > 0) {
          console.log('Sample post:', {
            title: posts[0].title,
            subreddit: posts[0].subreddit,
            score: posts[0].score,
            num_comments: posts[0].num_comments
          })
        } else {
          console.log(`No posts found in r/${subreddit} with query: "${searchQuery}"`)
          
          // Try a simpler search if the complex one failed
          if (searchQuery.includes(' OR ')) {
            console.log(`Trying simpler search in r/${subreddit}...`)
            try {
              const simpleQuery = parsedQuery.searchTerms.slice(0, 3).join(' ')
              const simpleSearchPromise = redditClient.searchPosts({
                subreddit: subreddit,
                query: simpleQuery,
                sort: 'hot',
                time: 'year',
                limit: maxLeadsPerSubreddit
              })
              
              const simpleTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Simple search timeout')), 15000)
              )
              
              const simplePosts = await Promise.race([simpleSearchPromise, simpleTimeoutPromise])
              console.log(`Simple search found ${simplePosts.length} posts in r/${subreddit}`)
              
              // Process simple search results
              for (const post of simplePosts) {
                if (leads.length >= totalMaxLeads) break
                
                try {
                  const relevanceScore = await calculateEnhancedRelevanceScore(post, parsedQuery)
                  if (relevanceScore >= 3) { // Even lower threshold for fallback
                    console.log(`Fallback lead found: "${post.title}" (score: ${relevanceScore})`)
                    // Add to leads with basic data
                    leads.push({
                      id: post.id,
                      title: post.title,
                      content: post.selftext || '',
                      subreddit: post.subreddit,
                      author: post.author,
                      score: post.score,
                      url: `https://reddit.com${post.permalink}`,
                      created_utc: post.created_utc,
                      relevanceScore: relevanceScore,
                      reasoning: `Found via fallback search for "${simpleQuery}"`,
                      problemKeywords: [],
                      solutionKeywords: []
                    })
                  }
                } catch (postError) {
                  console.error(`Error processing fallback post ${post.id}:`, postError)
                }
              }
            } catch (fallbackError) {
              console.error(`Fallback search failed for r/${subreddit}:`, fallbackError)
            }
          }
        }

        // Process each post
        for (const post of posts) {
          if (leads.length >= totalMaxLeads) break

          try {
            // Calculate enhanced relevance score
            const relevanceScore = await calculateEnhancedRelevanceScore(post, parsedQuery)
            
            // Only include relevant leads (lowered threshold from 6 to 4)
            if (relevanceScore >= 4) {
              console.log(`High relevance lead found: "${post.title}" (score: ${relevanceScore})`)
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
        if (subredditError.message === 'Search timeout') {
          console.log(`Timeout searching r/${subreddit}, continuing with next subreddit`)
        }
        // Continue with next subreddit
      }
    }

    // Sort leads by relevance score (highest first)
    leads.sort((a, b) => b.relevanceScore - a.relevanceScore)
    
    console.log('Search summary:', {
      totalSubredditsSearched: parsedQuery.subreddits.length,
      totalLeadsFound: leads.length,
      redditClientStatus: redditClient.isInitialized ? 'initialized' : 'not initialized'
    })

    // Save results to database
    if (leads.length > 0) {
      console.log(`Saving ${leads.length} leads to database...`)
      
      // Verify search record exists and belongs to user
      const { data: verifySearch, error: verifyError } = await supabase
        .from('chat_find_searches')
        .select('id, user_id')
        .eq('id', searchRecord.id)
        .eq('user_id', user.id)
        .single()
      
      if (verifyError || !verifySearch) {
        console.error('Search record verification failed:', verifyError)
        return NextResponse.json({ 
          error: 'Search record not found or unauthorized',
          searchId: searchRecord.id
        }, { status: 500 })
      }
      
      console.log('Search record verified:', verifySearch)
      
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
        relevance_score: Math.round(lead.relevanceScore * 100), // Convert to integer (multiply by 100 to preserve 2 decimal places)
        ai_analysis_reasons: lead.aiAnalysisReasons,
        ai_sample_reply: lead.aiSampleReply,
        ai_analysis_score: lead.aiAnalysisScore,
        lead_type: lead.leadType,
        parent_post_title: lead.parentPostTitle,
        parent_post_url: lead.parentPostUrl,
        is_comment: lead.isComment
      }))

      console.log('Sample result to insert:', resultsToInsert[0])
      
      const { error: resultsError } = await supabase
        .from('chat_find_results')
        .insert(resultsToInsert)

      if (resultsError) {
        console.error('Failed to save search results:', resultsError)
        console.error('Results error details:', {
          code: resultsError.code,
          message: resultsError.message,
          details: resultsError.details,
          hint: resultsError.hint
        })
        
        // Update search record with error
        await supabase
          .from('chat_find_searches')
          .update({
            search_status: 'failed',
            error_message: `Failed to save results: ${resultsError.message}`,
            completed_at: new Date().toISOString()
          })
          .eq('id', searchRecord.id)
        
        return NextResponse.json({ 
          error: 'Failed to save search results',
          details: resultsError.message,
          searchId: searchRecord.id
        }, { status: 500 })
      } else {
        console.log(`Successfully saved ${leads.length} leads to database`)
      }
    }

    // Update search record as completed
    console.log('Updating search record as completed:', {
      searchId: searchRecord.id,
      totalLeadsFound: leads.length,
      status: 'completed'
    })
    
    const { error: updateError } = await supabase
      .from('chat_find_searches')
      .update({
        total_leads_found: leads.length,
        search_status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', searchRecord.id)
    
    if (updateError) {
      console.error('Failed to update search record:', updateError)
    } else {
      console.log('Search record updated successfully')
    }

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
    console.log('Final leads summary:', {
      totalLeads: leads.length,
      redditClientInitialized: redditClient.isInitialized,
      searchedSubreddits: parsedQuery.subreddits.length,
      searchTerms: parsedQuery.searchTerms
    })

    // If no leads found and Reddit client not initialized, provide helpful message
    if (leads.length === 0 && !redditClient.isInitialized) {
      console.log('No leads found - Reddit client not initialized')
      return NextResponse.json({ 
        leads: [],
        query: parsedQuery,
        totalFound: 0,
        searchId: searchRecord.id,
        message: 'No leads found. Please connect your Reddit account in Settings to enable lead discovery.'
      })
    }

    // If no leads found but Reddit client is initialized, provide different message
    if (leads.length === 0 && redditClient.isInitialized) {
      console.log('No leads found - Reddit client initialized but no relevant posts')
      return NextResponse.json({ 
        leads: [],
        query: parsedQuery,
        totalFound: 0,
        searchId: searchRecord.id,
        message: 'No relevant leads found. Try adjusting your search terms or check different subreddits.'
      })
    }

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
