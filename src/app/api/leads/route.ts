import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Leads API called')
    
    // Use the same database connection as job scheduler to get leads
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!supabaseKey || !supabaseUrl) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    console.log('Leads API filters:', { productId, status, limit })
    
    // Build query with filters
    let query = supabase
      .from('leads')
      .select(`
        *,
        products(name, website_url, subreddits)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    // Add product filter if specified
    if (productId && productId !== 'all') {
      query = query.eq('product_id', productId)
    }
    
    // Add status filter if specified
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    const { data: leads, error: leadsError } = await query

    console.log('Leads query result:', { leadsCount: leads?.length || 0, error: leadsError?.message })

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

    return NextResponse.json({ leads: transformedLeads })

  } catch (error) {
    console.error('Error in leads API:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}