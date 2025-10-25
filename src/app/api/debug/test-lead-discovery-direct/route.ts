import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getRedditClient } from '@/lib/reddit-client'
import { aiLeadAnalyzer } from '@/lib/ai-lead-analyzer'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Starting direct lead discovery test...')
    
    const supabase = await createClient()
    
    // Create a test product first
    const testProduct = {
      user_id: '00000000-0000-0000-0000-000000000000',
      name: 'Test CRM Product',
      description: 'A CRM solution for small businesses',
      website_url: 'https://www.testcrm.com',
      features: ['Lead Management', 'Contact Tracking', 'Sales Pipeline'],
      benefits: ['Increase sales', 'Save time', 'Better organization'],
      pain_points: ['Lost leads', 'Poor follow-up', 'Manual processes'],
      ideal_customer_profile: 'Small businesses, startups, entrepreneurs',
      subreddits: ['entrepreneur', 'smallbusiness'],
      status: 'active'
    }

    console.log('Creating test product...')
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([testProduct])
      .select()
      .single()

    if (productError) {
      console.error('Error creating product:', productError)
      return NextResponse.json({ error: 'Failed to create test product', details: productError.message }, { status: 500 })
    }

    console.log('✅ Test product created:', product.id)

    // Now test lead discovery
    console.log('🔍 Starting lead discovery...')
    const redditClient = getRedditClient()
    
    const productData = {
      name: product.name,
      description: product.description || '',
      features: product.features || [],
      benefits: product.benefits || [],
      painPoints: product.pain_points || [],
      idealCustomerProfile: product.ideal_customer_profile || ''
    }

    const subreddits = ['entrepreneur', 'smallbusiness']
    const searchTerms = ['help', 'struggling', 'problem']
    const allLeads = []

    console.log(`Scanning ${subreddits.length} subreddits with ${searchTerms.length} search terms`)

    for (const subreddit of subreddits) {
      console.log(`Scanning r/${subreddit}...`)
      
      for (const searchTerm of searchTerms) {
        console.log(`  Searching for "${searchTerm}" in r/${subreddit}`)
        
        try {
          const posts = await redditClient.searchPosts({
            subreddit: subreddit,
            query: searchTerm,
            sort: 'hot',
            time: 'week',
            limit: 5
          })
          
          console.log(`  Found ${posts.length} posts for "${searchTerm}" in r/${subreddit}`)
          
          for (const post of posts) {
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
            
            if (analysis.qualityScore >= 1) {
              const lead = {
                ...leadData,
                analysis,
                searchTerm,
                discoveredAt: new Date().toISOString()
              }
              
              allLeads.push(lead)
              console.log(`    ✅ Found high-quality lead: "${post.title}" (score: ${analysis.qualityScore})`)
            } else {
              console.log(`    ❌ Lead rejected: score too low (${analysis.qualityScore})`)
            }
          }
        } catch (searchError) {
          console.error(`  ❌ Error searching r/${subreddit} for "${searchTerm}": ${searchError}`)
        }
      }
    }

    console.log(`🏁 Finished scanning. Total leads found: ${allLeads.length}`)

    // Save leads to database
    if (allLeads.length > 0) {
      console.log(`💾 Saving ${allLeads.length} leads to database...`)
      
      const leadsToSave = allLeads.map(lead => ({
        user_id: '00000000-0000-0000-0000-000000000000',
        product_id: product.id,
        reddit_post_id: lead.url.split('/').pop() || lead.title,
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
      
      const { data: savedLeads, error: saveError } = await supabase
        .from('leads')
        .insert(leadsToSave)
        .select()
      
      if (saveError) {
        console.error('❌ Error saving leads:', saveError)
        return NextResponse.json({ 
          success: false,
          error: 'Failed to save leads', 
          details: saveError.message 
        })
      }
      
      console.log(`✅ Successfully saved ${savedLeads?.length || leadsToSave.length} leads to database`)
      
      return NextResponse.json({
        success: true,
        message: 'Lead discovery test completed successfully',
        product: product,
        leadsFound: allLeads.length,
        leadsSaved: savedLeads?.length || 0,
        sampleLeads: allLeads.slice(0, 3).map(l => ({
          title: l.title,
          subreddit: l.subreddit,
          score: l.analysis.qualityScore,
          url: l.url
        }))
      })
    } else {
      console.log('❌ No leads found')
      return NextResponse.json({
        success: true,
        message: 'Lead discovery test completed but no leads found',
        product: product,
        leadsFound: 0,
        leadsSaved: 0
      })
    }

  } catch (error) {
    console.error('❌ Error in test-lead-discovery-direct:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Test failed', 
      details: error.message 
    })
  }
}
