import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database insertion...')
    
    const supabase = await createClient()
    
    // Test inserting a simple lead without authentication
    const testLead = {
      user_id: 'test-user-123',
      product_id: 'test-product-123',
      reddit_post_id: 'test_post_' + Date.now(),
      reddit_post_url: 'https://reddit.com/r/test/test_post',
      title: 'Test Lead - Database Insert Test',
      content: 'This is a test lead to verify database insertion works.',
      subreddit: 'test',
      author: 'testuser',
      score: 10,
      num_comments: 5,
      status: 'new',
      ai_analysis: {
        qualityScore: 8,
        confidence: 7,
        reasons: ['Test lead'],
        sampleReply: 'This is a test.',
        painPoints: ['test'],
        buyingSignals: ['test'],
        suggestedApproach: 'Test approach.'
      }
    }

    console.log('Attempting to insert test lead:', testLead)

    const { data, error } = await supabase
      .from('leads')
      .insert([testLead])
      .select()

    if (error) {
      console.error('Database insertion error:', error)
      return NextResponse.json({ 
        success: false,
        error: 'Database insertion failed', 
        details: error.message,
        code: error.code
      })
    }

    console.log('✅ Database insertion successful!')
    console.log('Inserted lead:', data)

    return NextResponse.json({
      success: true,
      message: 'Database insertion test successful',
      lead: data[0]
    })

  } catch (error) {
    console.error('Error in test-db-insert:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Test failed', 
      details: error.message 
    })
  }
}
