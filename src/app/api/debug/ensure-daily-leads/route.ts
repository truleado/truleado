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

    const results = {
      schedulerStarted: false,
      jobsCreated: 0,
      jobsReactivated: 0,
      errors: [] as string[]
    }

    // 1. Ensure job scheduler is running
    const jobScheduler = getJobScheduler()
    if (!jobScheduler.isRunning) {
      try {
        await jobScheduler.start()
        results.schedulerStarted = true
        console.log('Job scheduler started successfully')
      } catch (error) {
        results.errors.push(`Failed to start job scheduler: ${error}`)
      }
    }

    // 2. Check Reddit connection
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('reddit_access_token, reddit_token_expires_at')
      .eq('user_id', user.id)
      .single()

    if (apiKeysError || !apiKeys?.reddit_access_token) {
      return NextResponse.json({ 
        error: 'Reddit account not connected. Please connect your Reddit account first.',
        results
      }, { status: 400 })
    }

    // Check if token is expired
    const tokenExpired = apiKeys.reddit_token_expires_at && 
      new Date(apiKeys.reddit_token_expires_at) < new Date()

    if (tokenExpired) {
      return NextResponse.json({ 
        error: 'Reddit token has expired. Please reconnect your Reddit account.',
        results
      }, { status: 400 })
    }

    // 3. Get all user's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, subreddits, status')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (productsError || !products || products.length === 0) {
      return NextResponse.json({ 
        error: 'No active products found. Please add a product first.',
        results
      }, { status: 400 })
    }

    // 4. Ensure each product has an active job
    for (const product of products) {
      try {
        // Check if job already exists
        const existingJob = await jobScheduler.getJobStatus(user.id, product.id)
        
        if (existingJob) {
          if (existingJob.status === 'active') {
            console.log(`Job already active for product: ${product.name}`)
            continue
          } else {
            // Reactivate the job
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
              results.errors.push(`Failed to reactivate job for ${product.name}: ${updateError.message}`)
            } else {
              results.jobsReactivated++
              console.log(`Reactivated job for product: ${product.name}`)
            }
          }
        } else {
          // Create new job
          await jobScheduler.createJob(user.id, product.id, 'reddit_monitoring', 60)
          results.jobsCreated++
          console.log(`Created new job for product: ${product.name}`)
        }
      } catch (jobError) {
        results.errors.push(`Failed to create/reactivate job for ${product.name}: ${jobError}`)
      }
    }

    // 5. Process jobs immediately to start finding leads
    try {
      await jobScheduler.processJobs()
      console.log('Processed all jobs immediately')
    } catch (processError) {
      results.errors.push(`Failed to process jobs: ${processError}`)
    }

    // 6. Get current job status
    const { data: activeJobs, error: jobsError } = await supabase
      .from('background_jobs')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const jobStatus = activeJobs?.map(job => ({
      id: job.id,
      productId: job.product_id,
      nextRun: job.next_run,
      isDue: new Date(job.next_run) <= new Date(),
      runCount: job.run_count
    })) || []

    return NextResponse.json({
      success: true,
      message: 'Daily lead discovery ensured',
      results: {
        ...results,
        totalProducts: products.length,
        activeJobs: activeJobs?.length || 0,
        jobStatus
      },
      recommendations: [
        'Monitor the leads page for new discoveries',
        'Check job status regularly to ensure they stay active',
        'Reconnect Reddit account if token expires',
        'Add more subreddits to products for better coverage'
      ]
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to ensure daily leads'
    }, { status: 500 })
  }
}
