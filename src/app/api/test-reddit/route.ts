import { NextRequest, NextResponse } from 'next/server'
import { getRedditClient } from '@/lib/reddit-client'

export async function GET(request: NextRequest) {
  try {
    const redditClient = getRedditClient()
    
    // Test basic Reddit API connection
    const testResults = {
      clientInitialized: false,
      credentials: {
        clientId: !!process.env.REDDIT_CLIENT_ID,
        clientSecret: !!process.env.REDDIT_CLIENT_SECRET,
        username: !!process.env.REDDIT_USERNAME,
        password: !!process.env.REDDIT_PASSWORD,
        refreshToken: !!process.env.REDDIT_REFRESH_TOKEN
      },
      testSearch: null as any,
      error: null as string | null
    }

    // Check if client is initialized
    testResults.clientInitialized = (redditClient as any).isInitialized || false

    if (testResults.clientInitialized) {
      try {
        // Test a simple search
        const searchResults = await redditClient.searchPosts({
          query: 'test',
          subreddit: 'test',
          limit: 1
        })
        testResults.testSearch = {
          success: true,
          resultsCount: searchResults.length,
          sampleResult: searchResults[0] || null
        }
      } catch (searchError: any) {
        testResults.testSearch = {
          success: false,
          error: searchError.message
        }
      }
    } else {
      testResults.error = 'Reddit client not initialized - missing credentials'
    }

    return NextResponse.json({
      message: 'Reddit API test completed',
      results: testResults
    })
  } catch (error) {
    console.error('Reddit API test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to test Reddit API'
    }, { status: 500 })
  }
}
