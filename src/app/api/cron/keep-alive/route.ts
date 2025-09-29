import { NextRequest, NextResponse } from 'next/server'
import { getJobScheduler } from '@/lib/job-scheduler'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Keep-alive cron job triggered...')
    
    const jobScheduler = getJobScheduler()
    
    // Ensure scheduler is running
    if (!jobScheduler.isRunning) {
      console.log('Starting job scheduler from keep-alive cron...')
      await jobScheduler.start()
    }
    
    // Process any due jobs
    await jobScheduler.processJobs()
    
    console.log('Keep-alive cron job completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Keep-alive cron job completed',
      isRunning: jobScheduler.isRunning,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Keep-alive cron job error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to run keep-alive cron job'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
