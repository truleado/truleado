import { NextRequest, NextResponse } from 'next/server'
import { getRedditClient } from '@/lib/reddit-client'

export async function GET(request: NextRequest) {
  try {
    const redditClient = getRedditClient()
    
    // Test the Reddit client with a simple search
    const searchResults = await redditClient.searchPosts({
      query: 'startup',
      subreddit: 'entrepreneur',
      limit: 3
    })
    
    return NextResponse.json({
      message: 'Reddit client test completed',
      success: true,
      resultsCount: searchResults.length,
      results: searchResults.map(post => ({
        id: post.id,
        title: post.title,
        subreddit: post.subreddit,
        author: post.author,
        score: post.score,
        url: post.url
      }))
    })
  } catch (error) {
    console.error('Reddit client test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to test Reddit client',
      success: false
    }, { status: 500 })
  }
}
