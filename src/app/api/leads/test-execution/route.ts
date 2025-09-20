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

    // Force immediate execution by setting next_run to now
    const { error: updateError } = await supabase
      .from('background_jobs')
      .update({
        next_run: new Date().toISOString(),
        status: 'active'
      })
      .eq('user_id', user.id)
      .eq('product_id', productId)

    if (updateError) {
      throw new Error(`Failed to update job: ${updateError.message}`)
    }

    // Trigger job processing
    await jobScheduler.processJobs()

    return NextResponse.json({ 
      message: 'Job execution triggered successfully',
      productName: product.name
    })
  } catch (error) {
    console.error('Test execution error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to trigger job execution'
    }, { status: 500 })
  }
}
