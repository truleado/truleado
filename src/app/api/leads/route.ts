import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query
    let query = supabase
      .from('leads')
      .select(`
        *,
        products!inner(name, website_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Add filters
    if (productId) {
      query = query.eq('product_id', productId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: leads, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    // Transform the data to match frontend interface
    const transformedLeads = (leads || []).map((lead: any) => ({
      id: lead.id,
      title: lead.title,
      content: lead.content,
      subreddit: lead.subreddit,
      author: lead.author,
      url: lead.lead_type === 'comment' ? lead.reddit_comment_url : lead.reddit_post_url,
      score: lead.score,
      comments: lead.num_comments,
      createdAt: lead.created_at,
      status: lead.status,
      productId: lead.product_id,
      productName: lead.products?.name || 'Unknown Product',
      relevanceScore: lead.relevance_score,
      tags: lead.tags || [],
      notes: lead.notes,
      leadType: lead.lead_type || 'post',
      parentPostTitle: lead.parent_post_title,
      parentPostUrl: lead.parent_post_url,
      isComment: lead.lead_type === 'comment',
      aiAnalysisReasons: lead.ai_analysis_reasons || [],
      aiSampleReply: lead.ai_sample_reply || '',
      aiAnalysisScore: lead.ai_analysis_score || 0,
      aiAnalysisTimestamp: lead.ai_analysis_timestamp
    }))

    return NextResponse.json({ leads: transformedLeads })
  } catch (error) {
    console.error('Leads fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leadId, status, notes } = await request.json()

    if (!leadId || !status) {
      return NextResponse.json({ error: 'Lead ID and status are required' }, { status: 400 })
    }

    // Verify the lead belongs to the user
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Update the lead
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Lead updated successfully' })
  } catch (error) {
    console.error('Lead update error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update lead'
    }, { status: 500 })
  }
}
