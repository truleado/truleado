import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getRedditClient } from '@/lib/reddit-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Get the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    console.log(`🚀 FORCE RUNNING Reddit monitoring for product: ${product.name}`)

    // Get Reddit client
    const redditClient = getRedditClient()
    const searchTerms = redditClient.generateSearchTerms(product)
    
    let totalLeadsFound = 0
    
    // Search in each subreddit
    for (const subreddit of product.subreddits) {
      console.log(`🔍 Searching in r/${subreddit} for product: ${product.name}`)
      
      // Search for posts using generated terms
      const posts = await redditClient.searchPosts({
        subreddit: subreddit,
        query: searchTerms.join(' OR '),
        sort: 'relevance',
        time: 'year',
        limit: 50
      })
      
      console.log(`📊 Found ${posts.length} posts in r/${subreddit}`)
      
      // Process each post
      for (const post of posts) {
        // Simple relevance scoring
        let score = 0
        const postText = `${post.title} ${post.selftext}`.toLowerCase()
        
        // Direct product mention
        if (postText.includes(product.name.toLowerCase())) {
          score += 10
        }
        
        // Generic solution-seeking terms
        const solutionTerms = ['looking for', 'need', 'want', 'recommend', 'suggest', 'help with', 'struggling']
        for (const term of solutionTerms) {
          if (postText.includes(term)) {
            score += 1
          }
        }
        
        // Only save leads with score >= 5
        if (score >= 5) {
          try {
            const { error } = await supabase
              .from('leads')
              .insert({
                user_id: user.id,
                product_id: product.id,
                reddit_post_id: post.id,
                reddit_post_url: post.url,
                title: post.title,
                content: post.selftext,
                subreddit: post.subreddit,
                author: post.author,
                score: post.score,
                num_comments: post.num_comments,
                relevance_score: score,
                status: 'new'
              })

            if (error) {
              if (error.code === '23505') {
                console.log(`⚠️ Lead already exists: ${post.id}`)
              } else {
                console.error('❌ Error saving lead:', error)
              }
            } else {
              console.log(`✅ Saved new lead: ${post.title}`)
              totalLeadsFound++
            }
          } catch (error) {
            console.error('❌ Error saving lead:', error)
          }
        }
      }
    }
    
    console.log(`🎉 Reddit monitoring completed for product: ${product.name}. Found ${totalLeadsFound} leads.`)

    return NextResponse.json({ 
      message: `Lead discovery completed! Found ${totalLeadsFound} leads.`,
      leadsFound: totalLeadsFound,
      productName: product.name
    })
  } catch (error) {
    console.error('❌ Force run error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to run lead discovery'
    }, { status: 500 })
  }
}
