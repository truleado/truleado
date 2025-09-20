import { NextRequest, NextResponse } from 'next/server'
import { getJobScheduler } from '@/lib/job-scheduler'

export async function POST(request: NextRequest) {
  try {
    const scheduler = getJobScheduler()
    await scheduler.start()
    
    return NextResponse.json({ 
      message: 'Job scheduler started successfully',
      status: 'running'
    })
  } catch (error) {
    console.error('Job scheduler start error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to start job scheduler'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const scheduler = getJobScheduler()
    
    return NextResponse.json({ 
      message: 'Job scheduler status',
      status: scheduler.isRunning ? 'running' : 'stopped'
    })
  } catch (error) {
    console.error('Job scheduler status error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get job scheduler status'
    }, { status: 500 })
  }
}
