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

    console.log('🔍 Scanning existing products for leads...')

    // Get all products for the user
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
      return NextResponse.json({ 
        success: true, 
        message: 'No active products found',
        products: [],
        leadsFound: 0
      })
    }

    console.log(`Found ${products.length} products to scan`)

    // Import Reddit client and AI components
    const { getRedditClient } = await import('@/lib/reddit-client')
    const { aiLeadAnalyzer } = await import('@/lib/ai-lead-analyzer')
    
    const redditClient = getRedditClient()
    
    const allLeads = []
    const results = []

    // Scan each product
    for (const product of products) {
      console.log(`\n📦 Scanning product: ${product.name}`)
      
      // Use simple search terms
      const searchTerms = [
        'help', 'struggling', 'problem', 'need advice', 'recommendations',
        'software', 'tool', 'platform', 'automation', 'productivity',
        'team', 'work', 'business', 'startup', 'company'
      ]
      
      const subreddits = ['entrepreneur', 'smallbusiness', 'startups', 'AskReddit', 'business']
      
      let productLeads = 0
      
      // Scan each subreddit
      for (const subreddit of subreddits) {
        console.log(`  🔍 Scanning r/${subreddit}...`)
        
        for (const searchTerm of searchTerms.slice(0, 3)) {
          try {
            const posts = await redditClient.searchPosts({
              subreddit: subreddit,
              query: searchTerm,
              sort: 'hot',
              time: 'week',
              limit: 5
            })
            
            console.log(`    Found ${posts.length} posts for "${searchTerm}"`)
            
            // Analyze each post
            for (const post of posts) {
              try {
                const leadData = {
                  title: post.title,
                  content: post.selftext || '',
                  author: post.author,
                  subreddit: post.subreddit,
                  score: post.score,
                  numComments: post.num_comments,
                  created: new Date(post.created_utc * 1000),
                  url: `https://reddit.com${post.permalink}`,
                  leadType: 'post' as const
                }
                
                const productData = {
                  name: product.name,
                  description: product.description || '',
                  features: product.features || [],
                  benefits: product.benefits || [],
                  painPoints: product.pain_points || [],
                  idealCustomerProfile: product.ideal_customer_profile || ''
                }
                
                const analysis = await aiLeadAnalyzer.analyzeLead(leadData, productData)
                
                // Include leads with lower threshold
                if (analysis.isLead && analysis.leadScore >= 5) {
                  const lead = {
                    ...leadData,
                    analysis,
                    searchTerm,
                    discoveredAt: new Date().toISOString()
                  }
                  
                  allLeads.push(lead)
                  productLeads++
                  console.log(`    ✅ Found lead: "${post.title}" (score: ${analysis.leadScore})`)
                }
              } catch (analysisError) {
                console.error(`    Error analyzing post: ${analysisError}`)
              }
            }
          } catch (searchError) {
            console.error(`    Error searching r/${subreddit} for "${searchTerm}": ${searchError}`)
          }
        }
      }
      
      results.push({
        productId: product.id,
        productName: product.name,
        leadsFound: productLeads
      })
      
      console.log(`  ✅ Found ${productLeads} leads for ${product.name}`)
    }
    
    // Remove duplicates
    const uniqueLeads = allLeads.filter((lead, index, self) => 
      index === self.findIndex(l => l.url === lead.url)
    )
    
    console.log(`\n🎉 Total unique leads found: ${uniqueLeads.length}`)
    
    // Save leads to database
    if (uniqueLeads.length > 0) {
      const leadsToSave = uniqueLeads.map(lead => ({
        user_id: user.id,
        product_id: lead.analysis.productId || products[0].id, // Use first product if no product ID
        title: lead.title,
        content: lead.content,
        author: lead.author,
        subreddit: lead.subreddit,
        score: lead.score,
        num_comments: lead.numComments,
        url: lead.url,
        lead_type: lead.leadType,
        lead_score: lead.analysis.leadScore,
        pain_points: lead.analysis.painPoints,
        buying_signals: lead.analysis.buyingSignals,
        suggested_approach: lead.analysis.suggestedApproach,
        status: 'new',
        created_at: new Date().toISOString()
      }))
      
      const { error: saveError } = await supabase
        .from('leads')
        .insert(leadsToSave)
      
      if (saveError) {
        console.error('Error saving leads:', saveError)
      } else {
        console.log(`✅ Saved ${leadsToSave.length} leads to database`)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Found ${uniqueLeads.length} leads across ${products.length} products`,
      products: results,
      totalLeads: uniqueLeads.length,
      sampleLeads: uniqueLeads.slice(0, 5).map(lead => ({
        title: lead.title,
        subreddit: lead.subreddit,
        score: lead.analysis.leadScore,
        url: lead.url
      }))
    })

  } catch (error) {
    console.error('Error scanning existing products:', error)
    return NextResponse.json({ 
      error: 'Failed to scan products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
