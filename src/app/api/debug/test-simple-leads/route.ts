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

    console.log('🧪 Testing simple lead discovery...')

    // Import Reddit client
    const { getRedditClient } = await import('@/lib/reddit-client')
    const redditClient = getRedditClient()
    
    // Use very simple, common search terms
    const searchTerms = [
      'help', 'struggling', 'problem', 'need advice', 'recommendations',
      'software', 'tool', 'platform', 'automation', 'productivity',
      'team', 'collaboration', 'communication', 'workflow', 'efficiency'
    ]
    
    const subreddits = ['entrepreneur', 'smallbusiness', 'startups', 'AskReddit', 'business']
    
    console.log(`Testing with ${searchTerms.length} simple terms in ${subreddits.length} subreddits`)
    
    const allPosts = []
    
    // Test each subreddit with simple terms
    for (const subreddit of subreddits) {
      console.log(`Testing r/${subreddit}...`)
      
      for (const searchTerm of searchTerms.slice(0, 3)) { // Test first 3 terms
        try {
          const posts = await redditClient.searchPosts({
            subreddit: subreddit,
            query: searchTerm,
            sort: 'hot',
            time: 'week',
            limit: 5
          })
          
          console.log(`Found ${posts.length} posts for "${searchTerm}" in r/${subreddit}`)
          
          if (posts.length > 0) {
            allPosts.push(...posts.slice(0, 2)) // Take first 2 posts
          }
        } catch (error) {
          console.error(`Error searching r/${subreddit} for "${searchTerm}":`, error)
        }
      }
    }
    
    // Remove duplicates
    const uniquePosts = allPosts.filter((post, index, self) => 
      index === self.findIndex(p => p.id === post.id)
    )
    
    console.log(`Found ${uniquePosts.length} unique posts total`)
    
    // Return sample posts
    const samplePosts = uniquePosts.slice(0, 10).map(post => ({
      title: post.title,
      subreddit: post.subreddit,
      author: post.author,
      score: post.score,
      num_comments: post.num_comments,
      url: `https://reddit.com${post.permalink}`,
      created: new Date(post.created_utc * 1000).toISOString()
    }))
    
    return NextResponse.json({
      success: true,
      totalPosts: uniquePosts.length,
      samplePosts,
      searchTerms,
      subreddits
    })

  } catch (error) {
    console.error('Simple lead test error:', error)
    return NextResponse.json({ 
      error: 'Failed to test lead discovery',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
