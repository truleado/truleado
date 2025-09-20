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

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    console.log('Testing Reddit job for product:', product.name)

    // Test Reddit client initialization
    const redditClient = getRedditClient(user.id)
    console.log('Reddit client created for user:', user.id)

    // Test search terms generation
    const searchTerms = redditClient.generateSearchTerms(product)
    console.log('Generated search terms:', searchTerms)

    // Test Reddit API call
    let testResults: any[] = []
    if (product.subreddits && product.subreddits.length > 0) {
      const subreddit = product.subreddits[0]
      console.log(`Testing search in r/${subreddit}`)
      
      try {
        const posts = await redditClient.searchPosts({
          subreddit: subreddit,
          query: searchTerms.slice(0, 3).join(' OR '), // Use first 3 terms
          sort: 'relevance',
          time: 'month',
          limit: 10
        })
        
        console.log(`Found ${posts.length} posts in r/${subreddit}`)
        testResults = posts.map(post => ({
          id: post.id,
          title: post.title,
          subreddit: post.subreddit,
          author: post.author,
          score: post.score,
          num_comments: post.num_comments
        }))
      } catch (error) {
        console.error('Reddit search error:', error)
        testResults = [{ error: error instanceof Error ? error.message : 'Unknown error' }]
      }
    }

    return NextResponse.json({
      success: true,
      product: {
        name: product.name,
        subreddits: product.subreddits
      },
      searchTerms,
      testResults,
      message: `Tested Reddit search for ${product.name}`
    })

  } catch (error) {
    console.error('Test Reddit job error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to test Reddit job'
    }, { status: 500 })
  }
}
