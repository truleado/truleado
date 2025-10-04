import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all products for the user
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('user_id', user.id)

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 })
    }

    // Start lead discovery jobs for all products
    const { getJobScheduler } = await import('@/lib/job-scheduler')
    const jobScheduler = getJobScheduler()
    
    const results = []
    for (const product of products) {
      try {
        await jobScheduler.createJob(user.id, product.id, 'reddit_monitoring', 60)
        results.push({ productId: product.id, productName: product.name, status: 'started' })
        console.log(`Started lead discovery for product: ${product.name}`)
      } catch (jobError) {
        console.error(`Failed to start lead discovery for product ${product.name}:`, jobError)
        results.push({ productId: product.id, productName: product.name, status: 'failed', error: jobError.message })
      }
    }

    return NextResponse.json({ 
      message: 'Lead discovery jobs started',
      results 
    })

  } catch (error) {
    console.error('Error starting lead discovery:', error)
    return NextResponse.json({ error: 'Failed to start lead discovery' }, { status: 500 })
  }
}