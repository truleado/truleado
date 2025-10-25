import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('Testing lead discovery system...')
    
    // Import Reddit client and AI components
    const { getRedditClient } = await import('@/lib/reddit-client')
    const { aiLeadAnalyzer } = await import('@/lib/ai-lead-analyzer')
    const { aiSearchGenerator } = await import('@/lib/ai-search-generator')
    
    const redditClient = getRedditClient()
    console.log('Reddit client initialized successfully')
    
    // Test with a sample product
    const testProduct = {
      name: 'Test Product',
      description: 'A test product for lead discovery',
      features: ['Feature 1', 'Feature 2'],
      benefits: ['Benefit 1', 'Benefit 2'],
      painPoints: ['Pain point 1', 'Pain point 2'],
      idealCustomerProfile: 'Test customers'
    }
    
    // Generate search terms
    const searchStrategy = await aiSearchGenerator.generateSearchTerms(testProduct)
    console.log('Search strategy generated:', searchStrategy)
    
    // Test Reddit search
    const testSubreddit = 'entrepreneur'
    const testQuery = 'startup tools'
    
    const posts = await redditClient.searchPosts({
      subreddit: testSubreddit,
      query: testQuery,
      sort: 'hot',
      limit: 5
    })
    
    console.log(`Found ${posts.length} posts from r/${testSubreddit}`)
    
    // Test AI analysis on first post
    if (posts.length > 0) {
      const firstPost = posts[0]
      console.log('Testing AI analysis on post:', firstPost.title)
      
      const leadData = {
        title: firstPost.title,
        content: firstPost.selftext,
        author: firstPost.author,
        subreddit: firstPost.subreddit,
        score: firstPost.score,
        numComments: firstPost.num_comments,
        leadType: 'post' as const
      }
      
      const analysis = await aiLeadAnalyzer.analyzeLead(leadData, testProduct)
      console.log('AI analysis result:', analysis)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Lead discovery system test completed',
      results: {
        redditClientWorking: true,
        searchStrategyGenerated: true,
        postsFound: posts.length,
        aiAnalysisWorking: posts.length > 0,
        testSubreddit,
        testQuery
      }
    })
    
  } catch (error) {
    console.error('Lead discovery test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Lead discovery test failed',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
