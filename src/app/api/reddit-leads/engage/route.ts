import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Engaging with Reddit lead...')
    
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'Please log in to engage with leads'
      }, { status: 401 })
    }

    const body = await request.json()

    // Extract product name from body to find or create product
    const productName = body.product_name || 'Research Lead'
    const productDescription = body.product_description || ''

    // Find or create product
    let { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', productName)
      .single()

    if (!product) {
      // Create product if it doesn't exist
      const { data: newProduct, error: createError } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: productName,
          description: productDescription,
          website_url: '',
          status: 'active'
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating product:', createError)
        return NextResponse.json({ 
          error: 'Failed to create product',
          details: createError.message
        }, { status: 500 })
      }
      product = newProduct
    }

    // Insert into leads table
    const { error: insertError } = await supabase
      .from('leads')
      .insert({
        user_id: user.id,
        product_id: product.id,
        reddit_post_id: body.url.split('/').pop() || body.title,
        reddit_post_url: body.url,
        title: body.title,
        content: body.selftext || '',
        subreddit: body.subreddit,
        author: body.author,
        score: body.score || 0,
        num_comments: body.num_comments || 0,
        status: 'new',
        ai_analysis: {
          reasoning: body.reasoning || '',
          samplePitch: body.sample_pitch || '',
          keyword: body.keyword || ''
        }
      })

    if (insertError) {
      console.error('Error inserting lead:', insertError)
      return NextResponse.json({ 
        error: 'Failed to save lead',
        details: insertError.message
      }, { status: 500 })
    }

    // Delete from reddit_leads table
    const { error: deleteError } = await supabase
      .from('reddit_leads')
      .delete()
      .eq('user_id', user.id)
      .eq('url', body.url)

    if (deleteError) {
      console.error('Error deleting from reddit_leads:', deleteError)
      // Don't fail the request if delete fails - the lead is already in track leads
    }

    console.log('Lead engaged and moved successfully')

    return NextResponse.json({
      success: true
    })

  } catch (error: any) {
    console.error('❌ Engage lead error:', error)
    return NextResponse.json({ 
      error: 'Failed to engage with lead', 
      details: error.message 
    }, { status: 500 })
  }
}

