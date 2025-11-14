export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Testing lead save functionality...')

    // Get user's first product
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)

    if (productsError || !products || products.length === 0) {
      return NextResponse.json({ error: 'No products found' }, { status: 400 })
    }

    const product = products[0]

    // Create a test lead
    const testLead = {
      user_id: user.id,
      product_id: product.id,
      reddit_post_id: 'test_lead_' + Date.now(),
      reddit_post_url: 'https://reddit.com/r/test/test_lead',
      title: 'Test Lead - Looking for CRM solution',
      content: 'I need a CRM for my small business. Any recommendations?',
      subreddit: 'test',
      author: 'testuser',
      score: 10,
      num_comments: 5,
      status: 'new',
      ai_analysis: {
        qualityScore: 8,
        confidence: 7,
        reasons: ['Asks for CRM recommendations', 'Small business owner'],
        sampleReply: 'Hey! I can help you with CRM recommendations.',
        painPoints: ['need crm', 'small business'],
        buyingSignals: ['looking for', 'recommendations'],
        suggestedApproach: 'Offer helpful CRM advice and mention your product.'
      }
    }

    console.log('Attempting to save test lead:', testLead)

    const { error: saveError } = await supabase
      .from('leads')
      .insert([testLead])

    if (saveError) {
      console.error('Error saving test lead:', saveError)
      return NextResponse.json({ 
        error: 'Failed to save test lead', 
        details: saveError.message 
      }, { status: 500 })
    }

    console.log('✅ Test lead saved successfully!')

    return NextResponse.json({
      success: true,
      message: 'Test lead saved successfully',
      lead: testLead
    })

  } catch (error) {
    console.error('Error in test-save-lead:', error)
    return NextResponse.json({ error: 'Failed to test lead save' }, { status: 500 })
  }
}
