export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getJobScheduler } from '@/lib/job-scheduler'

export async function POST(request: NextRequest) {
  try {
    const jobScheduler = getJobScheduler()
    
    // Manually trigger job processing for testing
    await jobScheduler.processJobs()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Job processing triggered successfully'
    })
  } catch (error) {
    console.error('Failed to trigger job processing:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to trigger job processing'
    }, { status: 500 })
  }
}
