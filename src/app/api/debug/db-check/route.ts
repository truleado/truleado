import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('DB check API called')
    const supabase = await createClient()
    
    // Check if we can connect to the database
    const { data: tables, error: tablesError } = await supabase
      .from('leads')
      .select('count')
      .limit(1)

    console.log('Database connection test:', { hasData: !!tables, error: tablesError?.message })

    // Get all leads without any filters
    const { data: allLeads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(10)

    console.log('All leads query:', { count: allLeads?.length || 0, error: leadsError?.message })

    // Get leads with user filter
    const { data: userLeads, error: userLeadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', 'any-user-id')
      .limit(10)

    console.log('User leads query:', { count: userLeads?.length || 0, error: userLeadsError?.message })

    // Get recent leads (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentLeads, error: recentError } = await supabase
      .from('leads')
      .select('*')
      .gte('created_at', yesterday)
      .limit(10)

    console.log('Recent leads query:', { count: recentLeads?.length || 0, error: recentError?.message })

    return NextResponse.json({
      success: true,
      databaseConnection: { hasData: !!tables, error: tablesError?.message },
      allLeads: { count: allLeads?.length || 0, error: leadsError?.message, data: allLeads?.slice(0, 3) },
      userLeads: { count: userLeads?.length || 0, error: userLeadsError?.message },
      recentLeads: { count: recentLeads?.length || 0, error: recentError?.message, data: recentLeads?.slice(0, 3) },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('DB check error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to check database'
    }, { status: 500 })
  }
}
