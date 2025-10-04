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

    // Get all leads for the user
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id,
        title,
        content,
        author,
        subreddit,
        score,
        num_comments,
        relevance_score,
        status,
        created_at,
        products!inner(name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get lead count by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('leads')
      .select('status')
      .eq('user_id', user.id)

    const statusCount = statusCounts?.reduce((acc: any, lead: any) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1
      return acc
    }, {}) || {}

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      leads: {
        total: leads?.length || 0,
        data: leads || [],
        error: leadsError?.message
      },
      statusCounts: statusCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to check leads'
    }, { status: 500 })
  }
}
