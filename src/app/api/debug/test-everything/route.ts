export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getRedditClient } from '@/lib/reddit-client'
import { aiLeadAnalyzer } from '@/lib/ai-lead-analyzer'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing everything...')
    
    const results = {
      database: { status: 'pending', message: '', details: null },
      authentication: { status: 'pending', message: '', details: null },
      reddit: { status: 'pending', message: '', details: null },
      ai: { status: 'pending', message: '', details: null },
      leadDiscovery: { status: 'pending', message: '', details: null }
    }
    
    // Test 1: Database Connection
    try {
      console.log('Test 1: Database Connection')
      const supabase = await createClient()
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (profilesError) {
        throw profilesError
      }
      
      results.database = { status: 'success', message: 'Database connection successful', details: null }
      console.log('✅ Database connection successful')
    } catch (error) {
      results.database = { status: 'error', message: 'Database connection failed', details: error.message }
      console.error('❌ Database connection failed:', error)
    }
    
    // Test 2: Authentication
    try {
      console.log('Test 2: Authentication')
      const supabase = await createClient()
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        throw authError
      }
      
      if (user) {
        results.authentication = { status: 'success', message: `User authenticated: ${user.email}`, details: { userId: user.id, email: user.email } }
        console.log('✅ User authenticated:', user.email)
      } else {
        results.authentication = { status: 'warning', message: 'No user authenticated - this is expected for testing', details: null }
        console.log('⚠️ No user authenticated (expected for testing)')
      }
    } catch (error) {
      results.authentication = { status: 'error', message: 'Authentication test failed', details: error.message }
      console.error('❌ Authentication test failed:', error)
    }
    
    // Test 3: Reddit API
    try {
      console.log('Test 3: Reddit API')
      const redditClient = getRedditClient()
      
      const posts = await redditClient.searchPosts({
        subreddit: 'entrepreneur',
        query: 'help',
        sort: 'hot',
        time: 'week',
        limit: 3
      })
      
      results.reddit = { 
        status: 'success', 
        message: `Reddit API working - found ${posts.length} posts`, 
        details: { postsFound: posts.length, sampleTitles: posts.slice(0, 2).map(p => p.title) }
      }
      console.log(`✅ Reddit API working - found ${posts.length} posts`)
    } catch (error) {
      results.reddit = { status: 'error', message: 'Reddit API failed', details: error.message }
      console.error('❌ Reddit API failed:', error)
    }
    
    // Test 4: AI Analysis
    try {
      console.log('Test 4: AI Analysis')
      const testLead = {
        title: 'Looking for a CRM solution',
        content: 'Need help with lead management for my small business',
        author: 'testuser',
        subreddit: 'entrepreneur',
        score: 10,
        numComments: 5,
        created: new Date(),
        url: 'https://reddit.com/test',
        leadType: 'post' as const
      }
      
      const testProduct = {
        name: 'Test CRM',
        description: 'A CRM solution for small businesses',
        features: ['Lead Management', 'Contact Tracking'],
        benefits: ['Save time', 'Increase sales'],
        painPoints: ['Manual processes', 'Lost leads'],
        idealCustomerProfile: 'Small businesses'
      }
      
      const analysis = await aiLeadAnalyzer.analyzeLead(testLead, testProduct)
      
      results.ai = { 
        status: 'success', 
        message: `AI analysis working - score: ${analysis.qualityScore}`, 
        details: { 
          qualityScore: analysis.qualityScore, 
          confidence: analysis.confidence,
          reasons: analysis.reasons 
        }
      }
      console.log(`✅ AI analysis working - score: ${analysis.qualityScore}`)
    } catch (error) {
      results.ai = { status: 'error', message: 'AI analysis failed', details: error.message }
      console.error('❌ AI analysis failed:', error)
    }
    
    // Test 5: Lead Discovery (if authenticated)
    try {
      console.log('Test 5: Lead Discovery')
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // User is authenticated, test full lead discovery
        const redditClient = getRedditClient()
        const posts = await redditClient.searchPosts({
          subreddit: 'entrepreneur',
          query: 'help',
          sort: 'hot',
          time: 'week',
          limit: 2
        })
        
        if (posts.length > 0) {
          const testLead = {
            title: posts[0].title,
            content: posts[0].selftext || '',
            author: posts[0].author,
            subreddit: posts[0].subreddit,
            score: posts[0].score,
            numComments: posts[0].num_comments,
            created: new Date(posts[0].created_utc * 1000),
            url: `https://reddit.com${posts[0].permalink}`,
            leadType: 'post' as const
          }
          
          const testProduct = {
            name: 'Test Product',
            description: 'A test product for lead discovery',
            features: ['Feature 1', 'Feature 2'],
            benefits: ['Benefit 1', 'Benefit 2'],
            painPoints: ['Pain 1', 'Pain 2'],
            idealCustomerProfile: 'Test customers'
          }
          
          const analysis = await aiLeadAnalyzer.analyzeLead(testLead, testProduct)
          
          results.leadDiscovery = { 
            status: 'success', 
            message: `Lead discovery working - analyzed ${posts.length} posts`, 
            details: { 
              postsAnalyzed: posts.length,
              analysisScore: analysis.qualityScore,
              isLead: analysis.qualityScore >= 1
            }
          }
          console.log(`✅ Lead discovery working - analyzed ${posts.length} posts`)
        } else {
          results.leadDiscovery = { status: 'warning', message: 'No posts found to analyze', details: null }
          console.log('⚠️ No posts found to analyze')
        }
      } else {
        results.leadDiscovery = { status: 'warning', message: 'Lead discovery requires authentication', details: null }
        console.log('⚠️ Lead discovery requires authentication')
      }
    } catch (error) {
      results.leadDiscovery = { status: 'error', message: 'Lead discovery failed', details: error.message }
      console.error('❌ Lead discovery failed:', error)
    }
    
    // Calculate overall status
    const successCount = Object.values(results).filter(r => r.status === 'success').length
    const errorCount = Object.values(results).filter(r => r.status === 'error').length
    const warningCount = Object.values(results).filter(r => r.status === 'warning').length
    
    const overallStatus = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success'
    
    return NextResponse.json({
      success: overallStatus === 'success',
      status: overallStatus,
      message: `Tests completed: ${successCount} success, ${warningCount} warnings, ${errorCount} errors`,
      results: results,
      summary: {
        total: Object.keys(results).length,
        success: successCount,
        warnings: warningCount,
        errors: errorCount
      }
    })
    
  } catch (error) {
    console.error('❌ Test everything error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Test everything failed', 
      details: error.message 
    })
  }
}
