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

    console.log(`Force lead discovery triggered for user: ${user.id}`)
    
    // Ensure job scheduler is running
    const jobScheduler = getJobScheduler()
    if (!jobScheduler.isRunning) {
      await jobScheduler.start()
      console.log('Job scheduler started for force lead discovery')
    }

    // Get user's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, subreddits, status')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (productsError || !products || products.length === 0) {
      return NextResponse.json({ 
        error: 'No active products found' 
      }, { status: 400 })
    }

    // Check Reddit connection
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('reddit_access_token, reddit_token_expires_at')
      .eq('user_id', user.id)
      .single()

    if (apiKeysError || !apiKeys?.reddit_access_token) {
      return NextResponse.json({ 
        error: 'Reddit account not connected' 
      }, { status: 400 })
    }

    const tokenExpired = apiKeys.reddit_token_expires_at && 
      new Date(apiKeys.reddit_token_expires_at) < new Date()

    if (tokenExpired) {
      return NextResponse.json({ 
        error: 'Reddit token has expired' 
      }, { status: 400 })
    }

    const results = {
      productsProcessed: 0,
      jobsCreated: 0,
      jobsReactivated: 0,
      errors: [] as string[]
    }

    // Process each product
    for (const product of products) {
      try {
        results.productsProcessed++
        
        // Check if job exists
        const existingJob = await jobScheduler.getJobStatus(user.id, product.id)
        
        if (existingJob) {
          // Update job to run immediately
          const { error: updateError } = await supabase
            .from('background_jobs')
            .update({
              status: 'active',
              next_run: new Date().toISOString(),
              error_message: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingJob.id)

          if (updateError) {
            results.errors.push(`Failed to update job for ${product.name}: ${updateError.message}`)
          } else {
            results.jobsReactivated++
            console.log(`Updated job for product: ${product.name}`)
          }
        } else {
          // Create new job
          await jobScheduler.createJob(user.id, product.id, 'reddit_monitoring', 60)
          results.jobsCreated++
          console.log(`Created job for product: ${product.name}`)
        }
      } catch (error) {
        results.errors.push(`Failed to process product ${product.name}: ${error}`)
      }
    }

    // Process jobs immediately
    try {
      await jobScheduler.processJobs()
      console.log('Force lead discovery: Jobs processed immediately')
    } catch (processError) {
      results.errors.push(`Failed to process jobs: ${processError}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Force lead discovery completed',
      results: {
        ...results,
        schedulerRunning: jobScheduler.isRunning
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Force lead discovery error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to force lead discovery'
    }, { status: 500 })
  }
}
