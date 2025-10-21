import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('Leads API called')
    
    // Get authenticated user first
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Leads API auth check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    })
    
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '25')
    const page = parseInt(searchParams.get('page') || '1')
    const offset = (page - 1) * limit
    
    console.log('Leads API filters:', { productId, status, limit, page, offset, userId: user.id })
    
    // Build query with filters - filter by authenticated user
    let query = supabase
      .from('leads')
      .select(`
        *,
        products(name, website_url, subreddits)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Add product filter if specified
    if (productId && productId !== 'all') {
      query = query.eq('product_id', productId)
    }
    
    // Add status filter if specified
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    const { data: leads, error: leadsError } = await query

    // Get total count for pagination
    let countQuery = supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
    
    // Apply same filters for count
    if (productId && productId !== 'all') {
      countQuery = countQuery.eq('product_id', productId)
    }
    
    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }
    
    const { count: totalLeads, error: countError } = await countQuery

    console.log('Leads query result:', { leadsCount: leads?.length || 0, totalLeads, error: leadsError?.message, countError: countError?.message })

    if (leadsError) {
      console.error('Database error:', leadsError)
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

    const totalPages = Math.ceil((totalLeads || 0) / limit)
    
    return NextResponse.json({ 
      leads: transformedLeads,
      pagination: {
        page,
        limit,
        totalLeads: totalLeads || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })

  } catch (error) {
    console.error('Error in leads API:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}