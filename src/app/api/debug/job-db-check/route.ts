import { NextRequest, NextResponse } from 'next/server'
import { getJobScheduler } from '@/lib/job-scheduler'

export async function GET(request: NextRequest) {
  try {
    console.log('Job DB check API called')
    const jobScheduler = getJobScheduler()
    
    // Initialize the job scheduler to get its database connection
    await jobScheduler.initialize()
    
    // Check if we can connect to the database using job scheduler's connection
    const { data: tables, error: tablesError } = await jobScheduler.supabase
      .from('leads')
      .select('count')
      .limit(1)

    console.log('Job scheduler database connection test:', { hasData: !!tables, error: tablesError?.message })

    // Get all leads using job scheduler's connection
    const { data: allLeads, error: leadsError } = await jobScheduler.supabase
      .from('leads')
      .select('*')
      .limit(10)

    console.log('Job scheduler leads query:', { count: allLeads?.length || 0, error: leadsError?.message })

    // Get recent leads (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentLeads, error: recentError } = await jobScheduler.supabase
      .from('leads')
      .select('*')
      .gte('created_at', yesterday)
      .limit(10)

    console.log('Job scheduler recent leads query:', { count: recentLeads?.length || 0, error: recentError?.message })

    return NextResponse.json({
      success: true,
      databaseConnection: { hasData: !!tables, error: tablesError?.message },
      allLeads: { count: allLeads?.length || 0, error: leadsError?.message, data: allLeads?.slice(0, 3) },
      recentLeads: { count: recentLeads?.length || 0, error: recentError?.message, data: recentLeads?.slice(0, 3) },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Job DB check error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to check job database'
    }, { status: 500 })
  }
}
