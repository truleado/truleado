import { NextRequest, NextResponse } from 'next/server'
import { getJobScheduler } from '@/lib/job-scheduler'

export async function POST(request: NextRequest) {
  try {
    const jobScheduler = getJobScheduler()
    
    // Create a test job for the mock user
    const testUserId = 'mock-user-id'
    const testProductId = 'test-product-1'
    
    // Create a test job that runs every 5 minutes for testing
    await jobScheduler.createJob(testUserId, testProductId, 'reddit_monitoring', 5)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test job created successfully',
      userId: testUserId,
      productId: testProductId,
      interval: '5 minutes'
    })
  } catch (error) {
    console.error('Failed to create test job:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create test job'
    }, { status: 500 })
  }
}
