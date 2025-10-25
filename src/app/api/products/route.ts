import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Try to get authenticated user first
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Products API auth check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    })

    // Require authentication - no fallback for security
    if (!user) {
      console.error('No authenticated user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Filter products by authenticated user
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    console.log('Products query result:', { productsCount: products?.length || 0, error: error?.message })
    return NextResponse.json({ products: products || [] })
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Product creation API called')
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Auth check:', { user: user?.id, authError })
    
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
        }])

      if (createError) {
        console.error('Failed to create profile:', createError)
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }
    } else if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Failed to verify user profile' }, { status: 500 })
    }

    const productData = await request.json()
    console.log('Product data received:', { name: productData.name, website: productData.website })
    
    // Validate required fields
    if (!productData.name || !productData.website) {
      console.error('Validation failed:', { name: productData.name, website: productData.website })
      return NextResponse.json({ error: 'Product name and website are required' }, { status: 400 })
    }

    // Prepare product data for database
    const product = {
      user_id: user.id,
      name: productData.name,
      description: productData.description || '',
      website_url: productData.website,
      features: productData.features || [],
      benefits: productData.benefits || [],
      pain_points: productData.painPoints || [],
      ideal_customer_profile: productData.idealCustomerProfile || '',
      subreddits: productData.subreddits || [],
      status: 'active',
    }

    // Insert product into database
    console.log('Inserting product:', product)
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create product', details: error.message }, { status: 500 })
    }
    
    console.log('Product created successfully:', data)

        // Immediately scan for leads using the product's search terms
        setImmediate(async () => {
          try {
            console.log(`🔍 Starting immediate lead discovery for product: ${data.name} (ID: ${data.id})`)
            
            // Import Reddit client and AI components
            const { getRedditClient } = await import('@/lib/reddit-client')
            const { aiLeadAnalyzer } = await import('@/lib/ai-lead-analyzer')
            const { aiSearchGenerator } = await import('@/lib/ai-search-generator')
            
            const redditClient = getRedditClient()
            
            // Generate search terms from product data
            const productData = {
              name: data.name,
              description: data.description || '',
              features: data.features || [],
              benefits: data.benefits || [],
              painPoints: data.pain_points || [],
              idealCustomerProfile: data.ideal_customer_profile || ''
            }
            
            // Use very simple, common search terms that are guaranteed to find posts
            const allSearchTerms = [
              'help', 'struggling', 'problem', 'need advice', 'recommendations',
              'software', 'tool', 'platform', 'automation', 'productivity',
              'team', 'work', 'business', 'startup', 'company'
            ]
            
            const subreddits = data.subreddits || [
              'entrepreneur', 'smallbusiness', 'startups', 'AskReddit', 'business'
            ]
            
            console.log(`Scanning ${subreddits.length} subreddits with ${allSearchTerms.length} search terms`)
            console.log('Search terms:', allSearchTerms)
            console.log('Subreddits:', subreddits)
            console.log('Product ID for leads:', data.id)
            
            const allLeads = []
            const maxPostsPerSubreddit = 25
        
            // Scan each subreddit
            for (const subreddit of subreddits) {
              try {
                console.log(`Scanning r/${subreddit}...`)
                
                for (const searchTerm of allSearchTerms.slice(0, 3)) {
                  try {
                    console.log(`  Searching for "${searchTerm}" in r/${subreddit}`)
                    const posts = await redditClient.searchPosts({
                      subreddit: subreddit,
                      query: searchTerm,
                      sort: 'hot',
                      time: 'week',
                      limit: Math.ceil(maxPostsPerSubreddit / allSearchTerms.slice(0, 3).length)
                    })
                    
                    console.log(`  Found ${posts.length} posts for "${searchTerm}" in r/${subreddit}`)
                    
                    // Analyze each post
                    for (const post of posts) {
                      try {
                        console.log(`    Analyzing post: "${post.title}"`)
                        const leadData = {
                          title: post.title,
                          content: post.selftext || '',
                          author: post.author,
                          subreddit: post.subreddit,
                          score: post.score,
                          numComments: post.num_comments,
                          created: new Date(post.created_utc * 1000),
                          url: `https://reddit.com${post.permalink}`,
                          leadType: 'post' as const,
                          created_utc: post.created_utc
                        }
                        
                        const analysis = await aiLeadAnalyzer.analyzeLead(leadData, productData)
                        
                        console.log(`    Analysis result: score=${analysis.qualityScore}, confidence=${analysis.confidence}`)
                        
                        // Include leads with lower threshold to find more results
                        if (analysis.qualityScore >= 1) {
                          const lead = {
                            ...leadData,
                            analysis,
                            searchTerm,
                            discoveredAt: new Date().toISOString()
                          }
                          
                          allLeads.push(lead)
                          console.log(`    ✅ Found high-quality lead: "${post.title}" (score: ${analysis.qualityScore})`)
                          console.log(`    📊 Total leads so far: ${allLeads.length}`)
                        } else {
                          console.log(`    ❌ Lead rejected: score too low (${analysis.qualityScore})`)
                        }
                      } catch (analysisError) {
                        console.error(`    ❌ Error analyzing post: ${analysisError}`)
                      }
                    }
                  } catch (searchError) {
                    console.error(`  ❌ Error searching r/${subreddit} for "${searchTerm}": ${searchError}`)
                  }
                }
              } catch (subredditError) {
                console.error(`❌ Error accessing r/${subreddit}: ${subredditError}`)
              }
            }
            
            console.log(`🏁 Finished scanning all subreddits. Total leads found: ${allLeads.length}`)
        
        // Remove duplicates and save to database
        console.log(`🔄 Processing ${allLeads.length} leads for deduplication...`)
        const uniqueLeads = allLeads.filter((lead, index, self) => 
          index === self.findIndex(l => l.url === lead.url)
        )
        
        uniqueLeads.sort((a, b) => b.analysis.qualityScore - a.analysis.qualityScore)
        
        console.log(`📊 Lead processing complete:`)
        console.log(`  - Total leads found: ${allLeads.length}`)
        console.log(`  - Unique leads after deduplication: ${uniqueLeads.length}`)
        
        // Save leads to database
        if (uniqueLeads.length > 0) {
          console.log(`💾 Preparing to save ${uniqueLeads.length} leads to database...`)
          console.log('Sample lead data:', JSON.stringify(uniqueLeads[0], null, 2))
          
          const leadsToSave = uniqueLeads.map(lead => ({
            user_id: user.id,
            product_id: data.id,
            reddit_post_id: lead.url.split('/').pop() || lead.title, // Extract post ID from URL
            reddit_post_url: lead.url,
            title: lead.title,
            content: lead.content,
            subreddit: lead.subreddit,
            author: lead.author,
            score: lead.score,
            num_comments: lead.numComments,
            status: 'new',
            ai_analysis: {
              qualityScore: lead.analysis.qualityScore,
              confidence: lead.analysis.confidence,
              reasons: lead.analysis.reasons,
              sampleReply: lead.analysis.sampleReply,
              painPoints: lead.analysis.painPoints || [],
              buyingSignals: lead.analysis.buyingSignals || [],
              suggestedApproach: lead.analysis.suggestedApproach || ''
            }
          }))
          
          console.log(`💾 Attempting to save ${leadsToSave.length} leads to database...`)
          console.log('Sample lead to save:', JSON.stringify(leadsToSave[0], null, 2))
          
          const { data: savedLeads, error: saveError } = await supabase
            .from('leads')
            .insert(leadsToSave)
            .select()
          
          if (saveError) {
            console.error('❌ Error saving leads:', saveError)
            console.error('Save error details:', JSON.stringify(saveError, null, 2))
          } else {
            console.log(`✅ Successfully saved ${savedLeads?.length || leadsToSave.length} leads to database`)
            console.log('Saved leads:', savedLeads)
          }
        } else {
          console.log('❌ No leads to save - all leads were filtered out or had low scores')
        }
        
        console.log(`✅ Completed immediate lead discovery for product: ${data.name}`)
      } catch (leadError) {
        console.error(`❌ Failed to discover leads for product ${data.name}:`, leadError)
        // Don't fail product creation if lead discovery fails
      }
    })

    return NextResponse.json({ 
      success: true, 
      product: data,
      message: 'Product created successfully. Scanning Reddit for leads now...'
    })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
