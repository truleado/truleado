import { NextRequest, NextResponse } from 'next/server'
import { getJobScheduler } from '@/lib/job-scheduler'

export async function GET(request: NextRequest) {
  try {
    const jobScheduler = getJobScheduler()
    
    return NextResponse.json({
      success: true,
      scheduler: {
        running: jobScheduler.isRunning,
        message: jobScheduler.isRunning ? 'Job scheduler is running' : 'Job scheduler is NOT running'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to check scheduler status'
    }, { status: 500 })
  }
}
