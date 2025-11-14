export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'No active products found' }, { status: 400 })
    }

    // Start real lead discovery using Reddit public API
    let discoveryStarted = false
    let realLeadsFound = 0
    
    try {
      // Import Reddit client, AI analyzer, and search generator
      const { getRedditClient } = await import('@/lib/reddit-client')
      const { aiLeadAnalyzer } = await import('@/lib/ai-lead-analyzer')
      const { aiSearchGenerator } = await import('@/lib/ai-search-generator')
      
      const redditClient = getRedditClient()
      console.log('Reddit client initialized for lead discovery')
      
      // Search for real leads for each product
      for (const product of products) {
        console.log(`Starting real lead discovery for product: ${product.name}`)
        
        // Generate AI-powered search terms
        const productData = {
          name: product.name,
          description: product.description || '',
          features: product.features || [],
          benefits: product.benefits || [],
          painPoints: product.pain_points || [],
          idealCustomerProfile: product.ideal_customer_profile || ''
        }
        
        const searchStrategy = await aiSearchGenerator.generateSearchTerms(productData)
        
        // Combine all search terms for comprehensive searching
        const allSearchTerms = [
          ...searchStrategy.problemTerms,
          ...searchStrategy.solutionTerms,
          ...searchStrategy.industryTerms,
          ...searchStrategy.conversationTerms,
          ...searchStrategy.urgencyTerms,
          ...searchStrategy.toolTerms
        ].filter(term => term && term.length > 2) // Filter out short/empty terms
        
        console.log(`Generated ${allSearchTerms.length} search terms for ${product.name}:`, allSearchTerms.slice(0, 10))
        
        const subreddits = product.subreddits || ['entrepreneur', 'smallbusiness', 'startups']
        
        // Search in each subreddit
        for (const subreddit of subreddits.slice(0, 3)) { // Limit to 3 subreddits to avoid rate limiting
          try {
            console.log(`Searching r/${subreddit} for product: ${product.name}`)
            
            // Search with AI-generated search terms
            let posts: any[] = []
            if (allSearchTerms.length > 0) {
              posts = await redditClient.searchPostsWithKeywords(subreddit, allSearchTerms, 10)
            } else {
              // Fallback to basic search if no terms generated
              posts = await redditClient.searchPosts({
                subreddit: subreddit,
                query: product.name,
                sort: 'hot',
                limit: 10
              })
            }
            
            console.log(`Found ${posts.length} posts in r/${subreddit}`)
            
            // Process each post with AI analysis
            for (const post of posts) {
              try {
                const leadData = {
                  title: post.title,
                  content: post.selftext,
                  subreddit: post.subreddit,
                  author: post.author,
                  score: post.score,
                  numComments: post.num_comments,
                  leadType: 'post' as const
                }

                const productData = {
                  name: product.name,
                  description: product.description,
                  features: product.features || [],
                  benefits: product.benefits || [],
                  painPoints: product.pain_points || [],
                  idealCustomerProfile: product.ideal_customer_profile || ''
                }

                // Analyze with AI (with fallback for missing API keys)
                let aiAnalysis = null
                try {
                  aiAnalysis = await aiLeadAnalyzer.analyzeLead(leadData, productData)
                  console.log(`AI analysis completed for post: ${post.title.substring(0, 50)}... (Score: ${aiAnalysis.qualityScore})`)
                } catch (aiError) {
                  console.error('AI analysis failed:', aiError)
                  // Create a basic analysis fallback
                  aiAnalysis = {
                    qualityScore: 5, // Medium score for fallback
                    reasons: ['AI analysis unavailable - using basic relevance check'],
                    sampleReply: 'This looks like it could be relevant to your product. Consider reaching out to learn more about their specific needs.',
                    confidence: 0.5
                  }
                }
                
                // Save leads with medium+ relevance score (lowered threshold for fallback)
                const minScore = aiAnalysis ? 5 : 3 // Lower threshold if AI failed
                if (aiAnalysis && aiAnalysis.qualityScore >= minScore) {
                  const lead = {
                    title: post.title,
                    content: post.selftext,
                    subreddit: post.subreddit,
                    author: post.author,
                    url: post.permalink,
                    score: post.score,
                    num_comments: post.num_comments,
                    product_id: product.id,
                    relevance_score: aiAnalysis.qualityScore,
                    ai_analysis_reasons: aiAnalysis.reasons,
                    ai_sample_reply: aiAnalysis.sampleReply,
                    ai_analysis_score: aiAnalysis.confidence,
                    lead_type: "post",
                    status: "new",
                    user_id: user.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }

                  const { error: leadError } = await supabase
                    .from('leads')
                    .insert(lead)

                  if (!leadError) {
                    realLeadsFound++
                    console.log(`Saved real lead: ${post.title} (Score: ${aiAnalysis.relevanceScore})`)
                  } else {
                    console.error('Error saving lead:', leadError)
                  }
                }
              } catch (postError) {
                console.error(`Error processing post ${post.id}:`, postError)
              }
            }
          } catch (subredditError) {
            console.error(`Error searching r/${subreddit}:`, subredditError)
          }
        }
        
        discoveryStarted = true
      }
    } catch (error) {
      console.error('Error in real lead discovery:', error)
    }

    return NextResponse.json({
      success: true,
      message: discoveryStarted ? `Real lead discovery completed! Found ${realLeadsFound} leads` : 'Lead discovery failed',
      products_count: products.length,
      discovery_type: 'real',
      real_discovery_started: discoveryStarted,
      real_leads_found: realLeadsFound,
      reddit_connected: false
    })

  } catch (error) {
    console.error('Error starting lead discovery:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to start lead discovery'
    }, { status: 500 })
  }
}