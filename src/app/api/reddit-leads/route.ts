export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching Reddit leads...')
    
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'Please log in to view Reddit leads'
      }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // Fetch Reddit leads for the user
    const { data: leads, error: leadsError } = await supabase
      .from('reddit_leads')
      .select('*')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false })

    if (leadsError) {
      console.error('Error fetching Reddit leads:', leadsError)
      return NextResponse.json({ 
        error: 'Failed to fetch Reddit leads',
        details: leadsError.message
      }, { status: 500 })
    }

    console.log(`Found ${leads?.length || 0} Reddit leads`)

    return NextResponse.json({
      success: true,
      leads: leads || []
    })

  } catch (error: any) {
    console.error('❌ Reddit leads fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch Reddit leads', 
      details: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('💾 Saving Reddit lead...')
    
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'Please log in to save Reddit leads'
      }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      selftext,
      subreddit,
      score,
      num_comments,
      url,
      created_utc,
      author,
      reasoning,
      sample_pitch,
      keyword,
      product_name,
      product_description
    } = body

    // Validate required fields
    if (!title || !subreddit || !url) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Title, subreddit, and URL are required'
      }, { status: 400 })
    }

    console.log('Saving Reddit lead:', { title, subreddit, keyword })

    // Insert the Reddit lead
    const { data: lead, error: insertError } = await supabase
      .from('reddit_leads')
      .insert({
        user_id: user.id,
        title,
        selftext: selftext || '',
        subreddit,
        score: score || 0,
        num_comments: num_comments || 0,
        url,
        created_utc: created_utc || Math.floor(Date.now() / 1000),
        author: author || 'unknown',
        reasoning: reasoning || '',
        sample_pitch: sample_pitch || '',
        keyword: keyword || '',
        product_name: product_name || '',
        product_description: product_description || '',
        saved_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving Reddit lead:', insertError)
      return NextResponse.json({ 
        error: 'Failed to save Reddit lead',
        details: insertError.message
      }, { status: 500 })
    }

    console.log('Reddit lead saved successfully:', lead.id)

    return NextResponse.json({
      success: true,
      lead
    })

  } catch (error: any) {
    console.error('❌ Reddit lead save error:', error)
    return NextResponse.json({ 
      error: 'Failed to save Reddit lead', 
      details: error.message 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Deleting Reddit lead...')
    
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'Please log in to delete Reddit leads'
      }, { status: 401 })
    }

    const body = await request.json()
    const { url } = body

    // Validate required fields
    if (!url) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'URL is required'
      }, { status: 400 })
    }

    console.log('Deleting Reddit lead with URL:', url)

    // Delete the Reddit lead
    const { error: deleteError } = await supabase
      .from('reddit_leads')
      .delete()
      .eq('user_id', user.id)
      .eq('url', url)

    if (deleteError) {
      console.error('Error deleting Reddit lead:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete Reddit lead',
        details: deleteError.message
      }, { status: 500 })
    }

    console.log('Reddit lead deleted successfully')

    return NextResponse.json({
      success: true
    })

  } catch (error: any) {
    console.error('❌ Reddit lead delete error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete Reddit lead', 
      details: error.message 
    }, { status: 500 })
  }
}
