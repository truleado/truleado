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

    console.log(`Test lead discovery for user: ${user.id}`)
    
    // Get user's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (productsError || !products || products.length === 0) {
      return NextResponse.json({ 
        error: 'No active products found' 
      }, { status: 400 })
    }

    const results = {
      productsProcessed: 0,
      leadsCreated: 0,
      errors: [] as string[]
    }

    // Create some test leads for each product
    for (const product of products) {
      try {
        console.log(`Creating test leads for product: ${product.name}`)
        
        // Create sample leads based on the product
        const sampleLeads = [
          {
            user_id: user.id,
            product_id: product.id,
            title: `Looking for ${product.name} alternative`,
            content: `I'm currently struggling with ${product.pain_points?.[0] || 'manual processes'} and need a solution like ${product.name}. Anyone have recommendations?`,
            subreddit: 'entrepreneur',
            author: 'test_user_1',
            score: 15,
            num_comments: 8,
            lead_type: 'post',
            quality_score: 8,
            ai_analysis: {
              qualityScore: 8,
              reasons: ['High engagement', 'Direct problem mention', 'Seeking solution'],
              sampleReply: `Hi! I saw you're looking for a solution to ${product.pain_points?.[0] || 'your problem'}. ${product.name} might be exactly what you need. It helps with ${product.benefits?.[0] || 'improving efficiency'}. Would you like to learn more?`,
              confidence: 0.85
            },
            status: 'new',
            created_at: new Date().toISOString()
          },
          {
            user_id: user.id,
            product_id: product.id,
            title: `Best tools for ${product.ideal_customer_profile || 'business owners'}`,
            content: `As a ${product.ideal_customer_profile || 'business owner'}, I need help with ${product.pain_points?.[1] || 'workflow management'}. What tools do you recommend?`,
            subreddit: 'smallbusiness',
            author: 'test_user_2',
            score: 23,
            num_comments: 12,
            lead_type: 'post',
            quality_score: 7,
            ai_analysis: {
              qualityScore: 7,
              reasons: ['Target audience match', 'Problem alignment', 'Active discussion'],
              sampleReply: `I'd recommend checking out ${product.name}. It's specifically designed for ${product.ideal_customer_profile || 'business owners'} and helps with ${product.benefits?.[1] || 'streamlining processes'}.`,
              confidence: 0.78
            },
            status: 'new',
            created_at: new Date().toISOString()
          },
          {
            user_id: user.id,
            product_id: product.id,
            title: `Frustrated with current solution - need ${product.name} alternative`,
            content: `I've been using [competitor] but it's not working well. I need something that can handle ${product.features?.[0] || 'core functionality'} better. Any suggestions?`,
            subreddit: 'startups',
            author: 'test_user_3',
            score: 31,
            num_comments: 15,
            lead_type: 'post',
            quality_score: 9,
            ai_analysis: {
              qualityScore: 9,
              reasons: ['High frustration level', 'Direct competitor mention', 'Clear need'],
              sampleReply: `I understand your frustration! ${product.name} is specifically designed to handle ${product.features?.[0] || 'these challenges'} much better. It offers ${product.benefits?.[0] || 'significant improvements'} over traditional solutions.`,
              confidence: 0.92
            },
            status: 'new',
            created_at: new Date().toISOString()
          }
        ]

        // Insert test leads
        const { error: insertError } = await supabase
          .from('leads')
          .insert(sampleLeads)

        if (insertError) {
          console.error(`Error inserting leads for product ${product.name}:`, insertError)
          results.errors.push(`Failed to insert leads for ${product.name}: ${insertError.message}`)
        } else {
          results.leadsCreated += sampleLeads.length
          console.log(`Created ${sampleLeads.length} test leads for ${product.name}`)
        }

        results.productsProcessed++
      } catch (error) {
        console.error(`Error processing product ${product.name}:`, error)
        results.errors.push(`Error processing ${product.name}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${results.leadsCreated} test leads for ${results.productsProcessed} products`,
      results
    })

  } catch (error) {
    console.error('Test lead discovery error:', error)
    return NextResponse.json({ error: 'Failed to create test leads' }, { status: 500 })
  }
}
