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

    console.log(`Manual lead discovery triggered for user: ${user.id}`)
    
    // Ensure job scheduler is running
    const jobScheduler = getJobScheduler()
    if (!jobScheduler.isRunning) {
      await jobScheduler.start()
      console.log('Job scheduler started for manual lead discovery')
    }

    // Get user's active products
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

    // Reddit authentication no longer required - using public API
    console.log('Using Reddit public API for lead discovery')

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
        
        // Check if job already exists
        const { data: existingJob } = await supabase
          .from('background_jobs')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .eq('job_type', 'reddit_monitoring')
          .single()

        if (existingJob) {
          // Reactivate existing job
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
        } else {
          // Create new job
          const { error: createError } = await supabase
            .from('background_jobs')
            .insert({
              user_id: user.id,
              product_id: product.id,
              job_type: 'reddit_monitoring',
              status: 'active',
              interval_minutes: 60,
              next_run: new Date().toISOString(),
              run_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (createError) {
            results.errors.push(`Failed to create job for ${product.name}: ${createError.message}`)
          } else {
            results.jobsCreated++
            console.log(`Created new job for product: ${product.name}`)
          }
        }
      } catch (productError) {
        results.errors.push(`Error processing product ${product.name}: ${productError instanceof Error ? productError.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Manual lead discovery completed',
      results
    })

  } catch (error) {
    console.error('Error in manual lead discovery:', error)
    return NextResponse.json({ 
      error: 'Failed to trigger manual lead discovery',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
