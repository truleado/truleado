import { NextRequest, NextResponse } from 'next/server'
import { getJobScheduler } from '@/lib/job-scheduler'

export async function GET(request: NextRequest) {
  try {
    const jobScheduler = getJobScheduler()
    
    return NextResponse.json({
      success: true,
      jobScheduler: {
        isRunning: jobScheduler.isRunning,
        hasSupabase: !!jobScheduler.supabase
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get job scheduler status'
    }, { status: 500 })
  }
}
