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

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    // Check if Reddit account is connected
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('reddit_access_token')
      .eq('user_id', user.id)
      .single()

    if (apiKeysError || !apiKeys?.reddit_access_token) {
      return NextResponse.json({ 
        error: 'Reddit account not connected. Please connect your Reddit account first.' 
      }, { status: 400 })
    }

    // Get the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Start the job scheduler if not running
    const jobScheduler = getJobScheduler()
    if (!jobScheduler.isRunning) {
      await jobScheduler.start()
    }

    // Create or update the job
    const existingJob = await jobScheduler.getJobStatus(user.id, productId)
    
    if (existingJob) {
      // Update existing job to run immediately
      const { error: updateError } = await supabase
        .from('background_jobs')
        .update({
          status: 'active',
          next_run: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingJob.id)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
      }
    } else {
      // Create new job
      await jobScheduler.createJob(user.id, productId, 'reddit_monitoring', 60)
    }

    // Process jobs immediately
    await jobScheduler.processJobs()

    return NextResponse.json({
      success: true,
      message: 'Lead discovery triggered successfully',
      product: {
        id: product.id,
        name: product.name,
        subreddits: product.subreddits
      },
      jobScheduler: {
        running: jobScheduler.isRunning
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to trigger lead discovery'
    }, { status: 500 })
  }
}
