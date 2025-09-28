import { NextRequest, NextResponse } from 'next/server'
import { getJobScheduler } from '@/lib/job-scheduler'

export async function POST(request: NextRequest) {
  try {
    const jobScheduler = getJobScheduler()
    
    // Start the job scheduler
    await jobScheduler.start()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Job scheduler started successfully',
      isRunning: jobScheduler.isRunning
    })
  } catch (error) {
    console.error('Failed to start job scheduler:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to start job scheduler'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const jobScheduler = getJobScheduler()
    
    return NextResponse.json({ 
      isRunning: jobScheduler.isRunning,
      message: jobScheduler.isRunning ? 'Job scheduler is running' : 'Job scheduler is not running'
    })
  } catch (error) {
    console.error('Failed to check job scheduler status:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to check job scheduler status'
    }, { status: 500 })
  }
}
