import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getJobScheduler } from '@/lib/job-scheduler'

export async function POST(request: NextRequest) {
  try {
    // Use service role key for testing (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { productId, userId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', userId)
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
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (updateError) {
      throw new Error(`Failed to update job: ${updateError.message}`)
    }

    // Trigger job processing
    await jobScheduler.processJobs()

    return NextResponse.json({ 
      message: 'Job execution triggered successfully',
      productName: product.name,
      productId: productId,
      userId: userId
    })
  } catch (error) {
    console.error('Test execution error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to trigger job execution'
    }, { status: 500 })
  }
}
