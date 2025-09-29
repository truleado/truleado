import { NextRequest, NextResponse } from 'next/server'
import { getJobScheduler } from '@/lib/job-scheduler'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting job scheduler via cron...')
    
    const jobScheduler = getJobScheduler()
    
    // Force start the scheduler
    if (!jobScheduler.isRunning) {
      await jobScheduler.start()
      console.log('Job scheduler started successfully via cron')
    } else {
      console.log('Job scheduler already running')
    }

    // Process jobs immediately
    await jobScheduler.processJobs()
    console.log('Jobs processed immediately')

    return NextResponse.json({
      success: true,
      message: 'Job scheduler started and jobs processed',
      isRunning: jobScheduler.isRunning,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to start job scheduler via cron:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to start job scheduler'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
