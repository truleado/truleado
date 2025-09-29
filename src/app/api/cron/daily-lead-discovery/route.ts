import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getJobScheduler } from '@/lib/job-scheduler'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (you can add authentication here)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting daily lead discovery cron job...')
    
    const supabase = await createClient()
    const jobScheduler = getJobScheduler()
    
    const results = {
      schedulerStarted: false,
      usersProcessed: 0,
      jobsCreated: 0,
      jobsReactivated: 0,
      errors: [] as string[]
    }

    // 1. Ensure job scheduler is running
    if (!jobScheduler.isRunning) {
      try {
        await jobScheduler.start()
        results.schedulerStarted = true
        console.log('Job scheduler started by cron job')
      } catch (error) {
        results.errors.push(`Failed to start job scheduler: ${error}`)
      }
    }

    // 2. Get all users with active Reddit connections
    const { data: users, error: usersError } = await supabase
      .from('api_keys')
      .select(`
        user_id,
        reddit_access_token,
        reddit_token_expires_at,
        profiles!inner(
          id,
          email,
          subscription_status
        )
      `)
      .not('reddit_access_token', 'is', null)

    if (usersError) {
      return NextResponse.json({ 
        error: 'Failed to fetch users with Reddit connections',
        results
      }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with Reddit connections found',
        results
      })
    }

    // 3. Process each user
    for (const user of users) {
      try {
        results.usersProcessed++
        
        // Check if Reddit token is expired
        const tokenExpired = user.reddit_token_expires_at && 
          new Date(user.reddit_token_expires_at) < new Date()

        if (tokenExpired) {
          results.errors.push(`User ${user.user_id}: Reddit token expired`)
          continue
        }

        // Skip users with expired subscriptions
        if (user.profiles.subscription_status === 'expired' || 
            user.profiles.subscription_status === 'cancelled') {
          continue
        }

        // Get user's active products
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, subreddits, status')
          .eq('user_id', user.user_id)
          .eq('status', 'active')

        if (productsError || !products || products.length === 0) {
          continue
        }

        // Ensure each product has an active job
        for (const product of products) {
          try {
            // Check if job already exists
            const existingJob = await jobScheduler.getJobStatus(user.user_id, product.id)
            
            if (existingJob) {
              if (existingJob.status === 'active') {
                // Job is already active, just ensure it's scheduled to run soon
                const nextRun = new Date()
                nextRun.setMinutes(nextRun.getMinutes() + 5) // Run in 5 minutes
                
                const { error: updateError } = await supabase
                  .from('background_jobs')
                  .update({
                    next_run: nextRun.toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existingJob.id)

                if (!updateError) {
                  console.log(`Scheduled job for user ${user.user_id}, product ${product.name}`)
                }
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
                  results.errors.push(`Failed to reactivate job for user ${user.user_id}, product ${product.name}`)
                } else {
                  results.jobsReactivated++
                  console.log(`Reactivated job for user ${user.user_id}, product ${product.name}`)
                }
              }
            } else {
              // Create new job
              await jobScheduler.createJob(user.user_id, product.id, 'reddit_monitoring', 60)
              results.jobsCreated++
              console.log(`Created new job for user ${user.user_id}, product ${product.name}`)
            }
          } catch (jobError) {
            results.errors.push(`Failed to create/reactivate job for user ${user.user_id}, product ${product.name}: ${jobError}`)
          }
        }
      } catch (userError) {
        results.errors.push(`Failed to process user ${user.user_id}: ${userError}`)
      }
    }

    // 4. Process jobs immediately
    try {
      await jobScheduler.processJobs()
      console.log('Processed all jobs immediately')
    } catch (processError) {
      results.errors.push(`Failed to process jobs: ${processError}`)
    }

    // 5. Get summary statistics
    const { data: activeJobs, error: jobsError } = await supabase
      .from('background_jobs')
      .select('*')
      .eq('status', 'active')

    const { data: recentLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    console.log(`Daily lead discovery cron completed. Processed ${results.usersProcessed} users, ${results.jobsCreated} new jobs, ${results.jobsReactivated} reactivated jobs`)

    return NextResponse.json({
      success: true,
      message: 'Daily lead discovery cron job completed',
      results: {
        ...results,
        totalActiveJobs: activeJobs?.length || 0,
        recentLeadsCount: recentLeads?.length || 0,
        errorsCount: results.errors.length
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Daily lead discovery cron job error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to run daily lead discovery cron job'
    }, { status: 500 })
  }
}
