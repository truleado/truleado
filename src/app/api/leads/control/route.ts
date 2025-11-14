export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getJobScheduler } from '@/lib/job-scheduler'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, action } = await request.json()

    if (!productId || !action) {
      return NextResponse.json({ error: 'Product ID and action are required' }, { status: 400 })
    }

    if (!['start', 'stop'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "start" or "stop"' }, { status: 400 })
    }

    // Verify the product belongs to the user
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const jobScheduler = getJobScheduler()

    if (action === 'start') {
      // Check if job already exists
      const existingJob = await jobScheduler.getJobStatus(user.id, productId)
      
      if (existingJob && existingJob.status === 'active') {
        return NextResponse.json({ 
          message: 'Lead search is already running for this product',
          status: 'active',
          alreadyRunning: true
        })
      }

      // Create new job or reactivate existing one
      if (existingJob) {
        // Reactivate existing job
        const { error } = await supabase
          .from('background_jobs')
          .update({
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingJob.id)

        if (error) {
          throw new Error(`Failed to reactivate job: ${error.message}`)
        }
      } else {
        // Create new job
        await jobScheduler.createJob(user.id, productId, 'reddit_monitoring', 120)
      }

      return NextResponse.json({ 
        message: 'Lead search started successfully',
        status: 'active',
        alreadyRunning: false
      })
    } else {
      // Stop the job
      await jobScheduler.stopJob(user.id, productId)
      
      return NextResponse.json({ 
        message: 'Lead search stopped successfully',
        status: 'stopped'
      })
    }
  } catch (error) {
    console.error('Lead search control error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to control lead search'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Verify the product belongs to the user
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const jobScheduler = getJobScheduler()
    const jobStatus = await jobScheduler.getJobStatus(user.id, productId)

    return NextResponse.json({
      status: jobStatus?.status || 'stopped',
      lastRun: jobStatus?.last_run || null,
      nextRun: jobStatus?.next_run || null,
      runCount: jobStatus?.run_count || 0,
      errorMessage: jobStatus?.error_message || null
    })
  } catch (error) {
    console.error('Get job status error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get job status'
    }, { status: 500 })
  }
}
